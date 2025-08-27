// admin/appointments/new/page.js
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, addMonths } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";

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
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { startOfMonth, endOfMonth } from "date-fns";
import { el } from "date-fns/locale";
import { Session } from "@supabase/auth-helpers-nextjs";

function normalizeGreekText(text) {
  return text
    .normalize("NFD") // αποσυνθέτει τα τονισμένα γράμματα (π.χ. ή → ι + ́)
    .replace(/[\u0300-\u036f]/g, "") // αφαιρεί τους τόνους
    .toLowerCase(); // πεζά
}

export default function NewAppointmentPage() {
  const [patients, setPatients] = useState([]);
  const [session, setSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [newPatientMode, setNewPatientMode] = useState(false);
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
  const [nextAvailableTime, setNextAvailableTime] = useState(null);
  const [isFindingNext, setIsFindingNext] = useState(false);
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
  const [availableSlots, setAvailableSlots] = useState([]);
  const [allScheduleSlots, setAllScheduleSlots] = useState([]);
  const [visitorCount, setVisitorCount] = useState(null);
  const [showVisitorMessage, setShowVisitorMessage] = useState(false);
  const [errors, setErrors] = useState({});

  const filteredPatients = patients.filter((p) => {
    const term = normalizeGreekText(searchTerm);
    const fullName = normalizeGreekText(`${p.first_name} ${p.last_name}`);
    const amka = p.amka || "";
    const phone = p.phone || "";

    return (
      fullName.includes(term) || amka.includes(term) || phone.includes(term)
    );
  });
  const router = useRouter();
  const isMedicalVisitor = formData.reason === "Ιατρικός Επισκέπτης";
  const [visitorName, setVisitorName] = useState("");

  const greekLocale = {
    ...el,
    options: {
      ...el.options,
      weekStartsOn: 1, // Ξεκινά η εβδομάδα από Δευτέρα
    },
  };

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setSession(session);
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!formData.appointment_date) return;
      setLoadingSlots(true);
      const date = formData.appointment_date;
      const weekday = date.getDay(); // 0=Sunday

      const { data: scheduleData } = await supabase
        .from("clinic_schedule")
        .select("start_time, end_time")
        .eq("weekday", weekday);
      console.log("clinic_schedule:", scheduleData);

      if (!scheduleData || scheduleData.length === 0) {
        setAvailableSlots([]);
        setAllScheduleSlots([]);
        setHasFullDayException(false); // reset just in case
        setLoadingSlots(false);
        return;
      }
      setHasFullDayException(hasFullDayException); // ενημέρωση state

      // Working hours
      const workingPeriods = scheduleData.map((s) => {
        const [startHour, startMinute, startSecond] = s.start_time
          .split(":")
          .map(Number);
        const [endHour, endMinute, endSecond] = s.end_time
          .split(":")
          .map(Number);

        const start = new Date(date);
        start.setHours(startHour, startMinute, startSecond || 0, 0);

        const end = new Date(date);
        end.setHours(endHour, endMinute, endSecond || 0, 0);

        return { start, end };
      });

      // Fetch exceptions
      const { data: exceptions } = await supabase
        .from("schedule_exceptions")
        .select("start_time, end_time")
        .eq("exception_date", format(date, "yyyy-MM-dd"));

      const exceptionRanges =
        exceptions?.map((e) => ({
          start: e.start_time ? new Date(e.start_time) : null,
          end: e.end_time ? new Date(e.end_time) : null,
        })) || [];

      // Αν έχει εξαίρεση χωρίς start/end ώρα = όλη μέρα κλειστό
      const fullDayException = exceptions?.some(
        (e) => !e.start_time && !e.end_time
      );
      setHasFullDayException(fullDayException);

      // Appointments (booked)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: booked } = await supabase
        .from("appointments")
        .select("appointment_time, duration_minutes")
        .gte("appointment_time", startOfDay.toISOString())
        .lte("appointment_time", endOfDay.toISOString())
        .eq("status", "approved");

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

      // Υπολογισμός διαθέσιμων + όλων των slots
      const duration = parseInt(
        formData.duration_minutes === "custom"
          ? formData.customDuration
          : formData.duration_minutes
      );

      const slots = [];
      const allSlots = [];

      workingPeriods.forEach(({ start, end }) => {
        const cursor = new Date(start);
        while (cursor < end) {
          const endSlot = new Date(cursor);
          endSlot.setMinutes(endSlot.getMinutes() + duration);
          if (endSlot.getTime() > end.getTime()) break;

          const timeStr = cursor.toTimeString().slice(0, 5);

          const overlapsBooked = bookedSlots.includes(timeStr);
          const overlapsException = exceptionRanges.some((exc) => {
            if (!exc.start || !exc.end) return true;
            return cursor >= new Date(exc.start) && cursor < new Date(exc.end);
          });

          const available = !overlapsBooked && !overlapsException;

          if (available) slots.push(timeStr);

          allSlots.push({
            time: timeStr,
            available,
          });

          cursor.setMinutes(cursor.getMinutes() + 15);
        }
      });

      setAvailableSlots(slots);
      setAllScheduleSlots(allSlots);

      setLoadingSlots(false);
    };

    fetchAvailableSlots();
  }, [
    formData.appointment_date,
    formData.duration_minutes,
    formData.customDuration,
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

  useEffect(() => {
    if (isMedicalVisitor) {
      setSelectedPatient(null);
      setNewPatientMode(false);
      setVisitorName((v) => v); // προαιρετικό, κρατά το όνομα αν υπήρχε
    }
  }, [isMedicalVisitor]);

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
    router.push("/admin/appointments");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.reason) newErrors.reason = "Απαιτείται λόγος επίσκεψης";
    if (!formData.appointment_date)
      newErrors.appointment_date = "Απαιτείται ημερομηνία";
    if (!formData.appointment_time)
      newErrors.appointment_time = "Απαιτείται ώρα ραντεβού";

    if (formData.reason === "Προσαρμογή" && !formData.customReason)
      newErrors.customReason = "Απαιτείται περιγραφή";

    if (formData.duration_minutes === "custom" && !formData.customDuration)
      newErrors.customDuration = "Απαιτείται προσαρμοσμένη διάρκεια";

    if (newPatientMode) {
      if (!newPatientData.first_name) newErrors.first_name = "Απαιτείται όνομα";
      if (!newPatientData.last_name) newErrors.last_name = "Απαιτείται επώνυμο";
    } else {
      if (!selectedPatient) newErrors.selectedPatient = "Επιλέξτε ασθενή";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const [existingAmkaPatient, setExistingAmkaPatient] = useState(null);

  useEffect(() => {
    const checkAmka = async () => {
      const trimmedAmka = newPatientData.amka?.trim();
      if (!trimmedAmka || trimmedAmka.length < 6) {
        setExistingAmkaPatient(null);
        return;
      }

      const { data, error } = await supabase
        .from("patients")
        .select("first_name, last_name")
        .eq("amka", trimmedAmka)
        .single();

      if (data) {
        setExistingAmkaPatient(`${data.first_name} ${data.last_name}`);
      } else {
        setExistingAmkaPatient(null);
      }
    };

    checkAmka();
  }, [newPatientData.amka]);

  const [existingPhonePatient, setExistingPhonePatient] = useState(null);
  useEffect(() => {
    const checkPhone = async () => {
      const trimmedPhone = newPatientData.phone?.trim();
      if (!trimmedPhone || trimmedPhone.length < 6) {
        setExistingPhonePatient(null);
        return;
      }

      const { data, error } = await supabase
        .from("patients")
        .select("first_name, last_name")
        .ilike("phone", `%${trimmedPhone}%`)
        .limit(1)
        .single();

      if (data) {
        setExistingPhonePatient(`${data.first_name} ${data.last_name}`);
      } else {
        setExistingPhonePatient(null);
      }
    };

    checkPhone();
  }, [newPatientData.phone]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const isMedicalVisitor = formData.reason === "Ιατρικός Επισκέπτης";

      // ---- Έλεγχος διάρκειας
      const duration =
        formData.duration_minutes === "custom"
          ? parseInt(formData.customDuration || "", 10)
          : parseInt(formData.duration_minutes, 10);

      if (!Number.isFinite(duration) || duration <= 0) {
        alert("Η διάρκεια του ραντεβού δεν είναι έγκυρη.");
        return;
      }

      // ---- Έλεγχος ημερομηνίας/ώρας
      if (!formData.appointment_date || !formData.appointment_time) {
        alert("Πρέπει να συμπληρωθούν Ημερομηνία και Ώρα.");
        return;
      }

      const [hour, minute] = formData.appointment_time.split(":").map(Number);
      const combinedDate = new Date(formData.appointment_date);
      combinedDate.setHours(hour, minute, 0, 0);

      // =========================================================
      // === ΚΛΑΔΟΣ: ΙΑΤΡΙΚΟΣ ΕΠΙΣΚΕΠΤΗΣ ========================
      // =========================================================
      if (isMedicalVisitor) {
        const visitor =
          (typeof visitorName !== "undefined" ? visitorName : searchTerm) || "";
        const visitorTrimmed = visitor.trim();

        if (!visitorTrimmed) {
          alert("Πρέπει να συμπληρωθεί το Όνομα Επισκέπτη.");
          return;
        }

        const { error } = await supabase.from("appointments").insert([
          {
            patient_id: null,
            appointment_time: combinedDate.toISOString(),
            duration_minutes: duration,
            reason:
              formData.reason === "Προσαρμογή" && formData.customReason?.trim()
                ? formData.customReason.trim()
                : "Ιατρικός Επισκέπτης",
            notes: [formData.notes, `Ιατρικός Επισκέπτης: ${visitorTrimmed}`]
              .filter(Boolean)
              .join(" • "),
            status: "approved",
          },
        ]);

        if (error) {
          console.error("Appointment insert error:", error);
          alert("Σφάλμα κατά την καταχώρηση ραντεβού.");
          return;
        }

        toast.success("✅ Το ραντεβού καταχωρήθηκε επιτυχώς!");
        router.push("/admin/appointments");
        return;
      }

      // =========================================================
      // === ΚΛΑΔΟΣ: ΑΣΘΕΝΗΣ =====================================
      // =========================================================
      let patientId = selectedPatient?.id;
      let email = null;
      let name = "";

      if (newPatientMode) {
        const trimmedAmka = newPatientData.amka?.trim();
        if (trimmedAmka) {
          const { data: existingAmka } = await supabase
            .from("patients")
            .select("id")
            .eq("amka", trimmedAmka)
            .single();

          if (existingAmka) {
            alert("Υπάρχει ήδη ασθενής με αυτό το ΑΜΚΑ.");
            return;
          }
        }

        const { data, error: patientError } = await supabase
          .from("patients")
          .insert([
            {
              first_name: newPatientData.first_name.trim(),
              last_name: newPatientData.last_name.trim(),
              phone: newPatientData.phone?.trim() || null,
              email: newPatientData.email?.trim() || null,
              amka: newPatientData.amka?.trim() || null,
              gender: "other",
            },
          ])
          .select();

        if (patientError || !data || data.length === 0) {
          console.error("❌ Patient insert error:", patientError);
          alert("Σφάλμα κατά την καταχώρηση νέου ασθενή.");
          return;
        }

        patientId = data[0].id;
        email = newPatientData.email;
        name = `${newPatientData.first_name} ${newPatientData.last_name}`;
      } else {
        email = selectedPatient?.email || null;
        name = selectedPatient
          ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
          : "";
      }

      if (!patientId) {
        alert("Πρέπει να επιλεγεί/καταχωρηθεί ασθενής.");
        return;
      }

      const { error } = await supabase.from("appointments").insert([
        {
          patient_id: patientId,
          appointment_time: combinedDate.toISOString(),
          duration_minutes: duration,
          notes: formData.notes || null,
          reason:
            formData.reason === "Προσαρμογή" && formData.customReason?.trim()
              ? formData.customReason.trim()
              : formData.reason,
          status: "approved",
        },
      ]);

      if (error) {
        console.error("Appointment insert error:", error);
        alert("Σφάλμα κατά την καταχώρηση ραντεβού.");
        return;
      }

      // Εμφάνιση toast επιτυχίας
      toast.success("✅ Το ραντεβού καταχωρήθηκε επιτυχώς!");

      if (email) {
        await fetch("/api/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            name,
            date: formData.appointment_date.toISOString(),
            time: formData.appointment_time,
            reason:
              formData.reason === "Προσαρμογή" && formData.customReason?.trim()
                ? formData.customReason.trim()
                : formData.reason,
          }),
        });
      }

      router.push("/admin/appointments");
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
        .eq("reason", "Ιατρικός Επισκέπτης")
        .eq("status", "approved");

      if (error) {
        console.error("❌ Visitor count error:", error);
        return;
      }

      setVisitorCount(count || 0);
      setShowVisitorMessage((count || 0) > 0);
    };

    checkVisitors();
  }, [formData.appointment_date, formData.reason]);
  const findNextAvailableSlot = async (startDate, durationMin) => {
    // σκάναρε έως 30 μέρες μπροστά (εξαιρείς την ίδια ημέρα)
    for (let i = 1; i <= 30; i++) {
      const nextDate = new Date(startDate);
      nextDate.setDate(startDate.getDate() + i);

      const weekday = toDbWeekday(nextDate.getDay());

      // 1) Ωράριο
      const { data: scheduleData, error: schedErr } = await supabase
        .from("clinic_schedule")
        .select("start_time, end_time")
        .eq("weekday", weekday);

      if (schedErr) {
        console.error(schedErr);
        continue;
      }
      if (!scheduleData || scheduleData.length === 0) continue;

      const workingPeriods = scheduleData
        .map((s) => {
          const start = dateAtTime(nextDate, s.start_time);
          const end = dateAtTime(nextDate, s.end_time);
          return start && end ? { start, end } : null;
        })
        .filter(Boolean);

      // 2) Εξαιρέσεις για τη μέρα
      const startOfDay = new Date(nextDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(nextDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: exceptions, error: excErr } = await supabase
        .from("schedule_exceptions")
        .select("start_time, end_time, exception_date")
        .eq("exception_date", format(nextDate, "yyyy-MM-dd"));

      if (excErr) {
        console.error(excErr);
        continue;
      }

      // full-day exception
      const fullDay = exceptions?.some((e) => !e.start_time && !e.end_time);
      if (fullDay) continue;

      const exceptionRanges =
        exceptions?.map((e) => {
          const s = e.start_time
            ? dateAtTime(nextDate, e.start_time)
            : startOfDay;
          const eEnd = e.end_time ? dateAtTime(nextDate, e.end_time) : endOfDay;
          return { start: s, end: eEnd };
        }) ?? [];

      // 3) Κλεισμένα της μέρας (ως διαστήματα)
      const { data: bookedRaw, error: bookedErr } = await supabase
        .from("appointments")
        .select("appointment_time, duration_minutes, status")
        .gte("appointment_time", startOfDay.toISOString())
        .lt("appointment_time", endOfDay.toISOString())
        .in("status", ["scheduled", "approved", "completed"]);

      if (bookedErr) {
        console.error(bookedErr);
        continue;
      }

      const bookedRanges =
        (bookedRaw ?? []).map((b) => {
          const bs = new Date(b.appointment_time);
          const be = new Date(bs);
          be.setMinutes(be.getMinutes() + (b.duration_minutes ?? 0));
          return { start: bs, end: be };
        }) ?? [];

      // 4) Σάρωση ανά 15'
      for (const { start, end } of workingPeriods) {
        const cursor = new Date(start);
        while (cursor < end) {
          const endSlot = new Date(cursor);
          endSlot.setMinutes(endSlot.getMinutes() + durationMin);

          // Πρέπει να χωράει ολόκληρο εντός ωραρίου
          if (endSlot > end) break;

          const overlapsException = exceptionRanges.some((exc) =>
            rangesOverlap(cursor, endSlot, exc.start, exc.end)
          );
          if (overlapsException) {
            cursor.setMinutes(cursor.getMinutes() + 15);
            continue;
          }

          const overlapsBooked = bookedRanges.some((br) =>
            rangesOverlap(cursor, endSlot, br.start, br.end)
          );
          if (!overlapsBooked) {
            // Βρέθηκε πρώτο διαθέσιμο: επιστροφή date + time
            return { date: nextDate, time: new Date(cursor) };
          }

          cursor.setMinutes(cursor.getMinutes() + 15);
        }
      }
    }

    // Δεν βρέθηκε στο παράθυρο
    return null;
  };

  const resolvedDuration =
    formData.duration_minutes === "custom"
      ? parseInt(formData.customDuration || "", 10)
      : parseInt(formData.duration_minutes || "", 10);
  const toDateOnly = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const parseSelectedDate = (val) => {
    if (val instanceof Date) return val;
    // expect 'YYYY-MM-DD'
    if (typeof val === "string") {
      const [y, m, d] = val.split("-").map(Number);
      return new Date(y, (m || 1) - 1, d || 1);
    }
    return new Date(); // fallback: today
  };
  // helper: map JS getDay() -> DB weekday (1=Mon ... 7=Sun)
  function toDbWeekday(jsDay /* 0=Sun..6=Sat */) {
    // Αν στο DB έχεις 1=Mon..7=Sun:
    // Mon=1 => js 1 -> 1, ..., Sun=7 => js 0 -> 7
    return jsDay === 0 ? 7 : jsDay; // 1..7 με Δευ=1 ... Κυρ=7
    // Αν στο DB έχεις 0=Sun..6=Sat, τότε απλώς: return jsDay;
  }

  // helper: δένει "HH:MM(:SS)?" πάνω σε συγκεκριμένη ημερομηνία
  function dateAtTime(baseDate, timeStr) {
    if (!timeStr) return null;
    const [h, m = "0", s = "0"] = timeStr.split(":");
    const d = new Date(baseDate);
    d.setHours(Number(h), Number(m), Number(s), 0);
    return d;
  }

  const findNextAvailableDate = async (startDate, duration) => {
    // σκάναρε έως 30 μέρες
    for (let i = 1; i <= 30; i++) {
      const nextDate = new Date(startDate);
      nextDate.setDate(startDate.getDate() + i);

      // weekday (πρόσεξε mapping)
      const weekday = toDbWeekday(nextDate.getDay());

      // 1) Βάση ωραρίου
      const { data: scheduleData, error: schedErr } = await supabase
        .from("clinic_schedule")
        .select("start_time, end_time")
        .eq("weekday", weekday);

      if (schedErr) {
        console.error(schedErr);
        continue;
      }
      if (!scheduleData || scheduleData.length === 0) continue;

      const workingPeriods = scheduleData.map((s) => {
        const start = dateAtTime(nextDate, s.start_time); // "HH:MM"
        const end = dateAtTime(nextDate, s.end_time);
        return { start, end };
      });

      // 2) Εξαιρέσεις (ολόκληρη μέρα ή τμήμα)
      const { data: exceptions, error: excErr } = await supabase
        .from("schedule_exceptions")
        .select("start_time, end_time, exception_date")
        // αν exception_date είναι DATE, η σύγκριση με "yyyy-MM-dd" είναι σωστή
        .eq("exception_date", format(nextDate, "yyyy-MM-dd"));

      if (excErr) {
        console.error(excErr);
        continue;
      }

      // full-day: ούτε start ούτε end
      const fullDay = exceptions?.some((e) => !e.start_time && !e.end_time);
      if (fullDay) continue;

      // μετέτρεψε τα time-only σε Date ranges πάνω στο nextDate
      const startOfDay = new Date(nextDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(nextDate);
      endOfDay.setHours(23, 59, 59, 999);

      const exceptionRanges =
        exceptions?.map((e) => {
          // open-ended αρχή/τέλος
          const start = e.start_time
            ? dateAtTime(nextDate, e.start_time)
            : startOfDay;
          const end = e.end_time ? dateAtTime(nextDate, e.end_time) : endOfDay;
          return { start, end };
        }) || [];

      // 3) Κλεισμένα ραντεβού της ημέρας (μόνο ενεργά/δεσμευτικά)
      const { data: bookedRaw, error: bookedErr } = await supabase
        .from("appointments")
        .select("appointment_time, duration_minutes, status")
        .gte("appointment_time", startOfDay.toISOString())
        .lt("appointment_time", endOfDay.toISOString())
        .in("status", ["scheduled", "approved", "completed"]); // προσαρμόσ’ το αν θες

      if (bookedErr) {
        console.error(bookedErr);
        continue;
      }

      const booked = bookedRaw ?? [];

      // αποτύπωσε σε βήμα 15' όλα τα κατειλημμένα start times
      const bookedSlots = [];
      booked.forEach(({ appointment_time, duration_minutes }) => {
        const start = new Date(appointment_time);
        const count = Math.ceil((duration_minutes ?? 0) / 15);
        for (let k = 0; k < count; k++) {
          const slot = new Date(start);
          slot.setMinutes(start.getMinutes() + k * 15);
          bookedSlots.push(slot.toTimeString().slice(0, 5)); // "HH:MM"
        }
      });

      // 4) Σάρωσε τα working periods ανά 15'
      let found = false;
      for (const { start, end } of workingPeriods) {
        if (!start || !end) continue;

        const cursor = new Date(start);
        while (cursor < end) {
          const endSlot = new Date(cursor);
          endSlot.setMinutes(endSlot.getMinutes() + duration);

          // slot πρέπει να χωράει ΟΛΟ εντός ωραρίου
          if (endSlot > end) break;

          const timeStr = cursor.toTimeString().slice(0, 5); // "HH:MM"

          const overlapsBooked = bookedSlots.includes(timeStr);
          const overlapsException = exceptionRanges.some(
            (exc) => cursor < exc.end && endSlot > exc.start
          );

          if (!overlapsBooked && !overlapsException) {
            setNextAvailableDate(nextDate); // ή κράτα κι ώρα αν θέλεις
            found = true;
            break;
          }

          cursor.setMinutes(cursor.getMinutes() + 15);
        }
        if (found) break;
      }

      if (found) return;
    }

    // Δεν βρέθηκε διαθέσιμη ημερομηνία στο παράθυρο αναζήτησης
    setNextAvailableDate(null);
  };

  function isSlotDisabled(time, available, formData) {
    if (!available) return true;

    const [hour, minute] = time.split(":").map(Number);

    const selectedDate = parseSelectedDate(formData.date); // ίδια helper που ήδη χρησιμοποιείς
    const today = new Date();

    const start = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      hour,
      minute,
      0,
      0
    );

    const selectedIsBeforeToday = toDateOnly(selectedDate) < toDateOnly(today);
    const selectedIsToday =
      toDateOnly(selectedDate).getTime() === toDateOnly(today).getTime();
    const isPastTimeToday =
      selectedIsToday && start.getTime() <= today.getTime();
    const isPast = selectedIsBeforeToday || isPastTimeToday;

    return isPast;
  }

  const selectableSlots = useMemo(() => {
    return allScheduleSlots.filter(({ time, available }) => {
      return !isSlotDisabled(time, available, formData);
    });
  }, [allScheduleSlots, formData.date]);
  // compute selectedDate from formData.date
  const selectedDate = useMemo(() => {
    if (!formData.date) return null;
    return parseSelectedDate(formData.date); // your existing helper
  }, [formData.date]);

  function toDateAtTime(baseDate, hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date(baseDate);
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
  }

  async function findNextDateWithSlots(
    fetchSelectableSlots,
    startDate,
    durationMin,
    maxDaysLookahead = 90
  ) {
    const base = new Date(startDate);
    base.setHours(0, 0, 0, 0);

    for (let offset = 1; offset <= maxDaysLookahead; offset++) {
      const d = new Date(base);
      d.setDate(base.getDate() + offset);

      let slots = await fetchSelectableSlots(d, durationMin);
      if (!Array.isArray(slots)) slots = [];

      // Αν επιστρέφεις strings "HH:MM", κάν' τα Date για ομοιομορφία
      const normalized = slots.map((s) =>
        typeof s === "string" ? toDateAtTime(d, s) : new Date(s)
      );

      // Βεβαιώσου ότι είναι ταξινομημένα
      normalized.sort((a, b) => a - b);

      if (normalized.length > 0) {
        return { date: d, time: normalized[0] }; // πρώτο διαθέσιμο της ημέρας
      }
    }

    return null;
  }
  useEffect(() => {
    let cancelled = false;

    // Μην ξεκινάς πριν επιλεγεί ημερομηνία & διάρκεια
    if (!selectedDate || !resolvedDuration) return;

    // Περιμένουμε να τελειώσει το φόρτωμα των slots της επιλεγμένης μέρας
    if (loadingSlots) return;

    // Αν έχεις slots, καθάρισε τα "επόμενο διαθέσιμο"
    if (selectableSlots.length > 0) {
      setNextAvailableDate(null);
      setNextAvailableTime(null);
      setIsFindingNext(false);
      return;
    }

    // Δεν υπάρχουν slots -> βρες επόμενη μέρα με διαθέσιμα
    (async () => {
      setIsFindingNext(true);
      setNextAvailableDate(null);
      setNextAvailableTime(null);

      const res = await findNextDateWithSlots(
        fetchSelectableSlots, // η δική σου συνάρτηση που φέρνει ΟΛΑ τα slots για μια μέρα
        selectedDate,
        resolvedDuration,
        90 // max μέρες μπροστά
      );

      if (!cancelled) {
        if (res) {
          setNextAvailableDate(res.date);
          setNextAvailableTime(res.time);
        } else {
          setNextAvailableDate(null);
          setNextAvailableTime(null);
        }
        setIsFindingNext(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedDate, resolvedDuration, loadingSlots, selectableSlots.length]);
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#a3895d]" />
      </div>
    );
  }

  const hasDate = Boolean(formData.appointment_date);
  const hasTime = Boolean(formData.appointment_time);

  const isNewPatientValid =
    Boolean(newPatientData.first_name?.trim()) &&
    Boolean(newPatientData.last_name?.trim()) &&
    !errors.amka; // + ό,τι άλλο validation θες

  const hasPatient = newPatientMode
    ? isNewPatientValid
    : Boolean(selectedPatient);

  const isFormValid = isMedicalVisitor
    ? Boolean(visitorName?.trim()) && hasDate && hasTime
    : hasPatient && hasDate && hasTime;

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f9f9f9] px-14 py-22 ">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-2xl p-8 md:p-10 rounded-3xl shadow-lg border border-[#e4dfd4] transition-shadow hover:shadow-xl"
      >
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
            Καταχώρηση Ραντεβού
          </h2>

          {/* Κουμπί κάτω από τον τίτλο */}
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setNewPatientMode(!newPatientMode)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-black text-sm font-medium shadow-sm hover:shadow-md transition-all"
            >
              {newPatientMode ? (
                <>
                  <Users className="w-4 h-4" />
                  Επιλογή Υπάρχοντα Ασθενή
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Νέος Ασθενής
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/appointments/exception")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-black text-sm font-medium shadow-sm hover:shadow-md transition-all"
            >
              <CalendarX className="w-4 h-4" />
              Προσθήκη με Εξαίρεση
            </button>
          </div>
        </div>
        {formData.reason === "Ιατρικός Επισκέπτης" ? (
          <div className="mb-5">
            <label className="block text-sm mb-1 text-gray-600">
              Όνομα Επισκέπτη
            </label>
            <input
              type="text"
              placeholder="π.χ. Αντιπρόσωπος εταιρείας Χ"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              className="px-4 py-2 border border-[#d6d3cb] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#b5aa96] transition w-full"
            />
          </div>
        ) : newPatientMode ? (
          <div className="mb-6 grid grid-cols-1 gap-3">
            {/* πεδία νέου ασθενή */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Όνομα"
                value={newPatientData.first_name}
                onChange={(e) =>
                  setNewPatientData({
                    ...newPatientData,
                    first_name: e.target.value,
                  })
                }
                className="p-2 border border-gray-300 rounded-lg"
                required
              />
              {errors.first_name && (
                <p className="text-sm text-red-600 mt-1">{errors.first_name}</p>
              )}
              <input
                type="text"
                placeholder="Επώνυμο"
                value={newPatientData.last_name}
                onChange={(e) =>
                  setNewPatientData({
                    ...newPatientData,
                    last_name: e.target.value,
                  })
                }
                className="p-2 border border-gray-300 rounded-lg"
                required
              />
              {errors.last_name && (
                <p className="text-sm text-red-600 mt-1">{errors.last_name}</p>
              )}
            </div>
            {/* υπόλοιπα πεδία */}
            <input
              type="text"
              placeholder="Τηλέφωνο"
              value={newPatientData.phone}
              onChange={(e) =>
                setNewPatientData({ ...newPatientData, phone: e.target.value })
              }
              className="p-2 border border-gray-300 rounded-lg"
            />
            {existingPhonePatient && (
              <div className="mt-2 p-3 rounded-md bg-red-50 border border-red-300 text-red-700 text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" />
                <span>
                  Υπάρχει ήδη ασθενής με αυτό το τηλέφωνο:{" "}
                  <strong className="font-semibold">
                    {existingPhonePatient}
                  </strong>
                </span>
              </div>
            )}
            <input
              type="email"
              placeholder="Email"
              value={newPatientData.email}
              onChange={(e) =>
                setNewPatientData({ ...newPatientData, email: e.target.value })
              }
              className="p-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="ΑΜΚΑ"
              value={newPatientData.amka}
              onChange={(e) =>
                setNewPatientData({ ...newPatientData, amka: e.target.value })
              }
              className="p-2 border border-gray-300 rounded-lg"
            />
            {existingAmkaPatient && (
              <div className="mt-2 p-3 rounded-md bg-red-50 border border-red-300 text-red-700 text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" />
                <span>
                  Υπάρχει ήδη ασθενής με αυτό το ΑΜΚΑ:{" "}
                  <strong className="font-semibold">
                    {existingAmkaPatient}
                  </strong>
                </span>
              </div>
            )}

            {errors.amka && (
              <p className="text-sm text-red-600 mt-1">{errors.amka}</p>
            )}
          </div>
        ) : (
          <div className="mb-5">
            <label className="block text-sm mb-1 text-gray-600">
              Αναζήτηση Ασθενή
            </label>
            {/* input αναζήτησης και λίστα */}
            <input
              type="text"
              placeholder="Πληκτρολογήστε ονοματεπώνυμο, ΑΜΚΑ ή τηλέφωνο ασθενούς..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedPatient(null);
              }}
              className="px-4 py-2 border border-[#d6d3cb] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#b5aa96] transition w-full"
            />
            {searchTerm && !selectedPatient && (
              <ul className="mt-2 border rounded-lg max-h-40 overflow-y-auto text-sm bg-white">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <li
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatient(patient);
                        setSearchTerm(
                          `${patient.first_name} ${patient.last_name}`
                        );
                      }}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                    >
                      {patient.first_name} {patient.last_name} ({patient.email})
                      <br />
                      <span className="text-xs text-gray-500">
                        ΑΜΚΑ: {patient.amka} | Τηλ: {patient.phone}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-gray-400">
                    Δεν βρέθηκε ασθενής
                  </li>
                )}
              </ul>
            )}
            {selectedPatient && (
              <p className="mt-2 text-sm text-green-600">
                Επιλέχθηκε:{" "}
                <strong>{`${selectedPatient.first_name} ${selectedPatient.last_name}`}</strong>
              </p>
            )}
          </div>
        )}
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
            <option value="Προσαρμογή">Προσαρμογή (ελεύθερο κείμενο)</option>
          </select>
        </div>
        {/* Ελεύθερο πεδίο αν επιλέχθηκε Προσαρμογή */}
        {formData.reason === "Προσαρμογή" && (
          <div className="mb-5">
            <label className="block text-sm mb-1 text-gray-600">
              Περιγραφή Επίσκεψης
            </label>
            <input
              type="text"
              value={formData.customReason || ""}
              onChange={(e) =>
                setFormData({ ...formData, customReason: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="π.χ. Συνταγογράφηση, Έλεγχος ορμονών κ.λπ."
              required
            />
          </div>
        )}
        {/* Επιλογή Ημερομηνίας */}
        <div className="mb-5">
          <label className="block text-sm mb-1 text-gray-600">Ημερομηνία</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start text-left font-normal ${
                  !formData.reason ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={!formData.reason}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.appointment_date
                  ? format(formData.appointment_date, "dd/MM/yyyy")
                  : "Επιλέξτε ημερομηνία"}
              </Button>
            </PopoverTrigger>
            {formData.reason && (
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  locale={greekLocale}
                  selected={formData.appointment_date}
                  onSelect={(date) =>
                    setFormData({
                      ...formData,
                      appointment_date: date,
                      appointment_time: null,
                    })
                  }
                  disabled={{
                    before: new Date(),
                    after: addMonths(new Date(), 2),
                  }}
                  modifiers={{
                    weekend: (date) => [0, 6].includes(date.getDay()),
                  }}
                  modifiersClassNames={{
                    weekend: "text-gray-400 opacity-60",
                  }}
                  showOutsideDays
                  initialFocus
                />
              </PopoverContent>
            )}
          </Popover>
        </div>

        {/* Διάρκεια Ραντεβού */}
        <div className="mb-5">
          <label className="block text-sm mb-1 text-gray-600">
            Διάρκεια Ραντεβού
          </label>
          <select
            value={formData.duration_minutes}
            onChange={(e) =>
              setFormData({
                ...formData,
                duration_minutes: e.target.value,
                customDuration: "",
              })
            }
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            <option value="15">15 λεπτά</option>
            <option value="30">30 λεπτά</option>
            <option value="45">45 λεπτά</option>
            <option value="60">1 ώρα</option>
            <option value="custom">Προσαρμογή</option>
          </select>
        </div>
        {/* Προσαρμοσμένη διάρκεια */}
        {formData.duration_minutes === "custom" && (
          <div className="mb-5">
            <label className="block text-sm mb-1 text-gray-600">
              Προσαρμοσμένη Διάρκεια (σε λεπτά ≥ 5)
            </label>
            <input
              type="number"
              min="5"
              step="5"
              placeholder="π.χ. 15"
              value={formData.customDuration}
              onChange={(e) =>
                setFormData({ ...formData, customDuration: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
        )}

        {/* Ώρες Διαθεσιμότητας */}
        {formData.appointment_date && resolvedDuration >= 5 && (
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
            ) : hasFullDayException ? (
              <p className="text-red-600 text-sm mt-2">
                Το ιατρείο είναι κλειστό για όλη την ημέρα λόγω εξαίρεσης.
              </p>
            ) : allScheduleSlots.length === 0 ? (
              <p className="text-red-600 text-sm mt-2">
                Εκτός ωραρίου Ιατρείου για την επιλεγμένη ημέρα.
              </p>
            ) : selectableSlots.length === 0 ? (
              <p className="text-red-600 text-sm mt-2">
                Δεν υπάρχει διαθέσιμο ραντεβού για την διάρκεια και ημερομηνία
                που επιλέξατε.
                {isFindingNext ? (
                  <> Αναζήτηση επόμενου διαθέσιμου…</>
                ) : nextAvailableDate ? (
                  <>
                    {" "}
                    Πρώτο διαθέσιμο:{" "}
                    <strong>
                      {format(nextAvailableDate, "dd/MM/yyyy")}
                      {nextAvailableTime
                        ? `, ${format(nextAvailableTime, "HH:mm")}`
                        : ""}
                    </strong>
                  </>
                ) : (
                  <> Δοκιμάστε άλλη ημερομηνία.</>
                )}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {allScheduleSlots.map(({ time, available }) => {
                  const [hour, minute] = time.split(":").map(Number);

                  // selected date (no time)
                  const selectedDate = parseSelectedDate(formData.date);
                  const today = new Date();

                  // slot start = selected date at HH:mm
                  const start = new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    selectedDate.getDate(),
                    hour,
                    minute,
                    0,
                    0
                  );

                  const duration = parseInt(
                    formData.duration_minutes === "custom"
                      ? formData.customDuration
                      : formData.duration_minutes,
                    10
                  );

                  const end = new Date(start.getTime() + duration * 60 * 1000);

                  // Determine if this slot is in the past
                  const selectedIsBeforeToday =
                    toDateOnly(selectedDate) < toDateOnly(today);
                  const selectedIsToday =
                    toDateOnly(selectedDate).getTime() ===
                    toDateOnly(today).getTime();
                  const isPastTimeToday =
                    selectedIsToday && start.getTime() <= today.getTime();
                  const isPast = selectedIsBeforeToday || isPastTimeToday;

                  const disabled = !available || isPast;

                  const endTimeStr = `${String(end.getHours()).padStart(
                    2,
                    "0"
                  )}:${String(end.getMinutes()).padStart(2, "0")}`;

                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => {
                        if (!disabled) {
                          setFormData({ ...formData, appointment_time: time });
                        }
                      }}
                      disabled={disabled}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                        formData.appointment_time === time && !disabled
                          ? "bg-gray-800 text-white"
                          : !disabled
                          ? "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
                          : "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                      }`}
                      title={
                        !available
                          ? "Κλεισμένο ή μη διαθέσιμο"
                          : isPast
                          ? "Η ώρα έχει περάσει"
                          : ""
                      }
                    >
                      {time}–{endTimeStr}
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

        <button
          type="submit"
          disabled={isSubmitting || !isFormValid}
          className={`w-full flex items-center justify-center py-2 rounded-lg transition
    ${
      isSubmitting || !isFormValid
        ? "bg-gray-400 cursor-not-allowed text-white"
        : "bg-gray-800 text-white hover:bg-gray-700"
    }`}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
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
            </>
          ) : (
            "Καταχώρηση Ραντεβού"
          )}
        </button>
        {formData.reason === "Ιατρικός Επισκέπτης" &&
          showVisitorMessage &&
          visitorCount > 0 && (
            <div className="flex items-start gap-3 p-4 mt-4 border border-yellow-300 bg-yellow-50 rounded-xl shadow-sm">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-1" />
              <div className="text-sm text-yellow-800 leading-snug">
                <p className="font-semibold">Προειδοποίηση:</p>
                <p>
                  {visitorCount === 1
                    ? "Έχει ήδη προγραμματιστεί 1 Ιατρικός Επισκέπτης για τον επιλεγμένο μήνα."
                    : `Έχουν ήδη προγραμματιστεί ${visitorCount} Ιατρικοί Επισκέπτες για τον επιλεγμένο μήνα.`}
                </p>
              </div>
            </div>
          )}
      </form>
    </main>
  );
}
