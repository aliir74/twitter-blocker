export interface Settings {
  apiKey: string;
  model: string;
  maxReplies: number;
  confidenceThreshold: number;
}

export const AVAILABLE_MODELS = [
  { id: "google/gemma-2-9b-it", name: "Google Gemma 2 9B (Default)" },
  { id: "openai/gpt-4o-mini", name: "OpenAI GPT-4o Mini" },
  { id: "anthropic/claude-3-haiku", name: "Anthropic Claude 3 Haiku" },
  { id: "meta-llama/llama-3-8b-instruct", name: "Meta Llama 3 8B" },
  { id: "mistralai/mistral-7b-instruct", name: "Mistral 7B Instruct" },
];

export const DEFAULT_SETTINGS: Settings = {
  apiKey: "",
  model: "google/gemma-2-9b-it",
  maxReplies: 50,
  confidenceThreshold: 80,
};

export async function getSettings(): Promise<Settings> {
  const result = await browser.storage.sync.get("settings");
  return { ...DEFAULT_SETTINGS, ...result.settings };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.sync.set({ settings });
}
