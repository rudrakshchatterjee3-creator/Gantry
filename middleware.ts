import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export default async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    return NextResponse.redirect(new URL("/welcome", req.nextUrl));
  }
}

export const config = {
  matcher: ["/((?!welcome|report|api|_next/static|_next/image|icon.svg|favicon.ico).*)"],
  // Next.js middleware runs on the Edge runtime by default, which OpenNext's
  // Cloudflare adapter doesn't instrument with its request context —
  // getCloudflareContext() (used transitively via lib/auth/env.ts to read
  // the real AUTH_SECRET) needs the Node.js runtime to work here.
  runtime: "nodejs",
};
