import { analyzeReply } from "@/lib/openrouter";
import { getSettings } from "@/lib/storage";

export default defineBackground(() => {
  console.log("Twitter Hate Blocker background worker started");

  browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message.type === "GET_SETTINGS") {
      return await getSettings();
    }

    if (message.type === "ANALYZE_REPLY") {
      const settings = await getSettings();
      if (!settings.apiKey) {
        return { error: "No API key configured" };
      }
      return await analyzeReply(message.text, settings.apiKey, settings.model);
    }

    return { error: "Unknown message type" };
  });
});
