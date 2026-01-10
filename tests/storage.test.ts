import { describe, it, expect, vi } from "vitest";
import { getSettings, saveSettings, DEFAULT_SETTINGS, AVAILABLE_MODELS } from "../lib/storage";
import { browserMock, mockStorage } from "./setup";

describe("storage", () => {
  describe("DEFAULT_SETTINGS", () => {
    it("should have correct default values", () => {
      expect(DEFAULT_SETTINGS.apiKey).toBe("");
      expect(DEFAULT_SETTINGS.model).toBe("google/gemma-2-9b-it");
      expect(DEFAULT_SETTINGS.maxReplies).toBe(50);
      expect(DEFAULT_SETTINGS.confidenceThreshold).toBe(80);
    });
  });

  describe("AVAILABLE_MODELS", () => {
    it("should include default model", () => {
      const defaultModel = AVAILABLE_MODELS.find((m) => m.id === "google/gemma-2-9b-it");
      expect(defaultModel).toBeDefined();
      expect(defaultModel?.name).toContain("Default");
    });

    it("should have at least 3 models", () => {
      expect(AVAILABLE_MODELS.length).toBeGreaterThanOrEqual(3);
    });

    it("should have unique model IDs", () => {
      const ids = AVAILABLE_MODELS.map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("getSettings", () => {
    it("should return default settings when none saved", async () => {
      const settings = await getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it("should return saved settings merged with defaults", async () => {
      mockStorage["settings"] = { apiKey: "test-key", maxReplies: 100 };

      const settings = await getSettings();

      expect(settings.apiKey).toBe("test-key");
      expect(settings.maxReplies).toBe(100);
      expect(settings.model).toBe(DEFAULT_SETTINGS.model);
      expect(settings.confidenceThreshold).toBe(DEFAULT_SETTINGS.confidenceThreshold);
    });
  });

  describe("saveSettings", () => {
    it("should save settings to storage", async () => {
      const newSettings = {
        apiKey: "sk-or-test",
        model: "openai/gpt-4o-mini",
        maxReplies: 25,
        confidenceThreshold: 90,
      };

      await saveSettings(newSettings);

      expect(browserMock.storage.sync.set).toHaveBeenCalledWith({
        settings: newSettings,
      });
    });
  });
});
