// middleware.js
import { NextResponse } from "next/server";

// Protect both /admin and /admin/...
export const config = { matcher: ["/admin", "/admin/:path*"] };

export function middleware(req) {
  const { nextUrl, headers, method, cookies } = req;
  const { pathname, search } = nextUrl;

  // Always allow these (must be 200 online so SW can precache them)
  if (pathname === "/admin/offline-shell" || pathname === "/login") {
    return NextResponse.next();
  }

  // Only guard real page navigations. Let JSON, assets, prefetches pass.
  const accept = headers.get("accept") || "";
  const isPageNavigation = method === "GET" && accept.includes("text/html");
  if (!isPageNavigation) return NextResponse.next();

  // If you're NOT using @supabase/auth-helpers, this will be empty in prod.
  // In that case, rely on your client-side guards (which you already added).
  const hasSession = Boolean(
    cookies.get("sb-access-token")?.value ||
      cookies.get("sb-refresh-token")?.value ||
      cookies.get("supabase-auth-token")?.value
  );

  if (hasSession) return NextResponse.next();

  // No session → redirect to /login (but only for real navigations; see above)
  const url = nextUrl.clone();
  url.pathname = "/login";
  // Keep one redirect param, don't duplicate
  if (!url.searchParams.has("redirect")) {
    url.searchParams.set("redirect", pathname + search);
  }
  return NextResponse.redirect(url);
}
