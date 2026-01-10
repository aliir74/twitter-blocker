import { useState, useEffect } from "react";
import { getSettings, saveSettings, type Settings, AVAILABLE_MODELS, DEFAULT_SETTINGS } from "@/lib/storage";

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

      <button onClick={handleSave}>Save Settings</button>

      {status && <div className="status">{status}</div>}
    </div>
  );
}
