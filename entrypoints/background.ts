import { analyzeReply } from "@/lib/openrouter";
import { getSettings } from "@/lib/storage";

export default defineBackground(() => {
  console.log("Twitter Hate Blocker background worker started");

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_SETTINGS") {
      getSettings().then(sendResponse);
      return true;
    }

    if (message.type === "ANALYZE_REPLY") {
      getSettings().then(async (settings) => {
        if (!settings.apiKey) {
          sendResponse({ error: "No API key configured" });
          return;
        }
        const result = await analyzeReply(message.text, settings.apiKey, settings.model);
        sendResponse(result);
      });
      return true;
    }

    sendResponse({ error: "Unknown message type" });
    return false;
  });
});
