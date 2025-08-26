import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

export const config = {
  schedule: "0 8 * * *", // κάθε μέρα 08:00 UTC (11:00 Ελλάδας το καλοκαίρι)
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(`id, appointment_time, reason, patients (full_name, email)`)
      .eq("status", "approved")
      .gte("appointment_time", now.toISOString())
      .lte("appointment_time", tomorrow.toISOString());

    if (error) {
      console.error("Supabase error:", error);
      return new Response(
        JSON.stringify({ message: "Failed to fetch appointments" }),
        { status: 500 }
      );
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

    for (const appt of appointments) {
      const { full_name, email } = appt.patients;
      const appointmentDate = new Date(appt.appointment_time);

      const formattedDate = appointmentDate.toLocaleDateString("el-GR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Athens",
      });

      const formattedTime = appointmentDate.toLocaleTimeString("el-GR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Athens",
      });

      await transporter.sendMail({
        from: `"Δρ. Γεωργία Κόλλια" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: "Υπενθύμιση Ραντεβού",
        html: `
<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width"/>
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <title>Υπενθύμιση Ραντεβού</title>
  <style>
    @media (max-width: 600px) {
      .container { width:100% !important; }
      .px { padding-left:20px !important; padding-right:20px !important; }
      .py { padding-top:24px !important; padding-bottom:24px !important; }
      .card { padding:20px !important; }
      .btn { display:block !important; width:100% !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background:#f5f5f5; font-family: Georgia, 'Times New Roman', Times, serif;">
  <!-- Preheader (hidden preview text in inbox) -->
  <div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
    Υπενθύμιση: ραντεβού στις ${formattedDate} • ${formattedTime}.
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f5f5f5;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" class="container" style="width:600px; max-width:600px; background:#ffffff; border:1px solid #e9e9e9; border-radius:10px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:#2f2e2b; padding:16px 22px;">
              <div style="color:#ffffff; font-size:18px; font-weight:bold;">Ιατρείο Ενδοκρινολογίας</div>
              <div style="color:#d7cfc2; font-size:12px; margin-top:2px;">Υπενθύμιση Ραντεβού</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="px py" style="padding:32px 36px;">
              <h1 style="margin:0; color:#1a1a1a; font-size:20px; font-weight:700;">
                Αγαπητέ/ή ${full_name},
              </h1>

              <p style="margin:14px 0 0; color:#333333; font-size:16px; line-height:1.6;">
                Υπενθύμιση για το επικείμενο ραντεβού σας:
              </p>

              <!-- Appointment Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="card" style="margin-top:18px; border:1px solid #eeeeee; border-radius:8px; padding:22px; background:#fafafa;">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="color:#1a1a1a; font-size:15px; font-weight:bold; padding-bottom:6px;">Ημερομηνία</td>
                        <td align="right" style="color:#333333; font-size:15px; padding-bottom:6px;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="color:#1a1a1a; font-size:15px; font-weight:bold; padding:6px 0;">Ώρα</td>
                        <td align="right" style="color:#333333; font-size:15px; padding:6px 0;">${formattedTime}</td>
                      </tr>
                      <tr>
                        <td style="color:#1a1a1a; font-size:15px; font-weight:bold; padding:6px 0;">Λόγος</td>
                        <td align="right" style="color:#333333; font-size:15px; padding:6px 0;">${appt.reason}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:18px 0 0; color:#333333; font-size:15px; line-height:1.6;">
                Παρακαλούμε προσέλθετε εγκαίρως. Για αλλαγή ή ακύρωση, επικοινωνήστε με το ιατρείο.
              </p>

        

              <p style="margin:22px 0 0; color:#333333; font-size:15px; line-height:1.6;">
                Με εκτίμηση,<br/>
                <strong>Γεωργία Κόλλια</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background:#f2f2f2; padding:14px 18px; color:#888888; font-size:12px; border-top:1px solid #e9e9e9;">
              Το παρόν email αποστέλλεται αυτόματα από το σύστημα κρατήσεων του ιατρείου.
              <strong>Μην απαντάτε σε αυτό το μήνυμα.</strong>
            </td>
          </tr>
        </table>

        <!-- Small print -->
        <div style="max-width:600px; margin:12px auto 0; color:#888888; font-size:11px; line-height:1.5; text-align:center;">
          Αν δεν αναγνωρίζετε αυτό το ραντεβού, αγνοήστε το μήνυμα ή επικοινωνήστε μαζί μας.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`,
      });
    }

    return new Response(
      JSON.stringify({
        message: "Reminders sent successfully",
        count: appointments.length,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Reminder email error:", err);
    return new Response(
      JSON.stringify({ message: "Failed to send reminders" }),
      { status: 500 }
    );
  }
}
