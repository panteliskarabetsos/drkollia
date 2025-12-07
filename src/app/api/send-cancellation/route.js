import nodemailer from "nodemailer";
import crypto from "crypto";

function pad(n) {
  return String(n).padStart(2, "0");
}

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

function icsEscape(text = "") {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/**
 * Stable UID for calendar events.
 * IMPORTANT: Use the SAME function in confirmation emails too.
 */
function buildStableAppointmentUID(email, dateISO) {
  const raw = `${email}|${dateISO}|dr-kollia`;
  const hash = crypto.createHash("sha1").update(raw).digest("hex").slice(0, 16);
  return `apt-${hash}@dr-kollia`;
}

function buildCancellationICS({
  startDate,
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
  const dtStart = toICSDateUTC(startDate);
  const dtStamp = toICSDateUTC(new Date());

  const summary = `${clinicName} — ${reason}`;

  const descriptionLines = [
    `Ιατρός: ${doctorName}${doctorTitle ? " • " + doctorTitle : ""}`,
    `Λόγος επίσκεψης: ${reason}`,
    address ? `Διεύθυνση: ${address}` : null,
    phone ? `Τηλέφωνο: ${phone}` : null,
    mapUrl ? `Χάρτης: ${mapUrl}` : null,
    "Το ραντεβού ακυρώθηκε.",
  ].filter(Boolean);

  const description = descriptionLines.join("\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dr Kollia Clinic//Appointments//EL",
    "CALSCALE:GREGORIAN",
    "METHOD:CANCEL",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `SUMMARY:${icsEscape(summary)}`,
    address ? `LOCATION:${icsEscape(address)}` : "",
    `DESCRIPTION:${icsEscape(description)}`,
    organizerEmail
      ? `ORGANIZER;CN="${icsEscape(doctorName)}":MAILTO:${organizerEmail}`
      : "",
    attendeeEmail
      ? `ATTENDEE;CN="${icsEscape(
          patientName
        )}";ROLE=REQ-PARTICIPANT:MAILTO:${attendeeEmail}`
      : "",
    "STATUS:CANCELLED",
    "SEQUENCE:1",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export async function POST(req) {
  try {
    const { email, name, date, reason } = await req.json();

    if (!email || !name || !date || !reason) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
      });
    }

    const clinicName = "Ιατρείο Δρ. Γεωργίας Κόλλια";
    const doctorName = "Γεωργία Κόλλια";
    const doctorTitle = "Ενδοκρινολόγος";
    const phone = "210 9934316";
    const address = "Τάμπα 8, Ηλιούπολη";
    const mapUrl = "https://maps.app.goo.gl/jNSJE8SmamUBw4Ys5?g_st=ipc";
    const bookUrl = "https://www.drkollia.com/appointments";

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

    const uid = buildStableAppointmentUID(email, date);

    const icsContent = buildCancellationICS({
      startDate: appointmentDate,
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
      text: `
${clinicName}
Ακύρωση Ραντεβού

Αξιότιμε/η κ. ${name},

Το ραντεβού σας ακυρώθηκε.

Ημερομηνία: ${formattedDate}
Ώρα: ${formattedTime}
Λόγος: ${reason}
${address ? `Διεύθυνση: ${address}` : ""}

Για νέο ραντεβού:
• Τηλέφωνο: ${phone}
• Online: ${bookUrl}

Με εκτίμηση,
${doctorName}${doctorTitle ? `\n${doctorTitle}` : ""}
      `.trim(),
      html: `
<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width"/>
  <title>Ακύρωση Ραντεβού</title>
  <style>
    @media (max-width: 600px) {
      .container { width:100% !important; }
      .px { padding-left:20px !important; padding-right:20px !important; }
      .btn { display:block !important; width:100% !important; box-sizing:border-box !important; }
      .stack { display:block !important; width:100% !important; }
      .align-left { text-align:left !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background:#f6f1e9;">
  <div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
    Το ραντεβού σας για ${formattedDate} στις ${formattedTime} ακυρώθηκε.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e9;">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="container"
          style="width:600px; max-width:600px; background:#ffffff; border:1px solid #eadfce; border-radius:16px; overflow:hidden; box-shadow:0 10px 28px rgba(20, 16, 10, 0.08);">

          <tr><td style="height:6px; background:linear-gradient(90deg,#2f2e2b,#5a554c,#2f2e2b);"></td></tr>

          <tr>
            <td style="padding:24px 32px 8px 32px;" class="px">
              <div style="font-family: Georgia, 'Times New Roman', serif; font-size:20px; font-weight:700; color:#2f2e2b;">
                ${clinicName}
              </div>
              <div style="margin-top:4px; font-family: Arial, Helvetica, sans-serif; font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:#8f877a;">
                Ακύρωση ραντεβού
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 32px 0 32px;" class="px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="background:#fbf6ed; border:1px solid #efe3d1; border-radius:14px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-family: Arial, Helvetica, sans-serif; font-size:12px; color:#7b7367; letter-spacing:.14em; text-transform:uppercase;">
                      Κατάσταση
                    </div>
                    <div style="margin-top:6px; font-family: Georgia, 'Times New Roman', serif; font-size:20px; font-weight:700; color:#1f1e1b;">
                      ✓ Η ακύρωση ολοκληρώθηκε
                    </div>
                    <div style="margin-top:6px; font-family: Arial, Helvetica, sans-serif; font-size:13px; color:#6f675b;">
                      Αν η ακύρωση δεν έγινε από εσάς, επικοινωνήστε μαζί μας.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 32px 18px 32px; font-family: Arial, Helvetica, sans-serif;" class="px">
              <div style="font-size:16px; color:#2f2e2b;">
                Αξιότιμε/η κ. <strong>${name}</strong>,
              </div>
              <div style="margin-top:10px; font-size:14.5px; color:#5c554a; line-height:1.6;">
                Το ραντεβού σας ακυρώθηκε. Παρακάτω θα βρείτε τα στοιχεία της ακυρωμένης επίσκεψης.
              </div>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="margin-top:18px; background:#ffffff; border:1px solid #eee2d2; border-radius:14px;">
                <tr>
                  <td style="padding:22px;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td style="padding:8px 0; font-size:13px; color:#7a7368; width:40%;">Ημερομηνία</td>
                        <td align="right" style="padding:8px 0; font-size:14px; color:#2f2e2b; font-weight:600;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0; font-size:13px; color:#7a7368;">Ώρα</td>
                        <td align="right" style="padding:8px 0; font-size:14px; color:#2f2e2b; font-weight:600;">${formattedTime}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0; font-size:13px; color:#7a7368;">Λόγος</td>
                        <td align="right" style="padding:8px 0; font-size:14px; color:#2f2e2b; font-weight:600;">${reason}</td>
                      </tr>
                      ${
                        address
                          ? `<tr>
                              <td style="padding:8px 0; font-size:13px; color:#7a7368;">Διεύθυνση</td>
                              <td align="right" style="padding:8px 0; font-size:14px; color:#2f2e2b; font-weight:600;">${address}</td>
                             </tr>`
                          : ``
                      }
                    </table>

                    <div style="height:1px; background:#f0e5d6; margin:14px 0 16px 0;"></div>

                    <table role="presentation" width="100%">
                      <tr>
                        <td class="stack" style="padding-bottom:10px;">
                          <a href="${bookUrl}" class="btn"
                             style="background:#2f2e2b; color:#ffffff; text-decoration:none; display:inline-block; padding:12px 16px; border-radius:10px; font-size:13px; font-weight:700;">
                            Κλείστε νέο ραντεβού
                          </a>
                        </td>
                        <td align="right" class="stack align-left">
                          <a href="tel:${phone.replace(/\s+/g, "")}" class="btn"
                             style="background:#f5efe4; color:#2f2e2b; text-decoration:none; display:inline-block; padding:12px 16px; border-radius:10px; font-size:13px; font-weight:700; border:1px solid #e9dcc9;">
                            Επικοινωνία με ιατρείο
                          </a>
                        </td>
                      </tr>
                      ${
                        mapUrl
                          ? `<tr>
                              <td class="stack" style="padding-top:8px;">
                                <a href="${mapUrl}" class="btn"
                                   style="background:#ffffff; color:#2f2e2b; text-decoration:none; display:inline-block; padding:11px 16px; border-radius:10px; font-size:12.5px; font-weight:700; border:1px solid #eee2d2;">
                                  Οδηγίες πρόσβασης
                                </a>
                              </td>
                              <td></td>
                             </tr>`
                          : ``
                      }
                    </table>
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

          <tr>
            <td align="center" style="padding:18px 24px; background:#faf6ef; border-top:1px solid #efe3d1;">
              <div style="font-family: Arial, Helvetica, sans-serif; font-size:11px; color:#8a8274; line-height:1.5;">
                Το παρόν μήνυμα αποστέλλεται αυτόματα από το σύστημα κρατήσεων του ιατρείου.<br/>
                <strong>Μην απαντάτε σε αυτό το email.</strong>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
      // Calendar cancellation
      icalEvent: {
        method: "CANCEL",
        content: icsContent,
      },
      attachments: [
        {
          filename: "appointment-cancelled.ics",
          content: icsContent,
          contentType: "text/calendar; charset=utf-8; method=CANCEL",
        },
      ],
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("❌ Σφάλμα αποστολής email ακύρωσης:", error);
    return new Response(JSON.stringify({ error: "Αποτυχία αποστολής email" }), {
      status: 500,
    });
  }
}
