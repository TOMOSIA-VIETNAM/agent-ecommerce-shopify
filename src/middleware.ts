import { NextRequest, NextResponse } from "next/server";
import { MERCHANT_AUTH_COOKIE } from "@/lib/constants";

function checkBasicAuth(request: NextRequest): NextResponse | null {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !pass) return null;

  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const [reqUser, reqPass] = atob(header.slice(6)).split(":");
    if (reqUser === user && reqPass === pass) return null;
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Restricted"' },
  });
}

// Fast, cookie-presence-only reject. This is NOT the real gate — it never
// touches the database (Edge runtime can't reach Prisma) — the actual
// session validity check lives in
// src/app/(merchant)/merchant/(dashboard)/layout.tsx.
function isSafeNextPath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//");
}

const PUBLIC_PATHS = new Set([
  "/merchant/login",
  "/merchant/api/login",
  "/merchant/api/logout",
]);

export function middleware(request: NextRequest) {
  const basicAuthResponse = checkBasicAuth(request);
  if (basicAuthResponse) return basicAuthResponse;

  const { pathname, search } = request.nextUrl;

  if (!pathname.startsWith("/merchant")) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (request.cookies.has(MERCHANT_AUTH_COOKIE)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/merchant/login", request.url);
  const next = `${pathname}${search}`;
  if (isSafeNextPath(next)) {
    loginUrl.searchParams.set("next", next);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/revalidate|api/internal).*)"],
};
