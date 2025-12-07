"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarX,
  AlertTriangle,
  ShieldCheck,
  Lock,
  Calendar as CalendarIcon,
  CheckCircle2,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { el } from "date-fns/locale";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

// 🔹 Ενδεικτικές πληροφορίες / τιμές ανά λόγο επίσκεψης
const VISIT_TYPES = {
  Εξέταση: {
    title: "Πλήρης ενδοκρινολογική εξέταση",
    description:
      "Περιλαμβάνει λήψη αναλυτικού ιστορικού, κλινική εξέταση και αξιολόγηση προηγούμενων εξετάσεων.",
    priceLabel: "από 60€",
    durationLabel: "Διάρκεια περίπου 30'",
  },
  "Αξιολόγηση Αποτελεσμάτων": {
    title: "Αξιολόγηση εργαστηριακών εξετάσεων",
    description:
      "Συζήτηση αποτελεσμάτων, προσαρμογή αγωγής και απαντήσεις σε απορίες σχετικά με την πορεία σας.",
    priceLabel: "Χωρίς χρέωση αν εχει προηγηθεί εξέταση στο ιατρείο",
    durationLabel: "Διάρκεια περίπου 10–20'",
  },
  "Ιατρικός Επισκέπτης": {
    title: "Συνάντηση ιατρικού επισκέπτη",
    description:
      "Ραντεβού αποκλειστικά για ιατρικούς επισκέπτες και συνεργάτες. Δεν αφορά εξέταση ασθενών.",
    priceLabel: "Χωρίς χρέωση",
    durationLabel: "Σύντομη ενημερωτική συνάντηση",
  },
};

function normalizeGreekText(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const INPUT_BASE =
  "w-full rounded-xl border bg-white/85 px-3 py-2.5 text-[15px] shadow-sm outline-none transition " +
  "focus:ring-4 focus:ring-[#d7cfc2]/60";

const CARD_BASE =
  "rounded-2xl border border-[#e7e2d8] bg-white/85 shadow-sm backdrop-blur";

function SectionHeader({ eyebrow, title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#9b968c]">
            {eyebrow}
          </p>
        )}
        <h3 className="mt-1 text-sm font-semibold tracking-tight text-[#3b3a36]">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-[11px] text-[#9b968c]">{subtitle}</p>
        )}
      </div>
      {right}
    </div>
  );
}

