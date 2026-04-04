import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeReply, registerClient } from "../lib/backend-client";

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe("backend-client", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("registerClient", () => {
    it("should register a client successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, dailyLimit: 200 }),
      });

      const result = await registerClient("test-uuid");

      expect(result.ok).toBe(true);
      expect(result.dailyLimit).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/register"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ clientId: "test-uuid" }),
        })
      );
    });

    it("should handle registration failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await registerClient("test-uuid");

      expect(result.ok).toBe(false);
    });

    it("should handle network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await registerClient("test-uuid");

      expect(result.ok).toBe(false);
    });
  });

  describe("analyzeReply", () => {
    it("should return analysis result for safe content", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          isMatch: false,
          confidence: 15,
          reason: "Normal greeting",
        }),
      });

      const result = await analyzeReply("Hello everyone!", "test-client", "hate");

      expect(result.isMatch).toBe(false);
      expect(result.confidence).toBe(15);
      expect(result.reason).toBe("Normal greeting");
      expect(result.error).toBeUndefined();
    });

    it("should return analysis result for flagged content", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          isMatch: true,
          confidence: 92,
          reason: "Contains slur and threat",
        }),
      });

      const result = await analyzeReply("hateful content", "test-client", "hate");

      expect(result.isMatch).toBe(true);
      expect(result.confidence).toBe(92);
      expect(result.reason).toBe("Contains slur and threat");
    });

    it("should call backend with correct parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ isMatch: false, confidence: 10, reason: "Safe" }),
      });

      await analyzeReply("test text", "my-client-id", "cultPraise", "main tweet");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain("/analyze");
      expect(options.method).toBe("POST");

      const body = JSON.parse(options.body);
      expect(body.text).toBe("test text");
      expect(body.clientId).toBe("my-client-id");
      expect(body.blockingMode).toBe("cultPraise");
      expect(body.mainTweetText).toBe("main tweet");
    });

    it("should handle rate limit response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: "daily_limit", resetsAt: "2026-04-05T00:00:00Z" }),
      });

      const result = await analyzeReply("test", "client", "hate");

      expect(result.isMatch).toBe(false);
      expect(result.error).toContain("Rate limited");
    });

    it("should handle API error response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => ({ error: "upstream_error", message: "AI provider returned 500" }),
      });

      const result = await analyzeReply("test", "client", "hate");

      expect(result.isMatch).toBe(false);
      expect(result.error).toContain("AI provider returned 500");
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await analyzeReply("test", "client", "hate");

      expect(result.isMatch).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.error).toBe("Network error");
    });

    it("should send null mainTweetText when not provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ isMatch: false, confidence: 10, reason: "Safe" }),
      });

      await analyzeReply("test", "client", "hate");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.mainTweetText).toBeNull();
    });
  });
});
