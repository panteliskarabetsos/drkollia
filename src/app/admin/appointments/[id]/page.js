// app/admin/appointments/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import {
  ArrowLeft,
  UserCircle,
  CalendarDays,
  Clock3,
  FileText,
} from "lucide-react";
import { format } from "date-fns"; // ⬅ NEW

function formatDateTimeEl(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("el-GR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EditAppointmentPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    date: "",
    time: "",
    duration_minutes: 30,
    reason: "",
    notes: "",
  });

  const [patient, setPatient] = useState(null);
  const [status, setStatus] = useState(null);
  const [originalDateTime, setOriginalDateTime] = useState(null);

  // ⬅ NEW: state for slot grid
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [scheduleSlots, setScheduleSlots] = useState([]); // [{time, available}]
  const [hasFullDayException, setHasFullDayException] = useState(false);

  // Fetch appointment + patient
  useEffect(() => {
    if (!id) return;

    const run = async () => {
      // auth check
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          appointment_time,
          duration_minutes,
          reason,
          notes,
          status,
          patients (
            id,
            first_name,
            last_name,
            phone,
            email,
            amka
          )
        `
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error(error);
        setError("Δεν βρέθηκε το ραντεβού.");
        setLoading(false);
        return;
      }

      const dt = new Date(data.appointment_time);

      setForm({
        date: dt.toISOString().slice(0, 10), // YYYY-MM-DD
        time: dt.toTimeString().slice(0, 5), // HH:MM
        duration_minutes: data.duration_minutes || 30,
        reason: data.reason || "",
        notes: data.notes || "",
      });

      setPatient(data.patients || null);
      setStatus(data.status || null);
      setOriginalDateTime(data.appointment_time);
      setLoading(false);
    };

    run();
  }, [id, router, pathname]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // reset time when date changes, so user must re-pick a valid slot
    if (name === "date") {
      setForm((prev) => ({ ...prev, date: value, time: "" }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ⬅ NEW: load available slots when date or duration changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!form.date) {
        setScheduleSlots([]);
        setHasFullDayException(false);
        return;
      }

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setScheduleSlots([]);
        setHasFullDayException(false);
        return;
      }

      setLoadingSlots(true);

      const date = new Date(`${form.date}T00:00:00`);
      const weekday = date.getDay(); // 0=Κυρ

      // 1) clinic_schedule
      const { data: scheduleData, error: scheduleErr } = await supabase
        .from("clinic_schedule")
        .select("start_time, end_time")
        .eq("weekday", weekday);

      if (scheduleErr || !scheduleData || scheduleData.length === 0) {
        setScheduleSlots([]);
        setHasFullDayException(false);
        setLoadingSlots(false);
        return;
      }

      const workingPeriods = scheduleData.map((s) => {
        const [sh, sm, ss] = s.start_time.split(":").map(Number);
        const [eh, em, es] = s.end_time.split(":").map(Number);

        const start = new Date(date);
        start.setHours(sh, sm, ss || 0, 0);
        const end = new Date(date);
        end.setHours(eh, em, es || 0, 0);
        return { start, end };
      });

      // 2) schedule_exceptions
      const { data: exceptions } = await supabase
        .from("schedule_exceptions")
        .select("start_time, end_time")
        .eq("exception_date", format(date, "yyyy-MM-dd"));

      const fullDayException = exceptions?.some(
        (e) => !e.start_time && !e.end_time
      );
      setHasFullDayException(fullDayException);

      const exceptionRanges =
        exceptions?.map((e) => ({
          start: e.start_time ? new Date(e.start_time) : null,
          end: e.end_time ? new Date(e.end_time) : null,
        })) || [];

      // 3) already approved appointments that day (except current)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: booked, error: bookedErr } = await supabase
        .from("appointments")
        .select("id, appointment_time, duration_minutes, status")
        .gte("appointment_time", startOfDay.toISOString())
        .lte("appointment_time", endOfDay.toISOString())
        .eq("status", "approved")
        .neq("id", id);

      if (bookedErr) {
        console.error(bookedErr);
      }

      const bookedSlots = [];
      (booked || []).forEach(({ appointment_time, duration_minutes }) => {
        const start = new Date(appointment_time);
        const slotsCount = Math.ceil((duration_minutes || 30) / 15);
        for (let i = 0; i < slotsCount; i++) {
          const slot = new Date(start);
          slot.setMinutes(start.getMinutes() + i * 15);
          bookedSlots.push(slot.toTimeString().slice(0, 5));
        }
      });

      const duration =
        form.duration_minutes && Number(form.duration_minutes) > 0
          ? Number(form.duration_minutes)
          : 30;

      const allSlots = [];

      workingPeriods.forEach(({ start, end }) => {
        const cursor = new Date(start);
        while (cursor < end) {
          const endSlot = new Date(cursor);
          endSlot.setMinutes(endSlot.getMinutes() + duration);
          if (endSlot > end) break;

          const timeStr = cursor.toTimeString().slice(0, 5);

          const overlapsBooked = bookedSlots.includes(timeStr);
          const overlapsException = exceptionRanges.some((exc) => {
            if (!exc.start || !exc.end) return true;
            return cursor >= exc.start && cursor < exc.end;
          });

          const now = new Date();
          const isToday =
            format(date, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");
          const isPastToday = isToday && cursor.getTime() < now.getTime();

          const available =
            !fullDayException &&
            !overlapsBooked &&
            !overlapsException &&
            !isPastToday;

          allSlots.push({ time: timeStr, available });

          cursor.setMinutes(cursor.getMinutes() + 15);
        }
      });

      setScheduleSlots(allSlots);
      setLoadingSlots(false);
    };

    fetchSlots();
  }, [form.date, form.duration_minutes, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!form.date || !form.time) {
        setError("Συμπληρώστε ημερομηνία και ώρα.");
        setSaving(false);
        return;
      }

      const [hours, minutes] = form.time.split(":").map(Number);
      const finalDate = new Date(form.date);
      finalDate.setHours(hours, minutes, 0, 0);

      const duration = Number(form.duration_minutes) || 30;

      // extra guard overlapping (εκτός τρέχοντος)
      const end = new Date(finalDate.getTime() + duration * 60 * 1000);

      const { data: overlaps, error: overlapErr } = await supabase
        .from("appointments")
        .select("id, appointment_time, duration_minutes")
        .gte(
          "appointment_time",
          new Date(finalDate.getTime() - 60 * 1000).toISOString()
        )
        .lt("appointment_time", end.toISOString())
        .neq("id", id);

      if (overlapErr) throw overlapErr;

      if (overlaps && overlaps.length > 0) {
        setError(
          "Υπάρχει ήδη ραντεβού σε αυτό το διάστημα. Επιλέξτε άλλη ώρα."
        );
        setSaving(false);
        return;
      }

      const { error: updateErr } = await supabase
        .from("appointments")
        .update({
          appointment_time: finalDate.toISOString(),
          duration_minutes: duration,
          reason: form.reason || null,
          notes: form.notes || null,
        })
        .eq("id", id);

      if (updateErr) throw updateErr;

      router.push("/admin/appointments");
    } catch (err) {
      console.error(err);
      setError("Κάτι πήγε στραβά. Δοκιμάστε ξανά.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f4f1]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ddd4c4] border-t-[#3c3428]" />
      </main>
    );
  }

  if (error && !form.date) {
    return (
      <main className="min-h-screen bg-[#f6f4f1] px-4 py-10">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#e4ddd1] bg-white p-6 shadow-sm">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Πίσω
          </button>
          <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        </div>
      </main>
    );
  }

  const isMedicalVisitor = !patient && form.reason === "Ιατρικός Επισκέπτης";

  const statusStyles =
    {
      approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
      scheduled: "bg-amber-50 text-amber-700 border-amber-100",
      cancelled: "bg-red-50 text-red-700 border-red-100",
      rejected: "bg-red-50 text-red-700 border-red-100",
      completed: "bg-sky-50 text-sky-700 border-sky-100",
    }[status] || "bg-gray-50 text-gray-600 border-gray-100";

  const isOffline =
    typeof navigator !== "undefined" ? !navigator.onLine : false;

  return (
    <main className="min-h-screen bg-[#f6f4f1] px-4 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        {/* Back */}
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex w-max items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Πίσω
        </button>

        <div className="overflow-hidden rounded-3xl border border-[#e4ddd1] bg-gradient-to-b from-white to-[#fbf8f2] shadow-sm">
          <div className="flex flex-col gap-8 p-6 md:flex-row md:p-8">
            {/* Patient summary */}
            <aside className="md:w-1/3">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-[#2f2e2b]">
                  Επεξεργασία Ραντεβού
                </h1>
                {status && (
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusStyles}`}
                  >
                    {status}
                  </span>
                )}
              </div>

              <div className="rounded-2xl border border-[#eee6d8] bg-white/80 px-4 py-4 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4eee3] text-[#7b6c59]">
                    <UserCircle className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#9a9387]">
                      Ασθενής
                    </p>
                    <p className="text-sm font-semibold text-[#2f2e2b]">
                      {patient
                        ? `${patient.last_name} ${patient.first_name}`
                        : isMedicalVisitor
                        ? "Ιατρικός Επισκέπτης"
                        : "—"}
                    </p>
                  </div>
                </div>

                {patient && (
                  <dl className="space-y-2 text-xs text-[#5f5a52]">
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#9a9387]">Τηλέφωνο</dt>
                      <dd className="font-medium">{patient.phone || "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#9a9387]">ΑΜΚΑ</dt>
                      <dd className="font-medium">{patient.amka || "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#9a9387]">Email</dt>
                      <dd className="max-w-[180px] truncate font-medium">
                        {patient.email || "—"}
                      </dd>
                    </div>
                  </dl>
                )}

                <div className="mt-4 space-y-1 border-t border-[#f0e8da] pt-3 text-xs text-[#8c857a]">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-[#b0a694]" />
                    <span>
                      Τρέχουσα ημερομηνία ραντεβού:{" "}
                      <span className="font-medium text-[#4b463e]">
                        {formatDateTimeEl(originalDateTime)}
                      </span>
                    </span>
                  </div>
                  {form.reason && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-[#b0a694]" />
                      <span>
                        Λόγος:{" "}
                        <span className="font-medium text-[#4b463e]">
                          {form.reason}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* Form */}
            <section className="md:w-2/3">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Date + Time */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#999084]">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Ημερομηνία
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-[#e1d8ca] bg-white/90 px-3 py-2 text-sm text-[#2f2e2b] shadow-sm outline-none transition focus:border-[#cdbfa8] focus:ring-4 focus:ring-[#e0d4c3]/60"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#999084]">
                      <Clock3 className="h-3.5 w-3.5" />
                      Ώρα
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={form.time}
                      readOnly
                      disabled={!form.date}
                      className="w-full rounded-xl border border-[#e1d8ca] bg-gray-50 px-3 py-2 text-sm text-[#2f2e2b] shadow-sm outline-none"
                    />
                    <p className="mt-1 text-[11px] text-[#8c857a]">
                      Επιλέξτε ώρα από τις διαθέσιμες παρακάτω.
                    </p>
                  </div>
                </div>

                {/* ⬅ NEW: slot grid */}
                {form.date && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-[#999084]">
                      Διαθέσιμες ώρες για {form.duration_minutes} λεπτά
                    </p>

                    {isOffline ? (
                      <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Είστε εκτός σύνδεσης – δεν είναι δυνατός ο έλεγχος
                        διαθεσιμότητας.
                      </p>
                    ) : loadingSlots ? (
                      <div className="flex items-center gap-2 text-xs text-[#7a7267]">
                        <div className="h-4 w-4 animate-spin rounded-full border border-[#ddd4c4] border-t-[#7a7267]" />
                        <span>Φόρτωση διαθέσιμων ωρών...</span>
                      </div>
                    ) : hasFullDayException ? (
                      <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                        Το ιατρείο είναι κλειστό για την επιλεγμένη ημέρα.
                      </p>
                    ) : scheduleSlots.length === 0 ? (
                      <p className="text-xs text-[#8c857a]">
                        Δεν υπάρχουν διαθέσιμες ώρες για τη διάρκεια που
                        επιλέξατε.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
                        {scheduleSlots.map(({ time, available }) => {
                          const [h, m] = time.split(":").map(Number);
                          const baseDate = new Date(`${form.date}T00:00:00`);
                          baseDate.setHours(h, m, 0, 0);
                          const end = new Date(baseDate);
                          end.setMinutes(
                            end.getMinutes() +
                              Number(form.duration_minutes || 30)
                          );
                          const endStr = `${String(end.getHours()).padStart(
                            2,
                            "0"
                          )}:${String(end.getMinutes()).padStart(2, "0")}`;

                          const selected = form.time === time;

                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() =>
                                available &&
                                setForm((prev) => ({ ...prev, time }))
                              }
                              disabled={!available}
                              aria-pressed={
                                selected && available ? "true" : "false"
                              }
                              className={[
                                "inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide transition-all duration-150",
                                available
                                  ? "border-[#e1d8ca] bg-white text-[#3b3630] hover:bg-[#f4eee4] hover:border-[#d1c3aa]"
                                  : "cursor-not-allowed border-dashed border-gray-200 bg-gray-50 text-gray-400",
                                selected && available
                                  ? "border-[#827460] bg-[#f6efe3] text-[#26231e] shadow-[0_6px_14px_rgba(60,50,30,0.18)] ring-2 ring-[#d3c5b0]/80 translate-y-[1px] scale-[1.02]"
                                  : "",
                              ].join(" ")}
                            >
                              {selected && available && (
                                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]" />
                              )}
                              {time}–{endStr}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Duration */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-[#999084]">
                    Διάρκεια (λεπτά)
                  </label>
                  <input
                    type="number"
                    name="duration_minutes"
                    min={5}
                    value={form.duration_minutes}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#e1d8ca] bg-white/90 px-3 py-2 text-sm text-[#2f2e2b] shadow-sm outline-none transition focus:border-[#cdbfa8] focus:ring-4 focus:ring-[#e0d4c3]/60"
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-[#999084]">
                    Λόγος Επίσκεψης
                  </label>
                  <input
                    type="text"
                    name="reason"
                    value={form.reason}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#e1d8ca] bg-white/90 px-3 py-2 text-sm text-[#2f2e2b] shadow-sm outline-none transition focus:border-[#cdbfa8] focus:ring-4 focus:ring-[#e0d4c3]/60"
                    placeholder="π.χ. Εξέταση, Αξιολόγηση αποτελεσμάτων..."
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-[#999084]">
                    Σημειώσεις
                  </label>
                  <textarea
                    name="notes"
                    rows={4}
                    value={form.notes}
                    onChange={handleChange}
                    className="w-full resize-none rounded-xl border border-[#e1d8ca] bg-white/90 px-3 py-2 text-sm text-[#2f2e2b] shadow-sm outline-none transition placeholder:text-[#b1a698] focus:border-[#cdbfa8] focus:ring-4 focus:ring-[#e0d4c3]/60"
                    placeholder="Προσθέστε τυχόν πρόσθετες πληροφορίες..."
                  />
                </div>

                {error && (
                  <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {error}
                  </p>
                )}

                <div className="mt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/admin/appointments")}
                    className="rounded-xl border border-[#e1d8ca] bg-white px-4 py-2 text-sm text-[#3b3630] shadow-sm transition hover:bg-[#f6f1e9]"
                  >
                    Άκυρο
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className={`rounded-xl bg-[#2f2e2b] px-5 py-2 text-sm font-medium text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#d7cfc2]/70 ${
                      saving ? "cursor-wait opacity-70" : "hover:bg-black"
                    }`}
                  >
                    {saving ? "Αποθήκευση..." : "Αποθήκευση Αλλαγών"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
