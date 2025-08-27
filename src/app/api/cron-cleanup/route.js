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

  // 90 days ago (UTC)
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const cutoffISO = new Date(now.getTime() - ninetyDaysMs).toISOString();

  // Today (UTC) date-only for exceptions
  const todayUtcStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const todayDateOnly = todayUtcStart.toISOString().split("T")[0];

  // 1) Delete PAST appointments that are NOT completed (includes 'approved' and NULL)
  //    Anything with status in the allowed set below and appointment_time < now is removed.
  const nonCompletedStatuses = [
    "pending",
    "scheduled",
    "approved",
    "cancelled",
    "rejected",
  ];

  const del1a = supabase
    .from("appointments")
    .delete({ count: "exact" })
    .lt("appointment_time", nowISO)
    .in("status", nonCompletedStatuses);

  const del1b = supabase
    .from("appointments")
    .delete({ count: "exact" })
    .lt("appointment_time", nowISO)
    .is("status", null);

  // 2) Delete COMPLETED appointments older than 90 days
  const del2 = supabase
    .from("appointments")
    .delete({ count: "exact" })
    .lt("appointment_time", cutoffISO)
    .eq("status", "completed");

  // 3) Delete past schedule exceptions (date column)
  const del3 = supabase
    .from("schedule_exceptions")
    .delete({ count: "exact" })
    .lt("exception_date", todayDateOnly);

  const [
    { count: c1a, error: e1a },
    { count: c1b, error: e1b },
    { count: c2, error: e2 },
    { count: c3, error: e3 },
  ] = await Promise.all([del1a, del1b, del2, del3]);

  if (e1a || e1b || e2 || e3) {
    console.error("Cleanup errors:", { e1a, e1b, e2, e3 });
    return new NextResponse("Cleanup failed", { status: 500 });
  }

  return NextResponse.json({
    message: "Cleanup done",
    now: nowISO,
    cutoff_90d: cutoffISO,
    deleted_counts: {
      past_non_completed_known: c1a ?? 0,
      past_null_status: c1b ?? 0,
      completed_older_than_90d: c2 ?? 0,
      exceptions_past: c3 ?? 0,
    },
  });
}
