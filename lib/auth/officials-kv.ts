import { getCloudflareContext } from "@opennextjs/cloudflare";

// Official staff accounts, stored in a real Cloudflare KV namespace
// (see wrangler.jsonc's OFFICIALS_KV binding). Under `next dev`,
// initOpenNextCloudflareForDev() (next.config.js) proxies this to a local
// Miniflare-simulated KV, so the same code path runs in dev and production
// — no separate local-storage fallback to keep in sync.

export interface OfficialRecord {
  email: string;
  passwordHash: string;
  createdAt: string;
}

function kvKey(email: string): string {
  return `official:${email.toLowerCase().trim()}`;
}

function getKV() {
  const { env } = getCloudflareContext();
  return (env as unknown as { OFFICIALS_KV: KVNamespace }).OFFICIALS_KV;
}

export async function getOfficial(email: string): Promise<OfficialRecord | null> {
  const raw = await getKV().get(kvKey(email));
  if (!raw) return null;
  return JSON.parse(raw) as OfficialRecord;
}

export async function createOfficial(record: OfficialRecord): Promise<void> {
  await getKV().put(kvKey(record.email), JSON.stringify(record));
}
