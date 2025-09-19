"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { normalizeGreekName } from "../../app/utils/strings";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  Users,
  ArrowLeft,
  CalendarX,
  AlertTriangle,
} from "lucide-react";
import { addMinutes, isBefore } from "date-fns";
import { startOfMonth, endOfMonth } from "date-fns";
import { el } from "date-fns/locale";

function normalizeGreekText(text) {
  return text
    .normalize("NFD") // αποσυνθέτει τα τονισμένα γράμματα (π.χ. ή → ι + ́)
    .replace(/[\u0300-\u036f]/g, "") // αφαιρεί τους τόνους
    .toLowerCase(); // πεζά
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [newPatientMode, setNewPatientMode] = useState(false);
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
    notes: "",
  });
  const [bookedSlots, setBookedSlots] = useState([]);
  const filteredPatients = patients.filter((p) => {
    const term = normalizeGreekText(searchTerm);
    const fullName = normalizeGreekText(`${p.first_name} ${p.last_name}`);
    const amka = p.amka || "";
    const phone = p.phone || "";

    return (
      fullName.includes(term) || amka.includes(term) || phone.includes(term)
    );
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [allScheduleSlots, setAllScheduleSlots] = useState([]);
  const [visitorCount, setVisitorCount] = useState(null);
  const [showVisitorMessage, setShowVisitorMessage] = useState(false);
  const greekLocale = {
    ...el,
    options: {
      ...el.options,
      weekStartsOn: 1, // Ξεκινά η εβδομάδα από Δευτέρα
    },
  };

  const [acceptNewAppointments, setAcceptNewAppointments] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);

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
  // ---- slot helpers (15' grid) ----
  const addMinutes = (d, m) => new Date(d.getTime() + m * 60000);

  function buildDayGrid(
    workingPeriods,
    exceptionRanges,
    booked15Set,
    date,
    now
  ) {
    // normalize exceptions to concrete ranges for quick checks
    const exRanges = (exceptionRanges || []).map((e) => {
      if (!e.start && !e.end) {
        const s = new Date(date);
        s.setHours(0, 0, 0, 0);
        const t = new Date(date);
        t.setHours(23, 59, 59, 999);
        return { start: s, end: t };
      }
      return { start: new Date(e.start), end: new Date(e.end) };
    });
    const isInException = (t) =>
      exRanges.some((r) => t >= r.start && t < r.end);

    const ticks = [];
    for (const { start, end } of workingPeriods) {
      const cursor = new Date(start);
      const mod = cursor.getMinutes() % 15;
      if (mod !== 0) cursor.setMinutes(cursor.getMinutes() + (15 - mod), 0, 0);

      while (cursor < end) {
        const timeStr = cursor.toTimeString().slice(0, 5); // "HH:MM"
        const past = now && cursor < now;
        const unavailable =
          booked15Set.has(timeStr) || isInException(cursor) || past;

        ticks.push({
          t: new Date(cursor),
          timeStr,
          available: !unavailable,
        });

        cursor.setMinutes(cursor.getMinutes() + 15);
      }
    }
    return ticks;
  }

  useEffect(() => {
    const load = async () => {
      if (!formData.appointment_date) return;

      // derive duration number
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
    // Καθαρίζει τη φόρμα
    setFormData({
      appointment_date: null,
      appointment_time: null,
      duration_minutes: "30",
      customDuration: "",
      reason: "",
      customReason: "",
      notes: "",
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

    // Επιστροφή στην προηγούμενη σελίδα
    router.push("/");
  };

  const [submitError, setSubmitError] = useState("");
  // Βάλε τα βοηθητικά ΠΑΝΩ ΑΠΟ το component (ή έξω από το handleSubmit)

  const greekRegex = /^[\u0370-\u03FF\u1F00-\u1FFF\s-]+$/; // ελληνικά, κενά, παύλες
  function birthDateFromAmka(amka) {
    // Προϋπόθεση: το amka έχει ήδη ελεγχθεί ότι είναι 11 ψηφία και valid DDMMYY
    const dd = parseInt(amka.slice(0, 2), 10);
    const mm = parseInt(amka.slice(2, 4), 10);
    const yy = parseInt(amka.slice(4, 6), 10);

    // Κανόνας αιώνα: 00–τρέχον YY => 2000+, αλλιώς 1900+
    const currYY = new Date().getFullYear() % 100;
    const fullYear = yy <= currYY ? 2000 + yy : 1900 + yy;

    const d = new Date(fullYear, mm - 1, dd);
    if (
      d.getFullYear() !== fullYear ||
      d.getMonth() !== mm - 1 ||
      d.getDate() !== dd
    ) {
      return null; // safety net
    }
    // Επιστρέφουμε YYYY-MM-DD (καθαρή ημερομηνία)
    const isoDate = `${fullYear}-${String(mm).padStart(2, "0")}-${String(
      dd
    ).padStart(2, "0")}`;
    return isoDate; // "YYYY-MM-DD"
  }

  function titleCaseGreek(str) {
    if (!str) return "";
    // Καθαρισμοί: πολλά κενά -> 1, παύλες χωρίς κενά στα άκρα
    const cleaned = str
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\s*-\s*/g, "-")
      .toLowerCase();

    // Κάνε κεφαλαίο το πρώτο γράμμα κάθε "λέξης" που χωρίζεται από κενό ή παύλα
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
    if (!/^\d{11}$/.test(amka)) return false; // ακριβώς 11 ψηφία
    const day = parseInt(amka.slice(0, 2), 10);
    const month = parseInt(amka.slice(2, 4), 10);
    const yy = parseInt(amka.slice(4, 6), 10);

    // Απλός κανόνας αιώνα: 00–29 => 2000–2029, αλλιώς 1900–1999
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const greekRegex = /^[\u0370-\u03FF\u1F00-\u1FFF\s]+$/; // μόνο ελληνικά
    const amkaTrim = (newPatientData.amka || "").trim();
    const emailTrim = (newPatientData.email || "").trim();
    const phoneTrim = (newPatientData.phone || "").trim();
    const firstNameRaw = (newPatientData.first_name || "").trim();
    const lastNameRaw = (newPatientData.last_name || "").trim();

    // Έλεγχος ρύθμισης «δέχομαι ραντεβού»
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

    // --- Validation ---
    const errors = {};

    // ΟΝΟΜΑ / ΕΠΩΝΥΜΟ
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

    // ΤΗΛΕΦΩΝΟ
    if (!/^\d{10}$/.test(phoneTrim)) {
      errors.phone = "Ο αριθμός τηλεφώνου πρέπει να είναι 10 ψηφία.";
    }

    // EMAIL
    if (!emailTrim || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/i.test(emailTrim)) {
      errors.email = "Παρακαλώ εισάγετε ένα έγκυρο email.";
    }

    // ΑΜΚΑ (αν δόθηκε)
    let birthISO = null;
    if (amkaTrim) {
      if (!/^\d{11}$/.test(amkaTrim)) {
        errors.amka = "Το ΑΜΚΑ πρέπει να αποτελείται από 11 ψηφία.";
      } else {
        birthISO = birthDateFromAmka(amkaTrim); // "YYYY-MM-DD" ή null
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

    try {
      // ΔΙΑΡΚΕΙΑ
      const duration =
        formData.duration_minutes === "custom"
          ? parseInt(formData.customDuration || "", 10)
          : parseInt(formData.duration_minutes, 10);
      if (isNaN(duration) || duration <= 0) {
        setIsSubmitting(false);
        return alert("Η διάρκεια του ραντεβού δεν είναι έγκυρη.");
      }

      // ΗΜΕΡΟΜΗΝΙΑ / ΩΡΑ
      if (!formData.appointment_date || !formData.appointment_time) {
        setIsSubmitting(false);
        return alert("Πρέπει να επιλέξετε ημερομηνία και ώρα.");
      }
      const [hour, minute] = formData.appointment_time.split(":").map(Number);
      const combinedDate = new Date(formData.appointment_date);
      combinedDate.setHours(hour, minute, 0, 0);

      // Κανονικοποίηση ονομάτων
      const firstName = normalizeGreekName(firstNameRaw);
      const lastName = normalizeGreekName(lastNameRaw);

      // Ιατρικοί επισκέπτες (<= 2/μήνα)
      if (formData.reason === "Ιατρικός Επισκέπτης") {
        const startOfMonth = new Date(
          combinedDate.getFullYear(),
          combinedDate.getMonth(),
          1
        );
        const endOfMonth = new Date(
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
          .gte("appointment_time", startOfMonth.toISOString())
          .lte("appointment_time", endOfMonth.toISOString());
        if (visitorError) {
          setIsSubmitting(false);
          return alert("Σφάλμα κατά τον έλεγχο επισκέψεων.");
        }
        if ((count || 0) >= 2) {
          setIsSubmitting(false);
          return alert(
            "Έχουν ήδη καταχωρηθεί 2 επισκέψεις για τον τρέχοντα μήνα."
          );
        }
      }

      // Εύρεση ή δημιουργία ασθενούς
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
              birth_date: birthISO || null, // μόνο αν υπήρχε έγκυρο ΑΜΚΑ
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

      // Έλεγχος διπλού ραντεβού ίδιας μέρας
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

      // Καταχώρηση ραντεβού
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

      // Προαιρετικό email επιβεβαίωσης
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

    setNextAvailableDate(null); // Δεν βρέθηκε διαθέσιμη ημερομηνία
  };

  const isFormValid =
    !!formData.appointment_date &&
    !!formData.appointment_time &&
    (formData.reason !== "Προσαρμογή"
      ? !!formData.reason
      : !!formData.customReason?.trim());

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-[#f9f9f9] px-4 md:px-14 py-24 overflow-hidden">
      {/* 🔹 Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* 🔹 Dark blur overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#ece5da]/80 to-[#fdfaf6]/95 backdrop-blur-sm z-0" />

      {/* 🔹 Form (πάνω απ' όλα) */}
      <form
        onSubmit={handleSubmit}
        className="relative z-20 bg-white/90 backdrop-blur-xl w-full max-w-2xl p-8 md:p-10 rounded-3xl shadow-xl border border-[#e4dfd4]"
      >
        {" "}
        <div className="relative mb-8">
          {/* Back Button */}
          <button
            type="button"
            onClick={handleCancel}
            className="absolute left-0 top-1 p-2 rounded-full hover:bg-gray-200 transition"
            aria-label="Επιστροφή"
          >
            <ArrowLeft size={22} className="text-gray-600" />
          </button>

          {/* Τίτλος στο κέντρο */}
          <h2 className="text-center text-3xl font-serif font-semibold text-[#3b3a36] tracking-tight">
            Κλείστε Ραντεβού
          </h2>
        </div>
        {/* Στοιχεία Επικοινωνίας */}
        {/* Στοιχεία Επικοινωνίας (blended) */}
        <section
          className="mb-8 rounded-2xl border border-[#e5e1d8] bg-white/80 p-4 md:p-6 shadow-sm"
          role="group"
          aria-labelledby="contact-heading"
        >
          <div className="mb-5 flex items-center gap-2 text-[#6b675f]">
            <h3
              id="contact-heading"
              className="text-sm font-medium tracking-tight"
            >
              Στοιχεία Επικοινωνίας
            </h3>
            <span className="ml-2 hidden sm:inline text-xs text-[#9b968c]">
              Συμπληρώστε τα βασικά στοιχεία για επικοινωνία &amp; επιβεβαίωση.
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                className={`w-full rounded-xl border bg-white/80 px-3 py-2.5 text-[15px] shadow-sm outline-none transition
                    focus:ring-4 focus:ring-[#d7cfc2]/50 ${
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
                className={`w-full rounded-xl border bg-white/80 px-3 py-2.5 text-[15px] shadow-sm outline-none transition
                    focus:ring-4 focus:ring-[#d7cfc2]/50 ${
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
                  setNewPatientData({ ...newPatientData, phone: onlyDigits });
                }}
                onKeyDown={(e) => {
                  const allowedKeys = [
                    "Backspace",
                    "ArrowLeft",
                    "ArrowRight",
                    "Delete",
                    "Tab",
                  ];
                  if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key))
                    e.preventDefault();
                }}
                aria-invalid={!!formErrors?.phone}
                className={`w-full rounded-xl border bg-white/80 px-3 py-2.5 text-[15px] shadow-sm outline-none transition
                    focus:ring-4 focus:ring-[#d7cfc2]/50 ${
                      formErrors?.phone ? "border-red-400" : "border-[#e5e1d8]"
                    }`}
                required
              />
              <p className="mt-1 text-xs text-[#9b968c]">
                Μόνο αριθμοί, χωρίς κενά ή σύμβολα.
              </p>
              {formErrors?.phone && (
                <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>
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
                className={`w-full rounded-xl border bg-white/80 px-3 py-2.5 text-[15px] shadow-sm outline-none transition
                    focus:ring-4 focus:ring-[#d7cfc2]/50 ${
                      formErrors?.email ? "border-red-400" : "border-[#e5e1d8]"
                    }`}
                required
              />
              {formErrors?.email && (
                <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
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
                  const v = e.target.value.replace(/\D/g, ""); // keep digits only
                  setNewPatientData({ ...newPatientData, amka: v });
                  setFormErrors((prev) => ({ ...prev, amka: undefined }));
                }}
                aria-invalid={!!formErrors?.amka}
                className={`w-full rounded-xl border bg-white/80 px-3 py-2.5 text-[15px] shadow-sm outline-none transition
    focus:ring-4 focus:ring-[#d7cfc2]/50 ${
      formErrors?.amka ? "border-red-400" : "border-[#e5e1d8]"
    }`}
              />
              {formErrors?.amka && (
                <p className="mt-1 text-xs text-red-600">{formErrors.amka}</p>
              )}
            </div>
          </div>
        </section>
        {/* Λόγος Επίσκεψης */}
        <div className="mb-5">
          <label className="block text-sm mb-1 text-gray-600">
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
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            <option value="" disabled hidden>
              -- Επιλέξτε λόγο επίσκεψης --
            </option>

            <option value="Εξέταση">Εξέταση</option>
            <option value="Αξιολόγηση Αποτελεσμάτων">
              Αξιολόγηση Αποτελεσμάτων
            </option>
            <option value="Ιατρικός Επισκέπτης">Ιατρικός Επισκέπτης</option>
          </select>
        </div>
        {/* Επιλογή Ημερομηνίας */}
        <div className="mb-5">
          <label className="block text-sm mb-1 text-gray-600">Ημερομηνία</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                disabled={!formData.reason || !acceptNewAppointments} //disable when clinic OFF
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.appointment_date
                  ? format(formData.appointment_date, "dd/MM/yyyy")
                  : "Επιλέξτε ημερομηνία"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
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
                  weekend: (date) => [0, 6].includes(date.getDay()), // Κυριακή = 0, Σάββατο = 6
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
        </div>
        {!settingsLoading && !acceptNewAppointments && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100 px-4 py-3 text-sm text-red-800 shadow-sm">
            <CalendarX className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p>
                Προς το παρόν <strong>δεν</strong> δεχόμαστε νέα ηλεκτρονικά
                ραντεβού.
              </p>
              <p className="mt-1 text-red-700">
                Μπορείτε να κλείσετε το ραντεβού σας τηλεφωνικά στο{" "}
                <a
                  href="tel:2109934316"
                  className="font-semibold underline hover:text-red-900"
                >
                  210 9934316
                </a>
                .
              </p>
            </div>
          </div>
        )}
        {/* Ώρες Διαθεσιμότητας */}
        {formData.appointment_date && (
          <div className="mb-5">
            <label className="block text-sm mb-1 text-gray-600">
              Επιλογή Ώρας
            </label>

            {loadingSlots ? (
              <div className="flex items-center justify-center py-4">
                <svg
                  className="animate-spin h-5 w-5 text-gray-600"
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
                <span className="ml-2 text-gray-600 text-sm">
                  Φόρτωση διαθέσιμων ωρών...
                </span>
              </div>
            ) : formData.reason === "Ιατρικός Επισκέπτης" &&
              visitorCount >= 2 ? (
              <p className="text-red-600 text-sm mt-2">
                Λόγω αυξημένου όγκου ραντεβού, δεν είναι εφικτός ο
                προγραμματισμός επίσκεψης Ιατρικού Επισκέπτη για τον
                συγκεκριμένο μήνα. Παρακαλούμε επιλέξτε άλλον μήνα.
              </p>
            ) : hasFullDayException ? (
              <p className="text-red-600 text-sm mt-2">
                Το ιατρείο είναι κλειστό για όλη την ημέρα λόγω εξαίρεσης.
              </p>
            ) : allScheduleSlots.length === 0 ? (
              <p className="text-red-600 text-sm mt-2">
                Το ιατρείο ειναι κλειστό για την επιλεγμένη μέρα.
              </p>
            ) : availableSlots.length === 0 ? (
              <p className="text-red-600 text-sm mt-2">
                Δεν υπάρχει διαθέσιμο ραντεβού για τη διάρκεια που επιλέξατε.
                {nextAvailableDate ? (
                  <>
                    {" "}
                    Πρώτο διαθέσιμο:{" "}
                    <strong>{format(nextAvailableDate, "dd/MM/yyyy")}</strong>
                  </>
                ) : (
                  <> Δοκιμάστε άλλη ημερομηνία.</>
                )}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {allScheduleSlots
                  .filter(({ time }) => {
                    const [hour, minute] = time.split(":").map(Number);
                    const slotDate = new Date(formData.appointment_date);
                    slotDate.setHours(hour, minute, 0, 0);

                    const now = new Date();
                    const isToday =
                      formData.appointment_date &&
                      new Date(formData.appointment_date).toDateString() ===
                        now.toDateString();

                    const oneHourLater = new Date(
                      now.getTime() + 60 * 60 * 1000
                    );

                    // Απόκρυψη slot αν είναι για σήμερα και λιγότερο από 1 ώρα από τώρα
                    if (isToday && slotDate < oneHourLater) {
                      return false;
                    }

                    return true;
                  })
                  .map(({ time, available }) => {
                    const [hour, minute] = time.split(":").map(Number);
                    const start = new Date();
                    start.setHours(hour, minute, 0, 0);

                    const duration = parseInt(
                      formData.duration_minutes === "custom"
                        ? formData.customDuration
                        : formData.duration_minutes
                    );

                    const end = new Date(start);
                    end.setMinutes(end.getMinutes() + duration);

                    const endTimeStr = `${String(end.getHours()).padStart(
                      2,
                      "0"
                    )}:${String(end.getMinutes()).padStart(2, "0")}`;

                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() =>
                          available &&
                          setFormData({ ...formData, appointment_time: time })
                        }
                        disabled={!available}
                        aria-pressed={
                          formData.appointment_time === time && available
                        }
                        className={
                          `group relative flex items-center justify-center rounded-xl border px-3 py-2 text-sm transition focus:outline-none focus:ring-4 focus:ring-[#d7cfc2]/40 ` +
                          (formData.appointment_time === time && available
                            ? "border-[#2f2e2b] bg-[#2f2e2b] text-white shadow"
                            : available
                            ? "border-[#e5e1d8] bg-white text-[#2f2e2b] shadow-sm hover:-translate-y-0.5 hover:shadow"
                            : "cursor-not-allowed border-[#e8e4db] bg-[#f1eee7] text-[#a7a39a]")
                        }
                        title={available ? "" : "Κλεισμένο ή μη διαθέσιμο"}
                      >
                        <span className="tabular-nums">{time}</span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        )}
        {/* Σημειώσεις */}
        <div className="mb-6">
          <label className="block text-sm mb-1 text-gray-600">Σημειώσεις</label>
          <textarea
            rows="3"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
        </div>
        {/* Αποδοχή Όρων Χρήσης (minimal) */}
        <div className="mb-3">
          <label
            htmlFor="acceptTerms"
            className="flex items-center gap-2 text-xs text-gray-600 select-none"
          >
            <input
              id="acceptTerms"
              type="checkbox"
              required
              checked={!!formData.acceptTerms}
              onChange={(e) =>
                setFormData({ ...formData, acceptTerms: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 focus:ring-0 accent-gray-700"
              aria-required="true"
            />
            <span>
              Αποδέχομαι τους{" "}
              <a href="/terms" className="underline-offset-2 hover:underline">
                Όρους Χρήσης
              </a>{" "}
              και την{" "}
              <a
                href="/privacy-policy"
                className="underline-offset-2 hover:underline"
              >
                Πολιτική Απορρήτου
              </a>
              .
            </span>
          </label>
        </div>
        <div className="sticky bottom-0 z-10 w-full border-t border-[#eee7db] bg-white/80 px-6 py-4 backdrop-blur">
          <button
            type="submit"
            disabled={isSubmitting || !isFormValid}
            className={
              "w-full rounded-2xl px-4 py-3 text-sm font-medium tracking-tight text-white transition focus:outline-none focus:ring-4 focus:ring-[#d7cfc2]/50 " +
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
              "Κλείστε Ραντεβού (Demo)"
            )}
          </button>

          {submitError && (
            <p className="mt-2 text-center text-sm text-red-600">
              {submitError}
            </p>
          )}
        </div>
      </form>
    </main>
  );
}

function generateAvailableSlots(startHour, endHour, duration, booked) {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += 15) {
      const start = new Date();
      start.setHours(h, m, 0, 0);

      const end = new Date(start);
      end.setMinutes(end.getMinutes() + duration);

      if (
        end.getHours() > endHour ||
        (end.getHours() === endHour && end.getMinutes() > 0)
      )
        continue;

      let overlaps = false;
      for (let t = 0; t < duration; t += 15) {
        const check = new Date(start);
        check.setMinutes(check.getMinutes() + t);
        const hh = String(check.getHours()).padStart(2, "0");
        const mm = String(check.getMinutes()).padStart(2, "0");
        if (booked.includes(`${hh}:${mm}`)) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        slots.push(`${hh}:${mm}`);
      }
    }
  }
  return slots;
}
