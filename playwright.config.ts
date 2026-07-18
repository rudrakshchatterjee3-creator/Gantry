import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:8787",
    trace: "on-first-retry",
  },
  webServer: {
    // Not `npm run start` (plain `next start`): the official-accounts KV
    // binding (lib/auth/officials-kv.ts) only resolves in a Cloudflare-
    // shaped runtime, which `npm run preview` (Wrangler-backed) provides
    // and `next start` does not. See ARCHITECTURE.md.
    command: "npm run preview",
    url: "http://127.0.0.1:8787/welcome",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
