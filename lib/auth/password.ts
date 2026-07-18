// Password hashing via Web Crypto's PBKDF2 — chosen because it's the one
// password-hashing primitive natively available in the Workers runtime
// (bcrypt/argon2 need a native binding that doesn't exist there). 100,000
// iterations + SHA-256 is OWASP's current minimum recommendation for
// PBKDF2-SHA256.

const ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 256;

function toBase64(bytes: ArrayBuffer): string {
  return Buffer.from(bytes).toString("base64");
}

function fromBase64(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, "base64"));
}

async function deriveHash(password: string, salt: Uint8Array): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    KEY_LENGTH_BITS
  );

  return toBase64(derivedBits);
}

/** Returns "salt:hash", both base64, ready to store as one KV field. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveHash(password, salt);
  return `${toBase64(salt.buffer)}:${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, expectedHash] = stored.split(":");
  if (!saltB64 || !expectedHash) return false;

  const salt = fromBase64(saltB64);
  const actualHash = await deriveHash(password, salt);

  // Constant-time comparison — a naive `===` leaks timing information about
  // how many leading characters matched, which matters for a hash compare.
  if (actualHash.length !== expectedHash.length) return false;
  let mismatch = 0;
  for (let i = 0; i < actualHash.length; i++) {
    mismatch |= actualHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return mismatch === 0;
}
