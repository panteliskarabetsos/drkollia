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

  // Σημερινή UTC ημερομηνία για exceptions (date-only)
  const todayUtcStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const todayDateOnly = todayUtcStart.toISOString().split("T")[0];

  // --- 1) DELETE παρελθοντικά με status που ΔΕΝ είναι completed/approved
  const delPastOther = supabase
    .from("appointments")
    .delete({ count: "exact" })
    .lt("appointment_time", nowISO)
    .in("status", ["pending", "scheduled", "cancelled", "rejected"]);

  // --- 1b) DELETE παρελθοντικά με NULL status
  const delPastNull = supabase
    .from("appointments")
    .delete({ count: "exact" })
    .lt("appointment_time", nowISO)
    .is("status", null);

  // --- 2) DELETE completed & approved παλαιότερα από 90 μέρες
  const delOldCompleted = supabase
    .from("appointments")
    .delete({ count: "exact" })
    .lt("appointment_time", cutoffISO)
    .in("status", ["completed", "approved"]);

  // --- 3) DELETE παλιές εξαιρέσεις
  const delExceptions = supabase
    .from("schedule_exceptions")
    .delete({ count: "exact" })
    .lt("exception_date", todayDateOnly);

  const [
    { count: cOther, error: eOther },
    { count: cNull, error: eNull },
    { count: cOld, error: eOld },
    { count: cExc, error: eExc },
  ] = await Promise.all([
    delPastOther,
    delPastNull,
    delOldCompleted,
    delExceptions,
  ]);

  if (eOther || eNull || eOld || eExc) {
    console.error("Cleanup errors:", { eOther, eNull, eOld, eExc });
    return new NextResponse("Cleanup failed", { status: 500 });
  }

  return NextResponse.json({
    message: "Cleanup done",
    now: nowISO,
    cutoff_90d: cutoffISO,
    deleted_counts: {
      past_other_status: cOther ?? 0,
      past_null_status: cNull ?? 0,
      completed_or_approved_older_than_90d: cOld ?? 0,
      exceptions_past: cExc ?? 0,
    },
  });
}
