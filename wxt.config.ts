import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Twitter Hate Blocker",
    description: "Detect and block hate speech in Twitter replies using AI",
    version: "1.0.0",
    permissions: ["storage", "activeTab"],
    host_permissions: ["https://twitter.com/*", "https://x.com/*", "https://openrouter.ai/*"],
  },
});
