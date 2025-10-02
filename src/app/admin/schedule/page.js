"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "../../lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Clock, Trash2, ArrowLeft, Plus, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const weekdays = [
  "Δευτέρα",
  "Τρίτη",
  "Τετάρτη",
  "Πέμπτη",
  "Παρασκευή",
  "Σάββατο",
  "Κυριακή",
];

export default function SchedulePage() {
  const router = useRouter();

  // data
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [acceptNewAppointments, setAcceptNewAppointments] = useState(true);

  // ui state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hasMounted, setHasMounted] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // add/edit weekly slot
  const [editDay, setEditDay] = useState(null);
  const [editTimes, setEditTimes] = useState({ start: "", end: "" });

  // add exception
  const [exceptionTime, setExceptionTime] = useState({
    start: "",
    end: "",
    reason: "",
    fullDay: false,
  });
  const [isFullDay, setIsFullDay] = useState(false);

  // dialogs / errors
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState({ type: null, id: null });

  // ----- init -----
  useEffect(() => {
    router.prefetch("/admin");
  }, [router]);

  useEffect(() => {
    setHasMounted(true);
    fetchSchedule();
    fetchExceptions();
    fetchClinicSettings();
  }, []);

  useEffect(() => {
    if (!selectedDate || !exceptions.length) {
      setIsFullDay(false);
      return;
    }
    const full = exceptions.some(
      (e) =>
        format(new Date(e.exception_date), "yyyy-MM-dd") ===
          format(selectedDate, "yyyy-MM-dd") &&
        e.start_time === null &&
        e.end_time === null
    );
    setIsFullDay(full);
  }, [selectedDate, exceptions]);

  // ----- fetchers -----
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

  const fetchSchedule = async () => {
    const { data, error } = await supabase.from("clinic_schedule").select("*");
    if (!error) setWeeklySchedule(data || []);
  };

  const fetchExceptions = async () => {
    const { data, error } = await supabase
      .from("schedule_exceptions")
      .select("*");
    if (!error) setExceptions(data || []);
  };

  // ----- toggle accept appointments -----
  const toggleClinicAppointments = async (value) => {
    setAcceptNewAppointments(value);
    const { error } = await supabase
      .from("clinic_settings")
      .update({
        accept_new_appointments: value,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error) {
      console.error(error);
      // revert if failed
      setAcceptNewAppointments((prev) => !prev);
    }
  };

  // ----- time utils -----
  const toMin = (hhmm) => {
    const [h, m] = (hhmm || "00:00").split(":").map(Number);
    return h * 60 + m;
  };
  const toHHMM = (mins) => {
    const h = String(Math.floor(mins / 60)).padStart(2, "0");
    const m = String(mins % 60).padStart(2, "0");
    return `${h}:${m}`;
  };
  const timeSlots = useMemo(
    () =>
      Array.from({ length: 96 }, (_, i) => {
        const hour = String(Math.floor(i / 4)).padStart(2, "0");
        const minute = String((i % 4) * 15).padStart(2, "0");
        return `${hour}:${minute}`;
      }),
    []
  );

  // working & exception ranges (in minutes)
  const getWorkingRangesForDate = (date, schedule) => {
    const weekday = date.getDay() === 0 ? 7 : date.getDay(); // Sun->7
    return schedule
      .filter((s) => s.weekday === weekday)
      .map((s) => [
        toMin(s.start_time.slice(0, 5)),
        toMin(s.end_time.slice(0, 5)),
      ]);
  };
  const getExceptionRangesForDate = (date, exs) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const sameDay = exs.filter(
      (e) => format(new Date(e.exception_date), "yyyy-MM-dd") === dateStr
    );
    const fullDay = sameDay.some(
      (e) => e.start_time === null && e.end_time === null
    );
    if (fullDay) return [[0, 24 * 60]];
    return sameDay
      .filter((e) => e.start_time && e.end_time)
      .map((e) => {
        const st = new Date(e.start_time);
        const en = new Date(e.end_time);
        return [
          st.getHours() * 60 + st.getMinutes(),
          en.getHours() * 60 + en.getMinutes(),
        ];
      });
  };
  const subtractRanges = (workingRanges, exceptionRanges) => {
    if (!exceptionRanges.length) return workingRanges.slice();
    let result = workingRanges.slice();
    for (const [exS, exE] of exceptionRanges) {
      const next = [];
      for (const [wS, wE] of result) {
        if (exE <= wS || exS >= wE) {
          next.push([wS, wE]); // no overlap
          continue;
        }
        if (exS > wS) next.push([wS, Math.max(wS, exS)]); // left keep
        if (exE < wE) next.push([Math.min(wE, exE), wE]); // right keep
      }
      result = next.filter(([a, b]) => b - a >= 15);
    }
    return result;
  };

  // available start/end for exceptions
  const getAvailableExceptionStartTimes = () => {
    if (!selectedDate || !weeklySchedule.length) return [];
    const working = getWorkingRangesForDate(selectedDate, weeklySchedule);
    if (!working.length) return [];
    const exRanges = getExceptionRangesForDate(selectedDate, exceptions);
    const freeRanges = subtractRanges(working, exRanges);
    const starts = [];
    for (const [s, e] of freeRanges) {
      for (let m = s; m <= e - 15; m += 15) starts.push(toHHMM(m));
    }
    return starts;
  };
  const getAvailableExceptionEndTimes = (selectedStartHHMM) => {
    if (!selectedDate || !weeklySchedule.length) return [];
    const working = getWorkingRangesForDate(selectedDate, weeklySchedule);
    if (!working.length) return [];
    const exRanges = getExceptionRangesForDate(selectedDate, exceptions);
    const freeRanges = subtractRanges(working, exRanges);
    const endTimes = [];
    const startMin = selectedStartHHMM ? toMin(selectedStartHHMM) : null;

    for (const [s, e] of freeRanges) {
      let m = Math.max(s + 15, startMin !== null ? startMin + 15 : s + 15);
      for (; m <= e; m += 15) endTimes.push(toHHMM(m));
    }
    const filtered =
      startMin !== null
        ? endTimes.filter((t) => toMin(t) > startMin)
        : endTimes;
    return Array.from(new Set(filtered));
  };

  // ----- actions -----
  const updateSchedule = async () => {
    setFormError("");
    if (editDay === null || !editTimes.start || !editTimes.end) {
      setFormError("Συμπλήρωσε και τις δύο ώρες.");
      return;
    }
    if (editTimes.start >= editTimes.end) {
      setFormError('Η ώρα "Από" πρέπει να είναι μικρότερη από την ώρα "Έως".');
      return;
    }
    const overlaps = weeklySchedule
      .filter((s) => s.weekday === editDay)
      .some((s) => {
        const sStart = s.start_time.slice(0, 5);
        const sEnd = s.end_time.slice(0, 5);
        return editTimes.start < sEnd && editTimes.end > sStart;
      });
    if (overlaps) {
      setFormError("Το νέο διάστημα επικαλύπτεται με υπάρχον διάστημα.");
      return;
    }

    const { error } = await supabase.from("clinic_schedule").insert([
      {
        weekday: editDay,
        start_time: `${editTimes.start}:00`,
        end_time: `${editTimes.end}:00`,
      },
    ]);
    if (error) {
      console.error(error);
      setFormError("Σφάλμα κατά την αποθήκευση ωραρίου.");
      return;
    }
    await fetchSchedule();
    setEditDay(null);
    setEditTimes({ start: "", end: "" });
  };

  const deleteTimeSlot = async (id) => {
    const { error } = await supabase
      .from("clinic_schedule")
      .delete()
      .eq("id", id);
    if (!error) fetchSchedule();
  };

  const addException = async () => {
    setFormError("");

    if (!selectedDate) {
      setFormError("Δεν έχει επιλεγεί ημερομηνία.");
      return;
    }

    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
    const selectedWeekday =
      selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();

    if (!exceptionTime.fullDay) {
      const { start, end } = exceptionTime;

      const fullDayExists = exceptions.some(
        (e) =>
          format(new Date(e.exception_date), "yyyy-MM-dd") ===
            selectedDateStr &&
          e.start_time === null &&
          e.end_time === null
      );
      if (fullDayExists) {
        setFormError(
          "Υπάρχει ήδη εξαίρεση για όλη την ημέρα. Δεν μπορείτε να προσθέσετε άλλη εξαίρεση με ώρες."
        );
        return;
      }
      if (!start || !end) {
        setFormError("Συμπληρώστε και τις δύο ώρες.");
        return;
      }
      if (start >= end) {
        setFormError(
          'Η ώρα "Από" πρέπει να είναι μικρότερη από την ώρα "Έως".'
        );
        return;
      }

      const daySchedules = weeklySchedule.filter(
        (s) => s.weekday === selectedWeekday
      );
      const inWorkingHours = daySchedules.some((slot) => {
        const slotStart = slot.start_time?.slice(0, 5);
        const slotEnd = slot.end_time?.slice(0, 5);
        return start >= slotStart && end <= slotEnd;
      });
      if (!inWorkingHours) {
        setFormError(
          "Το χρονικό διάστημα είναι εκτός ωραρίου λειτουργίας του ιατρείου."
        );
        return;
      }

      const overlaps = exceptions.some((ex) => {
        const sameDay =
          format(new Date(ex.exception_date), "yyyy-MM-dd") === selectedDateStr;
        if (!sameDay || ex.start_time === null || ex.end_time === null)
          return false;

        const exStart = new Date(ex.start_time);
        const exEnd = new Date(ex.end_time);
        const newStart = new Date(`${selectedDateStr}T${start}:00`);
        const newEnd = new Date(`${selectedDateStr}T${end}:00`);

        return newStart < exEnd && newEnd > exStart;
      });
      if (overlaps) {
        setFormError(
          "Το χρονικό διάστημα επικαλύπτεται με υπάρχουσα εξαίρεση."
        );
        return;
      }
    }

    const datePart = format(selectedDate, "yyyy-MM-dd");
    const startTz = exceptionTime.start
      ? new Date(`${datePart}T${exceptionTime.start}:00`)
      : null;
    const endTz = exceptionTime.end
      ? new Date(`${datePart}T${exceptionTime.end}:00`)
      : null;

    const payload = {
      exception_date: datePart,
      start_time: exceptionTime.fullDay ? null : startTz.toISOString(),
      end_time: exceptionTime.fullDay ? null : endTz.toISOString(),
      reason: exceptionTime.reason || null,
    };

    const { error } = await supabase
      .from("schedule_exceptions")
      .insert([payload]);
    if (error) {
      console.error(error);
      setFormError("Παρουσιάστηκε σφάλμα κατά την αποθήκευση.");
      return;
    }

    setExceptionTime({ start: "", end: "", reason: "", fullDay: false });
    await fetchExceptions();
  };

  const deleteException = async (id) => {
    const { error } = await supabase
      .from("schedule_exceptions")
      .delete()
      .eq("id", id);
    if (!error) fetchExceptions();
  };

  // exceptions for selected date
  const dayExceptions = useMemo(() => {
    const key = format(selectedDate || new Date(), "yyyy-MM-dd");
    return exceptions
      .filter((e) => format(new Date(e.exception_date), "yyyy-MM-dd") === key)
      .sort((a, b) => {
        const as = a.start_time ? new Date(a.start_time).getTime() : 0;
        const bs = b.start_time ? new Date(b.start_time).getTime() : 0;
        return as - bs;
      });
  }, [exceptions, selectedDate]);

  return (
    <main className="py-2 relative min-h-screen bg-gradient-to-b from-stone-50 via-white to-white">
      {/* header */}
      <div className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push("/admin")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Επιστροφή
          </Button>
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
            Πρόγραμμα Ιατρείου
          </h1>
          <div className="w-[116px]" /> {/* spacer */}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* toggle */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          <span className="text-sm font-medium text-stone-700">
            Ηλεκτρονικά ραντεβού
          </span>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={acceptNewAppointments}
              onChange={(e) => toggleClinicAppointments(e.target.checked)}
              disabled={settingsLoading}
            />
            <div className="relative w-12 h-6 rounded-full bg-stone-300 transition peer-checked:bg-emerald-600 peer-checked:[&>span]:translate-x-6">
              <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform" />
            </div>
            <span className="ml-2 text-sm text-stone-700">
              {acceptNewAppointments
                ? "Δεχόμαστε νέα ραντεβού"
                : "Δεν δεχόμαστε νέα ραντεβού"}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly schedule */}
          <section className="rounded-3xl border bg-white shadow-sm">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-base font-semibold text-stone-800">
                Βασικό Εβδομαδιαίο Πρόγραμμα
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Ορίστε τα ωράρια ανά ημέρα. Τα διαστήματα εμφανίζονται ως chips.
              </p>
            </div>
            <div className="px-6 pb-6 space-y-3">
              {weekdays.map((day, idx) => {
                // FIX: Sunday should be 7 (not 0)
                const actualIdx = idx === 6 ? 7 : idx + 1;
                const daySchedules = weeklySchedule
                  .filter((s) => s.weekday === actualIdx)
                  .sort((a, b) => a.start_time.localeCompare(b.start_time));

                return (
                  <div
                    key={actualIdx}
                    className="rounded-xl border bg-stone-50/70 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-stone-800">{day}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditDay(actualIdx)}
                        className="gap-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                      >
                        <Plus className="h-4 w-4" /> Προσθήκη Ώρας
                      </Button>
                    </div>

                    {daySchedules.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {daySchedules.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-sm shadow-sm"
                          >
                            <Clock className="h-3.5 w-3.5 text-stone-500" />
                            {s.start_time.slice(0, 5)} –{" "}
                            {s.end_time.slice(0, 5)}
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDelete({ type: "schedule", id: s.id })
                              }
                              className="ml-1 rounded-full p-1 hover:bg-stone-100"
                              title="Διαγραφή"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-stone-500">
                        Δεν έχει οριστεί
                      </p>
                    )}

                    {/* inline add form for selected day */}
                    {editDay === actualIdx && (
                      <div className="mt-4 rounded-xl border bg-white p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-stone-600 mb-1">
                              Από
                            </label>
                            <select
                              value={editTimes.start}
                              onChange={(e) =>
                                setEditTimes((p) => ({
                                  ...p,
                                  start: e.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                            >
                              <option value="">-- Από --</option>
                              {timeSlots.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-stone-600 mb-1">
                              Έως
                            </label>
                            <select
                              value={editTimes.end}
                              onChange={(e) =>
                                setEditTimes((p) => ({
                                  ...p,
                                  end: e.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                            >
                              <option value="">-- Έως --</option>
                              {timeSlots.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {formError && (
                          <div className="mt-3">
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{formError}</AlertDescription>
                            </Alert>
                          </div>
                        )}

                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={updateSchedule}
                          >
                            Αποθήκευση
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditDay(null);
                              setEditTimes({ start: "", end: "" });
                              setFormError("");
                            }}
                          >
                            Άκυρο
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Exceptions */}
          <section className="rounded-3xl border bg-white shadow-sm">
            <div className="px-6 pt-6">
              <h2 className="text-base font-semibold text-stone-800 text-center">
                Εξαιρέσεις Ημερολογίου
              </h2>
              <p className="mt-1 text-xs text-stone-500 text-center">
                Επιλέξτε ημερομηνία και ορίστε χρονικά μπλοκαρίσματα ή ολόκληρη
                ημέρα.
              </p>
            </div>

            <div className="px-6 pb-6">
              <div className="mt-4 grid place-items-center">
                {hasMounted && (
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={el}
                    // block past days
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    className="rounded-xl border bg-white"
                  />
                )}
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="text-sm font-medium block mb-1 text-stone-700">
                    Σημείωση
                  </label>
                  <input
                    type="text"
                    value={exceptionTime.reason}
                    onChange={(e) =>
                      setExceptionTime((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    placeholder="π.χ. Επαγγελματική υποχρέωση"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="fullDay"
                    type="checkbox"
                    checked={exceptionTime.fullDay}
                    onChange={(e) =>
                      setExceptionTime((prev) => ({
                        ...prev,
                        fullDay: e.target.checked,
                        // reset hours when toggling
                        start: "",
                        end: "",
                      }))
                    }
                    className="h-4 w-4"
                  />
                  <label htmlFor="fullDay" className="text-sm text-stone-700">
                    Μπλοκάρισμα όλης της ημέρας
                  </label>
                </div>

                {!exceptionTime.fullDay && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Από
                      </label>
                      <select
                        disabled={isFullDay}
                        value={exceptionTime.start}
                        onChange={(e) =>
                          setExceptionTime((prev) => ({
                            ...prev,
                            start: e.target.value,
                            end: "",
                          }))
                        }
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-50"
                      >
                        <option value="">-- Από --</option>
                        {getAvailableExceptionStartTimes().map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Έως
                      </label>
                      <select
                        disabled={isFullDay || !exceptionTime.start}
                        value={exceptionTime.end}
                        onChange={(e) =>
                          setExceptionTime((prev) => ({
                            ...prev,
                            end: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-50"
                      >
                        <option value="">-- Έως --</option>
                        {getAvailableExceptionEndTimes(exceptionTime.start).map(
                          (t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                )}

                {formError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}

                {isFullDay && (
                  <p className="text-sm text-rose-700">
                    Υπάρχει ήδη εξαίρεση για όλη την ημέρα. Δεν μπορείτε να
                    προσθέσετε νέα εξαίρεση με ώρες.
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={addException}
                    disabled={
                      isFullDay ||
                      (!exceptionTime.fullDay &&
                        (!exceptionTime.start || !exceptionTime.end))
                    }
                  >
                    Αποθήκευση Εξαίρεσης
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setExceptionTime({
                        start: "",
                        end: "",
                        reason: "",
                        fullDay: false,
                      })
                    }
                  >
                    Καθαρισμός
                  </Button>
                </div>

                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-stone-700 mb-2">
                    Εξαιρέσεις ημέρας
                  </h3>
                  {dayExceptions.length === 0 ? (
                    <p className="text-sm text-stone-500">
                      Δεν υπάρχουν εξαιρέσεις για τη μέρα.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {dayExceptions.map((ex) => (
                        <li
                          key={ex.id}
                          className="flex items-center justify-between rounded-xl border bg-stone-50/70 px-4 py-3 text-sm"
                        >
                          <div>
                            <div className="font-medium text-stone-800">
                              {format(
                                new Date(ex.exception_date),
                                "dd/MM/yyyy"
                              )}
                              {ex.start_time && ex.end_time
                                ? ` (${format(
                                    new Date(ex.start_time),
                                    "HH:mm"
                                  )} - ${format(
                                    new Date(ex.end_time),
                                    "HH:mm"
                                  )})`
                                : " (όλη η ημέρα)"}
                            </div>
                            {ex.reason && (
                              <div className="text-xs text-stone-600 mt-0.5">
                                {ex.reason}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDelete({ type: "exception", id: ex.id })
                            }
                            className="rounded-full p-1 hover:bg-stone-100"
                            title="Διαγραφή"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Confirm delete dialog */}
      <Dialog
        open={!!confirmDelete.id}
        onOpenChange={(o) => !o && setConfirmDelete({ type: null, id: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Επιβεβαίωση Διαγραφής</DialogTitle>
            <DialogDescription>
              Θα διαγραφεί αυτή η{" "}
              {confirmDelete.type === "schedule"
                ? "εγγραφή ωραρίου"
                : "εξαίρεση"}
              . Η ενέργεια δεν μπορεί να αναιρεθεί.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete({ type: null, id: null })}
            >
              Άκυρο
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (confirmDelete.type === "schedule")
                  await deleteTimeSlot(confirmDelete.id);
                else await deleteException(confirmDelete.id);
                setConfirmDelete({ type: null, id: null });
              }}
            >
              Διαγραφή
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
