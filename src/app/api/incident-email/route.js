// src/app/api/incident-email/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// ---- Limits (keep in sync with frontend; can override via env)
const MAX_FILES = Number(process.env.INCIDENT_MAX_FILES ?? 5);
const MAX_FILE_BYTES = Number(
  process.env.INCIDENT_MAX_FILE_BYTES ?? 5 * 1024 * 1024
);
const MAX_TOTAL_BYTES = Number(
  process.env.INCIDENT_MAX_TOTAL_BYTES ?? 10 * 1024 * 1024
);

const esc = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function inferSmtpFromEmail(email) {
  const domain =
    String(email || "")
      .split("@")[1]
      ?.toLowerCase() || "";
  const presets = {
    "gmail.com": { host: "smtp.gmail.com", port: 465, secure: true },
    "googlemail.com": { host: "smtp.gmail.com", port: 465, secure: true },
    "outlook.com": { host: "smtp.office365.com", port: 587, secure: false },
    "hotmail.com": { host: "smtp.office365.com", port: 587, secure: false },
    "live.com": { host: "smtp.office365.com", port: 587, secure: false },
    "office365.com": { host: "smtp.office365.com", port: 587, secure: false },
    "yahoo.com": { host: "smtp.mail.yahoo.com", port: 465, secure: true },
    "yahoo.gr": { host: "smtp.mail.yahoo.com", port: 465, secure: true },
    "yandex.com": { host: "smtp.yandex.com", port: 465, secure: true },
    "protonmail.com": { host: "smtp.protonmail.ch", port: 465, secure: true },
    "zoho.com": { host: "smtp.zoho.com", port: 465, secure: true },
  };
  return presets[domain] || { host: `smtp.${domain}`, port: 465, secure: true };
}

const parseBool = (v) =>
  ["true", "1", "on", "yes"].includes(String(v ?? "").toLowerCase());

