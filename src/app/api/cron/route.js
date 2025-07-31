// app/api/cron/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

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

  // Υπολογισμός αυριανής ημερομηνίας (00:00)
  const startOfTomorrow = new Date(now);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  startOfTomorrow.setHours(0, 0, 0, 0);

  // Τέλος αυριανής ημέρας (23:59:59)
  const endOfTomorrow = new Date(startOfTomorrow);
  endOfTomorrow.setHours(23, 59, 59, 999);

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(
      "id, appointment_time, reason, patients (first_name, last_name, email)"
    )
    .eq("status", "approved")
    .gte("appointment_time", startOfTomorrow.toISOString())
    .lte("appointment_time", endOfTomorrow.toISOString());

  if (error) {
    console.error("Supabase error:", error.message);
    return new NextResponse("DB error", { status: 500 });
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  let sentCount = 0;

  for (const appointment of appointments) {
    const { patients, appointment_time, reason } = appointment;
    if (!patients?.email) continue;
    const name =
      [patients?.first_name, patients?.last_name].filter(Boolean).join(" ") ||
      "Ασθενής";

    const date = new Date(appointment_time);
    const formattedDate = date.toLocaleDateString("el-GR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Athens",
    });
    const formattedTime = date.toLocaleTimeString("el-GR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Athens",
    });

    await transporter.sendMail({
      from: `"Δρ. Γεωργία Κόλλια" <${process.env.SMTP_EMAIL}>`,
      to: patients.email,
      subject: "Υπενθύμιση Ραντεβού",
      html: `
            <!DOCTYPE html>
            <html lang="el">
            <head>
                <meta charset="UTF-8" />
                <title>Υπενθύμιση Ραντεβού</title>
            </head>
            <body style="margin:0;padding:0;font-family:Georgia, serif;background-color:#f5f5f5;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 0;">
                <tr>
                    <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #ddd;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                        <tr>
                        <td style="padding:40px 40px 30px;">
                            <h2 style="margin:0;color:#1a1a1a;font-size:22px;font-weight:normal;">Αξιότιμε/η κ. ${name},</h2>
                            <p style="margin-top:20px;color:#333333;font-size:16px;line-height:1.6;">
                            Θα θέλαμε να σας υπενθυμίσουμε ότι έχετε προγραμματισμένο ραντεβού στο ιατρείο μας.
                            </p>

                            <p style="margin-top:25px;margin-bottom:5px;color:#1a1a1a;font-size:16px;font-weight:bold;">Στοιχεία Ραντεβού:</p>
                            <table cellpadding="0" cellspacing="0" style="width:100%;font-size:15px;color:#333;margin-top:10px;">
                            <tr>
                                <td style="padding:8px 0;"><strong>Ημερομηνία:</strong></td>
                                <td style="padding:8px 0;">${formattedDate}</td>
                            </tr>
                            <tr>
                                <td style="padding:8px 0;"><strong>Ώρα:</strong></td>
                                <td style="padding:8px 0;">${formattedTime}</td>
                            </tr>
                            <tr>
                                <td style="padding:8px 0;"><strong>Λόγος Επίσκεψης:</strong></td>
                                <td style="padding:8px 0;">${reason}</td>
                            </tr>
                            </table>

                            <p style="margin-top:30px;color:#333333;font-size:15px;line-height:1.6;">
                            Παρακαλούμε προσέλθετε εγκαίρως. Για ακύρωση ή επαναπρογραμματισμό καλέστε μας στο 2109934316. Εάν δεν μπορείτε να παραβρεθείτε, παρακαλούμε ενημερώστε μας τουλάχιστον 24 ώρες νωρίτερα.
                            </p>

                            <p style="margin-top:35px;color:#1a1a1a;font-size:15px;">
                            Με εκτίμηση,<br />
                            <strong>Γεωργία Κόλλια</strong>
                            </p>
                        </td>
                        </tr>
                        <tr>
                        <td align="center" style="background-color:#f2f2f2;padding:15px;color:#888;font-size:13px;border-top:1px solid #ddd;">
                            Το παρόν μήνυμα αποστέλλεται αυτόματα από το σύστημα κρατήσεων του ιατρείου.<br/>
                            <strong>Μην απαντάτε σε αυτό το email.</strong>
                        </td>
                        </tr>
                    </table>
                    </td>
                </tr>
                </table>
            </body>
            </html>
      `,
    });

    sentCount++;
  }

  return NextResponse.json({ message: `Reminders sent: ${sentCount}` });
}
