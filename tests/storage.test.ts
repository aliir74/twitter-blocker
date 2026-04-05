import { describe, it, expect, vi } from "vitest";
import { getSettings, saveSettings, getDailyUsage, incrementDailyUsage, DEFAULT_SETTINGS, MAX_REPLIES_OPTIONS, DAILY_AI_LIMIT, DAILY_BLOCK_ALL_LIMIT } from "../lib/storage";
import { browserMock, mockStorage } from "./setup";

describe("storage", () => {
  describe("DEFAULT_SETTINGS", () => {
    it("should have correct default values", () => {
      expect(DEFAULT_SETTINGS.clientId).toBe("");
      expect(DEFAULT_SETTINGS.locale).toBe("en");
      expect(DEFAULT_SETTINGS.maxReplies).toBe(50);
      expect(DEFAULT_SETTINGS.autoScroll).toBe(true);
      expect(DEFAULT_SETTINGS.blockingMode).toBe("hate");
      expect(DEFAULT_SETTINGS.actionMode).toBe("block");
      expect(DEFAULT_SETTINGS.dryRun).toBe(false);
    });

    it("should not contain removed fields", () => {
      const settings = DEFAULT_SETTINGS as Record<string, unknown>;
      expect(settings.apiKey).toBeUndefined();
      expect(settings.model).toBeUndefined();
      expect(settings.confidenceThreshold).toBeUndefined();
      expect(settings.maxScrollAttemptsWithoutNewContent).toBeUndefined();
    });
  });

  describe("constants", () => {
    it("should have valid max replies options", () => {
      expect(MAX_REPLIES_OPTIONS).toEqual([25, 50, 100]);
    });

    it("should have correct daily limits", () => {
      expect(DAILY_AI_LIMIT).toBe(200);
      expect(DAILY_BLOCK_ALL_LIMIT).toBe(500);
    });
  });

  describe("getSettings", () => {
    it("should return default settings when none saved", async () => {
      const settings = await getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it("should return saved settings merged with defaults", async () => {
      mockStorage["settings"] = { clientId: "test-uuid", maxReplies: 100 };

      const settings = await getSettings();

      expect(settings.clientId).toBe("test-uuid");
      expect(settings.maxReplies).toBe(100);
      expect(settings.locale).toBe(DEFAULT_SETTINGS.locale);
    });
  });

  describe("saveSettings", () => {
    it("should save settings to storage", async () => {
      const newSettings = {
        clientId: "test-uuid-123",
        locale: "fa" as const,
        maxReplies: 25,
        autoScroll: true,
        blockingMode: "hate" as const,
        actionMode: "block" as const,
        dryRun: false,
      };

      await saveSettings(newSettings);

      expect(browserMock.storage.sync.set).toHaveBeenCalledWith({
        settings: newSettings,
      });
    });

    it("should save auto-scroll settings", async () => {
      const newSettings = {
        ...DEFAULT_SETTINGS,
        autoScroll: false,
      };

      await saveSettings(newSettings);

      expect(browserMock.storage.sync.set).toHaveBeenCalledWith({
        settings: newSettings,
      });
    });
  });

  describe("getSettings with blockingMode", () => {
    it("should return default blockingMode when none saved", async () => {
      const settings = await getSettings();
      expect(settings.blockingMode).toBe("hate");
    });

    it("should return saved blockingMode cultPraise", async () => {
      mockStorage["settings"] = { blockingMode: "cultPraise" };

      const settings = await getSettings();

      expect(settings.blockingMode).toBe("cultPraise");
    });

    it("should return saved blockingMode blockAll", async () => {
      mockStorage["settings"] = { blockingMode: "blockAll" };

      const settings = await getSettings();

      expect(settings.blockingMode).toBe("blockAll");
    });
  });

  describe("getSettings with dryRun", () => {
    it("should return default dryRun when none saved", async () => {
      const settings = await getSettings();
      expect(settings.dryRun).toBe(false);
    });

    it("should return saved dryRun", async () => {
      mockStorage["settings"] = { dryRun: true };

      const settings = await getSettings();

      expect(settings.dryRun).toBe(true);
    });
  });

  describe("getSettings with actionMode", () => {
    it("should return default actionMode when none saved", async () => {
      const settings = await getSettings();
      expect(settings.actionMode).toBe("block");
    });

    it("should return saved actionMode report", async () => {
      mockStorage["settings"] = { actionMode: "report" };

      const settings = await getSettings();

      expect(settings.actionMode).toBe("report");
    });

    it("should return saved actionMode both", async () => {
      mockStorage["settings"] = { actionMode: "both" };

      const settings = await getSettings();

      expect(settings.actionMode).toBe("both");
    });
  });

  describe("getSettings with locale", () => {
    it("should return default locale when none saved", async () => {
      const settings = await getSettings();
      expect(settings.locale).toBe("en");
    });

    it("should return saved locale", async () => {
      mockStorage["settings"] = { locale: "fa" };

      const settings = await getSettings();

      expect(settings.locale).toBe("fa");
    });
  });

  describe("getDailyUsage", () => {
    it("should return 0 when no usage recorded", async () => {
      const usage = await getDailyUsage("ai");
      expect(usage).toBe(0);
    });

    it("should return stored usage count", async () => {
      const today = new Date().toISOString().slice(0, 10);
      mockStorage[`usage_ai_${today}`] = 42;

      const usage = await getDailyUsage("ai");
      expect(usage).toBe(42);
    });
  });

  describe("incrementDailyUsage", () => {
    it("should increment from 0", async () => {
      const count = await incrementDailyUsage("ai");
      expect(count).toBe(1);
    });

    it("should increment existing count", async () => {
      const today = new Date().toISOString().slice(0, 10);
      mockStorage[`usage_blockAll_${today}`] = 5;

      const count = await incrementDailyUsage("blockAll");
      expect(count).toBe(6);
    });
  });
});
