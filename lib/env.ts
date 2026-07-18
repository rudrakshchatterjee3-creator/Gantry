import { getCloudflareContext } from "@opennextjs/cloudflare";

// process.env is unreliable for Cloudflare-dashboard-set Secrets/vars on
// Workers — confirmed via a real production bug where the invite-code and
// Groq API key checks kept failing despite the dashboard showing them set.
// getCloudflareContext().env is the same binding-style access already used
// for KV/service bindings, and is the reliable path on this runtime. CLI-set
// secrets (`wrangler secret put`) land here correctly; only the dashboard UI
// path was broken. Falls back to process.env for plain `next dev` without
// the Cloudflare dev-bindings proxy.
export function getEnvVar(name: string): string | undefined {
  try {
    const { env } = getCloudflareContext();
    const value = (env as unknown as Record<string, string | undefined>)[name];
    if (value) return value;
  } catch {
    // getCloudflareContext() throws outside a Cloudflare-shaped runtime.
  }
  return process.env[name];
}
