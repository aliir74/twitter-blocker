import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeReply } from "../lib/openrouter";

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe("openrouter", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("analyzeReply", () => {
    it("should return analysis result for safe content", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '{"isMatch": false, "confidence": 15, "reason": "Normal greeting"}',
              },
            },
          ],
        }),
      });

      const result = await analyzeReply("Hello everyone!", "test-api-key", "google/gemma-2-9b-it");

      expect(result.isMatch).toBe(false);
      expect(result.confidence).toBe(15);
      expect(result.reason).toBe("Normal greeting");
      expect(result.error).toBeUndefined();
    });

    it("should return analysis result for flagged content", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '{"isMatch": true, "confidence": 92, "reason": "Contains slur and threat"}',
              },
            },
          ],
        }),
      });

      const result = await analyzeReply("hateful content here", "test-api-key", "google/gemma-2-9b-it");

      expect(result.isMatch).toBe(true);
      expect(result.confidence).toBe(92);
      expect(result.reason).toBe("Contains slur and threat");
    });

    it("should call OpenRouter API with correct parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"isMatch": false, "confidence": 10, "reason": "Safe"}' } }],
        }),
      });

      await analyzeReply("test text", "my-api-key", "openai/gpt-4o-mini");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
      expect(options.method).toBe("POST");
      expect(options.headers["Authorization"]).toBe("Bearer my-api-key");
      expect(options.headers["Content-Type"]).toBe("application/json");

      const body = JSON.parse(options.body);
      expect(body.model).toBe("openai/gpt-4o-mini");
      expect(body.messages).toHaveLength(2);
      expect(body.messages[1].content).toBe("test text");
    });

    it("should use hate speech prompt by default", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"isMatch": false, "confidence": 10, "reason": "Safe"}' } }],
        }),
      });

      await analyzeReply("test text", "api-key", "model");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.messages[0].content).toContain("hate speech classifier");
    });

    it("should use cult praise prompt when mode is cultPraise", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"isMatch": true, "confidence": 85, "reason": "Cult-like devotion"}' } }],
        }),
      });

      await analyzeReply("test text", "api-key", "model", "cultPraise");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.messages[0].content).toContain("cult-like praise detector");
    });

    it("should handle API error response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });

      const result = await analyzeReply("test", "bad-key", "google/gemma-2-9b-it");

      expect(result.isMatch).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.error).toContain("401");
    });

    it("should handle malformed JSON response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "This is not JSON" } }],
        }),
      });

      const result = await analyzeReply("test", "api-key", "google/gemma-2-9b-it");

      expect(result.error).toBeDefined();
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await analyzeReply("test", "api-key", "google/gemma-2-9b-it");

      expect(result.isMatch).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.error).toBe("Network error");
    });

    it("should handle empty response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [] }),
      });

      const result = await analyzeReply("test", "api-key", "google/gemma-2-9b-it");

      expect(result.error).toBeDefined();
    });
  });
});
