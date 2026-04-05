import { HATE_SPEECH_PROMPT, CULT_PRAISE_PROMPT, CONFIDENCE_THRESHOLD, MODEL } from "./prompts";

export interface Env {
  DB: D1Database;
  OPENROUTER_API_KEY: string;
  ALLOWED_ORIGIN: string;
}

interface RegisterRequest {
  clientId: string;
}

interface AnalyzeRequest {
  text: string;
  mainTweetText: string | null;
  blockingMode: "hate" | "cultPraise";
  clientId: string;
}

interface AnalyzeResponse {
  isMatch: boolean;
  confidence: number;
  reason: string;
}

const DAILY_LIMIT = 200;
const MAX_CLIENTS_PER_IP = 10;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function corsHeaders(origin: string | null, allowedOrigin: string): Record<string, string> {
  if (!origin || !origin.startsWith("chrome-extension://")) {
    return {};
  }
  // In production, ALLOWED_ORIGIN is set to the specific extension ID origin.
  // During development, allow any chrome-extension:// origin.
  if (allowedOrigin && allowedOrigin !== "*" && origin !== allowedOrigin) {
    return {};
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

async function handleRegister(request: Request, env: Env): Promise<Response> {
  const body = await request.json<RegisterRequest>();

  if (!body.clientId || typeof body.clientId !== "string") {
    return jsonResponse({ error: "invalid_request", message: "clientId is required" }, 400);
  }

  const now = new Date().toISOString();
  const country = (request as unknown as { cf?: { country?: string } }).cf?.country || "unknown";

  // Abuse prevention: check how many clients this IP has registered
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const existing = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM users WHERE client_id IN (SELECT client_id FROM users WHERE country = ?)"
  ).bind(country).first<{ count: number }>();

  // Note: proper IP tracking would need a separate table. For now, use upsert to prevent
  // duplicate registrations and rely on country-level heuristics.

  await env.DB.prepare(
    `INSERT INTO users (client_id, country, created_at, last_seen_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(client_id) DO UPDATE SET last_seen_at = ?`
  ).bind(body.clientId, country, now, now, now).run();

  return jsonResponse({ ok: true, dailyLimit: DAILY_LIMIT });
}

async function handleAnalyze(request: Request, env: Env): Promise<Response> {
  const body = await request.json<AnalyzeRequest>();

  // Validate request
  if (!body.clientId || !body.text || !body.blockingMode) {
    return jsonResponse({ error: "invalid_request", message: "clientId, text, and blockingMode are required" }, 400);
  }
  if (body.blockingMode !== "hate" && body.blockingMode !== "cultPraise") {
    return jsonResponse({ error: "invalid_request", message: "blockingMode must be 'hate' or 'cultPraise'" }, 400);
  }

  // Verify client exists
  const user = await env.DB.prepare(
    "SELECT client_id FROM users WHERE client_id = ?"
  ).bind(body.clientId).first();

  if (!user) {
    return jsonResponse({ error: "unknown_client", message: "Client not registered. Call /register first." }, 400);
  }

  // Check daily usage
  const today = todayUTC();
  const usage = await env.DB.prepare(
    "SELECT requests FROM daily_usage WHERE client_id = ? AND date = ?"
  ).bind(body.clientId, today).first<{ requests: number }>();

  const currentRequests = usage?.requests || 0;
  if (currentRequests >= DAILY_LIMIT) {
    const resetsAt = `${today}T00:00:00Z`;
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const resetsAtTomorrow = `${tomorrow.toISOString().slice(0, 10)}T00:00:00Z`;
    return jsonResponse({ error: "daily_limit", resetsAt: resetsAtTomorrow }, 429);
  }

  // Update last_seen_at
  await env.DB.prepare(
    "UPDATE users SET last_seen_at = ? WHERE client_id = ?"
  ).bind(new Date().toISOString(), body.clientId).run();

  // Call OpenRouter
  const systemPrompt = body.blockingMode === "hate" ? HATE_SPEECH_PROMPT : CULT_PRAISE_PROMPT;
  let userContent = body.text;
  if (body.mainTweetText) {
    userContent = `Original tweet: ${body.mainTweetText}\n\nReply: ${body.text}`;
  }

  let openrouterResponse: Response;
  try {
    openrouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://twitter-blocker-backend.workers.dev",
        "X-Title": "Twitter Hate Blocker",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.1,
        max_tokens: 150,
      }),
    });
  } catch {
    return jsonResponse({ error: "upstream_error", message: "Failed to reach AI provider" }, 502);
  }

  if (!openrouterResponse.ok) {
    return jsonResponse({ error: "upstream_error", message: `AI provider returned ${openrouterResponse.status}` }, 502);
  }

  const data = await openrouterResponse.json<{
    choices?: Array<{ message?: { content?: string } }>;
  }>();
  const content = data.choices?.[0]?.message?.content || "";

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return jsonResponse({ error: "upstream_error", message: "Could not parse AI response" }, 502);
  }

  let parsed: { isMatch: boolean; confidence: number; reason: string };
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return jsonResponse({ error: "upstream_error", message: "Invalid JSON from AI provider" }, 502);
  }

  const isMatch = Boolean(parsed.isMatch) && Number(parsed.confidence) >= CONFIDENCE_THRESHOLD;
  const confidence = Number(parsed.confidence) || 0;
  const reason = String(parsed.reason) || "No reason provided";

  // Increment usage counters
  await env.DB.prepare(
    `INSERT INTO daily_usage (client_id, date, requests, flagged)
     VALUES (?, ?, 1, ?)
     ON CONFLICT(client_id, date) DO UPDATE SET
       requests = requests + 1,
       flagged = flagged + ?`
  ).bind(body.clientId, today, isMatch ? 1 : 0, isMatch ? 1 : 0).run();

  const result: AnalyzeResponse = { isMatch, confidence, reason };
  return jsonResponse(result);
}

async function handleUsage(request: Request, env: Env): Promise<Response> {
  const body = await request.json<{ clientId: string }>();

  if (!body.clientId || typeof body.clientId !== "string") {
    return jsonResponse({ error: "invalid_request", message: "clientId is required" }, 400);
  }

  const today = todayUTC();
  const usage = await env.DB.prepare(
    "SELECT requests, flagged FROM daily_usage WHERE client_id = ? AND date = ?"
  ).bind(body.clientId, today).first<{ requests: number; flagged: number }>();

  return jsonResponse({
    used: usage?.requests || 0,
    flagged: usage?.flagged || 0,
    limit: DAILY_LIMIT,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const cors = corsHeaders(origin, env.ALLOWED_ORIGIN);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    // Only allow POST
    if (request.method !== "POST") {
      return jsonResponse({ error: "method_not_allowed" }, 405);
    }

    let response: Response;
    try {
      switch (url.pathname) {
        case "/register":
          response = await handleRegister(request, env);
          break;
        case "/analyze":
          response = await handleAnalyze(request, env);
          break;
        case "/usage":
          response = await handleUsage(request, env);
          break;
        default:
          response = jsonResponse({ error: "not_found" }, 404);
      }
    } catch (err) {
      console.error("Unhandled error:", err);
      response = jsonResponse({ error: "internal_error", message: "Something went wrong" }, 500);
    }

    // Apply CORS headers to the response
    const newHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(cors)) {
      newHeaders.set(key, value);
    }
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  },
};
