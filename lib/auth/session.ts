import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getEnvVar } from "@/lib/env";

// Signed, HttpOnly session cookie — replaces NextAuth's session handling.
// jose is Edge/Workers-safe (pure Web Crypto under the hood), same library
// NextAuth itself used internally, so this isn't a new runtime dependency
// class, just a direct one now that NextAuth is gone.

export const SESSION_COOKIE_NAME = "gantry_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface OfficialSession {
  email: string;
}

function getSecretKey(): Uint8Array {
  const secret = getEnvVar("AUTH_SECRET");
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set — required to sign/verify session cookies. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(session: OfficialSession): Promise<string> {
  return new SignJWT({ email: session.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<OfficialSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.email !== "string") return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}

/** Sets the signed session cookie on the response side (Route Handlers only). */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/** Reads and verifies the session cookie in a Route Handler or Server Component. */
export async function getSession(): Promise<OfficialSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
