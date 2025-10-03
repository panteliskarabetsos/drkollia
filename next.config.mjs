// next.config.mjs
import withPWA from "@ducanh2912/next-pwa";

const runtimeCaching = [
  // Cache admin navigations so the shell opens offline
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
  // Next.js static assets
  {
    urlPattern: ({ url }) => url.pathname.startsWith("/_next/static/"),
    handler: "StaleWhileRevalidate",
    options: { cacheName: "next-static" },
  },
  // Images & fonts
  {
    urlPattern: ({ request }) =>
      request.destination === "image" || request.destination === "font",
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "assets",
      expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
    },
  },
  // Optional: Supabase REST GETs
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
];

const withPWAFn = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // no SW in dev
  runtimeCaching,
  workboxOptions: {
    navigateFallback: "/offline.html",
  },
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
