import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { getTransporter } from "@/lib/server/email/transporter";
import {
  buildAppointmentICS,
  getDurationMinutesByReason,
} from "@/lib/server/email/ics";

const ATHENS_TZ = "Europe/Athens";

function normalizeGreekName(str) {
  if (!str) return "";
  const cleaned = String(str)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*/g, "-")
    .toLowerCase();

  return cleaned
    .split(" ")
    .map((part) =>
      part
        .split("-")
        .map((seg) =>
          seg ? seg[0].toLocaleUpperCase("el-GR") + seg.slice(1) : seg
        )
        .join("-")
    )
    .join(" ");
}

function birthDateFromAmka(amka) {
  if (!amka || amka.length < 6) return null;
  const dd = parseInt(amka.slice(0, 2), 10);
  const mm = parseInt(amka.slice(2, 4), 10);
  const yy = parseInt(amka.slice(4, 6), 10);
  const currYY = new Date().getFullYear() % 100;
  const fullYear = yy <= currYY ? 2000 + yy : 1900 + yy;

  const d = new Date(fullYear, mm - 1, dd);
  if (
    d.getFullYear() !== fullYear ||
    d.getMonth() !== mm - 1 ||
    d.getDate() !== dd
  ) {
    return null;
  }
  return `${fullYear}-${String(mm).padStart(2, "0")}-${String(dd).padStart(
    2,
    "0"
  )}`;
}

