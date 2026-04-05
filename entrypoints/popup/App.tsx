import { useState, useEffect } from "react";
import { getSettings, saveSettings, getDailyUsage, type Settings, type BlockingMode, type ActionMode, type Locale, MAX_REPLIES_OPTIONS, DAILY_BLOCK_ALL_LIMIT } from "@/lib/storage";
import { t, setLocale } from "@/lib/i18n";

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [status, setStatus] = useState<string>("");
  const [dailyUsage, setDailyUsage] = useState<number>(0);
  const [dailyLimit, setDailyLimit] = useState<number>(200);

  useEffect(() => {
    loadSettings();
  }, []);

  // Re-apply locale whenever settings.locale changes
  useEffect(() => {
    if (settings) {
      setLocale(settings.locale);
    }
  }, [settings?.locale]);

  async function loadSettings() {
    const saved = await getSettings();
    setLocale(saved.locale);
    setSettings(saved);

    if (saved.blockingMode === "blockAll") {
      // Block All usage is tracked client-side only
      const usage = await getDailyUsage("blockAll");
      setDailyUsage(usage);
      setDailyLimit(DAILY_BLOCK_ALL_LIMIT);
    } else {
      // AI usage is tracked server-side — fetch from backend
      try {
        const usage = await browser.runtime.sendMessage({ type: "GET_USAGE" }) as { used: number; limit: number };
        setDailyUsage(usage.used);
        setDailyLimit(usage.limit);
      } catch {
        setDailyUsage(0);
        setDailyLimit(200);
      }
    }
  }

  async function handleSave() {
    if (!settings) return;
    await saveSettings(settings);
    setStatus(t("settingsSaved"));
    setTimeout(() => setStatus(""), 2000);
  }

  function updateLocale(locale: Locale) {
    setLocale(locale);
    setSettings((prev) => prev ? { ...prev, locale } : prev);
  }

  if (!settings) return null;

  const isFa = settings.locale === "fa";

  const dryRunAction = settings.actionMode === "report" ? t("report") : settings.actionMode === "both" ? t("blockOrReport") : t("block");

  return (
    <div className="popup-container" dir={isFa ? "rtl" : "ltr"} data-lang={settings.locale}>
      <h1>{t("title")}</h1>

      <div className="form-group">
        <label>{t("blockingMode")}</label>
        <div className="mode-selector">
          <label className="radio-label">
            <input
              type="radio"
              name="blockingMode"
              value="hate"
              checked={settings.blockingMode === "hate"}
              onChange={(e) => setSettings({ ...settings, blockingMode: e.target.value as BlockingMode })}
            />
            <span className="radio-text">{t("hateSpeech")}</span>
            <span className="radio-hint">{t("hateSpeechHint")}</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="blockingMode"
              value="cultPraise"
              checked={settings.blockingMode === "cultPraise"}
              onChange={(e) => setSettings({ ...settings, blockingMode: e.target.value as BlockingMode })}
            />
            <span className="radio-text">{t("cultPraise")}</span>
            <span className="radio-hint">{t("cultPraiseHint")}</span>
          </label>
          <label className={`radio-label ${settings.blockingMode === "blockAll" ? "radio-label-danger" : ""}`}>
            <input
              type="radio"
              name="blockingMode"
              value="blockAll"
              checked={settings.blockingMode === "blockAll"}
              onChange={(e) => setSettings({ ...settings, blockingMode: e.target.value as BlockingMode })}
            />
            <span className="radio-text">{t("blockAll")}</span>
            <span className={`radio-hint ${settings.blockingMode === "blockAll" ? "radio-hint-warning" : ""}`}>{t("blockAllHint")}</span>
          </label>
        </div>
      </div>

      <div className="form-group">
        <label>{t("actionMode")}</label>
        <div className="mode-selector">
          <label className="radio-label">
            <input
              type="radio"
              name="actionMode"
              value="block"
              checked={settings.actionMode === "block"}
              onChange={(e) => setSettings({ ...settings, actionMode: e.target.value as ActionMode })}
            />
            <span className="radio-text">{t("blockOnly")}</span>
            <span className="radio-hint">{t("blockOnlyHint")}</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="actionMode"
              value="report"
              checked={settings.actionMode === "report"}
              onChange={(e) => setSettings({ ...settings, actionMode: e.target.value as ActionMode })}
            />
            <span className="radio-text">{t("reportOnly")}</span>
            <span className="radio-hint">{t("reportOnlyHint")}</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="actionMode"
              value="both"
              checked={settings.actionMode === "both"}
              onChange={(e) => setSettings({ ...settings, actionMode: e.target.value as ActionMode })}
            />
            <span className="radio-text">{t("blockAndReport")}</span>
            <span className="radio-hint">{t("blockAndReportHint")}</span>
          </label>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="maxReplies">{t("maxReplies")}</label>
        <select
          id="maxReplies"
          value={settings.maxReplies}
          onChange={(e) => setSettings({ ...settings, maxReplies: parseInt(e.target.value) })}
        >
          {MAX_REPLIES_OPTIONS.map((n) => (
            <option key={n} value={n}>{n} {t("replies")}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.autoScroll}
            onChange={(e) => setSettings({ ...settings, autoScroll: e.target.checked })}
          />
          {t("autoScroll")}
        </label>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.dryRun}
            onChange={(e) => setSettings({ ...settings, dryRun: e.target.checked })}
          />
          {t("dryRunMode")} {dryRunAction})
        </label>
      </div>

      <div className="form-group">
        <label>{t("language")}</label>
        <div className="thb-language-toggle">
          <button
            type="button"
            className={settings.locale === "en" ? "active" : ""}
            onClick={() => updateLocale("en")}
          >
            English
          </button>
          <button
            type="button"
            className={settings.locale === "fa" ? "active" : ""}
            onClick={() => updateLocale("fa")}
          >
            فارسی
          </button>
        </div>
      </div>

      <button onClick={handleSave}>{t("saveSettings")}</button>

      {status && <div className="status">{status}</div>}

      <div className="thb-usage-indicator">
        {dailyUsage}/{dailyLimit} {t("scansUsedToday")}
      </div>
    </div>
  );
}
