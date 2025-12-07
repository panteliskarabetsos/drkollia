import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

export async function GET() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("clinic_settings")
    .select("accept_new_appointments")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("clinic_settings error:", error);
    return NextResponse.json(
      { error: "Failed to load clinic settings" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    accept_new_appointments: data.accept_new_appointments,
  });
}
