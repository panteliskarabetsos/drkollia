"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { CalendarX, ArrowLeft, Search, PlusCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

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

export default function AddExceptionAppointmentPage() {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  // existing appointment form
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

  // NEW: toggle + state for "Νέος ασθενής"
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
    setSelectedDate(new Date()); // set date only on client
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      return;
    }

    // Skip search while in "Νέος ασθενής" mode
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
    // Auth check
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
      }
    };

    checkAuth();

    // Fetch patients (optional; you weren’t using it further)
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
      // keep digits/+ and a single space, then normalize spaces
      phone: (phone ?? "")
        .replace(/[^\d+ ]/g, "")
        .replace(/\s+/g, " ")
        .trim(),
      amka: (amka ?? "").replace(/\D/g, ""),
    };

    if (!clean.first_name || !clean.last_name || !clean.phone) {
      throw new Error("Απαιτούνται: Όνομα, Επώνυμο, Τηλέφωνο.");
    }

    // --- Path A: AMKA provided & valid (11 digits) → use it as key
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

    // --- Path B: No/invalid AMKA → match by phone (and optionally name)
    // 1) Try exact phone match first
    const { data: existingByPhone, error: findP } = await supabase
      .from("patients")
      .select("id")
      .eq("phone", clean.phone)
      .maybeSingle();
    if (findP) throw findP;
    if (existingByPhone?.id) return existingByPhone.id;

    // 3) Insert WITHOUT AMKA (null)
    const { data: createdP, error: insP } = await supabase
      .from("patients")
      .insert([
        {
          first_name: clean.first_name,
          last_name: clean.last_name,
          email: clean.email,
          phone: clean.phone,
          amka: null, // optional
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

    // Build final datetime (store as timestamptz)
    const [hours, minutes] = selectedTime.split(":");
    const finalDate = new Date(selectedDate);
    finalDate.setHours(Number(hours));
    finalDate.setMinutes(Number(minutes));
    finalDate.setSeconds(0);
    finalDate.setMilliseconds(0);

    try {
      // STEP 1: resolve patient_id
      let patientId = form.patient_id;

      if (newPatientMode) {
        // minimal validation
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

        // Create or reuse by AMKA
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

      // STEP 2: (optional) simple overlap check inside the selected window
      const startIso = finalDate.toISOString();
      const end = new Date(
        finalDate.getTime() + (Number(form.duration_minutes) || 30) * 60 * 1000
      );
      const { data: overlaps, error: overlapErr } = await supabase
        .from("appointments")
        .select("id, appointment_time, duration_minutes, status")
        .gte(
          "appointment_time",
          new Date(finalDate.getTime() - 60 * 1000).toISOString()
        )
        .lt("appointment_time", end.toISOString());

      if (overlapErr) {
        throw overlapErr;
      }
      if (overlaps && overlaps.length > 0) {
        setMessage({
          type: "error",
          text: "Υπάρχει ήδη ραντεβού σε αυτό το διάστημα. Επιλέξτε άλλη ώρα.",
        });
        setLoading(false);
        return;
      }

      // STEP 3: create the EXCEPTION appointment
      const payload = {
        patient_id: patientId,
        reason: form.reason || "Εξαίρεση",
        appointment_time: startIso, // timestamptz in DB
        duration_minutes: Number(form.duration_minutes) || 30,
        notes: form.notes || null,
        is_exception: true,
        status: "approved", // change to "pending" if you prefer
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
        text: "Κάτι πήγε στραβά. Ελέγξτε τα στοιχεία και δοκιμάστε ξανά.",
        text: `Σφάλμα: ${err?.message || "Άγνωστο σφάλμα"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  function BackButton() {
    const router = useRouter();
    return (
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black px-3 py-2 rounded-lg border border-transparent hover:border-gray-300 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Πίσω
      </button>
    );
  }

  return (
    <main className="min-h-screen bg-[#f2f5f4] py-24 px-4 text-[#3a3a38]">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-8 border border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <BackButton />
          <h1 className="text-xl font-semibold tracking-tight">
            Προσθήκη Ραντεβού με Εξαίρεση
          </h1>
        </div>

        {/* Toggle row: Existing vs New patient */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600">
            Επιλέξτε υπάρχοντα ασθενή ή δημιουργήστε νέο.
          </span>
          <button
            type="button"
            onClick={() => {
              setNewPatientMode((v) => !v);
              setSelectedPatient(null);
              setSearchTerm("");
              setForm((prev) => ({ ...prev, patient_id: "" }));
            }}
            className={`inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition ${
              newPatientMode
                ? "bg-[#2e2c28] text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-800"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            {newPatientMode ? "Ακύρωση νέου ασθενούς" : "Νέος ασθενής"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Existing patient search */}
          {!newPatientMode && (
            <div className="relative">
              <label className="block text-sm font-medium mb-1">
                Αναζήτηση Ασθενή
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Αναζήτηση με όνομα, επώνυμο, ΑΜΚΑ ή τηλέφωνο"
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>

              {searchResults.length > 0 && !selectedPatient && (
                <ul className="absolute z-10 bg-white border border-gray-200 rounded-md mt-1 max-h-48 overflow-y-auto shadow-md w-full text-sm">
                  {searchResults.map((p) => (
                    <li
                      key={p.id}
                      onClick={() => {
                        setSelectedPatient(p);
                        setForm((prev) => ({ ...prev, patient_id: p.id }));
                        setSearchResults([]);
                      }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {p.last_name} {p.first_name} —{" "}
                      <span className="text-xs text-gray-500">
                        ΑΜΚΑ: {p.amka} | Τηλ: {p.phone}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* New patient inline form */}
          {newPatientMode && (
            <div className="rounded-2xl border p-4 space-y-4">
              <h2 className="text-sm font-semibold">Στοιχεία νέου ασθενούς</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Όνομα *
                  </label>
                  <input
                    name="first_name"
                    value={newPatient.first_name}
                    onChange={handleNewPatientChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Επώνυμο *
                  </label>
                  <input
                    name="last_name"
                    value={newPatient.last_name}
                    onChange={handleNewPatientChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newPatient.email}
                    onChange={handleNewPatientChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Τηλέφωνο *
                  </label>
                  <input
                    name="phone"
                    value={newPatient.phone}
                    onChange={handleNewPatientChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    ΑΜΚΑ{" "}
                    <span className="text-gray-400 text-xs">(προαιρετικό)</span>
                  </label>
                  <input
                    name="amka"
                    value={newPatient.amka}
                    onChange={handleNewPatientChange}
                    maxLength={11}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="π.χ. 01019912345"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Αν υπάρχει ήδη ασθενής με αυτό το ΑΜΚΑ, θα χρησιμοποιηθεί ο
                    υπάρχων.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Date picker */}
          {isClient && (
            <div className="flex justify-center">
              <div>
                <label className="block text-sm font-medium mb-1 text-center">
                  Ημερομηνία
                </label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                />
              </div>
            </div>
          )}

          {/* Time */}
          <div>
            <label className="block text-sm font-medium mb-1 mt-4">Ώρα</label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              required
            >
              <option value="">Επιλέξτε ώρα</option>
              {generateTimeSlots("06:00", "23:30", 15).map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Διάρκεια (λεπτά)
            </label>
            <input
              type="number"
              name="duration_minutes"
              value={form.duration_minutes}
              onChange={handleChange}
              min={5}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Λόγος Ραντεβού
            </label>
            <input
              type="text"
              name="reason"
              value={form.reason}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Σημειώσεις</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          {message && (
            <div
              className={`text-sm ${
                message.type === "error" ? "text-red-600" : "text-green-600"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              // enabled if: have selectedPatient OR we’re in newPatientMode
              disabled={loading || (!selectedPatient && !newPatientMode)}
              className="bg-[#2e2c28] hover:bg-[#1f1e1b] text-white px-6 py-2 rounded-lg text-sm font-semibold tracking-wide shadow-md hover:shadow-lg transition disabled:opacity-50"
            >
              {loading
                ? "Καταχώρηση..."
                : newPatientMode
                ? "Αποθήκευση Ασθενούς & Ραντεβού"
                : "Καταχώρηση Ραντεβού"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
