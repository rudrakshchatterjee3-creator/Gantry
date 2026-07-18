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
};
