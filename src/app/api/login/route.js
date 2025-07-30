import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  const { email, password } = await req.json();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return Response.json({ error: error.message }, { status: 401 });
  }

  return Response.json({ user: data.user, session: data.session });
}
