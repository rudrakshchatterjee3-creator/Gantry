import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { getOfficial } from "@/lib/auth/officials-kv";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/external/rate-limiter";

// --- Official Login --------------------------------------------------------
// Brute-force protection is per-IP (not just process-wide) since this is a
// credential-guessing target in a way the other rate-limited routes aren't.

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

// Generic message for both "no such account" and "wrong password" — a
// distinct message for each would let an attacker enumerate valid emails.
const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";

function isValidPayload(body: unknown): body is { email: string; password: string } {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return typeof b.email === "string" && typeof b.password === "string";
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (!checkRateLimit(`login:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many login attempts — please wait a moment and try again." },
      { status: 429 }
    );
  }

  let email: string;
  let password: string;

  try {
    const body = await request.json();
    if (!isValidPayload(body)) throw new Error("Invalid login payload");
    email = body.email.trim().toLowerCase();
    password = body.password;
  } catch {
    return NextResponse.json(
      { error: "Invalid payload — expected { email, password }." },
      { status: 400 }
    );
  }

  const official = await getOfficial(email);
  if (!official) {
    return NextResponse.json({ error: INVALID_CREDENTIALS_MESSAGE }, { status: 401 });
  }

  const valid = await verifyPassword(password, official.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: INVALID_CREDENTIALS_MESSAGE }, { status: 401 });
  }

  const token = await createSessionToken({ email });
  await setSessionCookie(token);

  return NextResponse.json({ email });
}
