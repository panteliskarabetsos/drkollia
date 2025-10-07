// middleware.js (root)
import { NextResponse } from "next/server";

export const config = {
  // run only for admin routes
  matcher: ["/admin/:path*"],
};

export function middleware(req) {
  const { nextUrl } = req;
  const { pathname, search } = nextUrl;

  // Always allow the admin login and offline pages
  if (
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/admin/offline")
  ) {
    return NextResponse.next();
  }

  // If you use @supabase/auth-helpers-nextjs, a session cookie will exist.
  // If you only use supabase-js (localStorage), middleware can't see it – in that case,
  // keep auth checks in the client (AuthGate) and let middleware just route to /admin/login.
  const hasSession =
    req.cookies.get("sb-access-token")?.value ||
    req.cookies.get("sb-refresh-token")?.value ||
    req.cookies.get("supabase-auth-token")?.value;

  if (!hasSession) {
    const url = nextUrl.clone();
    url.pathname = "/admin/login"; // keep login inside SW scope
    url.searchParams.set("redirect", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
