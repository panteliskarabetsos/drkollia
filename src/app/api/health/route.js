export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(
    JSON.stringify({ ok: true, time: new Date().toISOString() }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    }
  );
}

export async function HEAD() {
  return new Response(null, {
    status: 204,
    headers: { "cache-control": "no-store" },
  });
}
