import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.toml" },
        miniflare: {
          d1Databases: ["DB"],
          bindings: {
            OPENROUTER_API_KEY: "test-api-key",
            ALLOWED_ORIGIN: "*",
          },
        },
      },
    },
  },
});
