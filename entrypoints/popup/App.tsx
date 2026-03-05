import { useState, useEffect } from "react";
import { getSettings, saveSettings, type Settings, type BlockingMode, type ActionMode, AVAILABLE_MODELS, DEFAULT_SETTINGS } from "@/lib/storage";

export default function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const saved = await getSettings();
    setSettings(saved);
  }

  async function handleSave() {
    await saveSettings(settings);
    setStatus("Settings saved!");
    setTimeout(() => setStatus(""), 2000);
  }

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

      {settings.blockingMode !== "blockAll" && (
        <>
          <div className="form-group">
            <label htmlFor="apiKey">OpenRouter API Key</label>
            <input
              id="apiKey"
              type="password"
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              placeholder="sk-or-..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="model">Model</label>
            <select
              id="model"
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="confidenceThreshold">
              Block if confidence &gt; {settings.confidenceThreshold}%
            </label>
            <input
              id="confidenceThreshold"
              type="range"
              min="50"
              max="100"
              value={settings.confidenceThreshold}
              onChange={(e) => setSettings({ ...settings, confidenceThreshold: parseInt(e.target.value) })}
            />
          </div>
        </>
      )}

      <div className="form-group">
        <label htmlFor="maxReplies">Max Replies to Scan</label>
        <input
          id="maxReplies"
          type="number"
          min="1"
          max="200"
          value={settings.maxReplies}
          onChange={(e) => setSettings({ ...settings, maxReplies: parseInt(e.target.value) || 50 })}
        />
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

      {settings.autoScroll && (
        <div className="form-group">
          <label htmlFor="maxScrollAttempts">
            Stop after {settings.maxScrollAttemptsWithoutNewContent} scroll attempts with no new replies
          </label>
          <input
            id="maxScrollAttempts"
            type="range"
            min="1"
            max="10"
            value={settings.maxScrollAttemptsWithoutNewContent}
            onChange={(e) => setSettings({ ...settings, maxScrollAttemptsWithoutNewContent: parseInt(e.target.value) })}
          />
        </div>
      )}

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

      <button onClick={handleSave}>Save Settings</button>

      {status && <div className="status">{status}</div>}
    </div>
  );
}
