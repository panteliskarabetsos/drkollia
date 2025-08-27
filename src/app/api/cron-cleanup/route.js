// app/api/cron-cleanup/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const nowISO = now.toISOString();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const cutoffISO = new Date(now.getTime() - ninetyDaysMs).toISOString();

  const todayUtcStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const todayDateOnly = todayUtcStart.toISOString().split("T")[0];

  // --- (1) PROTECT: IDs of completed appointments within last 90 days
  // Use a tolerant match: trim(lower(status)) = 'completed'
  // Supabase JS doesn't support SQL functions in filters directly,
  // so we fetch candidates and filter in a single RPC-like query using 'or' + ilike.
  const { data: protectedRows, error: selErr } = await supabase
    .from("appointments")
    .select("id, status, appointment_time")
    .gte("appointment_time", cutoffISO)
    .lt("appointment_time", nowISO)
    .ilike("status", "%completed%"); // covers 'completed', 'Completed', 'completed ' etc.

  if (selErr) {
    console.error("Select protected completed <90d failed:", selErr);
    return new NextResponse("Cleanup failed", { status: 500 });
  }

  const protectedIds = (protectedRows ?? [])
    // extra guard in JS: accept only rows whose trimmed lower status === 'completed'
    .filter((r) => (r.status ?? "").toLowerCase().trim() === "completed")
    .map((r) => r.id);

  // --- (2) Delete PAST appointments EXCEPT protected ones
  // This removes approved/cancelled/rejected/scheduled/pending/NULL that are in the past,
  // but will NOT touch the protected completed <90d.
  // If there are no protected IDs, 'not in' is skipped.
  let delPast;
  if (protectedIds.length > 0) {
    delPast = supabase
      .from("appointments")
      .delete({ count: "exact" })
      .lt("appointment_time", nowISO)
      .not("id", "in", `(${protectedIds.join(",")})`);
  } else {
    delPast = supabase
      .from("appointments")
      .delete({ count: "exact" })
      .lt("appointment_time", nowISO);
  }

  // --- (3) Delete COMPLETED appointments older than 90 days
  // Strict equality on cleaned status via JS not needed here; 90d+ completed can go.
  const delCompleted90d = supabase
    .from("appointments")
    .delete({ count: "exact" })
    .lt("appointment_time", cutoffISO)
    .eq("status", "completed");

  // --- (4) Delete past schedule exceptions (date-only column)
  const delExceptions = supabase
    .from("schedule_exceptions")
    .delete({ count: "exact" })
    .lt("exception_date", todayDateOnly);

  const [
    { count: cPast, error: ePast },
    { count: c90, error: e90 },
    { count: cExc, error: eExc },
  ] = await Promise.all([delPast, delCompleted90d, delExceptions]);

  if (ePast || e90 || eExc) {
    console.error("Cleanup errors:", { ePast, e90, eExc });
    return new NextResponse("Cleanup failed", { status: 500 });
  }

  return NextResponse.json({
    message: "Cleanup done",
    now: nowISO,
    cutoff_90d: cutoffISO,
    protected_completed_last_90d: protectedIds.length,
    deleted_counts: {
      past_except_protected: cPast ?? 0,
      completed_older_than_90d: c90 ?? 0,
      exceptions_past: cExc ?? 0,
    },
  });
}
