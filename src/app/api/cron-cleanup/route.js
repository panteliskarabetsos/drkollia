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

  const now = new Date(); // current moment
  const nowISO = now.toISOString();

  // Start of "today" for date-only comparisons (exceptions)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStartISO = todayStart.toISOString();

  // Start of day, three months ago (for completed retention)
  const threeMonthsAgoStart = new Date(todayStart);
  threeMonthsAgoStart.setMonth(threeMonthsAgoStart.getMonth() - 3);
  const threeMonthsAgoISO = threeMonthsAgoStart.toISOString();

  // 1) Delete PAST appointments that should go away immediately:
  //    pending / cancelled (and optionally scheduled / rejected)
  const { error: pastNonFinalError } = await supabase
    .from("appointments")
    .delete()
    .lt("appointment_time", nowISO)
    .in("status", ["pending", "cancelled", "scheduled", "rejected"]);

  // 2) Delete COMPLETED appointments older than 3 months
  const { error: completedError } = await supabase
    .from("appointments")
    .delete()
    .lt("appointment_time", threeMonthsAgoISO)
    .eq("status", "completed");

  // 3) Delete past schedule exceptions (date-only)
  const { error: exceptionsError } = await supabase
    .from("schedule_exceptions")
    .delete()
    .lt("exception_date", todayStartISO.split("T")[0]); // keep only date part

  if (pastNonFinalError || completedError || exceptionsError) {
    console.error("Cleanup errors:", {
      pastNonFinalError,
      completedError,
      exceptionsError,
    });
    return new NextResponse("Cleanup failed", { status: 500 });
  }

  return NextResponse.json({
    message: "Cleanup done",
    now: nowISO,
    deleted_past_statuses: ["pending", "cancelled", "scheduled", "rejected"],
    kept_completed_until: threeMonthsAgoISO,
  });
}
