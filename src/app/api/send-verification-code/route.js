import { NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(req) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }

    // For Greek mobiles like 69XXXXXXXX
    const to =
      phone.startsWith("+") || phone.startsWith("00") ? phone : `+30${phone}`;

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verifications.create({
        to,
        channel: "sms",
      });

    return NextResponse.json({ status: verification.status });
  } catch (err) {
    console.error("Twilio send error:", err);
    return NextResponse.json(
      { error: "Αποτυχία αποστολής SMS. Προσπαθήστε ξανά." },
      { status: 500 }
    );
  }
}
