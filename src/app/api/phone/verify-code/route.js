// app/api/phone/verify-code/route.js
import { NextResponse } from "next/server";
import twilio from "twilio";

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

const TWILIO_VERIFY_SID = process.env.TWILIO_VERIFY_SID;

export async function POST(req) {
  try {
    const body = await req.json();
    const { phone, code } = body || {};

    console.log("🔍 verify-code body:", body);

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Λείπουν δεδομένα (phone ή code).", valid: false },
        { status: 400 }
      );
    }

    if (!twilioClient || !TWILIO_VERIFY_SID) {
      console.error("Twilio Verify env vars missing");
      return NextResponse.json(
        {
          error:
            "Η υπηρεσία επιβεβαίωσης δεν είναι προσωρινά διαθέσιμη. Προσπαθήστε αργότερα.",
          valid: false,
        },
        { status: 500 }
      );
    }

    const toPhone = phone.startsWith("+") ? phone : `+30${phone}`;

    // 🔹 Ερώτηση στο Twilio Verify αν ο κωδικός είναι σωστός
    const check = await twilioClient.verify.v2
      .services(TWILIO_VERIFY_SID)
      .verificationChecks.create({
        to: toPhone,
        code,
      });

    console.log("🔍 verify-code check:", check.status);

    if (check.status === "approved") {
      // ΕΠΙΤΥΧΗΣ επιβεβαίωση
      return NextResponse.json({ valid: true });
    }

    // Ο κωδικός είναι λάθος ή έληξε
    return NextResponse.json(
      { error: "Ο κωδικός δεν είναι σωστός ή έχει λήξει.", valid: false },
      { status: 400 }
    );
  } catch (err) {
    console.error("verify-code error", err);
    return NextResponse.json(
      { error: "Σφάλμα κατά την επιβεβαίωση.", valid: false },
      { status: 500 }
    );
  }
}
