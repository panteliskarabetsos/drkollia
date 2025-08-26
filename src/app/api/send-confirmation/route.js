import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { email, name, date, time, reason } = await req.json();

    if (!email || !name || !date || !time || !reason) {
      return new Response(JSON.stringify({ message: "Missing fields" }), {
        status: 400,
      });
    }
    const clinicName = " Ιατρείο Δρ. Γεωργίας Κόλλια";
    const doctorName = "Γεωργία Κόλλια";
    const doctorTitle = "Ενδοκρινολόγος";
    const phone = "210 9934316";
    const altPhone = null; // or another number
    const mapUrl = "https://maps.app.goo.gl/jNSJE8SmamUBw4Ys5?g_st=ipc"; // or Google Maps link
    const manageUrl = null; // link to portal if you have one
    const privacyUrl = null;
    const reminderChannel = "email";
    const address = "Τάμπα 8, Ηλιούπολη";

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    const appointmentDate = new Date(date); // αυτό είναι το ISO string

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
      subject: "Επιβεβαίωση Ραντεβού",
      html: `
<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width"/>
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <title>Επιβεβαίωση Ραντεβού</title>
  <style>
    /* Some clients honor embedded styles; keep most styles inline regardless */
    @media (max-width: 600px) {
      .container { width: 100% !important; }
      .px-40 { padding-left: 20px !important; padding-right: 20px !important; }
      .py-40 { padding-top: 28px !important; padding-bottom: 28px !important; }
      .card { padding: 20px !important; }
      .btn { display:block !important; width:100% !important; }
    }
    /* Dark mode hints for clients that support it */
    @media (prefers-color-scheme: dark) {
      body, .bg-page { background-color:#111111 !important; }
      .bg-card { background-color:#1a1a1a !important; }
      .text { color:#e7e7e7 !important; }
      .muted { color:#aaaaaa !important; }
      .divider { border-color:#333333 !important; }
      .title, .heading { color:#ffffff !important; }
      .btn { background-color:#d7cfc2 !important; color:#1d1c1a !important; }
      .footer { background-color:#161616 !important; color:#9a9a9a !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f5;" class="bg-page">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
    Η κράτησή σας επιβεβαιώθηκε για ${formattedDate} στις ${formattedTime}.
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
                      ${clinicName || " Ιατρείο Δρ. Γεωργίας Κόλλια "}
                    </div>
                    <div style="color:#d7cfc2; font-family: Georgia, 'Times New Roman', Times, serif; font-size:12px; margin-top:4px;">
                      Επιβεβαίωση Ραντεβού
                    </div>
                  </td>
                  <!-- Optional logo column; remove if not used -->
                  <td align="right">
                    <!-- <img src="https:/drkollia.com/favicon.ico" width="36" height="36" alt="Λογότυπο" style="display:block;border:0;"/> -->
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="px-40 py-40" style="padding:36px 40px; font-family: Georgia, 'Times New Roman', Times, serif;">
              <h1 class="title" style="margin:0; color:#1a1a1a; font-size:22px; font-weight:700; letter-spacing:.2px;">
                Αξιότιμε/η κ. ${name},
              </h1>

              <p class="text" style="margin:16px 0 0; color:#333333; font-size:16px; line-height:1.6;">
                Το ραντεβού σας καταχωρήθηκε με επιτυχία. Παρακάτω θα βρείτε τα στοιχεία της επίσκεψης.
              </p>

              <!-- Appointment Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="card bg-card" style="margin-top:24px; border:1px solid #eee; border-radius:8px; padding:24px; background:#fafafa;">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td class="heading" style="color:#1a1a1a; font-size:15px; font-weight:bold; padding:0 0 6px;">Ημερομηνία</td>
                        <td class="text" style="color:#333333; font-size:15px; padding:0 0 6px;" align="right">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td class="heading" style="color:#1a1a1a; font-size:15px; font-weight:bold; padding:6px 0;">Ώρα</td>
                        <td class="text" style="color:#333333; font-size:15px; padding:6px 0;" align="right">${formattedTime}</td>
                      </tr>
                      <tr>
                        <td class="heading" style="color:#1a1a1a; font-size:15px; font-weight:bold; padding:6px 0;">Λόγος Επίσκεψης</td>
                        <td class="text" style="color:#333333; font-size:15px; padding:6px 0;" align="right">${reason}</td>
                      </tr>
                      ${
                        address
                          ? `
                      <tr>
                        <td class="heading" style="color:#1a1a1a; font-size:15px; font-weight:bold; padding:6px 0;">Διεύθυνση</td>
                        <td class="text" style="color:#333333; font-size:15px; padding:6px 0;" align="right">${address}</td>
                      </tr>`
                          : ``
                      }
                    </table>

                    <!-- CTA Buttons -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:18px;">
                      <tr>
                        <td align="left" style="padding-top:10px;">
                          <!-- Primary button -->
                          ${
                            mapUrl
                              ? `
                          <a href="${mapUrl}"
                                class="btn"
                             style="background:#2f2e2b; color:#ffffff; text-decoration:none; display:inline-block; padding:12px 18px; border-radius:6px; font-size:14px; font-weight:bold;">
                            Οδηγίες πρόσβασης
                          </a>`
                              : ``
                          }
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Notes -->
              <p class="text" style="margin:22px 0 0; color:#333333; font-size:15px; line-height:1.6;">
                Θα λάβετε υπενθύμιση μία ημέρα πριν την επίσκεψή σας${
                  reminderChannel ? ` μέσω ${reminderChannel}` : ``
                }.
              </p>

              <p class="text" style="margin:14px 0 0; color:#333333; font-size:15px; line-height:1.6;">
                Παρακαλούμε προσέλθετε εγκαίρως.
              </p>

              <p class="text" style="margin:14px 0 0; color:#333333; font-size:15px; line-height:1.6;">
                Για αλλαγή ή ακύρωση, καλέστε στο <strong>${
                  phone || "210 9934316"
                }</strong>${
        altPhone ? ` ή στο <strong>${altPhone}</strong>` : ``
      }.
              </p>

              <!-- Divider -->
              <hr class="divider" style="border:none; border-top:1px solid #eaeaea; margin:26px 0;" />

              <p class="text" style="margin:0; color:#333333; font-size:15px; line-height:1.6;">
                Με εκτίμηση,<br/>
                <strong>${doctorName || "Γεωργία Κόλλια"}</strong>
                ${
                  doctorTitle
                    ? `<br/><span class="muted" style="color:#666666; font-size:13px;">${doctorTitle}</span>`
                    : ``
                }
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" class="footer" style="background-color:#f2f2f2; padding:16px 20px; color:#888888; font-size:12px; font-family: Georgia, 'Times New Roman', Times, serif; border-top:1px solid #e9e9e9;">
              Το παρόν μήνυμα αποστέλλεται αυτόματα από το σύστημα κρατήσεων του ιατρείου.
              <strong>Μην απαντάτε σε αυτό το email.</strong>
              ${
                privacyUrl
                  ? `<br/><a href="${privacyUrl}" style="color:#888888; text-decoration:underline;">Πολιτική Απορρήτου</a>`
                  : ``
              }
            </td>
          </tr>
        </table>

        <!-- Small print -->
        <div class="muted" style="max-width:600px; margin:12px auto 0; color:#888888; font-family:Georgia, 'Times New Roman', Times, serif; font-size:11px; line-height:1.5; text-align:center;">
          Αν δεν πραγματοποιήσατε εσείς αυτήν την κράτηση, αγνοήστε το μήνυμα ή επικοινωνήστε μαζί μας.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`,
    });

    return new Response(
      JSON.stringify({ message: "Email sent successfully" }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Email error:", err);
    return new Response(JSON.stringify({ message: "Failed to send email" }), {
      status: 500,
    });
  }
}
