// admin/appointments/new/page.js
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { db } from "../../../../lib/db";
import {
  createAppointment,
  syncAppointments,
} from "../../../../lib/offlineAppointments";

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
  Mail,
} from "lucide-react";
import { el } from "date-fns/locale";
import offlineAuth from "@/lib/offlineAuth";

function normalizeGreekText(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function NewAppointmentPage() {
  const pathname = usePathname();
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
  const [online, setOnline] = useState(true);
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
  const redirectedRef = useRef(false);
  const [authChecked, setAuthChecked] = useState(false);
  const isMedicalVisitor = formData.reason === "Ιατρικός Επισκέπτης";
  const [visitorName, setVisitorName] = useState("");
  const [sendConfirmationEmail, setSendConfirmationEmail] = useState(true);

  const greekLocale = {
    ...el,
    options: {
      ...el.options,
      weekStartsOn: 1,
    },
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      const onlineNow =
        typeof navigator === "undefined" ? true : navigator.onLine;
      const { data } = await supabase.auth.getSession();
      const sess = data?.session || null;
      const hasOffline = !!offlineAuth?.hasActiveSession?.();

      if (!sess && !hasOffline) {
        if (onlineNow && !redirectedRef.current) {
          redirectedRef.current = true;
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
        if (alive) {
          setAuthChecked(true);
          setLoading(false);
        }
        return;
      }

      if (alive) {
        setSession(sess || { user: { id: "offline-user" } });
        setAuthChecked(true);
        setLoading(false);

        if (onlineNow) {
          try {
            localStorage.setItem("lastAdminPath", pathname);
          } catch {}
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [router, pathname]);

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!navigator.onLine) {
        setAvailableSlots([]);
        setAllScheduleSlots([]);
        setHasFullDayException(false);
        setLoadingSlots(false);
        return;
      }
      if (!formData.appointment_date) return;
      setLoadingSlots(true);
      const date = formData.appointment_date;
      const weekday = date.getDay();

      const { data: scheduleData } = await supabase
        .from("clinic_schedule")
        .select("start_time, end_time")
        .eq("weekday", weekday);
      console.log("clinic_schedule:", scheduleData);

      if (!scheduleData || scheduleData.length === 0) {
        setAvailableSlots([]);
        setAllScheduleSlots([]);
        setHasFullDayException(false);
        setLoadingSlots(false);
        return;
      }
      setHasFullDayException(hasFullDayException);

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

      const { data: exceptions } = await supabase
        .from("schedule_exceptions")
        .select("start_time, end_time")
        .eq("exception_date", format(date, "yyyy-MM-dd"));

      const exceptionRanges =
        exceptions?.map((e) => ({
          start: e.start_time ? new Date(e.start_time) : null,
          end: e.end_time ? new Date(e.end_time) : null,
        })) || [];

      const fullDayException = exceptions?.some(
        (e) => !e.start_time && !e.end_time
      );
      setHasFullDayException(fullDayException);

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

      const bookedSlotsArr = [];
      booked.forEach(({ appointment_time, duration_minutes }) => {
        const start = new Date(appointment_time);
        const slotsCount = Math.ceil(duration_minutes / 15);
        for (let i = 0; i < slotsCount; i++) {
          const slot = new Date(start);
          slot.setMinutes(start.getMinutes() + i * 15);
          bookedSlotsArr.push(slot.toTimeString().slice(0, 5));
        }
      });

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

          const overlapsBooked = bookedSlotsArr.includes(timeStr);
          const overlapsException = exceptionRanges.some((exc) => {
            if (!exc.start || !exc.end) return true;
            return cursor >= new Date(exc.start) && cursor < new Date(exc.end);
          });

          const now = new Date();
          const isPastToday =
            format(date, "yyyy-MM-dd") === format(now, "yyyy-MM-dd") &&
            cursor.getTime() < now.getTime();

          const available =
            !overlapsBooked && !overlapsException && !isPastToday;

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
    hasFullDayException,
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
    allScheduleSlots,
  ]);

  useEffect(() => {
    const fetchPatients = async () => {
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from("patients")
          .select("id, first_name, last_name, email, amka, phone")
          .order("last_name", { ascending: true })
          .order("first_name", { ascending: true });

        if (!error) {
          setPatients(data || []);
          await db.patients.bulkPut(
            (data || []).map((p) => ({
              ...p,
              updated_at: new Date().toISOString(),
            }))
          );
        }
      } else {
        const rows = await db.patients.orderBy("last_name").toArray();
        setPatients(rows || []);
      }
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!formData.appointment_date) return;
      if (!navigator.onLine) return;
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
      setVisitorName((v) => v);
    }
  }, [isMedicalVisitor]);

  const handleCancel = () => {
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

    router.push("/admin/appointments");
  };

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    const onOnline = () => syncAppointments().catch(() => {});
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  const [existingAmkaPatient, setExistingAmkaPatient] = useState(null);

  useEffect(() => {
    const checkAmka = async () => {
      const trimmedAmka = newPatientData.amka?.trim();
      if (!trimmedAmka || trimmedAmka.length < 6) {
        setExistingAmkaPatient(null);
        return;
      }

      const { data } = await supabase
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

      const { data } = await supabase
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
      const isMedicalVisitorLocal = formData.reason === "Ιατρικός Επισκέπτης";

      const duration =
        formData.duration_minutes === "custom"
          ? parseInt(formData.customDuration || "", 10)
          : parseInt(formData.duration_minutes, 10);

      if (!Number.isFinite(duration) || duration <= 0) {
        toast.error("Η διάρκεια του ραντεβού δεν είναι έγκυρη.");
        return;
      }

      if (!formData.appointment_date || !formData.appointment_time) {
        toast.error("Πρέπει να συμπληρωθούν Ημερομηνία και Ώρα.");
        return;
      }

      const [hour, minute] = formData.appointment_time.split(":").map(Number);
      const combinedDate = new Date(formData.appointment_date);
      combinedDate.setHours(hour, minute, 0, 0);

      if (isMedicalVisitorLocal) {
        const visitor =
          (typeof visitorName !== "undefined" ? visitorName : searchTerm) || "";
        const visitorTrimmed = visitor.trim();

        if (!visitorTrimmed) {
          toast.error("Πρέπει να συμπληρωθεί το Όνομα Επισκέπτη.");
          return;
        }

        const payload = {
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
          is_exception: false,
        };

        await createAppointment(payload);
        toast.success(
          navigator.onLine
            ? "✅ Το ραντεβού καταχωρήθηκε."
            : "✅ Το ραντεβού αποθηκεύτηκε τοπικά. Θα συγχρονιστεί όταν είστε online."
        );
        router.push("/admin/appointments");
        return;
      }

      let patientId = selectedPatient?.id;
      let email = null;
      let name = "";

      if (newPatientMode && !navigator.onLine) {
        toast.error(
          "Δεν είναι δυνατή η δημιουργία νέου ασθενή χωρίς σύνδεση. Επιλέξτε υπάρχοντα ασθενή ή δοκιμάστε αργότερα."
        );
        return;
      }

      if (newPatientMode) {
        const trimmedAmka = newPatientData.amka?.trim();
        if (trimmedAmka) {
          const { data: existingAmka } = await supabase
            .from("patients")
            .select("id")
            .eq("amka", trimmedAmka)
            .single();

          if (existingAmka) {
            toast.error("Υπάρχει ήδη ασθενής με αυτό το ΑΜΚΑ.");
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
          toast.error("Σφάλμα κατά την καταχώρηση νέου ασθενή.");
          return;
        }

        patientId = data[0].id;
        email = newPatientData.email || null;
        name = `${newPatientData.first_name} ${newPatientData.last_name}`;
      } else {
        email = selectedPatient?.email || null;
        name = selectedPatient
          ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
          : "";
      }

      if (!patientId) {
        toast.error("Πρέπει να επιλεγεί/καταχωρηθεί ασθενής.");
        return;
      }

      const payload = {
        patient_id: patientId,
        appointment_time: combinedDate.toISOString(),
        duration_minutes: duration,
        notes: formData.notes || null,
        reason:
          formData.reason === "Προσαρμογή" && formData.customReason?.trim()
            ? formData.customReason.trim()
            : formData.reason,
        status: "approved",
        is_exception: false,
      };

      await createAppointment(payload);

      toast.success(
        navigator.onLine
          ? "✅ Το ραντεβού καταχωρήθηκε."
          : "✅ Το ραντεβού αποθηκεύτηκε τοπικά. Θα συγχρονιστεί όταν είστε online."
      );

      if (navigator.onLine && email && sendConfirmationEmail) {
        try {
          await fetch("/api/send-confirmation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              name,
              date: formData.appointment_date.toISOString(),
              time: formData.appointment_time,
              reason:
                formData.reason === "Προσαρμογή" &&
                formData.customReason?.trim()
                  ? formData.customReason.trim()
                  : formData.reason,
            }),
          });
        } catch (_) {}
      }

      router.push("/admin/appointments");
    } catch (err) {
      console.error("Σφάλμα:", err);
      toast.error("Προέκυψε σφάλμα.");
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

  const findNextAvailableDate = async (startDate, duration) => {
    if (!navigator.onLine) {
      setNextAvailableDate(null);
      return;
    }
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

      const bookedSlotsArr = [];
      booked.forEach(({ appointment_time, duration_minutes }) => {
        const start = new Date(appointment_time);
        const slotsCount = Math.ceil(duration_minutes / 15);
        for (let i = 0; i < slotsCount; i++) {
          const slot = new Date(start);
          slot.setMinutes(start.getMinutes() + i * 15);
          bookedSlotsArr.push(slot.toTimeString().slice(0, 5));
        }
      });

      for (const { start, end } of workingPeriods) {
        const cursor = new Date(start);
        while (cursor < end) {
          const endSlot = new Date(cursor);
          endSlot.setMinutes(endSlot.getMinutes() + duration);
          if (endSlot > end) break;

          const timeStr = cursor.toTimeString().slice(0, 5);

          const overlapsBooked = bookedSlotsArr.includes(timeStr);
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="h-12 w-12 animate-spin rounded-full border-b-4 border-t-4 border-emerald-500" />
      </div>
    );
  }

  const hasDate = Boolean(formData.appointment_date);
  const hasTime = Boolean(formData.appointment_time);
  const resolvedDuration =
    formData.duration_minutes === "custom"
      ? parseInt(formData.customDuration || "", 10)
      : parseInt(formData.duration_minutes || "", 10);

  const isNewPatientValid =
    Boolean(newPatientData.first_name?.trim()) &&
    Boolean(newPatientData.last_name?.trim()) &&
    !errors.amka;

  const hasPatient = newPatientMode
    ? isNewPatientValid
    : Boolean(selectedPatient);

  const isFormValid = isMedicalVisitor
    ? Boolean(visitorName?.trim()) && hasDate && hasTime
    : hasPatient && hasDate && hasTime;

  const baseInputClass =
    "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400";
  const canSendConfirmationEmail =
    !isMedicalVisitor &&
    (newPatientMode
      ? !!newPatientData.email?.trim()
      : !!selectedPatient?.email?.trim());

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-zinc-50 to-emerald-50 px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-4xl">
        {!online && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 shadow-sm">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Εργάζεστε εκτός σύνδεσης</p>
              <p className="mt-1 text-xs text-amber-900/90 sm:text-[13px]">
                Μπορείτε να δημιουργήσετε ραντεβού· θα συγχρονιστούν αυτόματα
                μόλις επανέλθει η σύνδεση.
              </p>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="relative w-full space-y-8 rounded-3xl border border-emerald-100/80 bg-white/95 px-5 py-7 shadow-[0_22px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-7 sm:py-8 md:px-10 md:py-10"
        >
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-zinc-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
                aria-label="Επιστροφή"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-500">
                  Νέο ραντεβού
                </p>
                <h1 className="mt-1 font-serif text-2xl font-semibold text-emerald-950 sm:text-3xl">
                  Καταχώρηση ραντεβού
                </h1>
                <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
                  Συμπληρώστε τα στοιχεία του ασθενή και τις λεπτομέρειες του
                  ραντεβού.
                </p>
              </div>
            </div>

            <div className="mt-1 flex items-center gap-2 sm:mt-0">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                  online
                    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    online ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                {online ? "Συνδεδεμένο" : "Εκτός σύνδεσης"}
              </span>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
              ΤΥΠΟΣ ΡΑΝΤΕΒΟΥ
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                disabled={!online}
                type="button"
                onClick={() => setNewPatientMode(!newPatientMode)}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium shadow-sm transition sm:text-sm
                  ${
                    newPatientMode
                      ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300 hover:bg-emerald-50"
                  }
                  ${!online ? "cursor-not-allowed opacity-60" : ""}
                `}
              >
                {newPatientMode ? (
                  <>
                    <Users className="h-4 w-4" />
                    Υπάρχων ασθενής
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Νέος ασθενής
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={!online}
                onClick={() => router.push("/admin/appointments/exception")}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium shadow-sm transition sm:text-sm
                  ${
                    online
                      ? "border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300 hover:bg-emerald-50"
                      : "cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400 opacity-60"
                  }
                `}
              >
                <CalendarX className="h-4 w-4" />
                Προσθήκη με εξαίρεση
              </button>
            </div>
          </div>

          {/* Main grid */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.3fr)]">
            {/* Left column: patient + appointment details */}
            <div className="space-y-6">
              {/* PATIENT SECTION */}
              <section className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-4 shadow-sm sm:px-5 sm:py-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-500">
                      Ασθενής
                    </p>
                    <h2 className="text-sm font-semibold text-emerald-950">
                      Στοιχεία ασθενή
                    </h2>
                  </div>
                  {isMedicalVisitor && (
                    <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-700">
                      Ιατρικός επισκέπτης
                    </span>
                  )}
                  {selectedPatient && !newPatientMode && !isMedicalVisitor && (
                    <span className="hidden items-center rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-medium text-emerald-800 sm:inline-flex">
                      Επιλέχθηκε:{" "}
                      <span className="ml-1 font-semibold">
                        {selectedPatient.first_name} {selectedPatient.last_name}
                      </span>
                    </span>
                  )}
                </div>

                {/* Variants */}
                {formData.reason === "Ιατρικός Επισκέπτης" ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-emerald-900">
                      Όνομα επισκέπτη
                    </label>
                    <input
                      type="text"
                      placeholder="π.χ. Αντιπρόσωπος εταιρείας Χ"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      className={baseInputClass}
                    />
                    <p className="text-[11px] text-emerald-900/70">
                      Πληκτρολογήστε το όνομα ή την εταιρεία του ιατρικού
                      επισκέπτη.
                    </p>
                  </div>
                ) : newPatientMode ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-emerald-900">
                          Όνομα
                        </label>
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
                          className={baseInputClass}
                          required
                        />
                        {errors.first_name && (
                          <p className="mt-1 text-xs text-rose-600">
                            {errors.first_name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-emerald-900">
                          Επώνυμο
                        </label>
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
                          className={baseInputClass}
                          required
                        />
                        {errors.last_name && (
                          <p className="mt-1 text-xs text-rose-600">
                            {errors.last_name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-emerald-900">
                          Τηλέφωνο
                        </label>
                        <input
                          type="text"
                          placeholder="Τηλέφωνο"
                          value={newPatientData.phone}
                          onChange={(e) =>
                            setNewPatientData({
                              ...newPatientData,
                              phone: e.target.value,
                            })
                          }
                          className={baseInputClass}
                        />
                        {existingPhonePatient && (
                          <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                            <span>
                              Υπάρχει ήδη ασθενής με αυτό το τηλέφωνο:{" "}
                              <strong className="font-semibold">
                                {existingPhonePatient}
                              </strong>
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-emerald-900">
                          Email
                        </label>
                        <input
                          type="email"
                          placeholder="Email"
                          value={newPatientData.email}
                          onChange={(e) =>
                            setNewPatientData({
                              ...newPatientData,
                              email: e.target.value,
                            })
                          }
                          className={baseInputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-emerald-900">
                        ΑΜΚΑ
                      </label>
                      <input
                        type="text"
                        placeholder="ΑΜΚΑ"
                        value={newPatientData.amka}
                        onChange={(e) =>
                          setNewPatientData({
                            ...newPatientData,
                            amka: e.target.value,
                          })
                        }
                        className={baseInputClass}
                      />
                      {existingAmkaPatient && (
                        <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                          <span>
                            Υπάρχει ήδη ασθενής με αυτό το ΑΜΚΑ:{" "}
                            <strong className="font-semibold">
                              {existingAmkaPatient}
                            </strong>
                          </span>
                        </div>
                      )}
                      {errors.amka && (
                        <p className="mt-1 text-xs text-rose-600">
                          {errors.amka}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-xs font-medium text-emerald-900">
                      Αναζήτηση ασθενή
                    </label>
                    <input
                      type="text"
                      placeholder="Ονοματεπώνυμο, ΑΜΚΑ ή τηλέφωνο..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setSelectedPatient(null);
                      }}
                      className={baseInputClass}
                    />
                    {searchTerm && !selectedPatient && (
                      <ul className="mt-2 max-h-52 space-y-1 overflow-y-auto rounded-2xl border border-emerald-100 bg-white p-1 text-sm shadow-sm">
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
                              className="cursor-pointer rounded-xl px-3 py-2 transition hover:bg-emerald-50"
                            >
                              <div className="font-medium text-emerald-950">
                                {patient.first_name} {patient.last_name}
                              </div>
                              <div className="text-[11px] text-zinc-500">
                                {patient.email}
                              </div>
                              <div className="mt-0.5 text-[11px] text-zinc-400">
                                ΑΜΚΑ: {patient.amka || "-"} · Τηλ:{" "}
                                {patient.phone || "-"}
                              </div>
                            </li>
                          ))
                        ) : (
                          <li className="px-3 py-2 text-xs text-zinc-400">
                            Δεν βρέθηκε ασθενής
                          </li>
                        )}
                      </ul>
                    )}
                    {selectedPatient && (
                      <p className="mt-1 text-xs text-emerald-800">
                        Επιλέχθηκε:{" "}
                        <strong>
                          {selectedPatient.first_name}{" "}
                          {selectedPatient.last_name}
                        </strong>
                      </p>
                    )}
                  </div>
                )}
              </section>

              {/* APPOINTMENT DETAILS */}
              <section className="rounded-2xl border border-zinc-100 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
                <div className="mb-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                    Ραντεβού
                  </p>
                  <h2 className="text-sm font-semibold text-zinc-900">
                    Λεπτομέρειες ραντεβού
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Λόγος επίσκεψης */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700">
                      Λόγος επίσκεψης
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
                      className={baseInputClass}
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
                      <option value="Προσαρμογή">
                        Προσαρμογή (ελεύθερο κείμενο)
                      </option>
                    </select>
                  </div>

                  {/* Προσαρμογή λόγου */}
                  {formData.reason === "Προσαρμογή" && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-700">
                        Περιγραφή επίσκεψης
                      </label>
                      <input
                        type="text"
                        value={formData.customReason || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customReason: e.target.value,
                          })
                        }
                        className={baseInputClass}
                        placeholder="π.χ. Συνταγογράφηση, Έλεγχος ορμονών κ.λπ."
                        required
                      />
                    </div>
                  )}

                  {/* Ημερομηνία & διάρκεια */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Ημερομηνία */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-700">
                        Ημερομηνία
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left text-sm font-normal text-zinc-700 shadow-sm hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-50 ${
                              !formData.reason ? "opacity-60" : ""
                            }`}
                            disabled={!formData.reason}
                          >
                            <span className="inline-flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-emerald-500" />
                              {formData.appointment_date
                                ? format(
                                    formData.appointment_date,
                                    "dd/MM/yyyy"
                                  )
                                : "Επιλέξτε ημερομηνία"}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        {formData.reason && (
                          <PopoverContent className="w-auto rounded-2xl border border-zinc-100 bg-white p-0 shadow-lg">
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
                                weekend: (date) =>
                                  [0, 6].includes(date.getDay()),
                              }}
                              modifiersClassNames={{
                                weekend: "text-zinc-400 opacity-60",
                              }}
                              showOutsideDays
                              initialFocus
                            />
                          </PopoverContent>
                        )}
                      </Popover>
                    </div>

                    {/* Διάρκεια */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-700">
                        Διάρκεια ραντεβού
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
                        className={baseInputClass}
                      >
                        <option value="15">15 λεπτά</option>
                        <option value="30">30 λεπτά</option>
                        <option value="45">45 λεπτά</option>
                        <option value="60">1 ώρα</option>
                        <option value="custom">Προσαρμογή</option>
                      </select>
                    </div>
                  </div>

                  {/* Προσαρμοσμένη διάρκεια */}
                  {formData.duration_minutes === "custom" && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-700">
                        Προσαρμοσμένη διάρκεια (σε λεπτά ≥ 5)
                      </label>
                      <input
                        type="number"
                        min="5"
                        step="5"
                        placeholder="π.χ. 15"
                        value={formData.customDuration}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customDuration: e.target.value,
                          })
                        }
                        className={baseInputClass}
                        required
                      />
                    </div>
                  )}

                  {/* Ώρα */}
                  {formData.appointment_date && resolvedDuration >= 5 && (
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <label className="block text-xs font-medium text-zinc-700">
                          Επιλογή ώρας
                        </label>
                        <div className="hidden items-center gap-3 text-[11px] text-zinc-500 sm:flex">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                            <span>Διαθέσιμο</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-zinc-200" />
                            <span>Μη διαθέσιμο</span>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 px-3 py-3 sm:px-3.5 sm:py-3.5">
                        {(() => {
                          const isOnline =
                            typeof navigator !== "undefined"
                              ? navigator.onLine
                              : true;

                          // OFFLINE
                          if (!isOnline) {
                            const timeOpts = Array.from(
                              { length: 96 },
                              (_, i) => {
                                const h = String(Math.floor(i / 4)).padStart(
                                  2,
                                  "0"
                                );
                                const m = String((i % 4) * 15).padStart(2, "0");
                                const startStr = `${h}:${m}`;
                                const [sh, sm] = [Number(h), Number(m)];
                                const start = new Date(
                                  formData.appointment_date
                                );
                                start.setHours(sh, sm, 0, 0);
                                const end = new Date(start);
                                end.setMinutes(
                                  end.getMinutes() + resolvedDuration
                                );
                                const endStr = `${String(
                                  end.getHours()
                                ).padStart(2, "0")}:${String(
                                  end.getMinutes()
                                ).padStart(2, "0")}`;

                                return {
                                  value: startStr,
                                  label: `${startStr}–${endStr}`,
                                };
                              }
                            );

                            return (
                              <>
                                <div className="mb-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] text-amber-900">
                                  Είστε εκτός σύνδεσης — επιλέξτε χειροκίνητα
                                  την ώρα ραντεβού.
                                </div>
                                <select
                                  value={formData.appointment_time || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      appointment_time: e.target.value,
                                    })
                                  }
                                  className={baseInputClass}
                                >
                                  <option value="" disabled>
                                    -- Επιλέξτε ώρα --
                                  </option>
                                  {timeOpts.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </>
                            );
                          }

                          // ONLINE
                          if (loadingSlots) {
                            return (
                              <div className="flex items-center justify-center py-4 text-sm text-zinc-600">
                                <svg
                                  className="h-5 w-5 animate-spin text-emerald-600"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  aria-hidden="true"
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
                                <span className="ml-2">
                                  Φόρτωση διαθέσιμων ωρών...
                                </span>
                              </div>
                            );
                          }

                          if (hasFullDayException) {
                            return (
                              <p className="text-sm text-rose-600">
                                Το ιατρείο είναι κλειστό για όλη την ημέρα λόγω
                                εξαίρεσης.
                              </p>
                            );
                          }

                          if (allScheduleSlots.length === 0) {
                            return (
                              <p className="text-sm text-rose-600">
                                Εκτός ωραρίου ιατρείου για την επιλεγμένη ημέρα.
                              </p>
                            );
                          }

                          if (availableSlots.length === 0) {
                            return (
                              <p className="text-sm text-rose-600">
                                Δεν υπάρχει διαθέσιμο ραντεβού για τη διάρκεια
                                που επιλέξατε.
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
                            );
                          }

                          return (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                              {allScheduleSlots.map(({ time, available }) => {
                                const [h, m] = time.split(":").map(Number);
                                const start = new Date(
                                  formData.appointment_date
                                );
                                start.setHours(h, m, 0, 0);
                                const end = new Date(start);
                                end.setMinutes(
                                  end.getMinutes() + resolvedDuration
                                );
                                const endTimeStr = `${String(
                                  end.getHours()
                                ).padStart(2, "0")}:${String(
                                  end.getMinutes()
                                ).padStart(2, "0")}`;
                                const selected =
                                  formData.appointment_time === time;

                                return (
                                  <button
                                    key={time}
                                    type="button"
                                    onClick={() => {
                                      if (available) {
                                        setFormData({
                                          ...formData,
                                          appointment_time: time,
                                        });
                                      }
                                    }}
                                    disabled={!available}
                                    aria-pressed={
                                      selected && available ? "true" : "false"
                                    }
                                    title={
                                      available
                                        ? ""
                                        : "Κλεισμένο ή μη διαθέσιμο"
                                    }
                                    className={[
                                      "inline-flex items-center justify-center rounded-full border px-3 py-2 text-xs sm:text-sm transition-all",
                                      available
                                        ? "border-zinc-200 bg-white text-zinc-800 hover:border-emerald-300 hover:bg-emerald-50"
                                        : "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400",
                                      selected && available
                                        ? "border-emerald-600 bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600/25"
                                        : "",
                                    ].join(" ")}
                                  >
                                    {time}–{endTimeStr}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Right column: notes, info, submit */}
            <div className="flex flex-col gap-6">
              {/* Notes + info */}
              <section className="flex-1 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-4 shadow-sm sm:px-5 sm:py-5">
                <div className="mb-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-500">
                    Επιπλέον
                  </p>
                  <h2 className="text-sm font-semibold text-emerald-950">
                    Σημειώσεις & ενημέρωση
                  </h2>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-emerald-900">
                    Σημειώσεις
                  </label>
                  <textarea
                    rows={4}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className={`${baseInputClass} resize-none`}
                  />
                  {/* Toggle: αποστολή email επιβεβαίωσης */}
                  {/* Toggle: αποστολή email επιβεβαίωσης */}
                  {/* Toggle: αποστολή email επιβεβαίωσης */}
                  {!isMedicalVisitor && (
                    <div className="mt-4">
                      <button
                        type="button"
                        disabled={!canSendConfirmationEmail}
                        onClick={() => {
                          if (!canSendConfirmationEmail) return;
                          setSendConfirmationEmail((prev) => !prev);
                        }}
                        className={[
                          "flex w-full items-center justify-between gap-4 rounded-3xl border px-4 py-3 text-left shadow-sm transition-all",
                          !canSendConfirmationEmail
                            ? "cursor-not-allowed border-emerald-50 bg-emerald-50/70 opacity-70"
                            : sendConfirmationEmail
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-zinc-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/60",
                        ].join(" ")}
                      >
                        {/* Left: text */}
                        <div className="mr-3 text-xs">
                          <p className="font-medium text-emerald-900">
                            Αποστολή email επιβεβαίωσης
                          </p>
                          <p className="mt-0.5 text-[11px] text-emerald-900/75">
                            {!canSendConfirmationEmail
                              ? "Δεν υπάρχει δηλωμένο email ασθενούς – δεν μπορεί να σταλεί επιβεβαίωση."
                              : sendConfirmationEmail
                              ? "Θα σταλεί email επιβεβαίωσης στον ασθενή μετά την καταχώρηση."
                              : "Δεν θα σταλεί email επιβεβαίωσης μετά την καταχώρηση."}
                          </p>
                        </div>

                        {/* Right: switch */}
                        <span
                          aria-hidden="true"
                          className={[
                            "relative inline-flex h-6 w-11 items-center rounded-full border transition-all",
                            !canSendConfirmationEmail
                              ? "border-emerald-100 bg-emerald-50/70"
                              : sendConfirmationEmail
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-zinc-300 bg-white",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-all",
                              sendConfirmationEmail
                                ? "translate-x-5"
                                : "translate-x-1",
                            ].join(" ")}
                          />
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {formData.reason === "Ιατρικός Επισκέπτης" &&
                  showVisitorMessage &&
                  visitorCount > 0 && (
                    <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900 shadow-sm sm:text-sm">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Προειδοποίηση</p>
                        <p className="mt-1">
                          {visitorCount === 1
                            ? "Έχει ήδη προγραμματιστεί 1 Ιατρικός Επισκέπτης για τον επιλεγμένο μήνα."
                            : `Έχουν ήδη προγραμματιστεί ${visitorCount} Ιατρικοί Επισκέπτες για τον επιλεγμένο μήνα.`}
                        </p>
                      </div>
                    </div>
                  )}
              </section>

              {/* Submit */}
              <div className="space-y-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || !isFormValid}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="mr-2 h-5 w-5 animate-spin text-white"
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
                    "Καταχώρηση ραντεβού"
                  )}
                </Button>
                <p className="text-center text-[11px] text-zinc-400">
                  Τα στοιχεία του ραντεβού μπορούν να τροποποιηθούν αργότερα από
                  τη σελίδα διαχείρισης.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

function combineLocalISO(dateObj, timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(dateObj);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}
