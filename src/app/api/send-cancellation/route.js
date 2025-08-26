import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { email, name, date, reason } = await req.json();

    if (!email || !name || !date || !reason) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
      });
    }

    const formattedDate = new Date(date).toLocaleDateString("el-GR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Athens",
    });

    const formattedTime = new Date(date).toLocaleTimeString("el-GR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Athens",
    });

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Δρ. Γεωργία Κόλλια" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "Ακύρωση Ραντεβού",
      html: `
<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width"/>
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <title>Ακύρωση Ραντεβού</title>
  <style>
    @media (max-width: 600px) {
      .container { width: 100% !important; }
      .px { padding-left: 20px !important; padding-right: 20px !important; }
      .py { padding-top: 28px !important; padding-bottom: 28px !important; }
      .card { padding: 20px !important; }
      .btn { display:block !important; width:100% !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f5;">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
    Το ραντεβού σας για ${formattedDate} στις ${formattedTime} ακυρώθηκε.
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding: 28px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" class="container" style="width:600px; max-width:600px; background-color:#ffffff; border:1px solid #e9e9e9; border-radius:10px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background-color:#2f2e2b; padding:18px 24px;">
              <table width="100%" role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left">
                    <div style="color:#ffffff; font-family: Georgia, 'Times New Roman', Times, serif; font-size:18px; letter-spacing:.2px; font-weight:bold;">
                      Ιατρείο Δρ. Γεωργίας Κόλλια
                    </div>
                    <div style="color:#d7cfc2; font-family: Georgia, 'Times New Roman', Times, serif; font-size:12px; margin-top:4px;">
                      Ακύρωση Ραντεβού
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="px py" style="padding:36px 40px; font-family: Georgia, 'Times New Roman', Times, serif;">
              <h1 style="margin:0; color:#1a1a1a; font-size:22px; font-weight:700; letter-spacing:.2px;">
                Αξιότιμε/η κ. ${name},
              </h1>

              <p style="margin:16px 0 0; color:#333333; font-size:16px; line-height:1.6;">
                Θα θέλαμε να σας ενημερώσουμε ότι το ραντεβού σας έχει ακυρωθεί.
              </p>

              <!-- Appointment Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="card" style="margin-top:24px; border:1px solid #eee; border-radius:8px; padding:24px; background:#fafafa;">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="color:#1a1a1a; font-size:15px; font-weight:bold; padding:0 0 6px;">Ημερομηνία</td>
                        <td style="color:#333333; font-size:15px; padding:0 0 6px;" align="right">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="color:#1a1a1a; font-size:15px; font-weight:bold; padding:6px 0;">Ώρα</td>
                        <td style="color:#333333; font-size:15px; padding:6px 0;" align="right">${formattedTime}</td>
                      </tr>
                      <tr>
                        <td style="color:#1a1a1a; font-size:15px; font-weight:bold; padding:6px 0;">Λόγος Επίσκεψης</td>
                        <td style="color:#333333; font-size:15px; padding:6px 0;" align="right">${reason}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Next steps -->
              <p style="margin:22px 0 0; color:#333333; font-size:15px; line-height:1.6;">
                Αν επιθυμείτε, μπορείτε να προγραμματίσετε νέο ραντεβού μέσω τηλεφώνου στο <strong>210 9934316</strong>.
              </p>

              <!-- Optional CTA (kept safe with #) -->
              <p style="margin:14px 0 0;">
                <a href="https://www.drkollia.com/appointments"
                   style="background:#2f2e2b; color:#ffffff; text-decoration:none; display:inline-block; padding:12px 18px; border-radius:6px; font-size:14px; font-weight:bold;">
                  Κλείστε νέο ραντεβού
                </a>
              </p>

              <!-- Sign-off -->
              <p style="margin:22px 0 0; color:#333333; font-size:15px; line-height:1.6;">
                Με εκτίμηση,<br/>
                <strong>Γεωργία Κόλλια</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color:#f2f2f2; padding:16px 20px; color:#888888; font-size:12px; font-family: Georgia, 'Times New Roman', Times, serif; border-top:1px solid #e9e9e9;">
              Το παρόν μήνυμα αποστέλλεται αυτόματα από το σύστημα κρατήσεων του ιατρείου.
              <strong>Μην απαντάτε σε αυτό το email.</strong>
            </td>
          </tr>
        </table>

        <!-- Small print -->
        <div style="max-width:600px; margin:12px auto 0; color:#888888; font-family:Georgia, 'Times New Roman', Times, serif; font-size:11px; line-height:1.5; text-align:center;">
          Αν δεν αναγνωρίζετε αυτήν την ακύρωση, παρακαλώ επικοινωνήστε μαζί μας.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("❌ Σφάλμα αποστολής email ακύρωσης:", error);
    return new Response(JSON.stringify({ error: "Αποτυχία αποστολής email" }), {
      status: 500,
    });
  }
}
