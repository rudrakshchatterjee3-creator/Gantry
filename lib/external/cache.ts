// Shared in-memory TTL cache for external API clients. Public free APIs
// (Overpass, NWS, Census, AirNow, WattTime) have real rate limits — this
// cache means a burst of chat questions costs at most one upstream call per
// TTL window, not one per question.
const store = new Map<string, { value: unknown; expiresAt: number }>();

export async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as T;

  const value = await fetcher();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}
