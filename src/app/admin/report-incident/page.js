"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import {
  ArrowLeft,
  Info,
  Loader2,
  MailCheck,
  Network,
  Send,
  ShieldAlert,
  Trash2,
  Upload,
  WifiOff,
} from "lucide-react";

/**
 * Αναφορά Προβλήματος — με πιο συγκεκριμένες επιλογές
 * - 2 επίπεδα: Περιοχή (Area) → Συγκεκριμένο Θέμα (Topic)
 * - Τα topics προσαρμόζονται ανά περιοχή
 * - Το "Άλλο" ζητά υπο-περιγραφή
 */

// Περιοχές με συγκεκριμένα θέματα
const AREAS = {
  appointments: {
    label: "Ραντεβού",
    topics: [
      { id: "cant-load", label: "Δεν φορτώνει η σελίδα ραντεβού" },
      { id: "create-fail", label: "Αποτυχία δημιουργίας ραντεβού" },
      { id: "reschedule", label: "Πρόβλημα διαγραφής/ακύρωσης ραντεβού" },
      { id: "double-book", label: "Διπλοκράτηση/επικάλυψη" },
      { id: "calendar-view", label: "Πρόβλημα προβολής ημερολογίου" },
      { id: "search-filter", label: "Αναζήτηση/φίλτρα δεν δουλεύουν" },
      { id: "notifications", label: "Ειδοποιήσεις/υπενθυμίσεις δεν εστάλησαν" },
      { id: "export-print", label: "Εξαγωγή/Εκτύπωση δεν λειτουργεί" },
      { id: "performance", label: "Αργή απόκριση/κολλήματα" },
      { id: "other", label: "Άλλο" },
    ],
  },
  patients: {
    label: "Ασθενείς",
    topics: [
      { id: "fetch-patients", label: "Δεν φορτώνεται η λίστα ασθενών" },
      { id: "search", label: "Δεν λειτουργεί η αναζήτηση ασθενή" },
      { id: "create-duplicate", label: "Δημιουργία διπλότυπου" },
      { id: "add-patient", label: "προβλημα στην προσθήκη ασθενή" },
      { id: "update", label: "Δεν αποθηκεύονται αλλαγές στοιχείων" },
      { id: "history", label: "Ιστορικό/επισκέψεις δεν εμφανίζονται" },
      { id: "gdpr-delete", label: "Αίτημα διαγραφής δεδομένων (GDPR)" },
      { id: "amka-validate", label: "Έλεγχος ΑΜΚΑ/στοιχείων αποτυγχάνει" },
      { id: "other", label: "Άλλο" },
    ],
  },
  admin: {
    label: "Πίνακας Διαχείρισης",
    topics: [
      { id: "login", label: "Σύνδεση/αποσύνδεση" },
      { id: "password", label: "Επαναφορά κωδικού δεν λειτουργεί" },
      { id: "roles", label: "Ρόλοι/δικαιώματα πρόσβασης" },
      { id: "dashboard", label: "Προβλήματα στον πίνακα ελέγχου" },
      { id: "settings", label: "Ρυθμίσεις δεν αποθηκεύονται" },
      { id: "stats", label: "Στατιστικά/μετρήσεις λάθος" },
      { id: "other", label: "Άλλο" },
    ],
  },
  website: {
    label: "Ιστότοπος",
    topics: [
      { id: "booking-widget", label: "Widget κρατήσεων δεν λειτουργεί" },
      { id: "forms", label: "Φόρμες/υποβολές δεν φτάνουν" },
      { id: "broken-link", label: "Σπασμένοι σύνδεσμοι" },
      { id: "content", label: "Ενημέρωση περιεχομένου" },
      { id: "images", label: "Εικόνες δεν εμφανίζονται" },
      { id: "perf", label: "Απόδοση/ταχύτητα" },
      { id: "seo", label: "SEO/εμφάνιση στο Google" },
      { id: "other", label: "Άλλο" },
    ],
  },
  email: {
    label: "Email/Ειδοποιήσεις",
    topics: [
      { id: "not-received", label: "Δεν έλαβα email" },
      { id: "spam", label: "Email πάει στα ανεπιθύμητα" },
      { id: "template", label: "Λάθος πρότυπο/περιεχόμενο" },
      { id: "language", label: "Λανθασμένη γλώσσα" },
      { id: "ics", label: "ICS/συνημμένα δεν ανοίγουν" },
      { id: "duplicate", label: "Διπλά email" },
      { id: "bounce", label: "Αποτυχία παράδοσης (bounce)" },
      { id: "other", label: "Άλλο" },
    ],
  },
  other: {
    label: "Άλλο",
    topics: [{ id: "other", label: "Άλλο (περιγράψτε)" }],
  },
};