export default function NewAppointmentPage() {
  const router = useRouter();

  const [visitorMonthFull, setVisitorMonthFull] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [newPatientData, setNewPatientData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    amka: "",
  });

  const [hasFullDayException, setHasFullDayException] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [nextAvailableDate, setNextAvailableDate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    appointment_date: null,
    appointment_time: null,
    duration_minutes: 30,
    customDuration: "",
    reason: "",
    customReason: "",
    notes: "",
    acceptTerms: false,
  });

  const [availableSlots, setAvailableSlots] = useState([]);
  const [allScheduleSlots, setAllScheduleSlots] = useState([]);
  const [visitorCount, setVisitorCount] = useState(null);
  const [showVisitorMessage, setShowVisitorMessage] = useState(false);

  const [acceptNewAppointments, setAcceptNewAppointments] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const greekLocale = useMemo(
    () => ({
      ...el,
      options: {
        ...el.options,
        weekStartsOn: 1,
      },
    }),
    []
  );

  const safeJson = async (res) => {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const fetchClinicSettings = async () => {
    setSettingsLoading(true);

    try {
      const res = await fetch("/api/public/clinic-settings", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      const data = await safeJson(res);

      if (!res.ok) {
        console.error("Clinic settings API error:", res.status, data);
        return;
      }

      setAcceptNewAppointments(!!data?.accept_new_appointments);
    } catch (e) {
      console.error("Clinic settings fetch error:", e);
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    fetchClinicSettings();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!formData.appointment_date) return;

      const duration = parseInt(
        formData.duration_minutes === "custom"
          ? formData.customDuration
          : formData.duration_minutes,
        10
      );

      const dateISO = formData.appointment_date
        ? `${formData.appointment_date.getFullYear()}-${String(
            formData.appointment_date.getMonth() + 1
          ).padStart(2, "0")}-${String(
            formData.appointment_date.getDate()
          ).padStart(2, "0")}`
        : null;

      setLoadingSlots(true);
      const res = await fetch("/api/check-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateISO,
          duration,
          reason: formData.reason || "",
          includeNext: true,
        }),
      });
      const data = await res.json();

      if (data.error) {
        setAvailableSlots([]);
        setAllScheduleSlots([]);
        setHasFullDayException(false);
        setNextAvailableDate(null);
        setVisitorCount(0);
        setVisitorMonthFull(false);
      } else {
        setAvailableSlots(data.availableSlots || []);
        setAllScheduleSlots(data.allSlots || []);
        setHasFullDayException(!!data.fullDayException);
        setNextAvailableDate(
          data.nextAvailable ? new Date(data.nextAvailable.dateISO) : null
        );

        setVisitorCount(data.visitorCount ?? 0);
        setVisitorMonthFull(!!data.visitorMonthFull);
      }
      setLoadingSlots(false);
    };
    load();
  }, [
    formData.appointment_date,
    formData.duration_minutes,
    formData.customDuration,
    formData.reason,
  ]);

  const handleCancel = () => {
    setFormData({
      appointment_date: null,
      appointment_time: null,
      duration_minutes: 30,
      customDuration: "",
      reason: "",
      customReason: "",
      notes: "",
      acceptTerms: false,
    });
    setNewPatientData({
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      amka: "",
    });
    setSelectedPatient(null);
    setNewPatientMode(false);
    router.push("/");
  };

  function birthDateFromAmka(amka) {
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
    const isoDate = `${fullYear}-${String(mm).padStart(2, "0")}-${String(
      dd
    ).padStart(2, "0")}`;
    return isoDate;
  }

  function titleCaseGreek(str) {
    if (!str) return "";
    const cleaned = str
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

  function normalizeGreekName(name) {
    return titleCaseGreek(name || "");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setFormErrors({});

    const greekRegex = /^[\u0370-\u03FF\u1F00-\u1FFF\s]+$/;
    const amkaTrim = (newPatientData.amka || "").trim();
    const emailTrim = (newPatientData.email || "").trim();
    const phoneTrim = (newPatientData.phone || "").trim();
    const firstNameRaw = (newPatientData.first_name || "").trim();
    const lastNameRaw = (newPatientData.last_name || "").trim();

    // Quick client gate using already-fetched settings
    if (!acceptNewAppointments) {
      setSubmitError("Προς το παρόν δεν δεχόμαστε νέα ηλεκτρονικά ραντεβού.");
      return;
    }

    const errors = {};

    if (!firstNameRaw || firstNameRaw.length < 3) {
      errors.first_name = "Το όνομα πρέπει να έχει τουλάχιστον 3 χαρακτήρες.";
    } else if (!greekRegex.test(firstNameRaw)) {
      errors.first_name =
        "Το όνομα πρέπει να περιέχει μόνο ελληνικούς χαρακτήρες.";
    }

    if (!lastNameRaw || lastNameRaw.length < 3) {
      errors.last_name = "Το επώνυμο πρέπει να έχει τουλάχιστον 3 χαρακτήρες.";
    } else if (!greekRegex.test(lastNameRaw)) {
      errors.last_name =
        "Το επώνυμο πρέπει να περιέχει μόνο ελληνικούς χαρακτήρες.";
    }

    if (!/^\d{10}$/.test(phoneTrim)) {
      errors.phone = "Ο αριθμός τηλεφώνου πρέπει να είναι 10 ψηφία.";
    }

    if (!emailTrim || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/i.test(emailTrim)) {
      errors.email = "Παρακαλώ εισάγετε ένα έγκυρο email.";
    }

    if (amkaTrim) {
      if (!/^\d{11}$/.test(amkaTrim)) {
        errors.amka = "Το ΑΜΚΑ πρέπει να αποτελείται από 11 ψηφία.";
      } else {
        const birthISO = birthDateFromAmka(amkaTrim);
        if (!birthISO) errors.amka = "Το ΑΜΚΑ δεν είναι έγκυρο.";
      }
    }

    if (!formData.appointment_date || !formData.appointment_time) {
      setSubmitError("Πρέπει να επιλέξετε ημερομηνία και ώρα.");
      errors.appointment = "missing";
    }

    if (Object.keys(errors).length > 0) {
      const { appointment, ...fieldErrors } = errors;
      setFormErrors(fieldErrors);
      return;
    }

    const duration =
      formData.duration_minutes === "custom"
        ? parseInt(formData.customDuration || "", 10)
        : parseInt(formData.duration_minutes, 10);

    if (!duration || duration <= 0) {
      setSubmitError("Η διάρκεια του ραντεβού δεν είναι έγκυρη.");
      return;
    }

    const [hour, minute] = formData.appointment_time.split(":").map(Number);
    const combinedDate = new Date(formData.appointment_date);
    combinedDate.setHours(hour, minute, 0, 0);

    const firstName = normalizeGreekName(firstNameRaw);
    const lastName = normalizeGreekName(lastNameRaw);

    const effectiveReason =
      formData.reason === "Προσαρμογή"
        ? formData.customReason
        : formData.reason;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/public-appointments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone: phoneTrim,
          email: emailTrim,
          amka: amkaTrim || null,
          reason: effectiveReason,
          notes: formData.notes || null,
          appointment_time_iso: combinedDate.toISOString(),
          duration_minutes: duration,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitError(data?.message || "Προέκυψε σφάλμα κατά την καταχώρηση.");
        return;
      }

      // Email is sent server-side now.
      router.push(
        `/appointments/success?ref=ok&name=${encodeURIComponent(
          firstName
        )}&date=${combinedDate.toISOString()}&reason=${encodeURIComponent(
          effectiveReason
        )}`
      );
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitError("Προέκυψε σφάλμα. Παρακαλώ δοκιμάστε ξανά.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    !!formData.appointment_date &&
    !!formData.appointment_time &&
    (formData.reason !== "Προσαρμογή"
      ? !!formData.reason
      : !!formData.customReason?.trim());

  const activeVisitMeta =
    formData.reason && VISIT_TYPES[formData.reason]
      ? VISIT_TYPES[formData.reason]
      : null;

  const selectedDateLabel = formData.appointment_date
    ? format(formData.appointment_date, "dd/MM/yyyy")
    : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f0e8] px-4 py-16 md:px-8">
      {/* 🔹 Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60"
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>

      {/* 🔹 Soft overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#f6f0e7]/95 via-[#fdfaf6]/96 to-[#fdfaf6]/98 backdrop-blur-sm" />

      <form
        onSubmit={handleSubmit}
        className="relative z-20 mx-auto w-full max-w-6xl"
      >
        {/* Outer shell */}
        <div className="rounded-[28px] border border-[#e4dfd4] bg-white/88 p-5 shadow-2xl backdrop-blur-xl md:p-8">
          {/* Header */}
          <header className="flex flex-col gap-4 border-b border-[#eee7db] pb-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent bg-white/85 text-gray-600 shadow-sm transition hover:border-gray-200 hover:bg-gray-100"
                aria-label="Επιστροφή"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#9b968c]">
                  Online Ραντεβού
                </p>
                <h1 className="mt-1 text-2xl font-serif font-semibold tracking-tight text-[#2f2e2b] md:text-3xl">
                  Κλείστε το ραντεβού σας
                </h1>
                <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[#8b8579] md:text-sm">
                  Συμπληρώστε τα στοιχεία σας και επιλέξτε την ημέρα και ώρα που
                  σας εξυπηρετεί. Η πληρωμή γίνεται αποκλειστικά στο ιατρείο,
                  την ημέρα της επίσκεψης.
                </p>
              </div>
            </div>

            {/* Quick status chips */}
            {/* <div className="flex flex-wrap items-center gap-2 md:pt-1">
              <span className="rounded-full bg-[#f5efe4] px-3 py-1 text-[10px] font-medium text-[#5b554b]">
                1) Στοιχεία
              </span>
              <span className="rounded-full bg-[#f5efe4] px-3 py-1 text-[10px] font-medium text-[#5b554b]">
                2) Λόγος & Ημερομηνία
              </span>
              <span className="rounded-full bg-[#f5efe4] px-3 py-1 text-[10px] font-medium text-[#5b554b]">
                3) Ώρα & Επιβεβαίωση
              </span>
            </div> */}
          </header>

          {/* Global “no new appointments” message */}
          {!settingsLoading && !acceptNewAppointments && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50/90 to-red-100/90 px-4 py-3 text-sm text-red-800 shadow-sm">
              <CalendarX className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
              <div>
                <p className="font-medium">
                  Προς το παρόν δεν δεχόμαστε νέα ηλεκτρονικά ραντεβού.
                </p>
                <p className="mt-1 text-[13px]">
                  Μπορείτε να κλείσετε τηλεφωνικά στο{" "}
                  <a
                    href="tel:2109934316"
                    className="font-semibold underline underline-offset-2 hover:text-red-900"
                  >
                    210 9934316
                  </a>
                  .
                </p>
              </div>
            </div>
          )}

          {/* Main layout */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
            {/* LEFT COLUMN — Contact */}
            <section className={`${CARD_BASE} p-4 md:p-6`}>
              <SectionHeader
                eyebrow="Βήμα 1"
                title="Στοιχεία Επικοινωνίας"
                subtitle="Χρησιμοποιούνται για επιβεβαίωση, υπενθύμιση και τυχόν αλλαγές."
              />

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Όνομα */}
                <div>
                  <label
                    htmlFor="first_name"
                    className="mb-1 block text-xs font-medium text-[#6b675f]"
                  >
                    Όνομα *
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    placeholder="π.χ. Μαρία"
                    value={newPatientData.first_name}
                    onChange={(e) =>
                      setNewPatientData({
                        ...newPatientData,
                        first_name: e.target.value,
                      })
                    }
                    aria-invalid={!!formErrors?.first_name}
                    className={`${INPUT_BASE} ${
                      formErrors?.first_name
                        ? "border-red-400"
                        : "border-[#e5e1d8]"
                    }`}
                    required
                  />
                  {formErrors?.first_name && (
                    <p className="mt-1 text-xs text-red-600">
                      {formErrors.first_name}
                    </p>
                  )}
                </div>

                {/* Επώνυμο */}
                <div>
                  <label
                    htmlFor="last_name"
                    className="mb-1 block text-xs font-medium text-[#6b675f]"
                  >
                    Επώνυμο *
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    placeholder="π.χ. Καλογεροπούλου"
                    value={newPatientData.last_name}
                    onChange={(e) =>
                      setNewPatientData({
                        ...newPatientData,
                        last_name: e.target.value,
                      })
                    }
                    aria-invalid={!!formErrors?.last_name}
                    className={`${INPUT_BASE} ${
                      formErrors?.last_name
                        ? "border-red-400"
                        : "border-[#e5e1d8]"
                    }`}
                    required
                  />
                  {formErrors?.last_name && (
                    <p className="mt-1 text-xs text-red-600">
                      {formErrors.last_name}
                    </p>
                  )}
                </div>

                {/* Τηλέφωνο */}
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-1 block text-xs font-medium text-[#6b675f]"
                  >
                    Τηλέφωνο *
                  </label>
                  <input
                    id="phone"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="69XXXXXXXX"
                    value={newPatientData.phone}
                    onChange={(e) => {
                      const onlyDigits = e.target.value.replace(/\D/g, "");
                      setNewPatientData({
                        ...newPatientData,
                        phone: onlyDigits,
                      });
                    }}
                    onKeyDown={(e) => {
                      const allowedKeys = [
                        "Backspace",
                        "ArrowLeft",
                        "ArrowRight",
                        "Delete",
                        "Tab",
                      ];
                      if (
                        !/[0-9]/.test(e.key) &&
                        !allowedKeys.includes(e.key)
                      ) {
                        e.preventDefault();
                      }
                    }}
                    aria-invalid={!!formErrors?.phone}
                    className={`${INPUT_BASE} ${
                      formErrors?.phone ? "border-red-400" : "border-[#e5e1d8]"
                    }`}
                    required
                  />
                  <p className="mt-1 text-[10px] text-[#9b968c]">
                    Μόνο αριθμοί, χωρίς κενά ή σύμβολα.
                  </p>
                  {formErrors?.phone && (
                    <p className="mt-1 text-xs text-red-600">
                      {formErrors.phone}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1 block text-xs font-medium text-[#6b675f]"
                  >
                    Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={newPatientData.email}
                    onChange={(e) =>
                      setNewPatientData({
                        ...newPatientData,
                        email: e.target.value,
                      })
                    }
                    aria-invalid={!!formErrors?.email}
                    className={`${INPUT_BASE} ${
                      formErrors?.email ? "border-red-400" : "border-[#e5e1d8]"
                    }`}
                    required
                  />
                  {formErrors?.email && (
                    <p className="mt-1 text-xs text-red-600">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                {/* ΑΜΚΑ */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="amka"
                    className="mb-1 block text-xs font-medium text-[#6b675f]"
                  >
                    ΑΜΚΑ (11 ψηφία – προαιρετικό)
                  </label>
                  <input
                    id="amka"
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    placeholder="π.χ. 21079812345"
                    value={newPatientData.amka || ""}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      setNewPatientData({ ...newPatientData, amka: v });
                      setFormErrors((prev) => ({ ...prev, amka: undefined }));
                    }}
                    aria-invalid={!!formErrors?.amka}
                    className={`${INPUT_BASE} ${
                      formErrors?.amka ? "border-red-400" : "border-[#e5e1d8]"
                    }`}
                  />
                  {formErrors?.amka && (
                    <p className="mt-1 text-xs text-red-600">
                      {formErrors.amka}
                    </p>
                  )}
                </div>
              </div>

              {/* Soft reassurance footer */}
              <div className="mt-5 rounded-xl border border-[#efe7da] bg-[#fbf6ed] px-3 py-2">
                <p className="text-[10px] text-[#7d766a]">
                  Τα στοιχεία σας χρησιμοποιούνται για την ορθή οργάνωση και
                  επιβεβαίωση του ραντεβού.
                </p>
              </div>
            </section>

            {/* MIDDLE COLUMN — Appointment selection */}
            <section className="space-y-6">
              {/* Reason + date */}
              <div className={`${CARD_BASE} p-4 md:p-6`}>
                <SectionHeader
                  eyebrow="Βήμα 2"
                  title="Λεπτομέρειες Ραντεβού"
                  subtitle="Επιλέξτε λόγο επίσκεψης και ημερομηνία."
                  right={
                    selectedDateLabel ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f4eee4] px-3 py-1 text-[10px] font-medium text-[#5b554b]">
                        <CalendarIcon className="h-3 w-3" />
                        {selectedDateLabel}
                      </span>
                    ) : null
                  }
                />

                {/* Λόγος Επίσκεψης */}
                <div className="mt-4">
                  <label className="mb-1 block text-xs font-medium text-[#6b675f]">
                    Λόγος Επίσκεψης
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        reason: value,
                        duration_minutes:
                          value === "Αξιολόγηση Αποτελεσμάτων" ||
                          value === "Ιατρικός Επισκέπτης"
                            ? "15"
                            : value === "Εξέταση"
                            ? "30"
                            : "custom",
                        customDuration:
                          value === "Προσαρμογή" ? prev.customDuration : "",
                        appointment_time: null,
                      }));
                    }}
                    className="w-full rounded-xl border border-[#e5e1d8] bg-white/85 px-3 py-2.5 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-[#d7cfc2]/60"
                  >
                    <option value="" disabled hidden>
                      -- Επιλέξτε λόγο επίσκεψης --
                    </option>
                    <option value="Εξέταση">Εξέταση</option>
                    <option value="Αξιολόγηση Αποτελεσμάτων">
                      Αξιολόγηση Αποτελεσμάτων
                    </option>
                    <option value="Ιατρικός Επισκέπτης">
                      Ιατρικός Επισκέπτης
                    </option>
                  </select>

                  {formData.reason === "Ιατρικός Επισκέπτης" && (
                    <p className="mt-2 flex items-start gap-2 text-[11px] text-amber-800">
                      <AlertTriangle className="mt-[1px] h-4 w-4 flex-shrink-0" />
                      <span>
                        Ραντεβού αποκλειστικά για
                        <span className="font-semibold">
                          {" "}
                          ιατρικούς επισκέπτες και συνεργάτες.
                        </span>{" "}
                        Δεν αφορά εξέταση ασθενών.
                        {/* {visitorCount > 0 && visitorCount < 2 && (
                          <>
                            {" "}
                            Έχει ήδη καταχωρηθεί <strong>
                              {visitorCount}
                            </strong>{" "}
                            επίσκεψη.
                          </>
                        )} */}
                      </span>
                    </p>
                  )}
                </div>

                {/* Ημερομηνία */}
                <div className="mt-4">
                  <label className="mb-1 block text-xs font-medium text-[#6b675f]">
                    Ημερομηνία
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start rounded-xl border border-[#e5e1d8] bg-white/85 px-3 py-2.5 text-left text-sm font-normal text-[#3b3a36] shadow-sm hover:bg-white focus-visible:ring-[#d7cfc2]"
                        disabled={!formData.reason || !acceptNewAppointments}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.appointment_date
                          ? format(formData.appointment_date, "dd/MM/yyyy")
                          : "Επιλέξτε ημερομηνία"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto rounded-2xl border border-[#e5e1d8] bg-white p-3 shadow-lg">
                      <Calendar
                        mode="single"
                        locale={greekLocale}
                        selected={formData.appointment_date}
                        onSelect={(date) => {
                          if (!acceptNewAppointments) return;
                          setFormData({
                            ...formData,
                            appointment_date: date,
                            appointment_time: null,
                          });
                        }}
                        disabled={{
                          before: new Date(),
                          after: new Date(
                            new Date().setMonth(new Date().getMonth() + 2)
                          ),
                        }}
                        modifiers={{
                          weekend: (date) => [0, 6].includes(date.getDay()),
                          friday: (date) => date.getDay() === 5,
                        }}
                        modifiersClassNames={{
                          weekend: "text-gray-400 opacity-60",
                          friday: "text-gray-400 opacity-60",
                        }}
                        showOutsideDays
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="mt-1 text-[10px] text-[#9b968c]">
                    Διαθέσιμες ημερομηνίες έως και 2 μήνες από σήμερα.
                  </p>
                </div>
              </div>

              {/* Time */}
              {formData.appointment_date && (
                <div className={`${CARD_BASE} p-4 md:p-6`}>
                  <SectionHeader
                    eyebrow="Βήμα 3"
                    title="Επιλογή Ώρας"
                    subtitle="Εμφανίζονται μόνο τα διαθέσιμα ραντεβού για την ημέρα που επιλέξατε."
                  />

                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-6 text-sm text-gray-600">
                      <svg
                        className="h-5 w-5 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      <span className="ml-2">Φόρτωση διαθέσιμων ωρών...</span>
                    </div>
                  ) : formData.reason === "Ιατρικός Επισκέπτης" &&
                    visitorCount >= 2 ? (
                    <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                      Δεν είναι εφικτός ο προγραμματισμός επίσκεψης Ιατρικού
                      Επισκέπτη για τον συγκεκριμένο μήνα. Παρακαλούμε επιλέξτε
                      άλλον μήνα.
                    </p>
                  ) : hasFullDayException ? (
                    <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                      Το ιατρείο είναι κλειστό για όλη την ημέρα λόγω εξαίρεσης.
                    </p>
                  ) : allScheduleSlots.length === 0 ? (
                    <p className="mt-3 rounded-xl bg-yellow-50 px-3 py-2 text-sm text-[#8b6b28]">
                      Το ιατρείο είναι κλειστό για την επιλεγμένη μέρα.
                    </p>
                  ) : availableSlots.length === 0 ? (
                    <p className="mt-3 rounded-xl bg-yellow-50 px-3 py-2 text-sm text-[#8b6b28]">
                      Δεν υπάρχει διαθέσιμο ραντεβού για τη διάρκεια που
                      επιλέξατε.
                      {nextAvailableDate ? (
                        <>
                          {" "}
                          Πρώτο διαθέσιμο:{" "}
                          <strong>
                            {format(nextAvailableDate, "dd/MM/yyyy")}
                          </strong>
                        </>
                      ) : (
                        <> Δοκιμάστε άλλη ημερομηνία.</>
                      )}
                    </p>
                  ) : (
                    <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {allScheduleSlots
                        .filter(({ time }) => {
                          const [hour, minute] = time.split(":").map(Number);
                          const slotDate = new Date(formData.appointment_date);
                          slotDate.setHours(hour, minute, 0, 0);

                          const now = new Date();
                          const isToday =
                            formData.appointment_date &&
                            new Date(
                              formData.appointment_date
                            ).toDateString() === now.toDateString();

                          const oneHourLater = new Date(
                            now.getTime() + 60 * 60 * 1000
                          );
                          if (isToday && slotDate < oneHourLater) return false;
                          return true;
                        })
                        .map(({ time, available }) => {
                          const duration = parseInt(
                            formData.duration_minutes === "custom"
                              ? formData.customDuration
                              : formData.duration_minutes,
                            10
                          );

                          const isSelected =
                            formData.appointment_time === time && available;

                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() =>
                                available &&
                                setFormData({
                                  ...formData,
                                  appointment_time: time,
                                })
                              }
                              disabled={!available}
                              aria-pressed={isSelected}
                              className={
                                "group relative flex items-center justify-center rounded-xl border px-3 py-2 text-xs sm:text-sm tabular-nums transition " +
                                "focus:outline-none focus:ring-4 focus:ring-[#d7cfc2]/50 " +
                                (isSelected
                                  ? "border-[#2f2e2b] bg-[#2f2e2b] text-white shadow"
                                  : available
                                  ? "border-[#e5e1d8] bg-white text-[#2f2e2b] shadow-sm hover:-translate-y-0.5 hover:bg-[#fbf8f1] hover:shadow"
                                  : "cursor-not-allowed border-[#e8e4db] bg-[#f1eee7] text-[#a7a39a]")
                              }
                              title={
                                available ? "" : "Κλεισμένο ή μη διαθέσιμο"
                              }
                            >
                              {time}
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className={`${CARD_BASE} p-4 md:p-6`}>
                <SectionHeader
                  eyebrow="Προαιρετικό"
                  title="Σημειώσεις"
                  subtitle="Γράψτε κάτι που θεωρείτε χρήσιμο για το ραντεβού σας."
                />
                <textarea
                  rows="3"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="mt-3 w-full resize-none rounded-xl border border-[#e5e1d8] bg-white/85 px-3 py-2.5 text-sm outline-none shadow-sm transition focus:ring-4 focus:ring-[#d7cfc2]/60"
                  placeholder="Σημειώσεις για το ραντεβού σας..."
                />
              </div>
            </section>

            {/* RIGHT COLUMN — Sticky summary + submit */}
            <aside className="lg:sticky lg:top-6 h-fit space-y-4">
              {/* Summary card */}
              <div className={`${CARD_BASE} p-4 md:p-6`}>
                <SectionHeader
                  eyebrow="Σύνοψη"
                  title="Το ραντεβού σας"
                  subtitle="Ελέγξτε τα στοιχεία πριν την καταχώρηση."
                />

                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-[#efe7da] bg-[#fbf6ed] px-3 py-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#7c745f]" />
                      <div className="text-[11px] text-[#4a453c]">
                        <p className="font-medium text-[12px]">
                          Επιλογές ραντεβού
                        </p>
                        <p className="mt-1">
                          Ημερομηνία:{" "}
                          <strong>
                            {formData.appointment_date
                              ? format(formData.appointment_date, "dd/MM/yyyy")
                              : "—"}
                          </strong>
                        </p>
                        <p>
                          Ώρα:{" "}
                          <strong>{formData.appointment_time || "—"}</strong>
                        </p>
                        <p>
                          Λόγος: <strong>{formData.reason || "—"}</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Visit meta */}
                  {activeVisitMeta ? (
                    <div className="rounded-xl border border-[#dccfb9] bg-gradient-to-r from-[#fdf7ed] to-[#f7efe2] px-3 py-3">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-6 w-6 flex-shrink-0 text-[#c7b89c]" />
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b7467]">
                            Ενδεικτικό κόστος
                          </p>
                          <p className="mt-1 text-sm font-medium text-[#2f2e2b]">
                            {activeVisitMeta.priceLabel}
                          </p>
                          {activeVisitMeta.durationLabel && (
                            <p className="text-[11px] text-[#7d766a]">
                              {activeVisitMeta.durationLabel}
                            </p>
                          )}
                          {activeVisitMeta.description && (
                            <p className="mt-2 text-[11px] text-[#7d766a]">
                              {activeVisitMeta.description}
                            </p>
                          )}
                          <p className="mt-2 text-[10px] text-[#8a8274]">
                            Η πληρωμή γίνεται στο ιατρείο, χωρίς online χρέωση.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#eee7db] bg-white/60 px-3 py-3">
                      <p className="text-[11px] text-[#8b8579]">
                        Επιλέξτε λόγο επίσκεψης για να εμφανιστούν πληροφορίες
                        διάρκειας και κόστους.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms + Submit card */}
              <div className={`${CARD_BASE} p-4 md:p-6`}>
                <SectionHeader
                  eyebrow="ΒΗΜΑ 3"
                  title="Επιβεβαίωση"
                  subtitle="Η καταχώρηση γίνεται με ασφαλή τρόπο."
                />

                <label
                  htmlFor="acceptTerms"
                  className="mt-4 flex items-start gap-2 text-xs text-gray-600 select-none"
                >
                  <input
                    id="acceptTerms"
                    type="checkbox"
                    required
                    checked={!!formData.acceptTerms}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        acceptTerms: e.target.checked,
                      })
                    }
                    className="mt-[2px] h-4 w-4 rounded border-gray-300 text-[#2f2e2b] focus:ring-0"
                    aria-required="true"
                  />
                  <span className="flex flex-col gap-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4c4740]">
                      <Lock className="h-3.5 w-3.5 text-[#91897b]" />
                      Ασφαλής καταχώρηση ραντεβού
                    </span>
                    <span>
                      Αποδέχομαι τους{" "}
                      <a
                        href="/terms"
                        className="underline underline-offset-2 hover:text-gray-800"
                      >
                        Όρους Χρήσης
                      </a>{" "}
                      και την{" "}
                      <a
                        href="/privacy-policy"
                        className="underline underline-offset-2 hover:text-gray-800"
                      >
                        Πολιτική Απορρήτου
                      </a>
                      .
                    </span>
                  </span>
                </label>

                <div className="mt-4">
                  <button
                    type="submit"
                    disabled={
                      isSubmitting || !isFormValid || !formData.acceptTerms
                    }
                    className={
                      "w-full rounded-2xl px-4 py-3 text-sm font-medium tracking-tight text-white shadow-md transition " +
                      "focus:outline-none focus:ring-4 focus:ring-[#d7cfc2]/60 " +
                      (isSubmitting || !isFormValid || !formData.acceptTerms
                        ? "cursor-not-allowed bg-[#8e8a82]"
                        : "bg-[#2f2e2b] hover:-translate-y-0.5 hover:bg-black")
                    }
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center justify-center">
                        <svg
                          className="mr-2 h-5 w-5 animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                          />
                        </svg>
                        Καταχώρηση...
                      </span>
                    ) : (
                      "Κλείστε Ραντεβού"
                    )}
                  </button>

                  {submitError && (
                    <p className="mt-2 text-center text-xs text-red-600">
                      {submitError}
                    </p>
                  )}

                  <p className="mt-3 text-center text-[10px] text-[#8a8274]">
                    Θα λάβετε επιβεβαίωση στο email που δηλώσατε.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </form>
    </main>
  );
}
