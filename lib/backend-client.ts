import type { BlockingMode } from "./storage";

export interface AnalysisResult {
  isMatch: boolean;
  confidence: number;
  reason: string;
  error?: string;
}

export interface RegisterResponse {
  ok: boolean;
  dailyLimit: number;
}

export interface UsageInfo {
  used: number;
  limit: number;
}

// This URL will be updated when the worker is deployed
const BACKEND_URL = "https://twitter-blocker-backend.aliirani74.workers.dev";

export async function registerClient(clientId: string): Promise<RegisterResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to register client:", error);
    return { ok: false, dailyLimit: 200 };
  }
}

export async function getUsage(clientId: string): Promise<UsageInfo> {
  try {
    const response = await fetch(`${BACKEND_URL}/usage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });

    if (!response.ok) {
      return { used: 0, limit: 200 };
    }

    const data = await response.json();
    return { used: data.used || 0, limit: data.limit || 200 };
  } catch {
    return { used: 0, limit: 200 };
  }
}

export async function analyzeReply(
  text: string,
  clientId: string,
  blockingMode: BlockingMode,
  mainTweetText?: string | null
): Promise<AnalysisResult> {
  try {
    const response = await fetch(`${BACKEND_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        mainTweetText: mainTweetText || null,
        blockingMode,
        clientId,
      }),
    });

    if (response.status === 429) {
      const data = await response.json();
      return {
        isMatch: false,
        confidence: 0,
        reason: "Daily limit reached",
        error: `Rate limited. Resets at ${data.resetsAt}`,
      };
    }

    if (!response.ok) {
      const data = await response.json();
      return {
        isMatch: false,
        confidence: 0,
        reason: "API error",
        error: data.message || `HTTP ${response.status}`,
      };
    }

    return await response.json();
  } catch (error) {
    return {
      isMatch: false,
      confidence: 0,
      reason: "Request failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