const AREA_IDS = Object.keys(AREAS);

const IMPACT = [
  { id: "blocker", label: "Δεν μπορώ να δουλέψω" },
  { id: "degraded", label: "Έχει σφάλματα/αργεί" },
  { id: "suggestion", label: "Πρόταση/Απορία/Αίτημα" },
];

const DRAFT_KEY = "incident_email_draft_v3"; // v3: adds topic/otherTopic
const LAST_SENT_KEY = "incident_email_last_sent_at";
const COOLDOWN_MS = 60 * 1000; // 1 min αντι-spam

// Αρχεία
const MAX_FILES = 5;
const MAX_TOTAL_BYTES = 10 * 1024 * 1024; // 10MB σύνολο
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB ανά αρχείο

function pad2(n) {
  return String(n).padStart(2, "0");
}

function nowLocalISOString() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(
    d.getDate()
  )}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function bytesToHuman(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function isValidPhoneGR(p) {
  if (!p) return true;
  const digits = p.replace(/[^0-9+]/g, "");
  return /^([+]30)?(2[0-9]{9}|69[0-9]{8})$/.test(digits);
}

function buildDescription(form, meta, areaLabel, topicLabel) {
  const lines = [];
  if (form.description?.trim()) lines.push(form.description.trim());
  if (form.phone?.trim())
    lines.push(`\nΤηλέφωνο επικοινωνίας: ${form.phone.trim()}`);

  const metaBlock = [
    "\n— Μετα-πληροφορίες —",
    `Περιοχή: ${areaLabel}`,
    `Θέμα: ${topicLabel}`,
    `Ζώνη ώρας: ${meta?.tz || "-"}`,
    `Γλώσσα: ${meta?.locale || "-"}`,
    `Περιηγητής: ${meta?.userAgent || "-"}`,
    `Ανάλυση: ${meta?.viewport || "-"}`,
    `Σελίδα: ${meta?.pageUrl || "-"}`,
    `Απεστάλη: ${meta?.sentAtLocal || "-"}`,
  ].join("\n");
  lines.push(metaBlock);

  return lines.join("\n");
}

export default function IncidentSimpleEmailOnlyPage() {
  const router = useRouter();
  const mounted = useRef(false);

  // ---- Auth guard
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionExists, setSessionExists] = useState(false);
  const [reporterEmail, setReporterEmail] = useState(null);

  useEffect(() => {
    let unsub = null;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
      } else {
        setSessionExists(true);
        const { data } = await supabase.auth.getUser();
        setReporterEmail(data?.user?.email ?? null);
      }
      setSessionChecked(true);

      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
        if (!s) router.replace("/login");
      });
      unsub = sub?.subscription;
    })();
    return () => unsub?.unsubscribe?.();
  }, [router]);

  // ---- Network awareness
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // ---- Cooldown countdown
  const [cooldownLeft, setCooldownLeft] = useState(0);
  useEffect(() => {
    const last = Number(localStorage.getItem(LAST_SENT_KEY) || 0);
    const tick = () => {
      const left = Math.max(0, COOLDOWN_MS - (Date.now() - last));
      setCooldownLeft(left);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, []);

  // defaults
  const defaultArea = AREA_IDS[0];
  const defaultTopic = AREAS[defaultArea].topics[0].id;

  const [form, setForm] = useState({
    title: "",
    area: defaultArea,
    topic: defaultTopic,
    otherTopic: "",
    impact: "degraded",
    description: "",
    phone: "",
    sendCopyToMe: true,
    impactStart: nowLocalISOString(),
  });

  // ---- Attachments (images)
  const [files, setFiles] = useState([]); // File[]
  const [attachError, setAttachError] = useState("");

  const totalBytes = files.reduce((a, f) => a + (f.size || 0), 0);

  function validateNewFiles(existing, incoming) {
    const imgs = incoming.filter((f) => f && f.type?.startsWith("image/"));

    const next = [...existing];
    for (const file of imgs) {
      if (next.length >= MAX_FILES) break;
      if (file.size > MAX_FILE_BYTES) {
        setAttachError(
          `Το αρχείο ${file.name} είναι πολύ μεγάλο (> ${bytesToHuman(
            MAX_FILE_BYTES
          )}).`
        );
        continue;
      }
      next.push(file);
    }
    if (next.length > MAX_FILES) next.length = MAX_FILES;

    const sum = next.reduce((a, f) => a + f.size, 0);
    if (sum > MAX_TOTAL_BYTES) {
      setAttachError(
        `Συνολικό μέγεθος > ${bytesToHuman(
          MAX_TOTAL_BYTES
        )}. Αφαιρέστε κάποια αρχεία.`
      );
    } else {
      setAttachError("");
    }

    return next;
  }

  function onChooseFiles(e) {
    const arr = Array.from(e.target.files || []);
    setFiles((prev) => validateNewFiles(prev, arr));
    e.target.value = ""; // επιτρέπει ίδια επιλογή ξανά
  }

  function onDrop(e) {
    e.preventDefault();
    const arr = Array.from(e.dataTransfer.files || []);
    setFiles((prev) => validateNewFiles(prev, arr));
  }

  function onDragOver(e) {
    e.preventDefault();
  }

  function removeFile(idx) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  // ---- Load/save draft (localStorage)
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setForm((s) => ({ ...s, ...parsed }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const {
          title,
          area,
          topic,
          otherTopic,
          impact,
          description,
          phone,
          sendCopyToMe,
          impactStart,
        } = form;
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            title,
            area,
            topic,
            otherTopic,
            impact,
            description,
            phone,
            sendCopyToMe,
            impactStart,
          })
        );
      } catch {}
    }, 250);
    return () => clearTimeout(id);
  }, [form]);

  // ---- When area changes, set first topic
  useEffect(() => {
    const currentTopics = AREAS[form.area]?.topics || [];
    if (!currentTopics.find((t) => t.id === form.topic)) {
      setForm((s) => ({ ...s, topic: currentTopics[0]?.id || "other" }));
    }
  }, [form.area]);

  // ---- Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Escape") router.back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const descTooShort = form.description.trim().length < 6;
  const phoneInvalid = !isValidPhoneGR(form.phone);
  const totalTooBig = totalBytes > MAX_TOTAL_BYTES;

  const isOtherTopic = form.topic === "other";
  const otherTopicTooShort = isOtherTopic && form.otherTopic.trim().length < 3;

  const disabled = useMemo(() => {
    return (
      !form.title.trim() ||
      !form.area ||
      !form.topic ||
      !form.impact ||
      descTooShort ||
      otherTopicTooShort ||
      phoneInvalid ||
      totalTooBig ||
      !!attachError ||
      !online ||
      (sessionChecked && !sessionExists)
    );
  }, [
    form,
    descTooShort,
    otherTopicTooShort,
    phoneInvalid,
    totalTooBig,
    attachError,
    online,
    sessionChecked,
    sessionExists,
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function handleSubmit(e) {
    e?.preventDefault?.();
    if (disabled) return;

    // Cooldown guard
    const last = Number(localStorage.getItem(LAST_SENT_KEY) || 0);
    const elapsed = Date.now() - last;
    if (elapsed < COOLDOWN_MS) {
      const ok = confirm(
        `Έχετε στείλει πρόσφατα (σε ${
          ((COOLDOWN_MS - elapsed) / 1000) | 0
        }s). Θέλετε σίγουρα να στείλετε ξανά;`
      );
      if (!ok) return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const meta = {
        pageUrl: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: typeof navigator !== "undefined" ? navigator.language : "",
        viewport:
          typeof window !== "undefined"
            ? `${window.innerWidth}x${window.innerHeight}`
            : "",
        sentAtLocal: new Date().toLocaleString(),
      };

      const areaLabel = AREAS[form.area]?.label || form.area;
      const topicLabel =
        (AREAS[form.area]?.topics || []).find((t) => t.id === form.topic)
          ?.label || form.topic;

      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("area", form.area);
      fd.append("impact", form.impact);
      fd.append("topic", form.topic);
      fd.append("topic_label", topicLabel); // optional, for backend
      fd.append("impact_start", new Date(form.impactStart).toISOString());
      fd.append(
        "description",
        buildDescription(form, meta, areaLabel, topicLabel)
      );
      fd.append("phone", form.phone?.trim() || "");
      fd.append("reporter_email", reporterEmail || "");
      fd.append("ccReporter", String(!!form.sendCopyToMe));

      files.forEach((file) => fd.append("files", file, file.name));

      const res = await fetch("/api/incident-email", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Απέτυχε η αποστολή email.");

      localStorage.setItem(LAST_SENT_KEY, String(Date.now()));
      localStorage.removeItem(DRAFT_KEY);

      setFiles([]);
      setSuccessMsg("Στάλθηκε email στην IT.");
      setTimeout(() => router.push("/admin/help?focus=1"), 1000);
    } catch (err) {
      console.error("[IncidentEmailOnly] Submit failed", err);
      const msg =
        err?.message || (typeof err === "string" ? err : JSON.stringify(err));
      setErrorMsg(msg || "Κάτι πήγε στραβά.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!sessionChecked) {
    return (
      <main className="min-h-screen grid place-items-center">
        Έλεγχος πρόσβασης…
      </main>
    );
  }
  if (!sessionExists) return null;

  const impactLabel = IMPACT.find((i) => i.id === form.impact)?.label ?? "";
  const areaLabel = AREAS[form.area]?.label ?? "";
  const topicLabel =
    (AREAS[form.area]?.topics || []).find((t) => t.id === form.topic)?.label ??
    "";

  return (
    <main className="py-8 min-h-screen bg-[#fafafa] text-[#2f2e2c]">
      {/* Header */}
      <div className="sticky top-14 z-20 border-b border-[#eceae6] bg-[#fafafa]/85 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
              aria-label="Πίσω"
            >
              <ArrowLeft className="w-4 h-4" /> Πίσω
            </button>
            <span className="hidden sm:inline text-xs text-gray-500">
              {areaLabel} • {topicLabel} • {impactLabel}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                online
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
              title={online ? "Είστε online" : "Είστε offline"}
            >
              {online ? (
                <Network className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
              {online ? "Online" : "Offline"}
            </span>
            {cooldownLeft > 0 && (
              <span className="text-xs text-gray-500">
                Cooldown: {Math.ceil(cooldownLeft / 1000)}s
              </span>
            )}
            <button
              onClick={handleSubmit}
              disabled={disabled || submitting}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-white transition ${
                disabled || submitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gray-800 hover:bg-black"
              }`}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Αναφορά προβλήματος
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-3xl px-4 py-8 space-y-6"
      >
        <h1 className="text-2xl font-semibold">Αναφορά Προβλήματος</h1>
        <p className="text-sm text-gray-600">
          Συμπληρώστε τα πεδία με *. Το μήνυμα θα σταλεί απευθείας στο IT.
          Πατήστε <kbd className="px-1 border rounded">Ctrl</kbd>+
          <kbd className="px-1 border rounded">Enter</kbd> για αποστολή.
        </p>

        {!!errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 mt-0.5" />
            <div>
              <b>Σφάλμα:</b> {errorMsg}
              {!online && (
                <div className="text-xs mt-1 text-red-700/80">
                  Δεν υπάρχει σύνδεση. Δοκιμάστε ξανά όταν είστε online.
                </div>
              )}
            </div>
          </div>
        )}
        {!!successMsg && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 flex items-start gap-2">
            <MailCheck className="w-4 h-4 mt-0.5" /> {successMsg}
          </div>
        )}

        {/* Tips */}
        <div className="rounded-2xl border border-[#e5e1d8] bg-white p-4 text-sm text-gray-700 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <div className="font-medium">Tips για γρήγορη διάγνωση</div>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>
                Περιγράψτε <i>βήμα-βήμα</i> τι προσπαθήσατε και τι συνέβη.
              </li>
              <li>
                Αναφέρετε <b>ακριβές μήνυμα σφάλματος</b> (αν υπάρχει).
              </li>
              <li>
                Σύρετε/επιλέξτε <b>εικόνες</b> ως συνημμένα (png/jpg).
              </li>
            </ul>
          </div>
        </div>

        <section className="rounded-2xl border border-[#e5e1d8] bg-white p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1" htmlFor="title">
              Τίτλος *
            </label>
            <input
              id="title"
              value={form.title}
              onChange={(e) =>
                setForm((s) => ({ ...s, title: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="Π.χ. Δεν φορτώνει η σελίδα Ραντεβού"
              required
              maxLength={120}
            />
          </div>

          {/* Area & Topic */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm text-gray-600 mb-1"
                htmlFor="area"
              >
                Περιοχή/Υπηρεσία *
              </label>
              <select
                id="area"
                value={form.area}
                onChange={(e) => {
                  const nextArea = e.target.value;
                  const firstTopic =
                    AREAS[nextArea]?.topics?.[0]?.id || "other";
                  setForm((s) => ({ ...s, area: nextArea, topic: firstTopic }));
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                {AREA_IDS.map((id) => (
                  <option key={id} value={id}>
                    {AREAS[id].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-sm text-gray-600 mb-1"
                htmlFor="topic"
              >
                Συγκεκριμένο θέμα *
              </label>
              <select
                id="topic"
                value={form.topic}
                onChange={(e) =>
                  setForm((s) => ({ ...s, topic: e.target.value }))
                }
                className={`w-full rounded-lg bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 border ${
                  isOtherTopic ? "border-amber-300" : "border-gray-300"
                }`}
              >
                {(AREAS[form.area]?.topics || []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              {isOtherTopic && (
                <input
                  value={form.otherTopic}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, otherTopic: e.target.value }))
                  }
                  className={`mt-2 w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 ${
                    otherTopicTooShort ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Περιγράψτε σύντομα το θέμα (π.χ. «Σφάλμα κατά την εκτύπωση»)"
                  maxLength={80}
                />
              )}
              {otherTopicTooShort && (
                <div className="mt-1 text-xs text-red-600">
                  Συμπληρώστε τουλάχιστον 3 χαρακτήρες.
                </div>
              )}
            </div>
          </div>

          {/* Impact */}
          <div>
            <label
              className="block text-sm text-gray-600 mb-1"
              htmlFor="impact"
            >
              Επίδραση *
            </label>
            <select
              id="impact"
              value={form.impact}
              onChange={(e) =>
                setForm((s) => ({ ...s, impact: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              {IMPACT.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label
              className="block text-sm text-gray-600 mb-1"
              htmlFor="description"
            >
              Περιγραφή *
            </label>
            <textarea
              id="description"
              rows={6}
              value={form.description}
              onChange={(e) =>
                setForm((s) => ({ ...s, description: e.target.value }))
              }
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 ${
                descTooShort ? "border-red-300" : "border-gray-300"
              }`}
              placeholder={
                "Τι προσπαθείτε να κάνετε; Τι βλέπετε στην οθόνη; Αν υπάρχει μήνυμα σφάλματος, γράψτε το ακριβώς."
              }
              required
              maxLength={2000}
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>{form.description.trim().length}/2000</span>
              {descTooShort && (
                <span className="text-red-600">
                  Γράψτε τουλάχιστον 6 χαρακτήρες.
                </span>
              )}
            </div>
          </div>

          {/* Attach images */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Συνημμένα (εικόνες)
            </label>
            <div
              onDragOver={onDragOver}
              onDrop={onDrop}
              className="border-2 border-dashed rounded-xl p-4 bg-gray-50 text-sm text-gray-600 flex flex-col items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              <div className="text-center">
                Σύρετε εδώ εικόνες ή
                <label className="ml-1 underline cursor-pointer text-gray-800">
                  επιλέξτε
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onChooseFiles}
                  />
                </label>
              </div>
              <div className="text-xs text-gray-500">
                Έως {MAX_FILES} αρχεία, max {bytesToHuman(MAX_FILE_BYTES)} ανά
                αρχείο, {bytesToHuman(MAX_TOTAL_BYTES)} σύνολο.
              </div>
            </div>

            {files.length > 0 && (
              <ul className="mt-3 grid sm:grid-cols-2 gap-2">
                {files.map((f, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-3 p-2 border rounded-lg bg-white"
                  >
                    <img
                      src={URL.createObjectURL(f)}
                      alt={f.name}
                      className="w-12 h-12 object-cover rounded"
                      onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-gray-800">
                        {f.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {bytesToHuman(f.size)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-1 rounded hover:bg-gray-100"
                      aria-label={`Αφαίρεση ${f.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-2 text-xs flex items-center justify-between">
              <span className={totalTooBig ? "text-red-600" : "text-gray-500"}>
                Σύνολο: {bytesToHuman(totalBytes)} /{" "}
                {bytesToHuman(MAX_TOTAL_BYTES)}
              </span>
              {attachError && (
                <span className="text-red-600">{attachError}</span>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm text-gray-600 mb-1"
                htmlFor="impactStart"
              >
                Πότε ξεκίνησε
              </label>
              <input
                id="impactStart"
                type="datetime-local"
                value={form.impactStart}
                onChange={(e) =>
                  setForm((s) => ({ ...s, impactStart: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
            <div className="flex items-end justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.sendCopyToMe}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, sendCopyToMe: e.target.checked }))
                  }
                />
                Στείλε μου αντίγραφο (CC)
              </label>
              {reporterEmail && (
                <span className="text-xs text-gray-500">
                  Θα σταλεί στο: {reporterEmail}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Προεπισκόπηση Θέματος */}
        <div className="rounded-2xl border border-[#e5e1d8] bg-white p-4">
          <div className="text-xs text-gray-500 mb-1">
            Προεπισκόπηση θέματος email
          </div>
          <div className="text-sm font-mono bg-gray-50 border border-gray-200 rounded px-3 py-2">
            [{areaLabel} › {topicLabel}] {impactLabel} —{" "}
            {form.title || "(χωρίς τίτλο)"}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={disabled || submitting}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-white transition ${
              disabled || submitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gray-900 hover:bg-black"
            }`}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Αναφορά προβλήματος
          </button>
          {!online && (
            <span className="inline-flex items-center gap-1 text-sm text-red-700">
              <WifiOff className="w-4 h-4" /> Δεν υπάρχει σύνδεση
            </span>
          )}
        </div>
      </form>
    </main>
  );
}
