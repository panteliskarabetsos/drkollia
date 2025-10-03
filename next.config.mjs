// next.config.mjs
import withPWAInit from "next-pwa";

/** Enable/disable the service worker in dev to avoid caching headaches */
const isDev = process.env.NODE_ENV === "development";

/** Runtime caching rules (tweak as needed) */
const runtimeCaching = [
  // Next.js build assets
  {
    urlPattern: /^https:\/\/.*\/_next\/static\/.*/i,
    handler: "CacheFirst",
    options: {
      cacheName: "next-static",
      expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
    },
  },
  // Images & fonts
  {
    urlPattern: /^https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg|woff2?)$/i,
    handler: "StaleWhileRevalidate",
    options: { cacheName: "assets" },
  },
  // Supabase REST (GET) – cache for offline reads
  {
    urlPattern: /^https:\/\/[^/]+\.supabase\.co\/rest\/v1\/.*/i,
    handler: "StaleWhileRevalidate",
    method: "GET",
    options: {
      cacheName: "supabase-rest",
      expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
    },
  },
];

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: isDev, // no SW in dev
  runtimeCaching,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // If you load images from Supabase Storage, allow them:
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
};

export default withPWA(nextConfig);
