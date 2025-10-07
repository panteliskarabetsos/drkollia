import { NextResponse } from "next/server";

export const config = { matcher: ["/admin/:path*"] };

export function middleware(req) {
  const { pathname, search } = req.nextUrl;

  // Allow these without a session (must return 200 when online)
  if (pathname === "/admin/offline-shell" || pathname === "/login")
    return NextResponse.next();

  // If you rely on Supabase cookies, check here; otherwise let client-side gate handle it
  const hasSession =
    req.cookies.get("sb-access-token")?.value ||
    req.cookies.get("sb-refresh-token")?.value ||
    req.cookies.get("supabase-auth-token")?.value;

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
