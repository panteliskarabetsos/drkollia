"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { CalendarX, ArrowLeft, Search, PlusCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { el } from "date-fns/locale"; // 👈 NEW

function generateTimeSlots(start, end, intervalMinutes) {
  const times = [];
  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);
  const current = new Date();
  current.setHours(startHour, startMin, 0, 0);

  const endDate = new Date();
  endDate.setHours(endHour, endMin, 0, 0);

  while (current <= endDate) {
    times.push(current.toTimeString().slice(0, 5));
    current.setMinutes(current.getMinutes() + intervalMinutes);
  }

  return times;
}

// 👇 NEW: Greek locale with Monday as first day
const greekLocale = {
  ...el,
  options: {
    ...(el.options || {}),
    weekStartsOn: 1,
  },
};

export default function AddExceptionAppointmentPage() {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    patient_id: "",
    reason: "",
    appointment_time: "",
    duration_minutes: 30,
    notes: "",
  });

  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [isClient, setIsClient] = useState(false);

  const [newPatientMode, setNewPatientMode] = useState(false);
  const [newPatient, setNewPatient] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    amka: "",
  });

  useEffect(() => {
    setIsClient(true);
    setSelectedDate(new Date());
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      return;
    }

    if (newPatientMode) return;

    const fetchMatches = async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name, amka, phone")
        .or(
          `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,amka.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
        )
        .limit(10);

      if (!error) {
        setSearchResults(data ?? []);
      }
    };

    fetchMatches();
  }, [searchTerm, newPatientMode]);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
      }
    };

    checkAuth();

    const fetchPatients = async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name")
        .limit(20);
      if (!error) setPatients(data ?? []);
    };

    fetchPatients();
  }, [router]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleNewPatientChange = (e) => {
    const { name, value } = e.target;
    setNewPatient((prev) => ({
      ...prev,
      [name]:
        name === "phone"
          ? value.replace(/[^\d+ ]/g, "")
          : name === "amka"
          ? value.replace(/\D/g, "")
          : value,
    }));
  };

  async function resolveOrCreatePatient({
    first_name,
    last_name,
    email,
    phone,
    amka,
  }) {
    const clean = {
      first_name: (first_name ?? "").trim(),
      last_name: (last_name ?? "").trim(),
      email: (email ?? "").trim() || null,
      phone: (phone ?? "")
        .replace(/[^\d+ ]/g, "")
        .replace(/\s+/g, " ")
        .trim(),
      amka: (amka ?? "").replace(/\D/g, ""),
    };

    if (!clean.first_name || !clean.last_name || !clean.phone) {
      throw new Error("Απαιτούνται: Όνομα, Επώνυμο, Τηλέφωνο.");
    }

    if (/^\d{11}$/.test(clean.amka)) {
      const { data: existingByAmka, error: findA } = await supabase
        .from("patients")
        .select("id")
        .eq("amka", clean.amka)
        .maybeSingle();
      if (findA) throw findA;
      if (existingByAmka?.id) return existingByAmka.id;

      const { data: createdA, error: insA } = await supabase
        .from("patients")
        .insert([
          {
            first_name: clean.first_name,
            last_name: clean.last_name,
            email: clean.email,
            phone: clean.phone,
            amka: clean.amka,
          },
        ])
        .select("id")
        .single();

      if (insA?.code === "23505") {
        const { data: afterRace, error: refetchErr } = await supabase
          .from("patients")
          .select("id")
          .eq("amka", clean.amka)
          .maybeSingle();
        if (refetchErr) throw refetchErr;
        if (afterRace?.id) return afterRace.id;
      }
      if (insA) throw insA;
      return createdA.id;
    }

    const { data: existingByPhone, error: findP } = await supabase
      .from("patients")
      .select("id")
      .eq("phone", clean.phone)
      .maybeSingle();
    if (findP) throw findP;
    if (existingByPhone?.id) return existingByPhone.id;

    const { data: createdP, error: insP } = await supabase
      .from("patients")
      .insert([
        {
          first_name: clean.first_name,
          last_name: clean.last_name,
          email: clean.email,
          phone: clean.phone,
          amka: null,
        },
      ])
      .select("id")
      .single();
    if (insP) throw insP;
    return createdP.id;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!selectedDate || !selectedTime) {
      setMessage({
        type: "error",
        text: "Παρακαλώ επιλέξτε ημερομηνία και ώρα.",
      });
      setLoading(false);
      return;
    }

    const [hours, minutes] = selectedTime.split(":");
    const finalDate = new Date(selectedDate);
    finalDate.setHours(Number(hours));
    finalDate.setMinutes(Number(minutes));
    finalDate.setSeconds(0);
    finalDate.setMilliseconds(0);

    try {
      let patientId = form.patient_id;

      if (newPatientMode) {
        if (
          !newPatient.first_name ||
          !newPatient.last_name ||
          !newPatient.phone
        ) {
          setMessage({
            type: "error",
            text: "Συμπληρώστε: Όνομα, Επώνυμο και Τηλέφωνο (το ΑΜΚΑ είναι προαιρετικό).",
          });
          setLoading(false);
          return;
        }

        patientId = await resolveOrCreatePatient(newPatient);
      } else {
        if (!selectedPatient?.id) {
          setMessage({
            type: "error",
            text: "Επιλέξτε ασθενή ή χρησιμοποιήστε τη λειτουργία 'Νέος ασθενής'.",
          });
          setLoading(false);
          return;
        }
        patientId = selectedPatient.id;
      }

      const startIso = finalDate.toISOString();
      const durationMinutes = Number(form.duration_minutes) || 30;

      // 🔓 ΕΔΩ: δεν κάνουμε πλέον κανέναν έλεγχο overlapping.
      // Τα ραντεβού εξαίρεσης επιτρέπεται να είναι εκτός ωραρίου
      // και να συμπίπτουν με άλλα ραντεβού.

      const payload = {
        patient_id: patientId,
        reason: form.reason || "Εξαίρεση",
        appointment_time: startIso,
        duration_minutes: durationMinutes,
        notes: form.notes || null,
        is_exception: true,
        status: "approved",
      };

      const { error } = await supabase.from("appointments").insert([payload]);

      if (error) {
        setMessage({ type: "error", text: "Σφάλμα κατά την αποθήκευση." });
        console.error(error);
      } else {
        setMessage({
          type: "success",
          text: newPatientMode
            ? "Ο ασθενής και το ραντεβού εξαίρεσης καταχωρήθηκαν."
            : "Το ραντεβού καταχωρήθηκε με εξαίρεση.",
        });
        router.push("/admin/appointments");
      }
    } catch (err) {
      console.error("SUBMIT ERROR:", err);
      setMessage({
        type: "error",
        text: err?.message
          ? `Κάτι πήγε στραβά: ${err.message}`
          : "Κάτι πήγε στραβά. Ελέγξτε τα στοιχεία και δοκιμάστε ξανά.",
      });
    } finally {
      setLoading(false);
    }
  };

  const baseInputClass =
    "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400";

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-zinc-50 to-emerald-50 px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-4xl">
        <section className="rounded-3xl border border-emerald-100/80 bg-white/95 px-5 py-7 shadow-[0_22px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-7 sm:py-8 md:px-10 md:py-10">
          {/* Header */}
          <header className="flex flex-col gap-4 border-b border-zinc-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
                aria-label="Επιστροφή"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-500">
                  Εξαίρεση ραντεβού
                </p>
                <h1 className="mt-1 font-serif text-2xl font-semibold text-emerald-950 sm:text-3xl">
                  Προσθήκη ραντεβού με εξαίρεση
                </h1>
                <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
                  Δημιουργήστε ένα ραντεβού εκτός των συνηθισμένων ωραρίων.
                </p>
              </div>
            </div>
            <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-800 sm:mt-0">
              <CalendarX className="h-4 w-4" />
              Ραντεβού εκτός standard προγράμματος
            </div>
          </header>

          {/* Toggle row */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
              Ασθενής
            </p>
            <button
              type="button"
              onClick={() => {
                setNewPatientMode((v) => !v);
                setSelectedPatient(null);
                setSearchTerm("");
                setForm((prev) => ({ ...prev, patient_id: "" }));
              }}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium shadow-sm transition sm:text-sm ${
                newPatientMode
                  ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300 hover:bg-emerald-50"
              }`}
            >
              <PlusCircle className="h-4 w-4" />
              {newPatientMode ? "Ακύρωση νέου ασθενούς" : "Νέος ασθενής"}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.4fr)]">
              {/* Left column: patient */}
              <section className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-4 shadow-sm sm:px-5 sm:py-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-500">
                      Επιλογή ασθενή
                    </p>
                    <h2 className="text-sm font-semibold text-emerald-950">
                      {newPatientMode
                        ? "Στοιχεία νέου ασθενούς"
                        : "Αναζήτηση υπάρχοντος ασθενούς"}
                    </h2>
                  </div>
                  {selectedPatient && !newPatientMode && (
                    <span className="hidden rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-medium text-emerald-800 sm:inline">
                      Επιλέχθηκε: {selectedPatient.last_name}{" "}
                      {selectedPatient.first_name}
                    </span>
                  )}
                </div>

                {/* Existing patient search */}
                {!newPatientMode && (
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-emerald-900">
                      Αναζήτηση ασθενή
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ονοματεπώνυμο, ΑΜΚΑ ή τηλέφωνο..."
                        value={
                          selectedPatient
                            ? `${selectedPatient.last_name} ${selectedPatient.first_name}`
                            : searchTerm
                        }
                        onChange={(e) => {
                          setSelectedPatient(null);
                          setForm((prev) => ({ ...prev, patient_id: "" }));
                          setSearchTerm(e.target.value);
                        }}
                        className={`${baseInputClass} pr-9`}
                      />
                      <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-zinc-400" />
                    </div>

                    {searchResults.length > 0 && !selectedPatient && (
                      <ul className="mt-2 max-h-52 space-y-1 overflow-y-auto rounded-2xl border border-emerald-100 bg-white p-1 text-sm shadow-sm">
                        {searchResults.map((p) => (
                          <li
                            key={p.id}
                            onClick={() => {
                              setSelectedPatient(p);
                              setForm((prev) => ({
                                ...prev,
                                patient_id: p.id,
                              }));
                              setSearchResults([]);
                            }}
                            className="cursor-pointer rounded-xl px-3 py-2 transition hover:bg-emerald-50"
                          >
                            <div className="font-medium text-emerald-950">
                              {p.last_name} {p.first_name}
                            </div>
                            <div className="mt-0.5 text-[11px] text-zinc-500">
                              ΑΜΚΑ: {p.amka || "-"} · Τηλ: {p.phone || "-"}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    {selectedPatient && (
                      <p className="mt-1 text-xs text-emerald-800">
                        Επιλέχθηκε:{" "}
                        <strong>
                          {selectedPatient.last_name}{" "}
                          {selectedPatient.first_name}
                        </strong>
                      </p>
                    )}
                  </div>
                )}

                {/* New patient inline form */}
                {newPatientMode && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-emerald-900">
                          Όνομα *
                        </label>
                        <input
                          name="first_name"
                          value={newPatient.first_name}
                          onChange={handleNewPatientChange}
                          className={baseInputClass}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-emerald-900">
                          Επώνυμο *
                        </label>
                        <input
                          name="last_name"
                          value={newPatient.last_name}
                          onChange={handleNewPatientChange}
                          className={baseInputClass}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-emerald-900">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={newPatient.email}
                          onChange={handleNewPatientChange}
                          className={baseInputClass}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-emerald-900">
                          Τηλέφωνο *
                        </label>
                        <input
                          name="phone"
                          value={newPatient.phone}
                          onChange={handleNewPatientChange}
                          className={baseInputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-emerald-900">
                        ΑΜΚΑ{" "}
                        <span className="text-[11px] font-normal text-emerald-700/70">
                          (προαιρετικό)
                        </span>
                      </label>
                      <input
                        name="amka"
                        value={newPatient.amka}
                        onChange={handleNewPatientChange}
                        maxLength={11}
                        className={baseInputClass}
                        placeholder="π.χ. 01019912345"
                      />
                      <p className="mt-1 text-[11px] text-emerald-900/75">
                        Αν υπάρχει ήδη ασθενής με αυτό το ΑΜΚΑ, θα
                        χρησιμοποιηθεί ο υπάρχων.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Right column: date / time / reason / notes */}
              <section className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/70 px-4 py-4 shadow-sm sm:px-5 sm:py-5">
                <div className="mb-2">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                    Ραντεβού
                  </p>
                  <h2 className="text-sm font-semibold text-zinc-900">
                    Ημερομηνία & ώρα εξαίρεσης
                  </h2>
                </div>

                {/* Date picker */}
                {isClient && (
                  <div className="flex justify-center">
                    <div className="rounded-2xl border border-zinc-100 bg-white px-3 py-3 shadow-sm">
                      <label className="mb-2 block text-center text-xs font-medium text-zinc-700">
                        Ημερομηνία
                      </label>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        locale={greekLocale} // 👈 GREEK, MONDAY START
                      />
                    </div>
                  </div>
                )}

                {/* Time */}
                <div>
                  <label className="mb-1 mt-2 block text-xs font-medium text-zinc-700">
                    Ώρα
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className={baseInputClass}
                    required
                  >
                    <option value="">Επιλέξτε ώρα</option>
                    {generateTimeSlots("06:00", "23:30", 15).map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Τα ραντεβού εξαίρεσης μπορούν να οριστούν εκτός βασικού
                    ωραρίου και επιτρέπεται να συμπίπτουν με άλλα ραντεβού.
                  </p>
                </div>

                {/* Duration & Reason */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700">
                      Διάρκεια (λεπτά)
                    </label>
                    <input
                      type="number"
                      name="duration_minutes"
                      value={form.duration_minutes}
                      onChange={handleChange}
                      min={5}
                      className={baseInputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700">
                      Λόγος ραντεβού
                    </label>
                    <input
                      type="text"
                      name="reason"
                      value={form.reason}
                      onChange={handleChange}
                      className={baseInputClass}
                      placeholder="π.χ. Επείγον, ειδική περίπτωση..."
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-700">
                    Σημειώσεις
                  </label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows={3}
                    className={`${baseInputClass} resize-none`}
                  />
                </div>
              </section>
            </div>

            {/* Messages */}
            {message && (
              <div
                className={`flex items-start gap-3 rounded-2xl border px-3 py-3 text-sm shadow-sm ${
                  message.type === "error"
                    ? "border-rose-200 bg-rose-50 text-rose-900"
                    : "border-emerald-200 bg-emerald-50 text-emerald-900"
                }`}
              >
                {message.type === "error" ? (
                  <span className="mt-0.5 text-base">⚠️</span>
                ) : (
                  <span className="mt-0.5 text-base">✅</span>
                )}
                <p>{message.text}</p>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || (!selectedPatient && !newPatientMode)}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
              >
                {loading
                  ? "Καταχώρηση..."
                  : newPatientMode
                  ? "Αποθήκευση ασθενούς & ραντεβού"
                  : "Καταχώρηση ραντεβού"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
