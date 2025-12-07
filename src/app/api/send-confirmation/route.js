import nodemailer from "nodemailer";
import crypto from "crypto";

function pad(n) {
  return String(n).padStart(2, "0");
}

/**
 * Stable UID.
 * IMPORTANT: Use the SAME function in cancellation emails.
 */
function buildStableAppointmentUID(email, dateISO) {
  const raw = `${email}|${dateISO}|dr-kollia`;
  const hash = crypto.createHash("sha1").update(raw).digest("hex").slice(0, 16);
  return `apt-${hash}@dr-kollia`;
}

function getDurationMinutesByReason(reason) {
  if (reason === "Αξιολόγηση Αποτελεσμάτων") return 20; // or 15
  if (reason === "Ιατρικός Επισκέπτης") return 15;
  if (reason === "Εξέταση") return 30;
  return 30;
}

function buildAppointmentICS({
  startDate,
  durationMinutes,
  clinicName,
  doctorName,
  doctorTitle,
  address,
  phone,
  mapUrl,
  patientName,
  reason,
  organizerEmail,
  attendeeEmail,
  uid,
}) {
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const dtStart = toICSDateUTC(startDate);
  const dtEnd = toICSDateUTC(endDate);
  const dtStamp = toICSDateUTC(new Date());

  const summary = `${clinicName} — ${reason}`;

  const descriptionLines = [
    `Ιατρός: ${doctorName}${doctorTitle ? " • " + doctorTitle : ""}`,
    `Λόγος επίσκεψης: ${reason}`,
    address ? `Διεύθυνση: ${address}` : null,
    phone ? `Τηλέφωνο: ${phone}` : null,
    mapUrl ? `Χάρτης: ${mapUrl}` : null,
    "Παρακαλούμε προσέλθετε 5-10 λεπτά νωρίτερα.",
  ].filter(Boolean);

  const description = descriptionLines.join("\n");

  // REQUEST = invite-like behavior
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dr Kollia Clinic//Appointments//EL",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${icsEscape(summary)}`,
    address ? `LOCATION:${icsEscape(address)}` : "",
    `DESCRIPTION:${icsEscape(description)}`,
    organizerEmail
      ? `ORGANIZER;CN="${icsEscape(doctorName)}":MAILTO:${organizerEmail}`
      : "",
    attendeeEmail
      ? `ATTENDEE;CN="${icsEscape(
          patientName
        )}";ROLE=REQ-PARTICIPANT;RSVP=FALSE:MAILTO:${attendeeEmail}`
      : "",
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export async function POST(req) {
  try {
    const { email, name, date, time, reason } = await req.json();

    // time is currently not used because date is expected to be full ISO with time.
    if (!email || !name || !date || !time || !reason) {
      return new Response(JSON.stringify({ message: "Missing fields" }), {
        status: 400,
      });
    }

    const clinicName = "Ιατρείο Δρ. Γεωργίας Κόλλια";
    const doctorName = "Γεωργία Κόλλια";
    const doctorTitle = "Ενδοκρινολόγος";
    const phone = "210 9934316";
    const altPhone = null;
    const mapUrl = "https://maps.app.goo.gl/jNSJE8SmamUBw4Ys5?g_st=ipc";
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

    // Expecting date to be ISO including time (e.g., combinedDate.toISOString()).
    const appointmentDate = new Date(date);

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

    const durationMinutes = getDurationMinutesByReason(reason);

    //Stable UID (must match cancellation)
    const uid = buildStableAppointmentUID(email, date);

    const icsContent = buildAppointmentICS({
      startDate: appointmentDate,
      durationMinutes,
      clinicName,
      doctorName,
      doctorTitle,
      address,
      phone,
      mapUrl,
      patientName: name,
      reason,
      organizerEmail: process.env.SMTP_EMAIL,
      attendeeEmail: email,
      uid,
    });
    await transporter.sendMail({
      from: `"Δρ. Γεωργία Κόλλια" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "Επιβεβαίωση Ραντεβού",
      text: `
${clinicName}
Επιβεβαίωση Ραντεβού

Αξιότιμε/η κ. ${name},

Το ραντεβού σας καταχωρήθηκε με επιτυχία.

Ημερομηνία: ${formattedDate}
Ώρα: ${formattedTime}
Λόγος Επίσκεψης: ${reason}
${address ? `Διεύθυνση: ${address}` : ""}

Για αλλαγή ή ακύρωση επικοινωνήστε στο ${phone}${
        altPhone ? ` ή ${altPhone}` : ""
      }.
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
  <title>Επιβεβαίωση Ραντεβού</title>
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
    Η κράτησή σας επιβεβαιώθηκε για ${formattedDate} στις ${formattedTime}.
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
            <td style="padding:26px 32px 8px 32px;" class="px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-family: Georgia, 'Times New Roman', serif; font-size:20px; font-weight:700; color:#2f2e2b; letter-spacing:.2px;">
                      ${clinicName}
                    </div>
                    <div style="margin-top:4px; font-family: Arial, Helvetica, sans-serif; font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:#8f877a;">
                      Επιβεβαίωση ραντεβού
                    </div>
                  </td>
                  <td align="right" class="stack align-left" style="font-family: Arial, Helvetica, sans-serif;">
                    <div style="display:inline-block; padding:6px 10px; border-radius:999px; background:#f5efe4; color:#5a554c; font-size:10px; font-weight:600; letter-spacing:.08em;">
                      Σύστημα online κρατήσεων
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero / status -->
          <tr>
            <td style="padding:10px 32px 0 32px;" class="px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="background:#fbf6ed; border:1px solid #efe3d1; border-radius:14px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-family: Arial, Helvetica, sans-serif; font-size:12px; color:#7b7367; letter-spacing:.14em; text-transform:uppercase;">
                      Κατάσταση
                    </div>
                    <div style="margin-top:6px; font-family: Georgia, 'Times New Roman', serif; font-size:22px; font-weight:700; color:#1f1e1b;">
                      ✓ Το ραντεβού σας επιβεβαιώθηκε
                    </div>
                    <div style="margin-top:6px; font-family: Arial, Helvetica, sans-serif; font-size:13px; color:#6f675b; line-height:1.5;">
                      Αποθηκεύστε τα στοιχεία παρακάτω. Η πληρωμή πραγματοποιείται στο ιατρείο.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:26px 32px 10px 32px; font-family: Arial, Helvetica, sans-serif;" class="px py">
              <div style="font-size:16px; color:#2f2e2b;">
                Αξιότιμε/η κ. <strong>${name}</strong>,
              </div>
              <div style="margin-top:10px; font-size:14.5px; color:#5c554a; line-height:1.6;">
                Το ραντεβού σας καταχωρήθηκε με επιτυχία. Παρακάτω θα βρείτε τα στοιχεία της επίσκεψης.
              </div>

              <!-- Details card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="margin-top:20px; background:#ffffff; border:1px solid #eee2d2; border-radius:14px;">
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
                        <td style="padding:8px 0; font-size:13px; color:#7a7368;">Λόγος Επίσκεψης</td>
                        <td style="padding:8px 0; font-size:14px; color:#2f2e2b; font-weight:600;" align="right">${reason}</td>
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

                    <!-- Divider -->
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
                            Καλέστε το ιατρείο
                          </a>`
                              : ``
                          }
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Helpful hints -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="margin-top:18px; background:#fbfaf8; border:1px solid #f0e7da; border-radius:12px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <div style="font-size:12.5px; color:#5f584d; line-height:1.6;">
                      • Παρακαλούμε προσέλθετε 5-10 λεπτά νωρίτερα.<br/>
                      • Έχετε μαζί σας πρόσφατες εξετάσεις και φαρμακευτική αγωγή.<br/>
                      • Για αλλαγή ή ακύρωση, επικοινωνήστε στο <strong>${phone}</strong>${
        altPhone ? ` ή <strong>${altPhone}</strong>` : ""
      }.
                    </div>
                  </td>
                </tr>
              </table>

              <div style="margin-top:18px; font-size:14px; color:#5c554a; line-height:1.6;">
                Θα λάβετε υπενθύμιση μία ημέρα πριν την επίσκεψή σας${
                  reminderChannel ? ` μέσω ${reminderChannel}` : ""
                }.
              </div>

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
                Το παρόν μήνυμα αποστέλλεται αυτόματα από το σύστημα κρατήσεων του ιατρείου.<br/>
                <strong>Μην απαντάτε σε αυτό το email.</strong>
                ${
                  privacyUrl
                    ? `<br/><a href="${privacyUrl}" style="color:#8a8274; text-decoration:underline;">Πολιτική Απορρήτου</a>`
                    : ``
                }
              </div>
            </td>
          </tr>
        </table>

        <!-- Small print -->
        <div style="max-width:600px; margin:12px auto 0; font-family: Arial, Helvetica, sans-serif; font-size:10.5px; color:#9a9286; line-height:1.5; text-align:center;">
          Αν δεν πραγματοποιήσατε εσείς αυτήν την κράτηση, αγνοήστε το μήνυμα ή επικοινωνήστε μαζί μας.
        </div>

      </td>
    </tr>
  </table>
</body>
</html>
  `,
      alternatives: [
        {
          contentType: "text/calendar; charset=utf-8; method=REQUEST",
          content: icsContent,
        },
      ],
      attachments: [
        {
          filename: "appointment.ics",
          content: icsContent,
          contentType: "text/calendar; charset=utf-8; method=REQUEST",
        },
      ],
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

// Convert Date -> ICS UTC format: YYYYMMDDTHHMMSSZ
function toICSDateUTC(d) {
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

// Basic escaping for ICS text fields
function icsEscape(text = "") {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}
