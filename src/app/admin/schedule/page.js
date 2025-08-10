"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "../../lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Clock, Trash2, Pencil } from "lucide-react";
import AdminBackButton from "../../components/AdminBackButton";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [exceptionTime, setExceptionTime] = useState({
    start: "",
    end: "",
    reason: "",
    fullDay: false,
  });
  const [exceptions, setExceptions] = useState([]);
  const [editDay, setEditDay] = useState(null);
  const [editTimes, setEditTimes] = useState({
    start: "",
    end: "",
    period: "",
  });
  const [hasMounted, setHasMounted] = useState(false);
  const [isFullDay, setIsFullDay] = useState(false);
  const router = useRouter();
  const [formError, setFormError] = useState("");

  const [confirmDelete, setConfirmDelete] = useState({ type: null, id: null });
  const [acceptNewAppointments, setAcceptNewAppointments] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const fetchClinicSettings = async () => {
    setSettingsLoading(true);
    const { data, error } = await supabase
      .from("clinic_settings")
      .select("accept_new_appointments")
      .eq("id", 1)
      .single();

    if (!error && data) {
      setAcceptNewAppointments(data.accept_new_appointments);
    }
    setSettingsLoading(false);
  };

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
      // revert safely
      setAcceptNewAppointments((prev) => prev); // or set back to !value if you prefer optimistic strict revert
    }
  };

  useEffect(() => {
    setHasMounted(true);
    fetchSchedule();
    fetchExceptions();
    fetchClinicSettings();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const full = exceptions.some(
        (e) =>
          format(new Date(e.exception_date), "yyyy-MM-dd") ===
            format(selectedDate, "yyyy-MM-dd") &&
          e.start_time === null &&
          e.end_time === null
      );
      setIsFullDay(full);
    }
  }, [selectedDate, exceptions]);

  const fetchSchedule = async () => {
    const { data, error } = await supabase.from("clinic_schedule").select("*");
    if (!error) setWeeklySchedule(data);
  };

  const fetchExceptions = async () => {
    const { data, error } = await supabase
      .from("schedule_exceptions")
      .select("*");
    if (!error) setExceptions(data);
  };

  const updateSchedule = async () => {
    if (editDay === null || !editTimes.start || !editTimes.end) {
      setFormError("Συμπλήρωσε και τις δύο ώρες.");
      return;
    }

    if (editTimes.start >= editTimes.end) {
      setFormError('Η ώρα "Από" πρέπει να είναι μικρότερη από την ώρα "Έως".');
      return;
    }

    // Προαιρετικός έλεγχος για επικάλυψη:
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
        start_time: `${editTimes.start}:00`, // ΜΟΝΟ ΩΡΑ
        end_time: `${editTimes.end}:00`,
      },
    ]);

    if (!error) {
      fetchSchedule();
      setEditDay(null);
      setEditTimes({ start: "", end: "" });
    } else {
      console.error(error);
      setFormError("Σφάλμα κατά την αποθήκευση ωραρίου.");
    }
  };
  // Τελευταίο slot ξεκινά 15' πριν το end_time
  const getAvailableTimeSlots = () => {
    if (!selectedDate || !weeklySchedule.length) return [];

    const selectedWeekday =
      selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
    const daySchedules = weeklySchedule.filter(
      (s) => s.weekday === selectedWeekday
    );

    const filteredSlots = [];

    for (const slot of daySchedules) {
      const start = slot.start_time.slice(0, 5); // π.χ. "10:00"
      const end = slot.end_time.slice(0, 5);

      let [h, m] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);

      // Ορισμός τελευταίου επιτρεπτού slot
      let lastH = eh;
      let lastM = em - 15;
      if (lastM < 0) {
        lastH -= 1;
        lastM += 60;
      }

      const lastValidStart = `${String(lastH).padStart(2, "0")}:${String(
        lastM
      ).padStart(2, "0")}`;

      let current = `${String(h).padStart(2, "0")}:${String(m).padStart(
        2,
        "0"
      )}`;
      while (current <= lastValidStart) {
        filteredSlots.push(current);
        m += 15;
        if (m >= 60) {
          h++;
          m = 0;
        }
        current = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      }
    }

    return filteredSlots;
  };

  const hasFullDayException = (date) => {
    return exceptions.some(
      (e) =>
        format(new Date(e.exception_date), "yyyy-MM-dd") ===
          format(date, "yyyy-MM-dd") &&
        e.start_time === null &&
        e.end_time === null
    );
  };

  const deleteTimeSlot = async (id) => {
    const { error } = await supabase
      .from("clinic_schedule")
      .delete()
      .eq("id", id);
    if (!error) {
      console.log("Το διάστημα διαγράφηκε.");
      fetchSchedule();
    }
  };

  const isFullDayException = (date) => {
    return exceptions.some(
      (e) =>
        format(new Date(e.exception_date), "yyyy-MM-dd") ===
          format(date, "yyyy-MM-dd") &&
        e.start_time === null &&
        e.end_time === null
    );
  };
  const timeSlots = Array.from({ length: 96 }, (_, i) => {
    const hour = String(Math.floor(i / 4)).padStart(2, "0");
    const minute = String((i % 4) * 15).padStart(2, "0");
    return `${hour}:${minute}`;
  });

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

      // Αν υπάρχει ήδη full-day εξαίρεση για τη μέρα → δεν επιτρέπεται άλλη χρονική
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

      // Εύρεση του ωραρίου λειτουργίας για την ημέρα
      const daySchedules = weeklySchedule.filter(
        (s) => s.weekday === selectedWeekday
      );

      const inWorkingHours = daySchedules.some((slot) => {
        const slotStart = slot.start_time?.slice(0, 5); // π.χ. "10:00"
        const slotEnd = slot.end_time?.slice(0, 5);
        return start >= slotStart && end <= slotEnd;
      });

      if (!inWorkingHours) {
        setFormError(
          "Το χρονικό διάστημα είναι εκτός ωραρίου λειτουργίας του ιατρείου."
        );
        return;
      }

      // Έλεγχος για επικάλυψη με ήδη υπάρχουσες χρονικές εξαιρέσεις
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

    const tzOffsetMin = new Date().getTimezoneOffset(); // σε λεπτά
    const offsetHours = String(Math.floor(Math.abs(tzOffsetMin) / 60)).padStart(
      2,
      "0"
    );
    const offsetMins = String(Math.abs(tzOffsetMin) % 60).padStart(2, "0");
    const sign = tzOffsetMin > 0 ? "-" : "+";
    const tz = `${sign}${offsetHours}:${offsetMins}`;
    // Δημιουργία της πλήρους ημερομηνίας με ώρα
    const datePart = format(selectedDate, "yyyy-MM-dd"); // π.χ. "2025-08-01"
    const startTz = new Date(`${datePart}T${exceptionTime.start}:00`);
    const endTz = new Date(`${datePart}T${exceptionTime.end}:00`);

    const payload = {
      exception_date: selectedDateStr,
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
    setFormError("");
    fetchExceptions();
  };

  const deleteException = async (id) => {
    const { error } = await supabase
      .from("schedule_exceptions")
      .delete()
      .eq("id", id);
    if (!error) {
      console.log("Η εξαίρεση διαγράφηκε.");
      fetchExceptions();
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#fafafa] to-[#f1f1f1] py-20 px-6">
      <div className=" gap-4 mb-8">
        <button
          onClick={() => router.push("/admin")}
          className=" py-4 text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2 rounded-full transition-colors duration-200 inline-flex items-center gap-2 "
          title="Επιστροφή στο Dashboard"
        >
          <ArrowLeft size={24} />
          Eπιστροφή
        </button>

        <h1 className="text-3xl font-serif font-semibold text-[#3b3a36] mb-8 text-center">
          Πρόγραμμα Ιατρείου
        </h1>
      </div>
      <div className="mb-4 flex items-center justify-center gap-3 py-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Ηλεκτρονικά ραντεβού
        </h3>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={acceptNewAppointments}
            onChange={(e) => toggleClinicAppointments(e.target.checked)}
            disabled={settingsLoading}
          />
          <div
            className="relative w-12 h-6 rounded-full bg-gray-200 transition-colors
               peer-checked:bg-emerald-600
               peer-checked:[&>span]:translate-x-6"
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow
                 transition-transform translate-x-0"
            />
          </div>
          <span className="ml-2 text-sm text-gray-700">
            {acceptNewAppointments
              ? "Δεχόμαστε νέα ραντεβού"
              : "Δεν δεχόμαστε νέα ραντεβού"}
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl shadow-xl">
          <h2 className="text-lg font-semibold mb-4 text-[#444]">
            Βασικό Εβδομαδιαίο Πρόγραμμα
          </h2>
          <div className="space-y-3">
            {weekdays.map((day, idx) => {
              const actualIdx = (idx + 1) % 7;
              const daySchedules = weeklySchedule.filter(
                (s) => s.weekday === actualIdx
              );
              return (
                <div
                  key={actualIdx}
                  className="border px-4 py-3 rounded-xl bg-[#fbfbfa]"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-700">{day}:</span>
                    <button
                      onClick={() => setEditDay(actualIdx)}
                      className="text-emerald-600 text-sm hover:underline"
                    >
                      + Προσθήκη Ώρας
                    </button>
                  </div>
                  {daySchedules.length > 0 ? (
                    <ul className="space-y-1 ml-2 text-sm text-gray-700">
                      {daySchedules.map((s) => (
                        <li
                          key={s.id}
                          className="flex justify-between items-center"
                        >
                          <span>
                            {s.start_time.slice(0, 5)} -{" "}
                            {s.end_time.slice(0, 5)}
                          </span>
                          <button
                            onClick={() =>
                              setConfirmDelete({ type: "schedule", id: s.id })
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400 text-sm">
                      Δεν έχει οριστεί
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {editDay !== null && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">
                Νέο Διάστημα για: {weekdays[(editDay + 6) % 7]}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Από
                  </label>
                  <select
                    value={editTimes.start}
                    onChange={(e) =>
                      setEditTimes((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-300 transition"
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
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Έως
                  </label>
                  <select
                    value={editTimes.end}
                    onChange={(e) =>
                      setEditTimes((prev) => ({ ...prev, end: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-300 transition"
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
              <div className="mt-4 flex gap-2">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={updateSchedule}
                >
                  Αποθήκευση
                </Button>
                <Button variant="outline" onClick={() => setEditDay(null)}>
                  Άκυρο
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl">
          <h2 className="text-lg font-semibold mb-4 text-[#444] text-center">
            Εξαιρέσεις Ημερολογίου
          </h2>

          <div className="mb-6 flex flex-col items-center">
            <label className="text-sm font-medium mb-2 text-gray-600 text-center">
              Επιλέξτε Ημερομηνία
            </label>
            {hasMounted && (
              <Calendar
                startweekOn={2}
                selected={selectedDate}
                onSelect={setSelectedDate}
                mode="single"
                locale={el}
                weekStartsOn={1}
                disabled={(date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
              />
            )}
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium block mb-1 text-gray-600">
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
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={exceptionTime.fullDay}
                onChange={(e) =>
                  setExceptionTime((prev) => ({
                    ...prev,
                    fullDay: e.target.checked,
                  }))
                }
              />
              <label className="text-sm text-gray-700">
                Μπλοκάρισμα όλης της ημέρας
              </label>
            </div>
            {!exceptionTime.fullDay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Από
                  </label>
                  <select
                    disabled={isFullDay}
                    value={exceptionTime.start}
                    onChange={(e) =>
                      setExceptionTime((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">-- Από --</option>
                    {getAvailableTimeSlots().map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Έως
                  </label>
                  <select
                    disabled={isFullDay}
                    value={exceptionTime.end}
                    onChange={(e) =>
                      setExceptionTime((prev) => ({
                        ...prev,
                        end: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">-- Έως --</option>
                    {getAvailableTimeSlots().map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={addException}
                disabled={
                  isFullDay ||
                  (!exceptionTime.fullDay &&
                    (!exceptionTime.start || !exceptionTime.end))
                }
              >
                Αποθήκευση Εξαίρεσης
              </Button>
            </div>
          </div>
          {formError && (
            <div className="text-red-600 text-sm font-medium bg-red-100 border border-red-300 rounded-lg px-3 py-2">
              {formError}
            </div>
          )}

          {isFullDay && (
            <div className="text-red-600 text-sm mt-2 text-center">
              Έχει ήδη προστεθεί εξαίρεση για όλη την ημέρα. Δεν μπορείτε να
              προσθέσετε νέα εξαίρεση.
            </div>
          )}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Υφιστάμενες εξαιρέσεις
            </h3>
            <ul className="space-y-3">
              {exceptions
                .filter(
                  (e) =>
                    format(new Date(e.exception_date), "yyyy-MM-dd") ===
                    format(selectedDate || new Date(), "yyyy-MM-dd")
                )
                .map((ex) => (
                  <li
                    key={ex.id}
                    className="border border-gray-200 bg-[#f9f9f9] p-4 rounded-xl flex justify-between items-center text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {format(new Date(ex.exception_date), "dd/MM/yyyy")}
                        {ex.start_time && ex.end_time
                          ? ` (${format(
                              new Date(ex.start_time),
                              "HH:mm"
                            )} - ${format(new Date(ex.end_time), "HH:mm")})`
                          : " (όλη η ημέρα)"}
                      </p>
                      {ex.reason && (
                        <p className="text-gray-500 text-xs mt-1">
                          {ex.reason}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setConfirmDelete({ type: "exception", id: ex.id })
                      }
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </div>
        {confirmDelete.id && (
          <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-[90%] max-w-md">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Επιβεβαίωση Διαγραφής
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την{" "}
                {confirmDelete.type === "schedule" ? "ώρα" : "εξαίρεση"}; Αυτή η
                ενέργεια δεν μπορεί να αναιρεθεί.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDelete({ type: null, id: null })}
                >
                  Άκυρο
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={async () => {
                    if (confirmDelete.type === "schedule") {
                      await deleteTimeSlot(confirmDelete.id);
                    } else {
                      await deleteException(confirmDelete.id);
                    }
                    setConfirmDelete({ type: null, id: null });
                  }}
                >
                  Διαγραφή
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
