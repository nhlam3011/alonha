import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Do NOT import auth from @/lib/auth here - it uses Node.js crypto and breaks Edge runtime.
// We only check for the presence of the NextAuth session cookie; role checks happen in server layouts.

const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

function hasSessionCookie(req: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => req.cookies.has(name));
}

const protectedPaths = ["/admin", "/moi-gioi", "/dang-tin"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (isProtected && !hasSessionCookie(req)) {
    const url = new URL("/dang-nhap", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/moi-gioi/:path*", "/dang-tin", "/dang-tin/:path*"],
};