async function sendConfirmationEmail({
  to,
  patientName,
  appointmentDate,
  reason,
}) {
  const clinicName = "Ιατρείο Δρ. Γεωργίας Κόλλια";
  const doctorName = "Γεωργία Κόλλια";
  const doctorTitle = "Ενδοκρινολόγος";
  const phone = "210 9934316";
  const mapUrl = "https://maps.app.goo.gl/jNSJE8SmamUBw4Ys5?g_st=ipc";
  const address = "Τάμπα 8, Ηλιούπολη";

  const formattedDate = appointmentDate.toLocaleDateString("el-GR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: ATHENS_TZ,
  });

  const formattedTime = appointmentDate.toLocaleTimeString("el-GR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ATHENS_TZ,
  });

  const durationMinutes = getDurationMinutesByReason(reason);

  const icsContent = buildAppointmentICS({
    startDate: appointmentDate,
    durationMinutes,
    clinicName,
    doctorName,
    doctorTitle,
    address,
    phone,
    mapUrl,
    patientName,
    reason,
    organizerEmail: process.env.SMTP_EMAIL,
    attendeeEmail: to,
  });

  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"Δρ. Γεωργία Κόλλια" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: "Επιβεβαίωση Ραντεβού",
    text: `
${clinicName}

Αξιότιμε/η κ. ${patientName},

Το ραντεβού σας καταχωρήθηκε με επιτυχία.

Ημερομηνία: ${formattedDate}
Ώρα: ${formattedTime}
Λόγος Επίσκεψης: ${reason}
Διεύθυνση: ${address}

Για αλλαγή ή ακύρωση επικοινωνήστε στο ${phone}.
Οδηγίες πρόσβασης: ${mapUrl}

Με εκτίμηση,
${doctorName}
${doctorTitle}
    `.trim(),
    html: `
<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width"/>
  <title>Επιβεβαίωση Ραντεβού</title>
  <style>
    @media (max-width: 600px) {
      .container { width:100% !important; }
      .px { padding-left:20px !important; padding-right:20px !important; }
      .py { padding-top:22px !important; padding-bottom:22px !important; }
      .btn { display:block !important; width:100% !important; box-sizing:border-box !important; }
      .stack { display:block !important; width:100% !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background:#f6f1e9;">
  <div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
    Η κράτησή σας επιβεβαιώθηκε για ${formattedDate} στις ${formattedTime}.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e9;">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="container"
          style="width:600px; max-width:600px; background:#ffffff; border:1px solid #eadfce; border-radius:16px; overflow:hidden; box-shadow:0 10px 28px rgba(20, 16, 10, 0.08);">
          <tr><td style="height:6px; background:#2f2e2b;"></td></tr>

          <tr>
            <td class="px" style="padding:26px 32px 8px 32px;">
              <div style="font-family: Georgia, 'Times New Roman', serif; font-size:20px; font-weight:700; color:#2f2e2b;">
                ${clinicName}
              </div>
              <div style="margin-top:4px; font-family: Arial, sans-serif; font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:#8f877a;">
                Επιβεβαίωση ραντεβού
              </div>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:10px 32px 0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="background:#fbf6ed; border:1px solid #efe3d1; border-radius:14px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-family: Georgia, serif; font-size:22px; font-weight:700; color:#1f1e1b;">
                      ✓ Το ραντεβού σας επιβεβαιώθηκε
                    </div>
                    <div style="margin-top:6px; font-family: Arial, sans-serif; font-size:13px; color:#6f675b; line-height:1.5;">
                      Η πληρωμή πραγματοποιείται στο ιατρείο.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="px py" style="padding:26px 32px 10px 32px; font-family: Arial, sans-serif;">
              <div style="font-size:16px; color:#2f2e2b;">
                Αξιότιμε/η κ. <strong>${patientName}</strong>,
              </div>
              <div style="margin-top:10px; font-size:14.5px; color:#5c554a; line-height:1.6;">
                Παρακάτω θα βρείτε τα στοιχεία της επίσκεψης.
              </div>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="margin-top:20px; background:#ffffff; border:1px solid #eee2d2; border-radius:14px;">
                <tr>
                  <td style="padding:22px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0; font-size:13px; color:#7a7368;">Ημερομηνία</td>
                        <td align="right" style="padding:8px 0; font-size:14px; color:#2f2e2b; font-weight:600;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0; font-size:13px; color:#7a7368;">Ώρα</td>
                        <td align="right" style="padding:8px 0; font-size:14px; color:#2f2e2b; font-weight:600;">${formattedTime}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0; font-size:13px; color:#7a7368;">Λόγος Επίσκεψης</td>
                        <td align="right" style="padding:8px 0; font-size:14px; color:#2f2e2b; font-weight:600;">${reason}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0; font-size:13px; color:#7a7368;">Διεύθυνση</td>
                        <td align="right" style="padding:8px 0; font-size:14px; color:#2f2e2b; font-weight:600;">${address}</td>
                      </tr>
                    </table>

                    <div style="height:1px; background:#f0e5d6; margin:14px 0 16px 0;"></div>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="stack" style="padding-bottom:10px;">
                          <a href="${mapUrl}" class="btn"
                             style="background:#2f2e2b; color:#ffffff; text-decoration:none; display:inline-block; padding:12px 16px; border-radius:10px; font-size:13px; font-weight:700;">
                            Οδηγίες πρόσβασης
                          </a>
                        </td>
                        <td align="right" class="stack">
                          <a href="tel:${phone.replace(/\s+/g, "")}" class="btn"
                             style="background:#f5efe4; color:#2f2e2b; text-decoration:none; display:inline-block; padding:12px 16px; border-radius:10px; font-size:13px; font-weight:700; border:1px solid #e9dcc9;">
                            Καλέστε το ιατρείο
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <div style="margin-top:18px; font-size:12.5px; color:#5f584d; line-height:1.6;">
                • Παρακαλούμε προσέλθετε 5-10 λεπτά νωρίτερα.<br/>
                • Έχετε μαζί σας πρόσφατες εξετάσεις και φαρμακευτική αγωγή.
              </div>

              <div style="margin-top:18px;">
                <div style="font-family: Georgia, serif; font-size:16px; font-weight:700; color:#2f2e2b;">
                  Με εκτίμηση,
                </div>
                <div style="font-family: Georgia, serif; font-size:15px; color:#2f2e2b;">
                  ${doctorName}
                </div>
                <div style="font-family: Arial, sans-serif; font-size:11.5px; color:#8a8274; margin-top:2px;">
                  ${doctorTitle}
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:18px 24px; background:#faf6ef; border-top:1px solid #efe3d1;">
              <div style="font-family: Arial, sans-serif; font-size:11px; color:#8a8274; line-height:1.5;">
                Το μήνυμα αποστέλλεται αυτόματα από το σύστημα κρατήσεων. <strong>Μην απαντάτε.</strong>
              </div>
            </td>
          </tr>
        </table>

        <div style="max-width:600px; margin:12px auto 0; font-family: Arial, sans-serif; font-size:10.5px; color:#9a9286; line-height:1.5; text-align:center;">
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
}

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      first_name,
      last_name,
      phone,
      email,
      amka,
      reason,
      notes,
      appointment_time_iso,
      duration_minutes,
      isVisitor: isVisitorFromBody,
    } = body || {};

    if (
      !first_name ||
      !last_name ||
      !phone ||
      !email ||
      !reason ||
      !appointment_time_iso ||
      !duration_minutes
    ) {
      return new Response(JSON.stringify({ message: "Missing fields" }), {
        status: 400,
      });
    }

    // Settings gate
    const { data: settings, error: sErr } = await supabaseAdmin
      .from("clinic_settings")
      .select("accept_new_appointments")
      .eq("id", 1)
      .single();

    if (sErr) {
      return new Response(
        JSON.stringify({ message: "Settings check failed" }),
        { status: 500 }
      );
    }
    if (!settings?.accept_new_appointments) {
      return new Response(
        JSON.stringify({ message: "No new online appointments currently." }),
        { status: 403 }
      );
    }

    // Basic validation
    const phoneTrim = String(phone).trim().replace(/\D/g, "");
    const emailTrim = String(email).trim();
    const amkaTrim = amka ? String(amka).trim() : "";

    if (!/^\d{10}$/.test(phoneTrim)) {
      return new Response(JSON.stringify({ message: "Invalid phone" }), {
        status: 400,
      });
    }

    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/i.test(emailTrim)) {
      return new Response(JSON.stringify({ message: "Invalid email" }), {
        status: 400,
      });
    }

    let birthISO = null;
    if (amkaTrim) {
      if (!/^\d{11}$/.test(amkaTrim)) {
        return new Response(JSON.stringify({ message: "Invalid AMKA" }), {
          status: 400,
        });
      }
      birthISO = birthDateFromAmka(amkaTrim);
      if (!birthISO) {
        return new Response(JSON.stringify({ message: "Invalid AMKA" }), {
          status: 400,
        });
      }
    }

    const duration = Number(duration_minutes);
    if (!Number.isFinite(duration) || duration <= 0) {
      return new Response(JSON.stringify({ message: "Invalid duration" }), {
        status: 400,
      });
    }

    const appointmentDate = new Date(appointment_time_iso);
    if (Number.isNaN(appointmentDate.getTime())) {
      return new Response(
        JSON.stringify({ message: "Invalid appointment time" }),
        { status: 400 }
      );
    }
    // Ιατρικός επισκέπτης = oχι patient entry
    const isVisitor =
      reason === "Ιατρικός Επισκέπτης" || Boolean(isVisitorFromBody);

    // Visitor monthly cap
    // Visitor monthly cap
    if (isVisitor) {
      const startOfMonth = new Date(
        appointmentDate.getFullYear(),
        appointmentDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        appointmentDate.getFullYear(),
        appointmentDate.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      const { count, error: vErr } = await supabaseAdmin
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("reason", "Ιατρικός Επισκέπτης")
        .gte("appointment_time", startOfMonth.toISOString())
        .lte("appointment_time", endOfMonth.toISOString());

      if (vErr) {
        return new Response(
          JSON.stringify({ message: "Visitor check failed" }),
          { status: 500 }
        );
      }
      if ((count || 0) >= 2) {
        return new Response(
          JSON.stringify({
            message:
              "Έχουν ήδη καταχωρηθεί 2 επισκέψεις για τον τρέχοντα μήνα.",
          }),
          { status: 409 }
        );
      }
    }

    // Find existing patient by phone or AMKA
    let patientId = null;

    // Find / create patient and same-day guard ONLY for real patients
    if (!isVisitor) {
      // Find existing patient by phone or AMKA
      const filters = [];
      if (phoneTrim) filters.push(`phone.eq.${phoneTrim}`);
      if (amkaTrim) filters.push(`amka.eq.${amkaTrim}`);

      if (filters.length) {
        const { data: found } = await supabaseAdmin
          .from("patients")
          .select("id, first_name, last_name, phone, amka")
          .or(filters.join(","))
          .limit(1)
          .maybeSingle();

        if (found?.id) patientId = found.id;
      }

      const firstNameNorm = normalizeGreekName(first_name);
      const lastNameNorm = normalizeGreekName(last_name);

      if (!patientId) {
        const { data: created, error: pErr } = await supabaseAdmin
          .from("patients")
          .insert([
            {
              first_name: firstNameNorm,
              last_name: lastNameNorm,
              phone: phoneTrim,
              email: emailTrim,
              amka: amkaTrim || null,
              birth_date: birthISO || null,
              gender: "other",
            },
          ])
          .select("id")
          .single();

        if (pErr || !created?.id) {
          return new Response(
            JSON.stringify({ message: "Failed to create patient" }),
            { status: 500 }
          );
        }
        patientId = created.id;
      }

      // Same-day duplicate appointment guard
      const startOfDay = new Date(appointmentDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(appointmentDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: sameDay, error: sdErr } = await supabaseAdmin
        .from("appointments")
        .select("id, status")
        .eq("patient_id", patientId)
        .gte("appointment_time", startOfDay.toISOString())
        .lte("appointment_time", endOfDay.toISOString());

      if (sdErr) {
        return new Response(
          JSON.stringify({ message: "Same-day check failed" }),
          { status: 500 }
        );
      }

      const hasActiveSameDay = (sameDay || []).some(
        (a) => !["cancelled", "rejected"].includes(a.status)
      );

      if (hasActiveSameDay) {
        return new Response(
          JSON.stringify({
            message: "Έχετε ήδη ραντεβού για την επιλεγμένη ημέρα.",
          }),
          { status: 409 }
        );
      }
    }

    // Simple overlap guard (race safety)
    const windowStart = new Date(appointmentDate);
    const windowEnd = new Date(appointmentDate.getTime() + duration * 60000);

    const { data: overlaps, error: ovErr } = await supabaseAdmin
      .from("appointments")
      .select("id, appointment_time, duration_minutes, status")
      .gte(
        "appointment_time",
        new Date(windowStart.getTime() - 3 * 60 * 60 * 1000).toISOString()
      )
      .lte(
        "appointment_time",
        new Date(windowEnd.getTime() + 3 * 60 * 60 * 1000).toISOString()
      );

    if (ovErr) {
      return new Response(JSON.stringify({ message: "Overlap check failed" }), {
        status: 500,
      });
    }

    const overlapsActive = (overlaps || [])
      .filter((a) => !["cancelled", "rejected"].includes(a.status))
      .some((a) => {
        const s = new Date(a.appointment_time);
        const e = new Date(
          s.getTime() + Number(a.duration_minutes || 30) * 60000
        );
        return s < windowEnd && windowStart < e;
      });

    if (overlapsActive) {
      return new Response(
        JSON.stringify({ message: "Το slot δεν είναι πλέον διαθέσιμο." }),
        { status: 409 }
      );
    }

    // Insert appointment
    // NOTE: ensure your DB CHECK constraint allows this status.
    const { data: createdAppt, error: aErr } = await supabaseAdmin
      .from("appointments")
      .insert([
        {
          patient_id: isVisitor ? null : patientId,
          appointment_time: appointmentDate.toISOString(),
          duration_minutes: duration,
          reason,
          notes: notes || null,
          status: "approved",
          is_exception: false,
        },
      ])
      .select("id")
      .single();

    if (aErr || !createdAppt?.id) {
      return new Response(
        JSON.stringify({ message: "Failed to create appointment" }),
        { status: 500 }
      );
    }

    // Send confirmation email + ICS (best place to do it)
    try {
      await sendConfirmationEmail({
        to: emailTrim,
        patientName: firstNameNorm,
        appointmentDate,
        reason,
      });
    } catch (mailErr) {
      console.error("Confirmation mail failed:", mailErr);
      // We won't fail booking because email failed.
    }

    return new Response(
      JSON.stringify({
        message: "OK",
        appointment_id: createdAppt.id,
        patient_id: isVisitor ? null : patientId,
        appointment_time: appointmentDate.toISOString(),
      }),
      { status: 200 }
    );
  } catch (e) {
    console.error("public-appointments/create error:", e);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}
