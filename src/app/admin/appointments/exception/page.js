"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { CalendarX } from "lucide-react";
import { formatISO } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Search } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch"; // If you have a shadcn/ui Switch
import { Label } from "@/components/ui/label";

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

  useEffect(() => {
    setIsClient(true);
    setSelectedDate(new Date()); // θέτουμε την ημερομηνία μόνο στον client
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      return;
    }

    const fetchMatches = async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name, amka, phone")
        .or(
          `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,amka.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
        );

      if (!error) {
        setSearchResults(data);
      }
    };

    fetchMatches();
  }, [searchTerm]);

  useEffect(() => {
    // Get authenticated session
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
      }
    };

    checkAuth();

    // Fetch patients
    const fetchPatients = async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name");
      if (!error) setPatients(data);
    };

    fetchPatients();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

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

    // Ανάλυση ώρας
    const [hours, minutes] = selectedTime.split(":");
    const finalDate = new Date(selectedDate);
    finalDate.setHours(Number(hours));
    finalDate.setMinutes(Number(minutes));
    finalDate.setSeconds(0);
    finalDate.setMilliseconds(0);

    const payload = {
      ...form,
      appointment_time: finalDate.toISOString(), // σωστό για timestamptz
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
        text: "Το ραντεβού καταχωρήθηκε με εξαίρεση.",
      });
      router.push("/admin/appointments");
    }

    setLoading(false);
  };

  function BackButton() {
    const router = useRouter(); // Χρήση router εδώ

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
        <form onSubmit={handleSubmit} className="space-y-6">
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
                    ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                    : searchTerm
                }
                onChange={(e) => {
                  setSelectedPatient(null); // clear selection
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
          {/* Ώρα με Dropdown */}
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
              disabled={loading}
              className="bg-[#2e2c28] hover:bg-[#1f1e1b] text-white px-6 py-2 rounded-lg text-sm font-semibold tracking-wide shadow-md hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? "Καταχώρηση..." : "Αποθήκευση Ραντεβού"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
