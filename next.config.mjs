// next.config.mjs
import withPWA from "@ducanh2912/next-pwa";

const withPWAFn = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  // keep SW enabled in prod; disabled in dev is fine
  disable: process.env.NODE_ENV === "development",

  // ✅ serve a static offline page instead of a guarded route
  fallbacks: {
    document: "/offline.html",
  },

  // ✅ pre-cache the login and admin shell so first offline visit hydrates
  precachePages: [
    "/login",
    "/admin",
    "/admin/appointments",
    "/admin/patients",
    "/admin/schedule",
  ],

  runtimeCaching: [
    // ✅ HTML navigations you care about while offline
    {
      urlPattern: ({ request, url }) =>
        request.mode === "navigate" &&
        (url.pathname === "/login" || url.pathname.startsWith("/admin")),
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        networkTimeoutSeconds: 4,
        matchOptions: { ignoreSearch: true },
      },
    },

    // Next static chunks
    {
      urlPattern: ({ url }) => url.pathname.startsWith("/_next/static/"),
      handler: "StaleWhileRevalidate",
      options: { cacheName: "next-static" },
    },

    // Next image optimizer & static assets
    {
      urlPattern: ({ url, request }) =>
        url.pathname.startsWith("/_next/image") ||
        request.destination === "image" ||
        request.destination === "font",
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "assets",
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },

    // manifest / favicon (nice-to-have)
    {
      urlPattern: ({ url }) =>
        url.pathname === "/manifest.json" || url.pathname === "/favicon.ico",
      handler: "StaleWhileRevalidate",
      options: { cacheName: "meta" },
    },

    // Optional: cache Supabase GETs
    {
      urlPattern: ({ url, request }) =>
        request.method === "GET" &&
        url.hostname.endsWith(".supabase.co") &&
        url.pathname.startsWith("/rest/v1/"),
      handler: "NetworkFirst",
      options: {
        cacheName: "supabase-rest",
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
export default withPWAFn({
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
});
