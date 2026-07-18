import { getCloudflareContext } from "@opennextjs/cloudflare";

// process.env is unreliable for Cloudflare-dashboard-set Secrets/vars on
// Workers (confirmed: a real invite-code check kept failing in production
// despite the value being correctly set in the dashboard, traced to
// process.env not reflecting it there) — getCloudflareContext().env is the
// same binding-style access already used for KV (lib/auth/officials-kv.ts),
// and is the documented reliable path for this runtime.
export function getAuthEnvVar(name: "AUTH_SECRET" | "OFFICIAL_INVITE_CODE"): string | undefined {
  try {
    const { env } = getCloudflareContext();
    const value = (env as unknown as Record<string, string | undefined>)[name];
    if (value) return value;
  } catch {
    // getCloudflareContext() throws outside a Cloudflare-shaped runtime
    // (e.g. if ever called somewhere it isn't initialized) — fall through
    // to process.env, which is what plain `next dev` without the Cloudflare
    // dev-bindings proxy would still populate from .env.local.
  }
  return process.env[name];
}
