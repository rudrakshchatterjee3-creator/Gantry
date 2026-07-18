import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Committed deliberately, not left for Cloudflare's build to auto-generate
// fresh on every run — an ephemeral, regenerated-each-build config was the
// actual root cause of a real deploy failure (WORKER_SELF_REFERENCE ended
// up bound to a stale Worker name that didn't match the real deployed
// Worker). Defaults are fine here; the fix that mattered was making
// wrangler.jsonc's `name` and this file both stable and committed instead
// of re-derived from scratch on every build.
export default defineCloudflareConfig();
