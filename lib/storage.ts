export type BlockingMode = "hate" | "cultPraise" | "blockAll";
export type ActionMode = "block" | "report" | "both";

export interface Settings {
  apiKey: string;
  model: string;
  maxReplies: number;
  confidenceThreshold: number;
  autoScroll: boolean;
  maxScrollAttemptsWithoutNewContent: number;
  blockingMode: BlockingMode;
  actionMode: ActionMode;
  dryRun: boolean;
}

export const AVAILABLE_MODELS = [
  { id: "google/gemma-3-12b-it", name: "Gemma 3 12B — $0.04/M (Best for Persian)" },
  { id: "google/gemma-3-27b-it", name: "Gemma 3 27B — $0.04/M" },
  { id: "qwen/qwen3-8b", name: "Qwen3 8B — $0.05/M" },
  { id: "qwen/qwen3-14b", name: "Qwen3 14B — $0.06/M" },
  { id: "google/gemini-2.0-flash-lite-001", name: "Gemini 2.0 Flash Lite — $0.075/M" },
  { id: "openai/gpt-4.1-nano", name: "GPT-4.1 Nano — $0.10/M" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini — $0.15/M" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash — $0.30/M" },
  { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5 — $1.00/M" },
];

export const DEFAULT_SETTINGS: Settings = {
  apiKey: "",
  model: "google/gemma-3-12b-it",
  maxReplies: 50,
  confidenceThreshold: 90,
  autoScroll: true,
  maxScrollAttemptsWithoutNewContent: 3,
  blockingMode: "hate",
  actionMode: "block",
  dryRun: false,
};

export async function getSettings(): Promise<Settings> {
  const result = await browser.storage.sync.get("settings");
  return { ...DEFAULT_SETTINGS, ...result.settings };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.sync.set({ settings });
}
