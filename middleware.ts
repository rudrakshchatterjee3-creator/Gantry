import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/welcome", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!welcome|report|api|_next/static|_next/image|icon.svg|favicon.ico).*)"],
};
