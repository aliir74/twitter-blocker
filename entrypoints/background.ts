import { analyzeReply, registerClient } from "@/lib/backend-client";
import { getSettings, saveSettings } from "@/lib/storage";

export default defineBackground(() => {
  console.log("Twitter Hate Blocker background worker started");

  // Register client on install
  browser.runtime.onInstalled.addListener(async () => {
    const settings = await getSettings();
    if (!settings.clientId) {
      const clientId = crypto.randomUUID();
      const locale = navigator.language.startsWith("fa") ? "fa" : "en";
      await saveSettings({ ...settings, clientId, locale });
      await registerClient(clientId);
      console.log("Client registered:", clientId);
    }
  });

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_SETTINGS") {
      getSettings().then(sendResponse);
      return true;
    }

    if (message.type === "ANALYZE_REPLY") {
      getSettings().then(async (settings) => {
        const result = await analyzeReply(
          message.text,
          settings.clientId,
          settings.blockingMode,
          message.mainTweetText
        );
        sendResponse(result);
      });
      return true;
    }

    sendResponse({ error: "Unknown message type" });
    return false;
  });
});
