import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/", "/login", "/api/auth"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

const ROLE_ROUTES: Record<string, string[]> = {
  ADMIN: ["/admin", "/dashboard"],
  PROFESSIONAL: ["/professional", "/dashboard"],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const sessionUser = req.auth?.user;

  // No session
  if (!sessionUser) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (sessionUser as Record<string, unknown>).role as string;
  const allowedRoutes = ROLE_ROUTES[role];

  if (!allowedRoutes) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Verify role for protected routes
  const protectedPrefixes = ["/admin", "/professional"];
  const matchedPrefix = protectedPrefixes.find((p) =>
    pathname.startsWith(p),
  );

  if (matchedPrefix && !allowedRoutes.includes(matchedPrefix)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
