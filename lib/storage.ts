export type BlockingMode = "hate" | "cultPraise" | "blockAll";
export type ActionMode = "block" | "report" | "both";
export type Locale = "en" | "fa";

export const MAX_REPLIES_OPTIONS = [25, 50, 100] as const;
export const DAILY_AI_LIMIT = 200;
export const DAILY_BLOCK_ALL_LIMIT = 500;

export interface Settings {
  clientId: string;
  locale: Locale;
  maxReplies: number;
  autoScroll: boolean;
  blockingMode: BlockingMode;
  actionMode: ActionMode;
  dryRun: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  clientId: "",
  locale: "en",
  maxReplies: 50,
  autoScroll: true,
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

export async function getHasSeenOnboarding(): Promise<boolean> {
  const result = await browser.storage.sync.get("hasSeenOnboarding");
  return Boolean(result.hasSeenOnboarding);
}

export async function setHasSeenOnboarding(): Promise<void> {
  await browser.storage.sync.set({ hasSeenOnboarding: true });
}

export async function getDailyUsage(key: string): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const storageKey = `usage_${key}_${today}`;
  const result = await browser.storage.sync.get(storageKey);
  return (result[storageKey] as number) || 0;
}

export async function incrementDailyUsage(key: string): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const storageKey = `usage_${key}_${today}`;
  const result = await browser.storage.sync.get(storageKey);
  const newCount = ((result[storageKey] as number) || 0) + 1;
  await browser.storage.sync.set({ [storageKey]: newCount });
  return newCount;
}
