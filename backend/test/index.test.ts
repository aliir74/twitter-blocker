import { describe, it, expect, beforeEach, vi } from "vitest";
import { env, createExecutionContext, waitOnExecutionContext, SELF } from "cloudflare:test";
import worker from "../src/index";

// Helper to seed the DB schema
async function setupDB() {
  await env.DB.exec(
    "CREATE TABLE IF NOT EXISTS users (client_id TEXT PRIMARY KEY, country TEXT, created_at TEXT NOT NULL, last_seen_at TEXT NOT NULL)"
  );
  await env.DB.exec(
    "CREATE TABLE IF NOT EXISTS daily_usage (client_id TEXT NOT NULL, date TEXT NOT NULL, requests INTEGER DEFAULT 0, flagged INTEGER DEFAULT 0, PRIMARY KEY (client_id, date), FOREIGN KEY (client_id) REFERENCES users(client_id))"
  );
}

async function registerClient(clientId: string) {
  const response = await SELF.fetch("https://test.workers.dev/register", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Origin": "chrome-extension://test" },
    body: JSON.stringify({ clientId }),
  });
  return response;
}

describe("/register", () => {
  beforeEach(async () => {
    await setupDB();
  });

  it("registers a new client", async () => {
    const response = await registerClient("test-uuid-123");
    expect(response.status).toBe(200);

    const body = await response.json<{ ok: boolean; dailyLimit: number }>();
    expect(body.ok).toBe(true);
    expect(body.dailyLimit).toBe(200);
  });

  it("returns 400 for missing clientId", async () => {
    const response = await SELF.fetch("https://test.workers.dev/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": "chrome-extension://test" },
      body: JSON.stringify({}),
    });
    expect(response.status).toBe(400);

    const body = await response.json<{ error: string }>();
    expect(body.error).toBe("invalid_request");
  });

  it("handles duplicate registration (upsert)", async () => {
    await registerClient("test-uuid-123");
    const response = await registerClient("test-uuid-123");
    expect(response.status).toBe(200);

    // Should still only have one row
    const result = await env.DB.prepare("SELECT COUNT(*) as count FROM users").first<{ count: number }>();
    expect(result?.count).toBe(1);
  });

  it("stores client in database", async () => {
    await registerClient("stored-client");
    const user = await env.DB.prepare("SELECT * FROM users WHERE client_id = ?").bind("stored-client").first();
    expect(user).toBeTruthy();
    expect(user!.client_id).toBe("stored-client");
    expect(user!.created_at).toBeTruthy();
  });
});

describe("/analyze", () => {
  beforeEach(async () => {
    await setupDB();
    await registerClient("analyze-client");
  });

  it("returns 400 for missing fields", async () => {
    const response = await SELF.fetch("https://test.workers.dev/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": "chrome-extension://test" },
      body: JSON.stringify({ clientId: "analyze-client" }),
    });
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid blockingMode", async () => {
    const response = await SELF.fetch("https://test.workers.dev/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": "chrome-extension://test" },
      body: JSON.stringify({
        clientId: "analyze-client",
        text: "hello",
        blockingMode: "invalid",
      }),
    });
    expect(response.status).toBe(400);

    const body = await response.json<{ error: string }>();
    expect(body.error).toBe("invalid_request");
  });

  it("returns 400 for unregistered client", async () => {
    const response = await SELF.fetch("https://test.workers.dev/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": "chrome-extension://test" },
      body: JSON.stringify({
        clientId: "nonexistent-client",
        text: "hello",
        blockingMode: "hate",
      }),
    });
    expect(response.status).toBe(400);

    const body = await response.json<{ error: string }>();
    expect(body.error).toBe("unknown_client");
  });

  it("returns 429 when daily limit exceeded", async () => {
    // Insert usage at limit
    const today = new Date().toISOString().slice(0, 10);
    await env.DB.prepare(
      "INSERT INTO daily_usage (client_id, date, requests, flagged) VALUES (?, ?, ?, 0)"
    ).bind("analyze-client", today, 200).run();

    const response = await SELF.fetch("https://test.workers.dev/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": "chrome-extension://test" },
      body: JSON.stringify({
        clientId: "analyze-client",
        text: "hello",
        blockingMode: "hate",
      }),
    });
    expect(response.status).toBe(429);

    const body = await response.json<{ error: string; resetsAt: string }>();
    expect(body.error).toBe("daily_limit");
    expect(body.resetsAt).toBeTruthy();
  });
});

describe("routing", () => {
  it("returns 404 for unknown paths", async () => {
    const response = await SELF.fetch("https://test.workers.dev/unknown", {
      method: "POST",
      headers: { "Origin": "chrome-extension://test" },
    });
    expect(response.status).toBe(404);
  });

  it("returns 405 for non-POST methods", async () => {
    const response = await SELF.fetch("https://test.workers.dev/register", {
      method: "GET",
      headers: { "Origin": "chrome-extension://test" },
    });
    expect(response.status).toBe(405);
  });

  it("handles OPTIONS preflight", async () => {
    const response = await SELF.fetch("https://test.workers.dev/analyze", {
      method: "OPTIONS",
      headers: { "Origin": "chrome-extension://test" },
    });
    expect(response.status).toBe(204);
  });

  it("sets CORS headers for chrome-extension origin", async () => {
    await setupDB();
    const response = await registerClient("cors-test");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("chrome-extension://test");
  });

  it("does not set CORS headers for non-extension origins", async () => {
    await setupDB();
    const response = await SELF.fetch("https://test.workers.dev/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": "https://evil.com" },
      body: JSON.stringify({ clientId: "evil" }),
    });
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});
