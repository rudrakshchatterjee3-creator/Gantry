// Simple in-memory token-bucket rate limiter, process-wide (fine for a
// single-instance hackathon deployment). Applied to both API routes that
// call Groq (/api/fan-assistant, /api/simulate-anomaly) so GANTRY throttles
// itself well before Groq's own free-tier limit would trigger a hard
// failure mid-demo — judges hitting the app in a burst get a friendly 429,
// not a broken chat.

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Returns true if the request under `key` is allowed, false if it should be
 * rejected (rate limited). `maxTokens` refill fully every `windowMs`.
 */
export function checkRateLimit(key: string, maxTokens: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: maxTokens, lastRefill: now };

  const elapsed = now - bucket.lastRefill;
  if (elapsed >= windowMs) {
    bucket.tokens = maxTokens;
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    buckets.set(key, bucket);
    return false;
  }

  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return true;
}
