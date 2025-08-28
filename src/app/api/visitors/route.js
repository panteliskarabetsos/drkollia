// app/api/visitors/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // server-only
  { auth: { persistSession: false } }
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from"); // "YYYY-MM-DD"
    const to = searchParams.get("to"); // "YYYY-MM-DD" inclusive
    if (!from || !to) {
      return NextResponse.json(
        { error: "from/to required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // Build inclusive [from, to] in UTC by making the upper bound exclusive (next day 00:00Z)
    const fromISO = new Date(from + "T00:00:00.000Z").toISOString();
    const toExclusive = new Date(to + "T00:00:00.000Z");
    toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
    const toISO = toExclusive.toISOString();

    // Pull only what we need; we'll aggregate here
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select("appointment_time,status,id")
      .gte("appointment_time", fromISO)
      .lt("appointment_time", toISO)
      .not("status", "in", '("cancelled","rejected")');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Aggregate per UTC day
    const counts = new Map(); // key: YYYY-MM-DD, val: number
    for (const row of data || []) {
      const d = new Date(row.appointment_time);
      const key = d.toISOString().slice(0, 10); // UTC date part
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    // Convert to sorted rows with ISO at 00:00Z for the chart
    const rows = Array.from(counts.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .map(([yyyy_mm_dd, visitors]) => ({
        day: new Date(yyyy_mm_dd + "T00:00:00.000Z").toISOString(),
        visitors,
      }));

    return NextResponse.json({ rows });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
