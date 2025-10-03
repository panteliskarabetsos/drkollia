// next.config.mjs
import withPWA from "@ducanh2912/next-pwa";

const withPWAFn = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  disable: process.env.NODE_ENV === "development",

  // serve a cached admin shell when navigations fail offline
  fallbacks: {
    document: "/admin",
  },

  // pre-cache the admin shell and key subpages so they work after a cold reload
  precachePages: [
    "/admin",
    "/admin/appointments",
    "/admin/patients",
    "/admin/schedule",
  ],

  runtimeCaching: [
    // HTML navigations (keep admin routes usable offline)
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

    // optional: Supabase GET requests
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
