// app/api/mark-completed/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role
);

export async function POST(req) {
  const adminKey = process.env.ADMIN_SYNC_KEY;
  if (adminKey) {
    const token = req.headers.get("x-admin-key");
    if (token !== adminKey) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  const nowISO = new Date().toISOString();

  // Mark all *past* approved appointments as completed
  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "completed" })
    .lt("appointment_time", nowISO)
    .eq("status", "approved")
    .select("id");

  if (error) {
    console.error("mark-completed error:", error);
    return new NextResponse("Update failed", { status: 500 });
  }

  return NextResponse.json({
    updated: data?.length ?? 0,
    at: nowISO,
  });
}
