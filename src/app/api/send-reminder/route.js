import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

export const config = {
  schedule: "0 8 * * *", // κάθε μέρα 08:00 UTC (11:00 Ελλάδας το καλοκαίρι)
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
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
      .select(
        `id, appointment_time, reason, patients (first_name, last_name, email)`
      )
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
      const patient = appt.patients || {};

      const first = patient.first_name || "";
      const last = patient.last_name || "";
      const full_name = `${first} ${last}`.trim() || "κυρία/κύριε";
      const email = patient.email;

      if (!email) continue;

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

      const clinicName = "Ιατρείο Δρ. Γεωργίας Κόλλια";
      const doctorName = "Γεωργία Κόλλια";
      const doctorTitle = "Ενδοκρινολόγος";
      const phone = "210 9934316";
      const mapUrl = "https://maps.app.goo.gl/jNSJE8SmamUBw4Ys5?g_st=ipc";
      const address = "Τάμπα 8, Ηλιούπολη";

      await transporter.sendMail({
        from: `"Δρ. Γεωργία Κόλλια" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: "Υπενθύμιση Ραντεβού",
        text: `
${clinicName}
ΥΠΕΝΘΥΜΙΣΗ ΡΑΝΤΕΒΟΥ

Αγαπητέ/ή ${full_name},

Σας υπενθυμίζουμε το ραντεβού σας:

Ημερομηνία: ${formattedDate}
Ώρα: ${formattedTime}
Λόγος: ${appt.reason}
${address ? `Διεύθυνση: ${address}` : ""}

Παρακαλούμε προσέλθετε 5-10 λεπτά νωρίτερα.
Για αλλαγή ή ακύρωση καλέστε στο ${phone}.
${mapUrl ? `Οδηγίες πρόσβασης: ${mapUrl}` : ""}

Με εκτίμηση,
${doctorName}${doctorTitle ? `\n${doctorTitle}` : ""}
  `.trim(),
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
      .py { padding-top:22px !important; padding-bottom:22px !important; }
      .card-pad { padding:18px !important; }
      .btn { display:block !important; width:100% !important; box-sizing:border-box !important; }
      .stack { display:block !important; width:100% !important; }
      .align-left { text-align:left !important; }
    }
  </style>
</head>

<body style="margin:0; padding:0; background:#f6f1e9;">
  <!-- Preheader -->
  <div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
    Υπενθύμιση: ${formattedDate} • ${formattedTime}.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e9;">
    <tr>
      <td align="center" style="padding:28px 12px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="container"
          style="width:600px; max-width:600px; background:#ffffff; border:1px solid #eadfce; border-radius:16px; overflow:hidden; box-shadow:0 10px 28px rgba(20, 16, 10, 0.08);">

          <!-- Top brand strip -->
          <tr>
            <td style="height:6px; background:linear-gradient(90deg,#2f2e2b,#5a554c,#2f2e2b);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:24px 32px 8px 32px;" class="px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-family: Georgia, 'Times New Roman', serif; font-size:20px; font-weight:700; color:#2f2e2b; letter-spacing:.2px;">
                      ${clinicName}
                    </div>
                    <div style="margin-top:4px; font-family: Arial, Helvetica, sans-serif; font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:#8f877a;">
                      Υπενθύμιση ραντεβού
                    </div>
                  </td>
                  <td align="right" class="stack align-left" style="font-family: Arial, Helvetica, sans-serif;">
                    <div style="display:inline-block; padding:6px 10px; border-radius:999px; background:#f5efe4; color:#5a554c; font-size:10px; font-weight:600; letter-spacing:.08em;">
                      Σε 24 ώρες περίπου
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Status block -->
          <tr>
            <td style="padding:8px 32px 0 32px;" class="px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="background:#fbf6ed; border:1px solid #efe3d1; border-radius:14px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-family: Arial, Helvetica, sans-serif; font-size:12px; color:#7b7367; letter-spacing:.14em; text-transform:uppercase;">
                      ΥΠΕΝΘΥΜΙΣΗ
                    </div>
                    <div style="margin-top:6px; font-family: Georgia, 'Times New Roman', serif; font-size:20px; font-weight:700; color:#1f1e1b;">
                      Το ραντεβού σας πλησιάζει
                    </div>
                    <div style="margin-top:6px; font-family: Arial, Helvetica, sans-serif; font-size:13px; color:#6f675b; line-height:1.5;">
                      Παρακαλούμε επιβεβαιώστε ότι μπορείτε να προσέλθετε την προγραμματισμένη ώρα.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:22px 32px 10px 32px; font-family: Arial, Helvetica, sans-serif;" class="px py">
              <div style="font-size:16px; color:#2f2e2b;">
                Αγαπητέ/ή <strong>${full_name}</strong>,
              </div>
              <div style="margin-top:10px; font-size:14.5px; color:#5c554a; line-height:1.6;">
                Σας υπενθυμίζουμε το προγραμματισμένο ραντεβού σας με τα παρακάτω στοιχεία.
              </div>

              <!-- Details card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="margin-top:18px; background:#ffffff; border:1px solid #eee2d2; border-radius:14px;">
                <tr>
                  <td class="card-pad" style="padding:22px;">
                    <div style="font-family: Arial, Helvetica, sans-serif; font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:#8f877a; font-weight:600;">
                      Στοιχεία ραντεβού
                    </div>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
                      <tr>
                        <td style="padding:8px 0; font-size:13px; color:#7a7368; width:40%;">Ημερομηνία</td>
                        <td style="padding:8px 0; font-size:14px; color:#2f2e2b; font-weight:600;" align="right">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0; font-size:13px; color:#7a7368;">Ώρα</td>
                        <td style="padding:8px 0; font-size:14px; color:#2f2e2b; font-weight:600;" align="right">${formattedTime}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0; font-size:13px; color:#7a7368;">Λόγος</td>
                        <td style="padding:8px 0; font-size:14px; color:#2f2e2b; font-weight:600;" align="right">${
                          appt.reason
                        }</td>
                      </tr>
                      ${
                        address
                          ? `
                      <tr>
                        <td style="padding:8px 0; font-size:13px; color:#7a7368;">Διεύθυνση</td>
                        <td style="padding:8px 0; font-size:14px; color:#2f2e2b; font-weight:600;" align="right">${address}</td>
                      </tr>`
                          : ``
                      }
                    </table>

                    <div style="height:1px; background:#f0e5d6; margin:14px 0 16px 0;"></div>

                    <!-- CTAs -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="stack" style="padding-bottom:10px;">
                          ${
                            mapUrl
                              ? `
                          <a href="${mapUrl}" class="btn"
                             style="background:#2f2e2b; color:#ffffff; text-decoration:none; display:inline-block; padding:12px 16px; border-radius:10px; font-size:13px; font-weight:700; letter-spacing:.02em;">
                            Οδηγίες πρόσβασης
                          </a>`
                              : ``
                          }
                        </td>
                        <td align="right" class="stack align-left">
                          ${
                            phone
                              ? `
                          <a href="tel:${phone.replace(/\s+/g, "")}" class="btn"
                             style="background:#f5efe4; color:#2f2e2b; text-decoration:none; display:inline-block; padding:12px 16px; border-radius:10px; font-size:13px; font-weight:700; border:1px solid #e9dcc9;">
                            Αλλαγή / Ακύρωση
                          </a>`
                              : ``
                          }
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Preparation tips -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="margin-top:16px; background:#fbfaf8; border:1px solid #f0e7da; border-radius:12px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <div style="font-size:12.5px; color:#5f584d; line-height:1.6;">
                      • Παρακαλούμε προσέλθετε 5-10 λεπτά νωρίτερα.<br/>
                      • Έχετε μαζί σας πρόσφατες εξετάσεις και τη φαρμακευτική σας αγωγή.<br/>
                      • Αν χρειάζεστε αλλαγή ή ακύρωση, καλέστε έγκαιρα στο <strong>${phone}</strong>.
                    </div>
                  </td>
                </tr>
              </table>

              <div style="margin-top:18px;">
                <div style="font-family: Georgia, 'Times New Roman', serif; font-size:16px; font-weight:700; color:#2f2e2b;">
                  Με εκτίμηση,
                </div>
                <div style="font-family: Georgia, 'Times New Roman', serif; font-size:15px; color:#2f2e2b;">
                  ${doctorName}
                </div>
                ${
                  doctorTitle
                    ? `<div style="font-family: Arial, Helvetica, sans-serif; font-size:11.5px; color:#8a8274; margin-top:2px;">${doctorTitle}</div>`
                    : ``
                }
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:18px 24px; background:#faf6ef; border-top:1px solid #efe3d1;">
              <div style="font-family: Arial, Helvetica, sans-serif; font-size:11px; color:#8a8274; line-height:1.5;">
                Το παρόν email αποστέλλεται αυτόματα από το σύστημα κρατήσεων του ιατρείου.<br/>
                <strong>Μην απαντάτε σε αυτό το μήνυμα.</strong>
              </div>
            </td>
          </tr>

        </table>

        <div style="max-width:600px; margin:12px auto 0; font-family: Arial, Helvetica, sans-serif; font-size:10.5px; color:#9a9286; line-height:1.5; text-align:center;">
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
