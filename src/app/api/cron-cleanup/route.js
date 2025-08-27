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
  const cutoffDate = new Date(now.getTime() - ninetyDaysMs);
  const cutoffISO = cutoffDate.toISOString();

  // Today UTC (for date-only comparisons on exceptions)
  const todayUtcStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const todayDateOnly = todayUtcStart.toISOString().split("T")[0];

  // 1) Delete past appointments where status != completed (or is NULL)
  const q1 = supabase
    .from("appointments")
    .delete()
    .lt("appointment_time", nowISO)
    .or("status.is.null,not.eq.status.completed")
    .select();

  // 2) Delete completed appointments older than 90 days
  const q2 = supabase
    .from("appointments")
    .delete()
    .lt("appointment_time", cutoffISO)
    .eq("status", "completed")
    .select();

  // 3) Delete past schedule exceptions
  const q3 = supabase
    .from("schedule_exceptions")
    .delete()
    .lt("exception_date", todayDateOnly)
    .select();

  const [
    { data: d1, error: e1 },
    { data: d2, error: e2 },
    { data: d3, error: e3 },
  ] = await Promise.all([q1, q2, q3]);

  if (e1 || e2 || e3) {
    console.error("Cleanup errors:", { e1, e2, e3 });
    return new NextResponse("Cleanup failed", { status: 500 });
  }

  return NextResponse.json({
    message: "Cleanup done",
    now: nowISO,
    cutoff_90d: cutoffISO,
    deleted_counts: {
      past_non_completed: d1?.length ?? 0,
      completed_older_than_90d: d2?.length ?? 0,
      exceptions_past: d3?.length ?? 0,
    },
  });
}
