import { useState, useEffect } from "react";
import { getSettings, saveSettings, getDailyUsage, type Settings, type BlockingMode, type ActionMode, type Locale, MAX_REPLIES_OPTIONS, DAILY_AI_LIMIT, DAILY_BLOCK_ALL_LIMIT } from "@/lib/storage";

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [status, setStatus] = useState<string>("");
  const [dailyUsage, setDailyUsage] = useState<number>(0);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const saved = await getSettings();
    setSettings(saved);
    const usage = await getDailyUsage("blockAll");
    const aiUsage = await getDailyUsage("ai");
    setDailyUsage(saved.blockingMode === "blockAll" ? usage : aiUsage);
  }

  async function handleSave() {
    if (!settings) return;
    await saveSettings(settings);
    setStatus("Settings saved!");
    setTimeout(() => setStatus(""), 2000);
  }

  if (!settings) return null;

  const isBlockAll = settings.blockingMode === "blockAll";
  const dailyLimit = isBlockAll ? DAILY_BLOCK_ALL_LIMIT : DAILY_AI_LIMIT;

  return (
    <div className="popup-container">
      <h1>Twitter Hate Blocker</h1>

      <div className="form-group">
        <label>Blocking Mode</label>
        <div className="mode-selector">
          <label className="radio-label">
            <input
              type="radio"
              name="blockingMode"
              value="hate"
              checked={settings.blockingMode === "hate"}
              onChange={(e) => setSettings({ ...settings, blockingMode: e.target.value as BlockingMode })}
            />
            <span className="radio-text">Hate Speech</span>
            <span className="radio-hint">Block offensive language and harassment</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="blockingMode"
              value="cultPraise"
              checked={settings.blockingMode === "cultPraise"}
              onChange={(e) => setSettings({ ...settings, blockingMode: e.target.value as BlockingMode })}
            />
            <span className="radio-text">Cult Praise</span>
            <span className="radio-hint">Block sycophantic, cult-like devotion</span>
          </label>
          <label className={`radio-label ${settings.blockingMode === "blockAll" ? "radio-label-danger" : ""}`}>
            <input
              type="radio"
              name="blockingMode"
              value="blockAll"
              checked={settings.blockingMode === "blockAll"}
              onChange={(e) => setSettings({ ...settings, blockingMode: e.target.value as BlockingMode })}
            />
            <span className="radio-text">Block All</span>
            <span className={`radio-hint ${settings.blockingMode === "blockAll" ? "radio-hint-warning" : ""}`}>Blocks EVERY account on the page - use with caution!</span>
          </label>
        </div>
      </div>

      <div className="form-group">
        <label>Action Mode</label>
        <div className="mode-selector">
          <label className="radio-label">
            <input
              type="radio"
              name="actionMode"
              value="block"
              checked={settings.actionMode === "block"}
              onChange={(e) => setSettings({ ...settings, actionMode: e.target.value as ActionMode })}
            />
            <span className="radio-text">Block Only</span>
            <span className="radio-hint">Block flagged accounts</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="actionMode"
              value="report"
              checked={settings.actionMode === "report"}
              onChange={(e) => setSettings({ ...settings, actionMode: e.target.value as ActionMode })}
            />
            <span className="radio-text">Report Only</span>
            <span className="radio-hint">Report flagged accounts for hateful content</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="actionMode"
              value="both"
              checked={settings.actionMode === "both"}
              onChange={(e) => setSettings({ ...settings, actionMode: e.target.value as ActionMode })}
            />
            <span className="radio-text">Block &amp; Report</span>
            <span className="radio-hint">Report first, then block flagged accounts</span>
          </label>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="maxReplies">Max Replies to Scan</label>
        <select
          id="maxReplies"
          value={settings.maxReplies}
          onChange={(e) => setSettings({ ...settings, maxReplies: parseInt(e.target.value) })}
        >
          {MAX_REPLIES_OPTIONS.map((n) => (
            <option key={n} value={n}>{n} replies</option>
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
          Enable auto-scroll to find more replies
        </label>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.dryRun}
            onChange={(e) => setSettings({ ...settings, dryRun: e.target.checked })}
          />
          Dry-run mode (analyze only, don't {settings.actionMode === "report" ? "report" : settings.actionMode === "both" ? "block or report" : "block"})
        </label>
      </div>

      <div className="form-group">
        <label>Language</label>
        <div className="thb-language-toggle">
          <button
            type="button"
            className={settings.locale === "en" ? "active" : ""}
            onClick={() => setSettings({ ...settings, locale: "en" as Locale })}
          >
            English
          </button>
          <button
            type="button"
            className={settings.locale === "fa" ? "active" : ""}
            onClick={() => setSettings({ ...settings, locale: "fa" as Locale })}
          >
            فارسی
          </button>
        </div>
      </div>

      <button onClick={handleSave}>Save Settings</button>

      {status && <div className="status">{status}</div>}

      <div className="thb-usage-indicator">
        {dailyUsage}/{dailyLimit} scans used today
      </div>
    </div>
  );
}
