import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Next.js 16 "proxy" (voorheen middleware). Goedkope eerste poort voor het
 * admin-paneel: enkel een aanwezigheids-check op de sessie-cookie. De
 * autoritatieve DB-controle gebeurt in app/admin/layout.tsx via requireAdmin()
 * (de proxy kan/mag Postgres niet bevragen).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Login-pagina en de login-action zelf moeten publiek blijven.
  if (pathname === "/admin/login") return NextResponse.next();

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