export async function POST(req) {
  try {
    // Expect multipart/form-data
    const form = await req.formData();

    // Helper: read string field safely
    const getStr = (k) => {
      const v = form.get(k);
      return v == null ? "" : String(v);
    };

    // Fields (support both new and legacy shapes)
    const title = getStr("title");
    const area = getStr("area");
    const impact = getStr("impact");
    const impact_start = getStr("impact_start");
    const description = getStr("description");
    const phone = getStr("phone");
    const attachmentLink = getStr("attachment"); // legacy optional

    // reporter can arrive either as `reporter_email` (new)
    // or as JSON string in `reporter` (legacy)
    let reporter_email = getStr("reporter_email");
    if (!reporter_email) {
      const reporterRaw = getStr("reporter");
      try {
        reporter_email = JSON.parse(reporterRaw || "null")?.email || "";
      } catch {}
    }
    const ccReporter = parseBool(getStr("ccReporter"));

    if (!title || !area || !impact || !description) {
      return NextResponse.json(
        { error: "Λείπουν υποχρεωτικά πεδία." },
        { status: 400 }
      );
    }

    // Collect image files
    const incoming = form.getAll("files") || [];
    /** @type {Array<{filename:string, content:Buffer, contentType:string, size:number}>} */
    const files = [];
    let total = 0;

    for (const f of incoming) {
      // Only process File objects (ignore accidental strings)
      if (typeof File !== "undefined" && f instanceof File) {
        const type = f.type || "application/octet-stream";
        if (!type.startsWith("image/")) continue; // accept photos only

        const buf = Buffer.from(await f.arrayBuffer());
        if (buf.length > MAX_FILE_BYTES) {
          return NextResponse.json(
            {
              error: `Το αρχείο ${f.name} είναι > ${Math.round(
                MAX_FILE_BYTES / (1024 * 1024)
              )}MB.`,
            },
            { status: 413 }
          );
        }

        files.push({
          filename: f.name || "image",
          content: buf,
          contentType: type,
          size: buf.length,
        });
        total += buf.length;

        if (files.length > MAX_FILES) {
          return NextResponse.json(
            { error: `Πάρα πολλά αρχεία (max ${MAX_FILES}).` },
            { status: 413 }
          );
        }
        if (total > MAX_TOTAL_BYTES) {
          return NextResponse.json(
            {
              error: `Συνολικό μέγεθος συνημμένων > ${Math.round(
                MAX_TOTAL_BYTES / (1024 * 1024)
              )}MB.`,
            },
            { status: 413 }
          );
        }
      }
    }

    // Build email content (improved design)

    const AREA_LABELS = {
      appointments: "Ραντεβού",
      patients: "Ασθενείς",
      admin: "Πίνακας Διαχείρισης",
      website: "Ιστότοπος",
      email: "Email/Ειδοποιήσεις",
      other: "Άλλο",
    };

    const IMPACT_STYLE = {
      blocker: {
        label: "Δεν μπορώ να δουλέψω",
        bg: "#FEE2E2",
        color: "#991B1B",
        border: "#FECACA",
      },
      degraded: {
        label: "Έχει σφάλματα/αργεί",
        bg: "#FEF3C7",
        color: "#92400E",
        border: "#FDE68A",
      },
      suggestion: {
        label: "Πρόταση/Απορία",
        bg: "#E5E7EB",
        color: "#374151",
        border: "#D1D5DB",
      },
    };

    const impactKey = String(impact || "").toLowerCase();
    const impactInfo = IMPACT_STYLE[impactKey] || {
      label: String(impact || "-"),
      bg: "#E5E7EB",
      color: "#374151",
      border: "#D1D5DB",
    };

    const areaLabel = AREA_LABELS[area] || String(area || "-");

    let startedHuman = impact_start || "";
    try {
      const d = new Date(impact_start);
      if (!isNaN(d))
        startedHuman = d.toLocaleString("el-GR", { hour12: false });
    } catch {
      /* keep raw */
    }

    const subject = `[Incident/${areaLabel}][${String(
      impact
    ).toUpperCase()}] ${title}`;

    const preheader = `${areaLabel} • ${impactInfo.label} • ${startedHuman}`;

    // Attachments summary table (names + sizes)
    const fileListHtml = files.length
      ? `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:8px">
    <thead>
      <tr>
        <th align="left" style="font-size:12px;color:#6B7280;padding:6px 0;border-bottom:1px solid #E5E7EB;">Όνομα</th>
        <th align="left" style="font-size:12px;color:#6B7280;padding:6px 0;border-bottom:1px solid #E5E7EB;">Μέγεθος</th>
      </tr>
    </thead>
    <tbody>
      ${files
        .map(
          (f) => `
        <tr>
          <td style="font-size:13px;color:#111827;padding:6px 0;border-bottom:1px solid #F3F4F6;">${esc(
            f.filename
          )}</td>
          <td style="font-size:13px;color:#374151;padding:6px 0;border-bottom:1px solid #F3F4F6;">${(
            f.size /
            (1024 * 1024)
          ).toFixed(1)} MB</td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>`
      : "";

    // Optional legacy link row
    const linkRow = attachmentLink
      ? `<tr>
       <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;color:#111827;"><b>Σύνδεσμος</b></td>
       <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;">
         <a href="${esc(attachmentLink)}" style="color:#111827">${esc(
          attachmentLink
        )}</a>
       </td>
     </tr>`
      : "";

    // Hidden preheader (for inbox preview)
    const preheaderSpan = `
  <span style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#fff;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${esc(preheader)}
  </span>
`;

    // Final HTML
    const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F9FAFB;">
    ${preheaderSpan}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:24px 0;">
      <tr>
        <td align="center" style="padding:0 16px;">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
            <!-- Header -->
            <tr>
              <td style="padding:20px 24px;border-bottom:1px solid #F3F4F6;">
                <div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:6px;">
                  ${esc(title)}
                </div>
                <div style="font-size:0;">
                  <span style="display:inline-block;padding:4px 10px;border-radius:9999px;border:1px solid ${
                    impactInfo.border
                  };background:${impactInfo.bg};color:${
      impactInfo.color
    };font-weight:700;font-size:12px;margin-right:8px;">
                    ${esc(impactInfo.label)}
                  </span>
                  <span style="display:inline-block;font-size:12px;color:#6B7280;vertical-align:middle;">
                    ${esc(areaLabel)} • ${esc(startedHuman || "-")}
                  </span>
                </div>
              </td>
            </tr>

            <!-- Facts -->
            <tr>
              <td style="padding:16px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tbody>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;color:#111827;width:160px;"><b>Περιοχή</b></td>
                      <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;color:#374151;">${esc(
                        areaLabel
                      )}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;color:#111827;"><b>Επίδραση</b></td>
                      <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;color:#374151;">${esc(
                        impactInfo.label
                      )}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;color:#111827;"><b>Έναρξη</b></td>
                      <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;color:#374151;">${esc(
                        startedHuman || "-"
                      )}</td>
                    </tr>
                    ${linkRow}
                    ${
                      phone
                        ? `<tr>
                            <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;color:#111827;"><b>Τηλέφωνο</b></td>
                            <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;color:#374151;">${esc(
                              phone
                            )}</td>
                          </tr>`
                        : ""
                    }
                    ${
                      reporter_email
                        ? `<tr>
                            <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;color:#111827;"><b>Αποστολέας</b></td>
                            <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;color:#374151;">${esc(
                              reporter_email
                            )}</td>
                          </tr>`
                        : ""
                    }
                  </tbody>
                </table>
              </td>
            </tr>

            <!-- Description -->
            <tr>
              <td style="padding:8px 24px;">
                <div style="font-size:13px;color:#111827;font-weight:700;margin:8px 0 4px;">Περιγραφή</div>
                <div style="font-size:14px;line-height:1.6;color:#111827;white-space:pre-wrap;">
                  ${esc(description).replace(/\\n/g, "<br/>")}
                </div>
              </td>
            </tr>

            <!-- Attachments -->
            ${
              files.length
                ? `<tr>
                     <td style="padding:8px 24px 20px;">
                       <div style="font-size:13px;color:#111827;font-weight:700;margin:8px 0 4px;">Συνημμένα</div>
                       ${fileListHtml}
                     </td>
                   </tr>`
                : ""
            }

            <!-- Footer -->
            <tr>
              <td style="padding:14px 24px;border-top:1px solid #F3F4F6;background:#FBFBFB;color:#6B7280;font-size:12px;">
                Email δημιουργήθηκε αυτόματα από το σύστημα ραντεβού. Απαντήστε σε αυτό το μήνυμα για διευκρινίσεις.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    // Improved plain-text alternative
    const text = `${title}
