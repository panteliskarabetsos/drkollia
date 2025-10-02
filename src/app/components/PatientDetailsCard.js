"use client";

import { useEffect, useRef, useState } from "react";
import {
  User,
  IdCard,
  Phone as PhoneIcon,
  Mail,
  CalendarDays,
  Briefcase,
  Users,
  Copy,
  Check,
  FileText,
  HeartPulse,
  Stethoscope,
  Microscope,
  Pill,
} from "lucide-react";

export default function PatientDetailsCard({ patient = {} }) {
  const [copied, setCopied] = useState("");
  const age = ageFromDOB(patient.birth_date);
  const name =
    `${patient.last_name ?? ""} ${patient.first_name ?? ""}`.trim() || "—";
  const initialsText = initials(name);

  const copy = async (key, val) => {
    if (!val) return;
    try {
      await navigator.clipboard.writeText(String(val));
      setCopied(key);
      setTimeout(() => setCopied(""), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
      {/* soft backdrop accents */}
      <div className="pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(70%_60%_at_50%_0%,#000,transparent)] bg-[radial-gradient(900px_400px_at_10%_-10%,#f6f4ef,transparent),radial-gradient(800px_360px_at_90%_-20%,#f1efe8,transparent)]" />

      <div className="relative grid grid-cols-1 gap-6 p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-stone-200 bg-white shadow-sm text-stone-700 font-semibold">
              {initialsText}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-stone-900">
                {name}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-600">
                {patient.gender && (
                  <span className="inline-flex items-center rounded-full border border-stone-300 bg-white px-2 py-0.5">
                    {genderLabel(patient.gender)}
                  </span>
                )}
                {age != null && (
                  <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5">
                    Ηλικία: <span className="ml-1 font-medium">{age}</span>
                  </span>
                )}
                {patient.created_at && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Δημιουργία: {fmtDate(patient.created_at)}
                  </span>
                )}
                {patient.updated_at && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Τελ. αλλαγή: {fmtDate(patient.updated_at)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <KeyChip
              icon={<IdCard className="h-3.5 w-3.5" />}
              label="ΑΜΚΑ"
              value={patient.amka}
              onCopy={() => copy("amka", patient.amka)}
              copied={copied === "amka"}
              mono
            />
            <KeyChip
              icon={<PhoneIcon className="h-3.5 w-3.5" />}
              label="Τηλέφωνο"
              value={patient.phone}
              onCopy={() => copy("phone", patient.phone)}
              copied={copied === "phone"}
              mono
            />
            <KeyChip
              icon={<Mail className="h-3.5 w-3.5" />}
              label="Email"
              value={patient.email}
              onCopy={() => copy("email", patient.email)}
              copied={copied === "email"}
            />
          </div>
        </div>

        <Divider />

        {/* Βασικά */}
        <Section title="Βασικά">
          <InfoRow icon={<User />} label="Όνομα">
            {patient.first_name}
          </InfoRow>
          <InfoRow icon={<User />} label="Επώνυμο">
            {patient.last_name}
          </InfoRow>
          <InfoRow icon={<IdCard />} label="ΑΜΚΑ" mono>
            {patient.amka}
          </InfoRow>
          <InfoRow icon={<CalendarDays />} label="Ημ. Γέννησης">
            {fmtDate(patient.birth_date)}
          </InfoRow>
          <InfoRow icon={<Briefcase />} label="Επάγγελμα">
            {patient.occupation}
          </InfoRow>
        </Section>

        {/* Επικοινωνία */}
        <Section title="Επικοινωνία">
          <InfoRow icon={<PhoneIcon />} label="Τηλέφωνο" mono>
            {patient.phone}
          </InfoRow>
          <InfoRow icon={<Mail />} label="Email" wrap>
            {patient.email}
          </InfoRow>
          <InfoRow icon={<CalendarDays />} label="Πρώτη Επίσκεψη">
            {fmtDate(patient.first_visit_date)}
          </InfoRow>
        </Section>

        <Divider />

        {/* Δημογραφικά / Συνήθειες */}
        <Section title="Δημογραφικά">
          <InfoRow icon={<Users />} label="Φύλο">
            {genderLabel(patient.gender)}
          </InfoRow>
          <InfoRow label="Οικογενειακή Κατάσταση">
            {patient.marital_status}
          </InfoRow>
          <InfoRow label="Τέκνα">{patient.children}</InfoRow>
        </Section>

        <Section title="Συνήθειες">
          <InfoRow label="Κάπνισμα">{patient.smoking}</InfoRow>
          <InfoRow label="Αλκοόλ">{patient.alcohol}</InfoRow>
        </Section>

        <Divider />

        {/* Ιστορικό & Κλινικά */}
        <Section title="Ιστορικό & Κλινικά" wide>
          <LongBlock
            icon={<Pill />}
            title="Φάρμακα"
            text={patient.medications}
          />
          <LongBlock
            icon={<Users />}
            title="Γυναικολογικό Ιστορικό"
            text={patient.gynecological_history}
          />
          <LongBlock
            icon={<Users />}
            title="Κληρονομικό Ιστορικό"
            text={patient.hereditary_history}
          />
          <LongBlock
            icon={<HeartPulse />}
            title="Παρούσα Νόσος"
            text={patient.current_disease}
          />
          <LongBlock
            icon={<Stethoscope />}
            title="Αντικειμενική Εξέταση"
            text={patient.physical_exam}
          />
          <LongBlock
            icon={<Microscope />}
            title="Πάρακλινικός Έλεγχος"
            text={patient.preclinical_screening}
          />
          <LongBlock
            icon={<FileText />}
            title="Σημειώσεις"
            text={patient.notes}
          />
        </Section>
      </div>
    </div>
  );
}

/* ---------- Small UI bits ---------- */

function Section({ title, children, wide }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <h3 className="mb-3 text-sm font-semibold tracking-wide text-stone-700">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

function InfoRow({ icon, label, children, mono, wrap }) {
  return (
    <div className="grid grid-cols-[200px,1fr] items-start gap-2">
      <div className="flex items-center gap-2 text-xs text-stone-500">
        {icon ? <span className="text-stone-500">{icon}</span> : null}
        <span className="whitespace-nowrap">{label}</span>
      </div>
      <div
        className={[
          "text-sm",
          wrap ? "break-words" : "whitespace-pre-wrap break-words",
          mono ? "tabular-nums font-mono" : "",
        ].join(" ")}
      >
        {empty(children)}
      </div>
    </div>
  );
}

function LongBlock({ icon, title, text }) {
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const needsToggle = el.scrollHeight > 160; // ~10rem
    setShowToggle(needsToggle);
  }, [text]);

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-700">
        <span className="text-stone-500">{icon}</span>
        {title}
      </div>

      <div className="relative">
        <div
          ref={ref}
          className={[
            "text-sm whitespace-pre-wrap break-words text-stone-800 min-h-[1rem] transition-all",
            expanded ? "max-h-full" : "max-h-40 overflow-hidden",
          ].join(" ")}
        >
          {empty(text)}
        </div>

        {!expanded && showToggle && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-stone-50/90 to-transparent" />
        )}
      </div>

      {showToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-medium text-stone-700 underline underline-offset-2 hover:text-stone-900"
        >
          {expanded ? "Λιγότερα" : "Περισσότερα"}
        </button>
      )}
    </div>
  );
}

