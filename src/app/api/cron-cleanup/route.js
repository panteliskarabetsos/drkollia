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
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // --- NEW: 90-day cutoff (UTC)
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const cutoffISO = new Date(now.getTime() - ninetyDaysMs).toISOString();

  // 1) Delete past appointments that are not completed or approved
  const { error: appointmentsError } = await supabase
    .from("appointments")
    .delete()
    .lt("appointment_time", todayStart.toISOString())
    .in("status", ["pending", "cancelled", "scheduled", "rejected"]);

  // 2) Delete past schedule exceptions
  const { error: exceptionsError } = await supabase
    .from("schedule_exceptions")
    .delete()
    .lt("exception_date", todayStart.toISOString().split("T")[0]); // date-only

  // 3) Delete COMPLETED appointments older than 90 days
  const { error: completed90dError } = await supabase
    .from("appointments")
    .delete()
    .lt("appointment_time", cutoffISO)
    .eq("status", "completed");

  if (appointmentsError || exceptionsError || completed90dError) {
    console.error("Cleanup errors:", {
      appointmentsError,
      exceptionsError,
      completed90dError,
    });
    return new NextResponse("Cleanup failed", { status: 500 });
  }

  return NextResponse.json({
    message: "Old appointments and exceptions cleaned",
  });
}
