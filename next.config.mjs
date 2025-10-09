// next.config.mjs
import withPWA from "@ducanh2912/next-pwa";

const withPWAFn = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  disable: process.env.NODE_ENV === "development",

  // When a navigation fails offline, return a cached 200-page
  fallbacks: { document: "/admin-offline.html" },
  // Try to precache useful pages
  precachePages: [
    "/admin",
    "/admin/offline-shell",
    "/admin/appointments",
    "/admin/appointments/new",
    "/admin/patients",
    "/admin/patients/new",
    "/admin/schedule",
    "/login",
  ],

  // Guarantee they’re in the Workbox precache even if precachePages misses any
  workboxOptions: {
    additionalManifestEntries: [
      { url: "/admin-offline.html", revision: "1" },
      { url: "/admin/offline-shell", revision: "1" },
      { url: "/login", revision: "1" },
      { url: "/admin/patients", revision: "1" },
      { url: "/admin/patients/new", revision: "1" },
      { url: "/admin/appointments", revision: "1" },
      { url: "/admin/appointments/new", revision: "1" },
    ],
  },

  runtimeCaching: [
    // HTML navigations under /admin
    {
      urlPattern: ({ request, url }) =>
        request.mode === "navigate" && url.pathname.startsWith("/admin"),
      handler: "NetworkFirst",
      options: {
        cacheName: "admin-pages",
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
    // images/fonts
    {
      urlPattern: ({ request }) =>
        request.destination === "image" || request.destination === "font",
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "assets",
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    // Supabase GETs (optional)
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