function KeyChip({ icon, label, value, onCopy, copied, mono }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs shadow-sm">
      {icon}
      <span className="text-stone-500">{label}:</span>
      <span
        className={[
          "font-medium text-stone-800",
          mono ? "tabular-nums font-mono" : "",
        ].join(" ")}
      >
        {empty(value)}
      </span>
      {onCopy && value && (
        <button
          type="button"
          onClick={onCopy}
          className="ml-1 rounded-full p-1 transition hover:bg-stone-100"
          title={copied ? "Αντιγράφηκε!" : "Αντιγραφή"}
          aria-label="Copy"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-stone-600" />
          )}
        </button>
      )}
    </div>
  );
}

function Divider() {
  return (
    <div className="md:col-span-2 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
  );
}

/* ---------- helpers ---------- */
function fmtDate(val) {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("el-GR");
  } catch {
    return "—";
  }
}
function ageFromDOB(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const t = new Date();
  let age = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
  return age;
}
function genderLabel(g) {
  if (!g) return "—";
  if (g === "male") return "Άνδρας";
  if (g === "female") return "Γυναίκα";
  return "Άλλο";
}
function empty(v) {
  const s = typeof v === "string" ? v.trim() : v;
  return s ? s : "—";
}
function initials(n) {
  return (
    (n || "—")
      .split(" ")
      .map((s) => s?.[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}
