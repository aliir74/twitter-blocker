import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  runner: {
    disabled: true,
  },
  manifest: {
    name: "\u067E\u0627\u06A9\u200C\u06A9\u0646 \u062A\u0648\u06CC\u06CC\u062A\u0631 - Twitter Hate Blocker",
    description: "\u0627\u0633\u06A9\u0646 \u0631\u06CC\u067E\u0644\u0627\u06CC\u200C\u0647\u0627 \u0648 \u0628\u0644\u0627\u06A9 \u0627\u06A9\u0627\u0646\u062A\u200C\u0647\u0627\u06CC \u0646\u0641\u0631\u062A\u200C\u067E\u0631\u0627\u06A9\u0646 \u0628\u0627 \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06CC | Scan replies and block hateful accounts using AI",
    version: "1.0.0",
    permissions: ["storage", "activeTab"],
    host_permissions: ["https://twitter.com/*", "https://x.com/*", "https://twitter-blocker-backend.workers.dev/*"],
  },
});
