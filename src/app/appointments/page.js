"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CalendarX,
  AlertTriangle,
  ShieldCheck,
  Lock,
  Send,
  PhoneCall,
  Loader2,
  Clock3,
} from "lucide-react";
import { startOfMonth, endOfMonth } from "date-fns";
import { el } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import clsx from "clsx";

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
    durationLabel: "Διάρκεια περίπου 15–20'",
  },
  "Ιατρικός Επισκέπτης": {
    title: "Συνάντηση ιατρικού επισκέπτη",
    description:
      "Ραντεβού αποκλειστικά για ιατρικούς επισκέπτες και συνεργάτες. Δεν αφορά εξέταση ασθενών.",
    priceLabel: "Χωρίς χρέωση ",
    durationLabel: "Σύντομη ενημερωτική συνάντηση",
  },
};

function normalizeGreekText(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [newPatientMode, setNewPatientMode] = useState(false);
  const [visitorMonthFull, setVisitorMonthFull] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  //Phone verification state
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

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
    notes: "",
    acceptTerms: false,
  });

  const [bookedSlots, setBookedSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [allScheduleSlots, setAllScheduleSlots] = useState([]);
  const [visitorCount, setVisitorCount] = useState(null);
  const [showVisitorMessage, setShowVisitorMessage] = useState(false);

  const [acceptNewAppointments, setAcceptNewAppointments] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  // Ποια τηλέφωνα έχουν επιβεβαιωθεί σε αυτό το session
  const [verifiedPhones, setVerifiedPhones] = useState(() => new Set());

  // Cooldowns ανά τηλέφωνο: { [phone]: timestampMs }
  const [cooldowns, setCooldowns] = useState({});

  // "Ρολόι" για να ανανεώνουν τα cooldowns στο UI
  const [now, setNow] = useState(Date.now());

  const greekLocale = {
    ...el,
    options: {
      ...el.options,
      weekStartsOn: 1,
    },
  };

  const filteredPatients = patients.filter((p) => {
    const term = normalizeGreekText(searchTerm);
    const fullName = normalizeGreekText(`${p.first_name} ${p.last_name}`);
    const amka = p.amka || "";
    const phone = p.phone || "";
    return (
      fullName.includes(term) || amka.includes(term) || phone.includes(term)
    );
  });

  const fetchClinicSettings = async () => {
    setSettingsLoading(true);
    const { data, error } = await supabase
      .from("clinic_settings")
      .select("accept_new_appointments")
      .eq("id", 1)
      .single();
    if (!error && data) setAcceptNewAppointments(data.accept_new_appointments);
    setSettingsLoading(false);
  };

  useEffect(() => {
    // Αν αλλάξει ο αριθμός, ξαναχρειάζεται επιβεβαίωση
    setPhoneVerified(false);

    setOtpCode("");
    setOtpError("");
  }, [newPatientData.phone]);

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
      } else {
        setAvailableSlots(data.availableSlots || []);
        setAllScheduleSlots(data.allSlots || []);
        setHasFullDayException(!!data.fullDayException);
        setNextAvailableDate(
          data.nextAvailable ? new Date(data.nextAvailable.dateISO) : null
        );
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

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000); // update κάθε 1s

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const date = formData.appointment_date;
    const duration = parseInt(
      formData.duration_minutes === "custom"
        ? formData.customDuration
        : formData.duration_minutes
    );

    if (
      date &&
      availableSlots.length === 0 &&
      !hasFullDayException &&
      allScheduleSlots.length > 0
    ) {
      findNextAvailableDate(date, duration);
    } else {
      setNextAvailableDate(null);
    }
  }, [
    availableSlots,
    hasFullDayException,
    formData.appointment_date,
    formData.duration_minutes,
    formData.customDuration,
  ]);

  useEffect(() => {
    const fetchPatients = async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name, email, amka, phone")
        .order("last_name", { ascending: true })
        .order("first_name", { ascending: true });

      if (!error) setPatients(data);
    };
    fetchPatients();
    fetchClinicSettings();
  }, []);

  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!formData.appointment_date) return;

      const start = new Date(formData.appointment_date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("appointments")
        .select("appointment_time, duration_minutes")
        .gte("appointment_time", start.toISOString())
        .lte("appointment_time", end.toISOString());

      if (error) return;

      const taken = [];
      data.forEach(({ appointment_time, duration_minutes }) => {
        const startTime = new Date(appointment_time);
        const totalSlots = Math.ceil(duration_minutes / 15);
        for (let i = 0; i < totalSlots; i++) {
          const t = new Date(startTime);
          t.setMinutes(t.getMinutes() + i * 15);
          taken.push(
            `${String(t.getHours()).padStart(2, "0")}:${String(
              t.getMinutes()
            ).padStart(2, "0")}`
          );
        }
      });

      setBookedSlots(taken);
    };

    fetchBookedSlots();
  }, [formData.appointment_date]);

  const handleCancel = () => {
    setFormData({
      appointment_date: null,
      appointment_time: null,
      duration_minutes: 30,
      customDuration: "",
      reason: "",
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

  const sendVerificationCode = async () => {
    setOtpError("");
    setFormErrors((prev) => ({ ...prev, phone: undefined }));

    const phoneTrim = (newPatientData.phone || "").trim();

    if (!isValidGreekMobile(phoneTrim)) {
      setFormErrors((prev) => ({
        ...prev,
        phone: "Το κινητό πρέπει να ξεκινά από 69 και να έχει 10 ψηφία.",
      }));
      return;
    }

    // Αν ήδη verified, δεν χρειάζεται να ξαναστείλουμε
    if (verifiedPhones.has(phoneTrim)) {
      setOtpError("Το συγκεκριμένο κινητό έχει ήδη επιβεβαιωθεί.");
      return;
    }

    // Αν υπάρχει ενεργό cooldown, μπλοκάρουμε
    if (resendSecondsLeft > 0) {
      setOtpError(
        `Μπορείτε να ζητήσετε νέο κωδικό σε ${resendSecondsLeft} δευτερόλεπτα.`
      );
      return;
    }

    try {
      setSmsSending(true);

      const res = await fetch("/api/phone/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneTrim }),
      });

      const data = await res.json().catch(() => ({}));

      // Αν έχεις υλοποιήσει το endpoint όπως είπαμε:
      // return NextResponse.json({ success: true });
      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            "Προέκυψε σφάλμα κατά την αποστολή SMS. Παρακαλούμε δοκιμάστε ξανά."
        );
      }

      // Επιτυχημένη αποστολή → ανοίγουμε dialog
      setShowOtpDialog(true);

      // ⏱ Βάλε cooldown 2 λεπτών για αυτό το τηλέφωνο
      setCooldowns((prev) => ({
        ...prev,
        [phoneTrim]: Date.now() + 2 * 60 * 1000, // 2 λεπτά
      }));
    } catch (err) {
      console.error("SMS send error", err);
      setOtpError(
        err.message ||
          "Προέκυψε σφάλμα κατά την αποστολή SMS. Παρακαλούμε δοκιμάστε ξανά."
      );
    } finally {
      setSmsSending(false);
    }
  };

  const verifyCode = async () => {
    setOtpError("");

    if (!otpCode || otpCode.trim().length < 4) {
      setOtpError("Παρακαλώ εισάγετε τον κωδικό που λάβατε με SMS.");
      return;
    }

    const phoneTrim = (newPatientData.phone || "").trim();

    try {
      setOtpLoading(true);

      const res = await fetch("/api/phone/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneTrim,
          code: otpCode.trim(),
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        // αν το σώμα δεν είναι valid JSON, απλά το αγνοούμε
      }

      // ❌ ΛΑΘΟΣ ΚΩΔΙΚΟΣ / ΛΗΓΜΕΝΟΣ / 400 από το API
      if (!res.ok || !data.valid) {
        const message =
          (data && data.error) ||
          "Ο κωδικός δεν είναι σωστός ή έχει λήξει. Δοκιμάστε ξανά.";

        // δεν κάνουμε throw – απλά ενημερώνουμε τον χρήστη
        setOtpError(message);

        // optional: μικρό warning για σένα μόνο στο dev
        if (process.env.NODE_ENV !== "production") {
          console.warn("Verify failed:", message);
        }

        return;
      }

      //  Επιτυχής επιβεβαίωση
      setPhoneVerified(true);
      setShowOtpDialog(false);

      // Αν χρησιμοποιείς session-level μνήμη:
      setVerifiedPhones((prev) => {
        const next = new Set(prev);
        next.add(phoneTrim);
        return next;
      });
    } catch (err) {
      // ΜΟΝΟ εδώ έχει νόημα console.error (δίκτυο, απρόσμενο bug κλπ.)
      console.error("Verify error (network/unexpected):", err);
      setOtpError(
        "Προέκυψε πρόβλημα κατά την επιβεβαίωση. Παρακαλούμε δοκιμάστε ξανά."
      );
    } finally {
      setOtpLoading(false);
    }
  };

  // load verified phones on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.sessionStorage.getItem("verifiedPhones");
    if (stored) {
      const parsed = JSON.parse(stored);
      setVerifiedPhones(new Set(parsed));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // μετατρέπουμε το Set σε array
    window.sessionStorage.setItem(
      "verifiedPhones",
      JSON.stringify(Array.from(verifiedPhones))
    );
  }, [verifiedPhones]);

  const greekRegex = /^[\u0370-\u03FF\u1F00-\u1FFF\s-]+$/;

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

  function isValidAmka(amka) {
    if (!/^\d{11}$/.test(amka)) return false;
    const day = parseInt(amka.slice(0, 2), 10);
    const month = parseInt(amka.slice(2, 4), 10);
    const yy = parseInt(amka.slice(4, 6), 10);
    const currYY = new Date().getFullYear() % 100;
    const fullYear = yy <= currYY ? 2000 + yy : 1900 + yy;

    const d = new Date(fullYear, month - 1, day);
    if (
      d.getFullYear() !== fullYear ||
      d.getMonth() !== month - 1 ||
      d.getDate() !== day
    ) {
      return false;
    }
    return true;
  }

  function isValidGreekMobile(phone) {
    // 10-ψήφιο κινητό που ξεκινά από 69
    return /^69\d{8}$/.test(phone || "");
  }

  const currentPhone = (newPatientData.phone || "").trim();

  const isCurrentPhoneVerified = currentPhone
    ? verifiedPhones?.has(currentPhone)
    : false;

  const isPhoneVerified =
    !!currentPhone && verifiedPhones && verifiedPhones.has(currentPhone);

  const phoneCooldownUntil = cooldowns?.[currentPhone] || 0;
  const resendSecondsLeft = Math.max(
    0,
    Math.ceil((phoneCooldownUntil - now) / 1000)
  );

  const isSendDisabled =
    smsSending ||
    !isValidGreekMobile(currentPhone) ||
    isCurrentPhoneVerified ||
    resendSecondsLeft > 0;

  const baseButtonClasses =
    "relative inline-flex items-center justify-center rounded-full border text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

  const stateClasses = isCurrentPhoneVerified
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : resendSecondsLeft > 0
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    const greekRegex = /^[\u0370-\u03FF\u1F00-\u1FFF\s]+$/;
    const amkaTrim = (newPatientData.amka || "").trim();
    const emailTrim = (newPatientData.email || "").trim();
    const phoneTrim = (newPatientData.phone || "").trim();
    const firstNameRaw = (newPatientData.first_name || "").trim();
    const lastNameRaw = (newPatientData.last_name || "").trim();

    const { data: settingsCheck, error: settingsErr } = await supabase
      .from("clinic_settings")
      .select("accept_new_appointments")
      .eq("id", 1)
      .single();

    if (settingsErr) {
      setIsSubmitting(false);
      setSubmitError("Σφάλμα κατά τον έλεγχο ρυθμίσεων ιατρείου.");
      return;
    }
    if (!settingsCheck?.accept_new_appointments) {
      setIsSubmitting(false);
      setSubmitError("Προς το παρόν δεν δεχόμαστε νέα ηλεκτρονικά ραντεβού.");
      return;
    }

    setIsSubmitting(true);

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

    let birthISO = null;
    if (amkaTrim) {
      if (!/^\d{11}$/.test(amkaTrim)) {
        errors.amka = "Το ΑΜΚΑ πρέπει να αποτελείται από 11 ψηφία.";
      } else {
        birthISO = birthDateFromAmka(amkaTrim);
        if (!birthISO) {
          errors.amka = "Το ΑΜΚΑ δεν είναι έγκυρο.";
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    if (!isPhoneVerified) {
      setSubmitError(
        "Παρακαλώ επιβεβαιώστε το κινητό σας πριν κλείσετε ραντεβού."
      );
      return;
    }

    try {
      const duration =
        formData.duration_minutes === "custom"
          ? parseInt(formData.customDuration || "", 10)
          : parseInt(formData.duration_minutes, 10);
      if (isNaN(duration) || duration <= 0) {
        setIsSubmitting(false);
        return alert("Η διάρκεια του ραντεβού δεν είναι έγκυρη.");
      }

      if (!formData.appointment_date || !formData.appointment_time) {
        setIsSubmitting(false);
        return alert("Πρέπει να επιλέξετε ημερομηνία και ώρα.");
      }
      const [hour, minute] = formData.appointment_time.split(":").map(Number);
      const combinedDate = new Date(formData.appointment_date);
      combinedDate.setHours(hour, minute, 0, 0);

      const firstName = normalizeGreekName(firstNameRaw);
      const lastName = normalizeGreekName(lastNameRaw);

      if (formData.reason === "Ιατρικός Επισκέπτης") {
        const startOfMonthDate = new Date(
          combinedDate.getFullYear(),
          combinedDate.getMonth(),
          1
        );
        const endOfMonthDate = new Date(
          combinedDate.getFullYear(),
          combinedDate.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        const { count, error: visitorError } = await supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("reason", "Ιατρικός Επισκέπτης")
          .gte("appointment_time", startOfMonthDate.toISOString())
          .lte("appointment_time", endOfMonthDate.toISOString());
        if (visitorError) {
          setIsSubmitting(false);
          return alert("Σφάλμα κατά τον έλεγχο επισκέψεων.");
        }
        if ((count || 0) >= 2) {
          setIsSubmitting(false);
          // return alert(
          //   "Έχουν ήδη καταχωρηθεί 2 επισκέψεις για τον τρέχοντα μήνα."
          // );
        }
      }

      let patientId = null;
      const filters = [];
      if (phoneTrim) filters.push(`phone.eq.${phoneTrim}`);
      if (amkaTrim) filters.push(`amka.eq.${amkaTrim}`);

      let existingPatient = null;
      if (filters.length) {
        const { data } = await supabase
          .from("patients")
          .select("id")
          .or(filters.join(","))
          .limit(1)
          .single();
        existingPatient = data || null;
      }

      if (existingPatient) {
        patientId = existingPatient.id;
      } else {
        const { data, error: patientError } = await supabase
          .from("patients")
          .insert([
            {
              first_name: firstName,
              last_name: lastName,
              phone: phoneTrim,
              email: emailTrim || null,
              amka: amkaTrim || null,
              birth_date: birthISO || null,
              gender: "other",
            },
          ])
          .select()
          .single();
        if (patientError || !data) {
          setIsSubmitting(false);
          return alert("Σφάλμα κατά την καταχώρηση ασθενούς.");
        }
        patientId = data.id;
      }

      const startOfDay = new Date(combinedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(combinedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: sameDayAppointments, error: sameDayError } = await supabase
        .from("appointments")
        .select("id")
        .eq("patient_id", patientId)
        .gte("appointment_time", startOfDay.toISOString())
        .lte("appointment_time", endOfDay.toISOString())
        .in("status", ["pending", "approved", "completed"]);

      if (sameDayError) {
        setIsSubmitting(false);
        return alert("Προέκυψε σφάλμα κατά τον έλεγχο ραντεβού.");
      }
      if ((sameDayAppointments || []).length > 0) {
        setIsSubmitting(false);
        setSubmitError("Έχετε ήδη ραντεβού για την επιλεγμένη ημέρα.");
        return;
      }

      const { error } = await supabase.from("appointments").insert([
        {
          patient_id: patientId,
          appointment_time: combinedDate.toISOString(),
          duration_minutes: duration,
          reason:
            formData.reason === "Προσαρμογή"
              ? formData.customReason
              : formData.reason,
          notes: formData.notes,
          status: "approved",
        },
      ]);
      if (error) {
        setIsSubmitting(false);
        return alert(`Σφάλμα κατά την καταχώρηση ραντεβού:\n${error.message}`);
      }

      try {
        if (emailTrim) {
          await fetch("/api/send-confirmation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: emailTrim,
              name: firstName,
              date: combinedDate.toISOString(),
              time: formData.appointment_time,
              reason:
                formData.reason === "Προσαρμογή"
                  ? formData.customReason
                  : formData.reason,
            }),
          });
        }
      } catch (err) {
        console.error("Σφάλμα αποστολής email επιβεβαίωσης:", err);
      }

      router.push(
        `/appointments/success?ref=ok&name=${encodeURIComponent(
          firstName
        )}&date=${combinedDate.toISOString()}&reason=${encodeURIComponent(
          formData.reason
        )}`
      );
    } catch (err) {
      console.error("Σφάλμα:", err);
      alert("Προέκυψε σφάλμα.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const checkVisitors = async () => {
      if (
        formData.reason !== "Ιατρικός Επισκέπτης" ||
        !formData.appointment_date
      ) {
        setVisitorCount(0);
        setShowVisitorMessage(false);
        return;
      }

      const date = new Date(formData.appointment_date);
      const start = startOfMonth(date).toISOString();
      const end = endOfMonth(date).toISOString();

      const { count, error } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("appointment_time", start)
        .lte("appointment_time", end)
        .eq("reason", "Ιατρικός Επισκέπτης");

      if (error) {
        console.error("❌ Visitor count error:", error);
        return;
      }

      setVisitorCount(count || 0);
      setShowVisitorMessage((count || 0) > 0);
    };

    checkVisitors();
  }, [formData.appointment_date, formData.reason]);

  const findNextAvailableDate = async (startDate, duration) => {
    for (let i = 1; i <= 30; i++) {
      const nextDate = new Date(startDate);
      nextDate.setDate(startDate.getDate() + i);

      const weekday = nextDate.getDay();

      const { data: scheduleData } = await supabase
        .from("clinic_schedule")
        .select("start_time, end_time")
        .eq("weekday", weekday);

      if (!scheduleData || scheduleData.length === 0) continue;

      const workingPeriods = scheduleData.map((s) => {
        const [startHour, startMinute] = s.start_time.split(":").map(Number);
        const [endHour, endMinute] = s.end_time.split(":").map(Number);

        const start = new Date(nextDate);
        start.setHours(startHour, startMinute, 0, 0);
        const end = new Date(nextDate);
        end.setHours(endHour, endMinute, 0, 0);

        return { start, end };
      });

      const { data: exceptions } = await supabase
        .from("schedule_exceptions")
        .select("start_time, end_time")
        .eq("exception_date", format(nextDate, "yyyy-MM-dd"));

      const fullDay = exceptions?.some((e) => !e.start_time && !e.end_time);
      if (fullDay) continue;

      const exceptionRanges =
        exceptions?.map((e) => ({
          start: e.start_time ? new Date(e.start_time) : null,
          end: e.end_time ? new Date(e.end_time) : null,
        })) || [];

      const startOfDay = new Date(nextDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(nextDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: booked } = await supabase
        .from("appointments")
        .select("appointment_time, duration_minutes")
        .gte("appointment_time", startOfDay.toISOString())
        .lte("appointment_time", endOfDay.toISOString());

      const bookedSlots = [];
      booked.forEach(({ appointment_time, duration_minutes }) => {
        const start = new Date(appointment_time);
        const slotsCount = Math.ceil(duration_minutes / 15);
        for (let i = 0; i < slotsCount; i++) {
          const slot = new Date(start);
          slot.setMinutes(start.getMinutes() + i * 15);
          bookedSlots.push(slot.toTimeString().slice(0, 5));
        }
      });

      for (const { start, end } of workingPeriods) {
        const cursor = new Date(start);
        while (cursor < end) {
          const endSlot = new Date(cursor);
          endSlot.setMinutes(endSlot.getMinutes() + duration);
          if (endSlot > end) break;

          const timeStr = cursor.toTimeString().slice(0, 5);

          const overlapsBooked = bookedSlots.includes(timeStr);
          const overlapsException = exceptionRanges.some((exc) => {
            if (!exc.start || !exc.end) return true;
            return cursor >= new Date(exc.start) && cursor < new Date(exc.end);
          });

          if (!overlapsBooked && !overlapsException) {
            setNextAvailableDate(nextDate);
            return;
          }

          cursor.setMinutes(cursor.getMinutes() + 15);
        }
      }
    }

    setNextAvailableDate(null);
  };

  const isFormValid =
    !!formData.appointment_date &&
    !!formData.appointment_time &&
    isPhoneVerified &&
    (formData.reason !== "Προσαρμογή"
      ? !!formData.reason
      : !!formData.customReason?.trim());

  const activeVisitMeta =
    formData.reason && VISIT_TYPES[formData.reason]
      ? VISIT_TYPES[formData.reason]
      : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f0e6] px-4 py-12 md:px-8 lg:px-10">
      {/* 🔹 Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60"
      >
        <source src="/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* 🔹 Ambient overlays */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f2e7d9]/95 via-[#fbf6ee]/96 to-[#fdfaf7]/98 backdrop-blur-sm" />
      <div className="pointer-events-none absolute -left-32 top-[-8rem] h-72 w-72 rounded-full bg-[#f0d3aa]/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-[-6rem] h-64 w-64 rounded-full bg-[#d5d0c5]/35 blur-3xl" />

      {/* 🔹 Form wrapper */}
      <div className="relative z-20 mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-start justify-center">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="rounded-[28px] border border-white/60 bg-white/90 p-5 shadow-[0_22px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl md:p-8 lg:p-10">
            {/* Header */}
            <header className="flex flex-col gap-5 border-b border-[#eee7db] pb-5 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-1 items-start gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent bg-white/90 text-gray-600 shadow-sm transition hover:border-gray-200 hover:bg-gray-100 hover:shadow-md"
                  aria-label="Επιστροφή"
                >
                  <ArrowLeft size={18} />
                </button>

                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#f7efe2] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[#8b8579]">
                    {/* <span className="h-1.5 w-1.5 rounded-full bg-[#c1a071]" /> */}
                    Online Ραντεβού
                  </span>
                  <h1 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-[#2f2e2b] md:text-3xl">
                    Κλείστε το ραντεβού σας
                  </h1>
                  <p className="mt-2 max-w-xl text-xs leading-relaxed text-[#7b7467] md:text-sm">
                    Συμπληρώστε τα στοιχεία σας και επιλέξτε την ημέρα και ώρα
                    που σας εξυπηρετεί. Η πληρωμή γίνεται αποκλειστικά στο
                    ιατρείο, την ημέρα της επίσκεψης.
                  </p>
                </div>
              </div>
            </header>

            {/* Global “no new appointments” message */}
            {!settingsLoading && !acceptNewAppointments && (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50/95 to-red-100/90 px-4 py-3 text-sm text-red-800 shadow-sm">
                <CalendarX className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                <div>
                  <p className="font-medium">
                    Προς το παρόν δεν δεχόμαστε νέα ηλεκτρονικά ραντεβού.
                  </p>
                  <p className="mt-1 text-[13px]">
                    Μπορείτε να κλείσετε το ραντεβού σας τηλεφωνικά στο{" "}
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

            {/* Main grid: left = στοιχεία, right = ραντεβού */}
            <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.95fr)]">
              {/* 🔹 Left: Στοιχεία Επικοινωνίας */}
              <section
                className="rounded-2xl border border-[#ebe4d7] bg-gradient-to-br from-white/95 via-white/90 to-[#f8f3eb]/90 p-4 shadow-sm md:p-6"
                role="group"
                aria-labelledby="contact-heading"
              >
                <div className="mb-4 flex items-center justify-between gap-2 text-[#6b675f]">
                  <div>
                    <h3
                      id="contact-heading"
                      className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                    >
                      Στοιχεία Επικοινωνίας
                    </h3>
                    <p className="mt-1 text-[11px] text-[#9b968c]">
                      Χρησιμοποιούνται για επιβεβαίωση, υπενθύμιση και τυχόν
                      αλλαγές στο ραντεβού.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Όνομα */}
                  <div>
                    <label
                      htmlFor="first_name"
                      className="mb-1 block text-xs font-medium text-[#5d5952]"
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
                      className={`w-full rounded-xl border bg-white/80 px-3 py-2.5 text-[15px] shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[#d1c3ad] focus-visible:ring-offset-1 focus-visible:ring-offset-white ${
                        formErrors?.first_name
                          ? "border-red-400"
                          : "border-[#e4ddd0]"
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
                      className="mb-1 block text-xs font-medium text-[#5d5952]"
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
                      className={`w-full rounded-xl border bg-white/80 px-3 py-2.5 text-[15px] shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[#d1c3ad] focus-visible:ring-offset-1 focus-visible:ring-offset-white ${
                        formErrors?.last_name
                          ? "border-red-400"
                          : "border-[#e4ddd0]"
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
                  <div className="sm:col-span-1">
                    <label
                      htmlFor="phone"
                      className="mb-1 block text-xs font-medium text-[#5d5952]"
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
                      className={`w-full rounded-xl border bg-white/80 px-3 py-2.5 text-[15px] shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[#d1c3ad] focus-visible:ring-offset-1 focus-visible:ring-offset-white ${
                        formErrors?.phone
                          ? "border-red-400"
                          : "border-[#e4ddd0]"
                      }`}
                      required
                      disabled={isSubmitting}
                    />
                    <p className="mt-1 text-[11px] text-[#9b968c]">
                      Μόνο αριθμοί, χωρίς κενά ή σύμβολα. Για επιβεβαίωση θα
                      σταλεί SMS στο κινητό σας.
                    </p>
                    {formErrors?.phone && (
                      <p className="mt-1 text-xs text-red-600">
                        {formErrors.phone}
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[11px] text-[#969084]">
                        <Lock className="h-3.5 w-3.5" />
                        <span>
                          Η επιβεβαίωση ραντεβού απαιτεί έγκυρο κινητό τηλέφωνο.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={sendVerificationCode}
                        disabled={isSendDisabled}
                        className={baseButtonClasses + " " + stateClasses}
                      >
                        <span className="inline-flex items-center gap-2">
                          {isCurrentPhoneVerified ? (
                            <>
                              <ShieldCheck className="h-4 w-4" />
                              <span>Τηλέφωνο επιβεβαιωμένο</span>
                            </>
                          ) : resendSecondsLeft > 0 ? (
                            <>
                              <Clock3 className="h-4 w-4" />
                              <span>Ξαναποστολή σε {resendSecondsLeft}s</span>
                            </>
                          ) : smsSending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Αποστολή...</span>
                            </>
                          ) : (
                            <>
                              <PhoneCall className="h-4 w-4" />
                              <span>Αποστολή SMS επιβεβαίωσης</span>
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1 block text-xs font-medium text-[#5d5952]"
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
                      className={`w-full rounded-xl border bg-white/80 px-3 py-2.5 text-[15px] shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[#d1c3ad] focus-visible:ring-offset-1 focus-visible:ring-offset-white ${
                        formErrors?.email
                          ? "border-red-400"
                          : "border-[#e4ddd0]"
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
                      className="mb-1 block text-xs font-medium text-[#5d5952]"
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
                        setFormErrors((prev) => ({
                          ...prev,
                          amka: undefined,
                        }));
                      }}
                      aria-invalid={!!formErrors?.amka}
                      className={`w-full rounded-xl border bg-white/80 px-3 py-2.5 text-[15px] shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[#d1c3ad] focus-visible:ring-offset-1 focus-visible:ring-offset-white ${
                        formErrors?.amka ? "border-red-400" : "border-[#e4ddd0]"
                      }`}
                    />
                    {formErrors?.amka && (
                      <p className="mt-1 text-xs text-red-600">
                        {formErrors.amka}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* 🔹 Right: Λόγος, ημερομηνία, ώρα, σημειώσεις */}
              <section className="space-y-4" aria-labelledby="visit-heading">
                {/* Card: λόγος + ημερομηνία */}
                <div className="rounded-2xl border border-[#ebe4d7] bg-gradient-to-br from-white/95 via-white/90 to-[#f8f3eb]/90 p-4 shadow-sm md:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3
                        id="visit-heading"
                        className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b675f]"
                      >
                        Λεπτομέρειες Ραντεβού
                      </h3>
                      <p className="mt-1 text-[11px] text-[#9b968c]">
                        Επιλέξτε τον λόγο επίσκεψης και την επιθυμητή
                        ημερομηνία.
                      </p>
                    </div>
                    {formData.appointment_date && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f4eee4] px-3 py-1 text-[11px] font-medium text-[#5b554b] shadow-sm">
                        <CalendarIcon className="h-3 w-3" />
                        {format(formData.appointment_date, "dd/MM/yyyy")}
                      </span>
                    )}
                  </div>

                  {/* Λόγος Επίσκεψης */}
                  <div className="mt-4">
                    <label className="mb-1 block text-xs font-medium text-gray-600">
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
                        }));
                      }}
                      className="w-full rounded-xl border border-[#e4ddd0] bg-white/90 px-3 py-2.5 text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[#d1c3ad] focus-visible:ring-offset-1 focus-visible:ring-offset-white"
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
                      <p className="mt-2 flex items-start gap-2 text-[11px] text-amber-900">
                        <AlertTriangle className="mt-[1px] h-4 w-4 flex-shrink-0" />
                        <span>
                          Επιτρέπονται έως{" "}
                          <span className="font-semibold">2 επισκέψεις</span>{" "}
                          ανά μήνα.{" "}
                          {visitorCount > 0 && visitorCount < 2 && (
                            <>
                              Έχει ήδη καταχωρηθεί{" "}
                              <strong>{visitorCount}</strong> επίσκεψη.
                            </>
                          )}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Ημερομηνία */}
                  <div className="mt-4">
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Ημερομηνία
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start rounded-xl border border-[#e4ddd0] bg-white/90 px-3 py-2.5 text-left text-sm font-normal text-[#3b3a36] shadow-sm transition hover:bg-white focus-visible:ring-2 focus-visible:ring-[#d1c3ad]"
                          disabled={!formData.reason || !acceptNewAppointments}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.appointment_date
                            ? format(formData.appointment_date, "dd/MM/yyyy")
                            : "Επιλέξτε ημερομηνία"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto rounded-2xl border border-[#e4ddd0] bg-white p-3 shadow-lg">
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
                    <p className="mt-1 text-[11px] text-[#9b968c]">
                      Διαθέσιμες ημερομηνίες έως και 2 μήνες από σήμερα.
                    </p>
                  </div>
                </div>

                {/* Card: Ώρα & διαθεσιμότητα */}
                {formData.appointment_date && (
                  <div className="rounded-2xl border border-[#ebe4d7] bg-gradient-to-br from-white/95 via-white/90 to-[#f8f3eb]/90 p-4 shadow-sm md:p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-xs font-medium text-gray-600">
                          Επιλογή Ώρας
                        </label>
                        <p className="mt-1 text-[11px] text-[#9b968c]">
                          Εμφανίζονται μόνο τα διαθέσιμα ραντεβού για την ημέρα
                          που επιλέξατε.
                        </p>
                      </div>
                    </div>

                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-4 text-sm text-gray-600">
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
                      <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                        Λόγω αυξημένου όγκου ραντεβού, δεν είναι εφικτός ο
                        προγραμματισμός επίσκεψης Ιατρικού Επισκέπτη για τον
                        συγκεκριμένο μήνα. Παρακαλούμε επιλέξτε άλλον μήνα.
                      </p>
                    ) : hasFullDayException ? (
                      <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                        Το ιατρείο είναι κλειστό για όλη την ημέρα λόγω
                        εξαίρεσης.
                      </p>
                    ) : allScheduleSlots.length === 0 ? (
                      <p className="mt-2 rounded-xl bg-yellow-50 px-3 py-2 text-sm text-[#8b6b28]">
                        Το ιατρείο είναι κλειστό για την επιλεγμένη μέρα.
                      </p>
                    ) : availableSlots.length === 0 ? (
                      <p className="mt-2 rounded-xl bg-yellow-50 px-3 py-2 text-sm text-[#8b6b28]">
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
                      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {allScheduleSlots
                          .filter(({ time }) => {
                            const [hour, minute] = time.split(":").map(Number);
                            const slotDate = new Date(
                              formData.appointment_date
                            );
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

                            if (isToday && slotDate < oneHourLater) {
                              return false;
                            }

                            return true;
                          })
                          .map(({ time, available }) => {
                            const duration = parseInt(
                              formData.duration_minutes === "custom"
                                ? formData.customDuration
                                : formData.duration_minutes,
                              10
                            );

                            const [hour, minute] = time.split(":").map(Number);
                            const start = new Date();
                            start.setHours(hour, minute, 0, 0);

                            const end = new Date(start);
                            end.setMinutes(end.getMinutes() + duration);

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
                                  "group relative flex items-center justify-center rounded-xl border px-3 py-2 text-xs tabular-nums shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d1c3ad] focus-visible:ring-offset-1 focus-visible:ring-offset-white sm:text-sm " +
                                  (isSelected
                                    ? "border-[#2f2e2b] bg-[#2f2e2b] text-white shadow-md"
                                    : available
                                    ? "border-[#e4ddd0] bg-white text-[#2f2e2b] hover:-translate-y-0.5 hover:bg-[#fbf8f1] hover:shadow"
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

                {/* Σημειώσεις */}
                <div className="rounded-2xl border border-[#ebe4d7] bg-gradient-to-br from-white/95 via-white/90 to-[#f8f3eb]/90 p-4 shadow-sm md:p-5">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Σημειώσεις (προαιρετικό)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="mt-1 w-full resize-none rounded-xl border border-[#e4ddd0] bg-white/90 px-3 py-2.5 text-sm outline-none shadow-sm transition focus-visible:ring-2 focus-visible:ring-[#d1c3ad] focus-visible:ring-offset-1 focus-visible:ring-offset-white"
                    placeholder="Σημειώσεις για το ραντεβού σας..."
                  />
                </div>

                {/* Σύνοψη επιλογής + ενδεικτικό κόστος */}
                {formData.appointment_date && formData.appointment_time && (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-dashed border-[#e2ddcf] bg-[#f9f4ec] px-4 py-3 text-[11px] text-[#4a453c] shadow-sm">
                      <p className="text-[12px] font-medium">
                        Περίληψη ραντεβού
                      </p>
                      <p className="mt-1">
                        Ημερομηνία:{" "}
                        <strong>
                          {format(formData.appointment_date, "dd/MM/yyyy")}
                        </strong>
                        , ώρα <strong>{formData.appointment_time}</strong>
                        {formData.reason && (
                          <>
                            , λόγος: <strong>{formData.reason}</strong>
                          </>
                        )}
                        .
                      </p>
                      <p className="mt-1 text-[11px] text-[#7d766a]">
                        Η επιβεβαίωση θα σταλεί στο email που δηλώσατε.
                      </p>
                    </div>

                    {activeVisitMeta && (
                      <div className="rounded-2xl border border-[#dccfb9] bg-gradient-to-r from-[#fdf7ed] to-[#f7efe2] px-4 py-3 text-[11px] text-[#4a453c] shadow-sm">
                        <div className="flex items-start gap-3">
                          <ShieldCheck className="mt-0.5 h-7 w-7 flex-shrink-0 text-[#c7b89c]" />
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b7467]">
                              Ενδεικτικό κόστος επίσκεψης
                            </p>
                            <p className="mt-1 text-sm font-medium">
                              {activeVisitMeta.priceLabel}
                              {activeVisitMeta.durationLabel && (
                                <span className="ml-2 text-xs text-[#7d766a]">
                                  • {activeVisitMeta.durationLabel}
                                </span>
                              )}
                            </p>
                            {activeVisitMeta.description && (
                              <p className="mt-1 text-[11px] text-[#7d766a]">
                                {activeVisitMeta.description}
                              </p>
                            )}
                            <p className="mt-2 text-[10px] text-[#8a8274]">
                              Οι τιμές είναι ενδεικτικές και μπορεί να
                              διαφοροποιηθούν ανάλογα με την κλινική εικόνα και
                              την πολυπλοκότητα του περιστατικού. Η πληρωμή
                              γίνεται στο ιατρείο, χωρίς online χρέωση.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* 🔹 Όροι & κουμπί υποβολής */}
            <div className="mt-8 flex flex-col gap-4 border-t border-[#eee7db] pt-5 md:flex-row md:items-center md:justify-between">
              {/* Όροι χρήσης */}
              <div className="rounded-2xl bg-[#faf5ee] px-3 py-3 md:px-4">
                <label
                  htmlFor="acceptTerms"
                  className="flex cursor-pointer items-start gap-2 text-xs text-gray-600 select-none"
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
                    <span className="text-[11px] leading-relaxed text-[#706a61]">
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
              </div>

              {/* Submit */}
              <div className="md:w-64">
                <button
                  type="submit"
                  disabled={
                    isSubmitting || !isFormValid || !formData.acceptTerms
                  }
                  className={
                    "w-full rounded-2xl px-4 py-3 text-sm font-medium tracking-tight text-white shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d1c3ad] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f0e6] " +
                    (isSubmitting || !isFormValid || !formData.acceptTerms
                      ? "cursor-not-allowed bg-[#8e8a82]"
                      : "bg-[#2f2e2b] hover:-translate-y-0.5 hover:bg-black hover:shadow-lg")
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
                  <p className="mt-2 text-center text-xs text-red-600 md:text-right">
                    {submitError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 🔹 OTP Dialog */}
          <Dialog
            open={showOtpDialog}
            onOpenChange={(open) => {
              if (!otpLoading) setShowOtpDialog(open);
            }}
          >
            <DialogContent className="max-w-sm rounded-2xl border border-[#e5e1d8] bg-white/95 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-sm font-semibold text-[#3b3a36]">
                  Επιβεβαίωση κινητού τηλεφώνου
                </DialogTitle>
                <DialogDescription className="text-xs text-[#7b7467]">
                  Στείλαμε έναν κωδικό επιβεβαίωσης SMS στο{" "}
                  <strong>{newPatientData.phone}</strong>. Παρακαλούμε εισάγετέ
                  τον παρακάτω για να συνεχίσετε.
                  {resendSecondsLeft > 0 && (
                    <>
                      <br />
                      <span className="text-[11px] text-[#9a9183]">
                        Μπορείτε να ζητήσετε νέο κωδικό σε {resendSecondsLeft}
                        δευτερόλεπτα.
                      </span>
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-3 space-y-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, ""))
                  }
                  className="w-full rounded-xl border border-[#e5e1d8] bg-white/80 px-3 py-2.5 text-center text-lg tracking-[0.3em] tabular-nums outline-none shadow-sm focus-visible:ring-2 focus-visible:ring-[#d1c3ad] focus-visible:ring-offset-1 focus-visible:ring-offset-white"
                  placeholder="••••••"
                />
                {otpError && <p className="text-xs text-red-600">{otpError}</p>}
              </div>

              <DialogFooter className="mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={sendVerificationCode}
                  disabled={smsSending || otpLoading || resendSecondsLeft > 0}
                  className="text-[11px] text-[#6b675f] underline underline-offset-2 disabled:opacity-60 disabled:text-[#b0aaa0] disabled:no-underline"
                >
                  {resendSecondsLeft > 0
                    ? `Ξαναποστολή σε ${resendSecondsLeft}s`
                    : smsSending
                    ? "Αποστολή..."
                    : "Ξαναποστολή κωδικού"}
                </button>
                <button
                  type="button"
                  onClick={verifyCode}
                  disabled={otpLoading || !otpCode}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#2f2e2b] px-4 py-2 text-xs font-medium text-white shadow-md transition disabled:cursor-not-allowed disabled:bg-[#96918a]"
                >
                  {otpLoading ? "Έλεγχος..." : "Επιβεβαίωση"}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </form>
      </div>
    </main>
  );
}
