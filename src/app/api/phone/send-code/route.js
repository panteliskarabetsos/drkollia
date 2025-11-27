// app/api/phone/send-code/route.js
import { NextResponse } from "next/server";
import twilio from "twilio";

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

const TWILIO_VERIFY_SID = process.env.TWILIO_VERIFY_SID; // το Verify Service SID

export async function POST(req) {
  try {
    const { phone } = await req.json();

    // Έλεγχος ελληνικού κινητού: 69xxxxxxxx
    if (!phone || !/^69\d{8}$/.test(phone)) {
      return NextResponse.json(
        { error: "Μη έγκυρο ελληνικό κινητό (πρέπει να ξεκινά από 69)." },
        { status: 400 }
      );
    }

    if (!twilioClient || !TWILIO_VERIFY_SID) {
      console.error("Twilio Verify env vars missing");
      return NextResponse.json(
        {
          error:
            "Η υπηρεσία SMS δεν είναι προσωρινά διαθέσιμη. Προσπαθήστε αργότερα.",
        },
        { status: 500 }
      );
    }

    // Μετατροπή σε διεθνή μορφή
    const toPhone = phone.startsWith("+") ? phone : `+30${phone}`;

    // 🔹 Ζητάμε από το Twilio Verify να στείλει κωδικό με SMS
    const verification = await twilioClient.verify.v2
      .services(TWILIO_VERIFY_SID)
      .verifications.create({
        to: toPhone,
        channel: "sms",
      });

    // Προαιρετικό log
    if (process.env.NODE_ENV !== "production") {
      console.log("Twilio Verify send-code status:", verification.status);
    }

    // Αρκεί ένα success flag στο frontend
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("send-code error", err);
    return NextResponse.json(
      { error: "Σφάλμα κατά την αποστολή SMS." },
      { status: 500 }
    );
  }
}
