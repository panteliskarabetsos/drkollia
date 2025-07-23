// /app/api/appointments/route.js
// Fallback to relative path
import { supabase } from "../../lib/supabaseClient";


export async function POST(request) {
  const body = await request.json();

  const { data, error } = await supabase
    .from("appointments")
    .insert([body]);

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  return new Response(JSON.stringify(data), { status: 200 });
}
