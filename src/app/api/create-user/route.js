// app/api/admin/create-user/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // keep secret!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export async function POST(req) {
  try {
    const { name, email, phone, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1) Create the user with metadata
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        password,
        user_metadata: { name, phone, role: "admin" },
        email_confirm: false, // set true if you want to auto-confirm
      });
    if (createErr) {
      return NextResponse.json({ error: createErr.message }, { status: 400 });
    }

    const user = created.user;
    if (!user) {
      return NextResponse.json({ error: "User not returned" }, { status: 500 });
    }

    // 2) Upsert into profiles
    const { error: profileErr } = await admin
      .from("profiles")
      .upsert([{ id: user.id, name, email, phone, role: "admin" }]);

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 400 });
    }

    // Optional: send invite
    // await admin.auth.admin.inviteUserByEmail(email); // requires gotrue >= v2. This is optional.

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (e) {
    return NextResponse.json(
      { error: e.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
