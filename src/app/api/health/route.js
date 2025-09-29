// src/app/api/health/route.js
export const runtime = "nodejs"; // safe default, easy to extend later
export const dynamic = "force-dynamic"; // don't cache

export async function GET() {
  const body = {
    ok: true,
    service: "drkollia",
    time: new Date().toISOString(),
    commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT || null,
    region: process.env.VERCEL_REGION || null,
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store, max-age=0",
    },
  });
}

// Optional: quick ping support if you ever use HEAD
export async function HEAD() {
  return new Response(null, {
    status: 204,
    headers: { "cache-control": "no-store, max-age=0" },
  });
}