[${areaLabel}] ${impactInfo.label} • Έναρξη: ${startedHuman || "-"}

ΠΕΡΙΟΧΗ: ${areaLabel}
ΕΠΙΔΡΑΣΗ: ${impactInfo.label}
ΕΝΑΡΞΗ: ${startedHuman || "-"}

ΠΕΡΙΓΡΑΦΗ:
${description}

${attachmentLink ? `ΣΥΝΔΕΣΜΟΣ: ${attachmentLink}\n` : ""}${
      phone ? `ΤΗΛΕΦΩΝΟ: ${phone}\n` : ""
    }${reporter_email ? `ΑΠΟΣΤΟΛΕΑΣ: ${reporter_email}\n` : ""}${
      files.length
        ? `ΣΥΝΗΜΜΕΝΑ:\n${files
            .map(
              (f) =>
                `• ${f.filename} (${(f.size / (1024 * 1024)).toFixed(1)}MB)`
            )
            .join("\n")}\n`
        : ""
    }`;

    // SMTP config (same env names you already use)
    const user = process.env.SMTP_EMAIL;
    const pass = process.env.SMTP_PASSWORD;
    if (!user || !pass) {
      return NextResponse.json(
        { error: "Set SMTP_EMAIL and SMTP_PASSWORD." },
        { status: 500 }
      );
    }

    const inferred = inferSmtpFromEmail(user);
    const host = process.env.SMTP_HOST || inferred.host;
    const port = Number(process.env.SMTP_PORT ?? inferred.port);
    const secure =
      typeof process.env.SMTP_SECURE === "string"
        ? process.env.SMTP_SECURE === "true"
        : inferred.secure;

    const FROM = process.env.SMTP_FROM || user;
    const toList = (process.env.INCIDENTS_IT_EMAIL_TO || user)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const ccList = ccReporter && reporter_email ? [reporter_email] : [];
    const replyTo = reporter_email || undefined;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: FROM,
      to: toList,
      cc: ccList,
      replyTo,
      subject,
      html,
      text,
      attachments: files.map((f) => ({
        filename: f.filename,
        content: f.content,
        contentType: f.contentType,
      })),
    });

    return NextResponse.json({ ok: true, id: info?.messageId || null });
  } catch (err) {
    console.error("[incident-email] error", err);
    return NextResponse.json(
      { error: err?.message || "Σφάλμα διακομιστή." },
      { status: 500 }
    );
  }
}
