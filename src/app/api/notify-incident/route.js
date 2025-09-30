// src/app/api/notify-incident/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const esc = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const sevLabel = (severity) => {
  const s = String(severity || "").toLowerCase();
  return s === "critical"
    ? "SEV1"
    : s === "major"
    ? "SEV2"
    : s === "minor"
    ? "SEV3"
    : s.toUpperCase();
};

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
    "msn.com": { host: "smtp.office365.com", port: 587, secure: false },
    "office365.com": { host: "smtp.office365.com", port: 587, secure: false },
    "yahoo.com": { host: "smtp.mail.yahoo.com", port: 465, secure: true },
    "yahoo.gr": { host: "smtp.mail.yahoo.com", port: 465, secure: true },
    "yandex.com": { host: "smtp.yandex.com", port: 465, secure: true },
    "protonmail.com": { host: "smtp.protonmail.ch", port: 465, secure: true },
    "zoho.com": { host: "smtp.zoho.com", port: 465, secure: true },
  };
  return presets[domain] || { host: `smtp.${domain}`, port: 465, secure: true };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      id,
      title,
      severity,
      status,
      impact_start,
      affected_services = [],
      description,
      links = [],
      customer_visible,
      tags = [],
      notifySlack,
      notifyEmail,
      reporter, // { email?:string, name?:string }
      ccReporter, // boolean
    } = body || {};

    if (!title || !severity || !status) {
      return NextResponse.json(
        { ok: false, error: "Missing: title, severity, status." },
        { status: 400 }
      );
    }

    // ---------- build content ----------
    const sev = sevLabel(severity);
    const servicesStr = affected_services.join(", ") || "—";
    const tagsStr = tags.join(", ") || "—";
    const visibleStr = customer_visible
      ? "Customers & Internal"
      : "Internal only";
    const desc = String(description || "");
    const subject = `[Incident][${sev}][${String(
      status
    ).toUpperCase()}] ${title}`;

    const linksHtml = links?.length
      ? `<p><b>Links:</b> ${links
          .map((l) => `<a href="${esc(l)}">${esc(l)}</a>`)
          .join(", ")}</p>`
      : "";

    const reporterLine =
      reporter?.email || reporter?.name
        ? `<p><b>Reporter:</b> ${esc(
            [reporter?.name, reporter?.email].filter(Boolean).join(" ")
          )}</p>`
        : "";

    const html = `
      <h3>${esc(title)}</h3>
      <p><b>Severity:</b> ${esc(sev)} &nbsp; <b>Status:</b> ${esc(status)}</p>
      <p><b>Start:</b> ${esc(impact_start || "")}</p>
      <p><b>Services:</b> ${esc(servicesStr)}</p>
      <p><b>Visible:</b> ${esc(visibleStr)}</p>
      <p><b>Tags:</b> ${esc(tagsStr)}</p>
      <p><b>Description:</b><br/>${esc(desc).replace(/\n/g, "<br/>")}</p>
      ${linksHtml}
      ${reporterLine}
    `;

    const text = `${title}
Severity: ${sev} | Status: ${status}
Start: ${impact_start || ""}
Services: ${servicesStr}
Visible: ${visibleStr}
Tags: ${tagsStr}

Description:
${desc}

${links?.length ? `Links: ${links.join(", ")}\n` : ""}${
      reporter?.email || reporter?.name
        ? `Reporter: ${[reporter?.name, reporter?.email]
            .filter(Boolean)
            .join(" ")}\n`
        : ""
    }`;

    // ---------- Slack (optional) ----------
    let slackOk = false;
    if (notifySlack) {
      const hook = process.env.SLACK_WEBHOOK_URL;
      if (!hook) {
        return NextResponse.json(
          {
            ok: false,
            error: "SLACK_WEBHOOK_URL missing while notifySlack=true.",
          },
          { status: 500 }
        );
      }
      const lines = [
        `*Incident* ${id ? `(#${id})` : ""}`,
        `Severity: *${esc(sev)}*`,
        `Status: *${esc(String(status))}*`,
        `Start: ${esc(impact_start || "")}`,
        `Services: ${esc(servicesStr)}`,
        `Visible: ${esc(visibleStr)}`,
        `Tags: ${esc(tagsStr)}`,
        "",
        `*Title:* ${esc(title)}`,
        `*Description:* ${esc(desc)}`,
        links?.length ? `Links: ${links.map(esc).join(", ")}` : null,
      ].filter(Boolean);
      const r = await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: lines.join("\n") }),
      });
      slackOk = r.ok;
    }

    // ---------- Email via SMTP (only needs SMTP_EMAIL & SMTP_PASSWORD) ----------
    let emailOk = false;
    if (notifyEmail) {
      const user = process.env.SMTP_EMAIL;
      const pass = process.env.SMTP_PASSWORD;
      if (!user || !pass) {
        return NextResponse.json(
          { ok: false, error: "Set SMTP_EMAIL and SMTP_PASSWORD." },
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
      const TO = (process.env.INCIDENTS_IT_EMAIL_TO || user) // fallback: send to yourself
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const cc = ccReporter && reporter?.email ? [reporter.email] : [];
      const replyTo = reporter?.email || undefined;

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      const info = await transporter.sendMail({
        from: FROM,
        to: TO,
        cc,
        replyTo,
        subject,
        html,
        text,
      });
      emailOk = Boolean(info?.messageId);
    }

    return NextResponse.json({ ok: true, slackOk, emailOk });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
