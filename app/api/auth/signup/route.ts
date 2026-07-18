import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { createOfficial, getOfficial } from "@/lib/auth/officials-kv";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { getAuthEnvVar } from "@/lib/auth/env";
import { checkRateLimit } from "@/lib/external/rate-limiter";

// --- Official Signup -----------------------------------------------------
// Real Cloudflare KV-backed account creation, gated by a shared invite code
// (OFFICIAL_INVITE_CODE) rather than open self-registration — a demo
// credential, not a vetted-identity system, but a real server-side check
// rather than "anyone can claim to be staff". See SECURITY.md.

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MIN_PASSWORD_LENGTH = 10;

function isValidPayload(
  body: unknown
): body is { email: string; password: string; inviteCode: string } {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.email === "string" &&
    typeof b.password === "string" &&
    typeof b.inviteCode === "string"
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (!checkRateLimit(`signup:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many signup attempts — please wait a moment and try again." },
      { status: 429 }
    );
  }

  let email: string;
  let password: string;
  let inviteCode: string;

  try {
    const body = await request.json();
    if (!isValidPayload(body)) throw new Error("Invalid signup payload");
    email = body.email.trim().toLowerCase();
    password = body.password;
    inviteCode = body.inviteCode.trim();
  } catch {
    return NextResponse.json(
      { error: "Invalid payload — expected { email, password, inviteCode }." },
      { status: 400 }
    );
  }

  const expectedInviteCode = getAuthEnvVar("OFFICIAL_INVITE_CODE");
  if (!expectedInviteCode || inviteCode !== expectedInviteCode) {
    // TEMPORARY debug — remove after diagnosing the invite-code env var issue.
    return NextResponse.json(
      {
        error: "Invalid invite code.",
        debug: {
          expectedIsSet: Boolean(expectedInviteCode),
          expectedLength: expectedInviteCode?.length ?? 0,
          receivedLength: inviteCode.length,
          match: inviteCode === expectedInviteCode,
        },
      },
      { status: 403 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const existing = await getOfficial(email);
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  await createOfficial({ email, passwordHash, createdAt: new Date().toISOString() });

  const token = await createSessionToken({ email });
  await setSessionCookie(token);

  return NextResponse.json({ email });
}
