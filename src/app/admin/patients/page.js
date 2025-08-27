"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

import {
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaStickyNote,
  FaFilter,
  FaSearch,
  FaMinus,
  FaPlus,
  FaHistory,
} from "react-icons/fa";
import { FiX, FiPlus, FiMinus } from "react-icons/fi";
import { HiAdjustmentsHorizontal } from "react-icons/hi2";
import {
  IdCard,
  PencilLine,
  Trash2,
  ScrollText,
  UserCircle,
} from "lucide-react";

function removeDiacritics(str) {
  if (typeof str !== "string") return "";
  return str
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [sortOption, setSortOption] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [ageRange, setAgeRange] = useState([0, 100]);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const minInterval = useRef(null);
  const maxInterval = useRef(null);

  const highlightMatch = (text, query) => {
    if (!query || typeof text !== "string") return text;

    const cleanText = removeDiacritics(text);
    const cleanQuery = removeDiacritics(query);

    const regex = new RegExp(`(${cleanQuery})`, "gi");
    const matches = [];
    let lastIndex = 0;

    cleanText.replace(regex, (match, _, offset) => {
      if (offset > lastIndex) {
        matches.push({ text: text.slice(lastIndex, offset), match: false });
      }
      const matchedText = text.slice(offset, offset + match.length);
      matches.push({ text: matchedText, match: true });
      lastIndex = offset + match.length;
    });

    if (lastIndex < text.length) {
      matches.push({ text: text.slice(lastIndex), match: false });
    }

    return matches.map((part, i) =>
      part.match ? (
        <mark key={i} className="bg-yellow-200 text-black px-1 rounded">
          {part.text}
        </mark>
      ) : (
        <span key={i}>{part.text}</span>
      )
    );
  };

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
      } else {
        await fetchPatients();
      }
    };
    checkAuthAndFetch();
  }, []);

  useEffect(() => {
    const results = patients.filter((p) => {
      const query = removeDiacritics(search);
      const matchesSearch =
        removeDiacritics(`${p.first_name} ${p.last_name}` || "").includes(
          query
        ) ||
        removeDiacritics(p.amka || "").includes(query) ||
        removeDiacritics(p.email || "").includes(query) ||
        removeDiacritics(p.phone || "").includes(query);

      const matchesGender = genderFilter ? p.gender === genderFilter : true;

      let age = null;
      if (p.birth_date) {
        const birth = new Date(p.birth_date);
        const today = new Date();
        age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      }

      const matchesAge =
        age === null || (age >= ageRange[0] && age <= ageRange[1]);

      return matchesSearch && matchesGender && matchesAge;
    });

    if (sortOption === "name") {
      results.sort((a, b) =>
        `${a.first_name} ${a.last_name}`.localeCompare(
          `${b.first_name} ${b.last_name}`
        )
      );
    } else if (sortOption === "age") {
      const getAge = (date) => {
        if (!date) return 0;
        const birth = new Date(date);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
      };
      results.sort((a, b) => getAge(a.birth_date) - getAge(b.birth_date));
    } else if (sortOption === "amka") {
      results.sort((a, b) => (a.amka || "").localeCompare(b.amka || ""));
    } else if (sortOption === "updated_at") {
      results.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }
    setFiltered(results);
  }, [search, genderFilter, ageRange, sortOption, patients]);

  const fetchPatients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setPatients(data);
    setLoading(false);
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return "";
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `(${age} ετών)`;
  };

  const handleViewNotes = (patient) => {
    setSelectedPatient(patient);
    setEditedNotes(patient.notes || "");
    setNotesModalOpen(true);
  };

  const handleEdit = (patient) => {
    router.push(`/admin/patients/${patient.id}`);
  };

  const handleDelete = (patient) => {
    setPatientToDelete(patient);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!patientToDelete) return;
    const { error } = await supabase
      .from("patients")
      .delete()
      .eq("id", patientToDelete.id);

    if (!error) {
      await fetchPatients();
      setSearch("");
    }

    setDeleteModalOpen(false);
    setPatientToDelete(null);
  };

  const handleSaveNotes = async () => {
    if (!selectedPatient) return;
    const { error } = await supabase
      .from("patients")
      .update({ notes: editedNotes })
      .eq("id", selectedPatient.id);
    if (!error) {
      setPatients((prev) =>
        prev.map((p) =>
          p.id === selectedPatient.id ? { ...p, notes: editedNotes } : p
        )
      );
      setNotesModalOpen(false);
    }
  };

  const handleHold = (type, operation) => {
    const interval = setInterval(() => {
      setAgeRange((prev) => {
        const newMin =
          type === "min"
            ? operation === "inc"
              ? Math.min(prev[0] + 1, 100)
              : Math.max(prev[0] - 1, 0)
            : prev[0];
        const newMax =
          type === "max"
            ? operation === "inc"
              ? Math.min(prev[1] + 1, 100)
              : Math.max(prev[1] - 1, 0)
            : prev[1];
        if (newMin <= newMax) return [newMin, newMax];
        return prev;
      });
    }, 100);
    if (type === "min") minInterval.current = interval;
    else maxInterval.current = interval;
  };

  const clearHold = (type) => {
    if (type === "min" && minInterval.current)
      clearInterval(minInterval.current);
    if (type === "max" && maxInterval.current)
      clearInterval(maxInterval.current);
  };
  const [patientAppointments, setPatientAppointments] = useState([]);

  useEffect(() => {
    if (patientToDelete) {
      supabase
        .from("appointments")
        .select("status, appointment_time, patient_id")
        .eq("patient_id", patientToDelete.id)
        .eq("status", "approved")
        .gt("appointment_time", new Date().toISOString())
        .then(({ data }) => {
          setPatientAppointments(data || []);
        });
    }
  }, [patientToDelete]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f7f5f2] via-[#ece9e6] to-[#dcd8d3] text-[#3a3a38] font-sans">
      <section className="max-w-7xl mx-auto px-6 py-26">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 mb-10">
          {/* Left Buttons */}
          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={() => router.push("/admin")}
              className="inline-flex items-center gap-2 text-sm text-[#5f5d58] hover:text-[#8c7c68] bg-white/40 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm transition-all hover:shadow-md"
            >
              <FaArrowLeft className="text-base" />
              <span className="tracking-tight">Dashboard</span>
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 text-sm text-[#5f5d58] hover:text-[#8c7c68] bg-white/40 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm transition-all hover:shadow-md"
            >
              <FaFilter className="text-base" />
              <span className="tracking-tight">Φίλτρα</span>
            </button>
          </div>

          {/* Primary CTA */}
          <button
            onClick={() => router.push("/admin/patients/new")}
            className="inline-flex items-center gap-2 bg-[#8c7c68]/90 hover:bg-[#6f6253] text-white text-sm px-5 py-2 rounded-2xl shadow-md transition-all hover:shadow-lg backdrop-blur-md"
          >
            <FaPlus className="text-base" />
            <span className="tracking-tight">Προσθήκη Ασθενούς</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full max-w-md mb-8">
          {loading && (
            <div className="fixed inset-0 flex items-center justify-center bg-white/60 backdrop-blur z-50">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#8c7c68]"></div>
            </div>
          )}

          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
          <input
            type="text"
            placeholder="Αναζήτηση ασθενή με όνομα, ΑΜΚΑ, τηλέφωνο ή email"
            className="w-full pl-5 pr-4 py-2 text-sm rounded-2xl bg-white/60 border border-gray-200 text-gray-700 placeholder:text-gray-400 shadow-inner backdrop-blur focus:outline-none focus:ring-2 focus:ring-[#8c7c68] transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {showFilters && (
          <div className="relative bg-white/70 backdrop-blur-md border border-[#e1dfda] rounded-2xl p-6 mb-10 shadow transition-all">
            {/* X close button */}
            <button
              onClick={() => setShowFilters(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
              title="Κλείσιμο φίλτρων"
            >
              <FiX className="w-5 h-5" />
            </button>

            {/* Header */}
            <h3 className="text-base font-semibold text-[#4a4947] mb-8 tracking-tight flex items-center gap-2">
              <HiAdjustmentsHorizontal className="text-[#8c7c68] w-5 h-5" />
              Φίλτρα Αναζήτησης
            </h3>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 items-center">
              {/* Gender */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-600">Φύλο</label>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-gray-300 bg-white/70 backdrop-blur focus:outline-none focus:ring-2 focus:ring-[#8c7c68] transition"
                >
                  <option value="">Όλα</option>
                  <option value="male">Άνδρας</option>
                  <option value="female">Γυναίκα</option>
                  <option value="other">Άλλο</option>
                </select>
              </div>

              {/* Age Range */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-600">Ηλικία</label>
                <div className="flex items-end gap-6">
                  {/* Από */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500">Από</span>
                    <div className="flex items-center gap-1">
                      <button
                        onMouseDown={() => handleHold("min", "dec")}
                        onMouseUp={() => clearHold("min")}
                        onMouseLeave={() => clearHold("min")}
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                      >
                        <FiMinus className="text-sm" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={ageRange[0]}
                        onChange={(e) => {
                          const newMin = +e.target.value;
                          if (newMin <= ageRange[1])
                            setAgeRange([newMin, ageRange[1]]);
                        }}
                        className="w-14 px-2 py-1 text-center text-sm border border-gray-300 rounded-xl bg-white/70 backdrop-blur"
                      />
                      <button
                        onMouseDown={() => handleHold("min", "inc")}
                        onMouseUp={() => clearHold("min")}
                        onMouseLeave={() => clearHold("min")}
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                      >
                        <FiPlus className="text-sm" />
                      </button>
                    </div>
                  </div>

                  {/* Έως */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500">Έως</span>
                    <div className="flex items-center gap-1">
                      <button
                        onMouseDown={() => handleHold("max", "dec")}
                        onMouseUp={() => clearHold("max")}
                        onMouseLeave={() => clearHold("max")}
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                      >
                        <FiMinus className="text-sm" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={ageRange[1]}
                        onChange={(e) => {
                          const newMax = +e.target.value;
                          if (newMax >= ageRange[0])
                            setAgeRange([ageRange[0], newMax]);
                        }}
                        className="w-14 px-2 py-1 text-center text-sm border border-gray-300 rounded-xl bg-white/70 backdrop-blur"
                      />
                      <button
                        onMouseDown={() => handleHold("max", "inc")}
                        onMouseUp={() => clearHold("max")}
                        onMouseLeave={() => clearHold("max")}
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                      >
                        <FiPlus className="text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sort */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-600">Ταξινόμηση</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-gray-300 bg-white/70 backdrop-blur focus:outline-none focus:ring-2 focus:ring-[#8c7c68] transition"
                >
                  <option value="">Καμία</option>
                  <option value="name">Αλφαβητικά</option>
                  <option value="age">Κατά ηλικία</option>
                  <option value="amka">Κατά ΑΜΚΑ</option>
                  <option value="updated_at">Τελευταία Επεξεργασία</option>
                </select>
              </div>
            </div>

            {/* Reset Button */}
            <div className="mt-8 text-right">
              <button
                onClick={() => {
                  setGenderFilter("");
                  setAgeRange([0, 100]);
                  setSortOption("");
                }}
                className="px-5 py-2 text-sm text-gray-600 border border-gray-300 bg-white rounded-xl hover:bg-gray-100 transition"
              >
                Επαναφορά Φίλτρων
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-500 text-sm">Φόρτωση...</p>
        ) : (
          <div className="overflow-auto rounded-2xl border border-[#e5e1d8] shadow-sm">
            <table className="min-w-full text-sm text-left text-[#3b3a36]">
              <caption className="sr-only">Λίστα Ασθενών</caption>

              {/* Sticky header */}
              <thead className="sticky top-0 z-10 bg-[#f7f5f0] text-[#6b675f] uppercase text-xs tracking-wide border-b border-[#eee7db] shadow-[inset_0_-1px_0_#eee7db]">
                <tr>
                  {[
                    "Όνομα",
                    "ΑΜΚΑ",
                    "Ηλικία",
                    "Φύλο",
                    "Τηλέφωνο",
                    "Email",
                    "Ενέργειες",
                  ].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-4 py-3 font-medium whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-[#8c887f]"
                    >
                      Δεν βρέθηκαν αποτελέσματα.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, i) => (
                    <tr
                      key={p.id}
                      className={`transition ${
                        i % 2 === 1 ? "bg-[#fafafa]" : "bg-white"
                      } hover:bg-[#f5f5f5]`}
                    >
                      {/* Όνομα */}
                      <td className="px-4 py-3 font-medium text-[#2f2e2b] whitespace-nowrap">
                        {highlightMatch(
                          `${p.first_name} ${p.last_name}`,
                          search
                        )}
                      </td>

                      {/* ΑΜΚΑ */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono tabular-nums text-[13px] text-[#4a473f]">
                        {highlightMatch(p.amka || "—", search)}
                      </td>

                      {/* Ηλικία */}
                      <td className="px-4 py-3 text-[#6b675f]">
                        {p.birth_date ? calculateAge(p.birth_date) : "—"}
                      </td>

                      {/* Φύλο */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border ${
                            p.gender === "male"
                              ? "bg-blue-50 text-blue-700 border-blue-100"
                              : p.gender === "female"
                              ? "bg-pink-50 text-pink-700 border-pink-100"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                          title="Φύλο"
                        >
                          {p.gender === "male"
                            ? "Άνδρας"
                            : p.gender === "female"
                            ? "Γυναίκα"
                            : "Άλλο"}
                        </span>
                      </td>

                      {/* Τηλέφωνο */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {p.phone ? (
                          <a
                            href={`tel:${p.phone}`}
                            className="hover:underline"
                          >
                            {highlightMatch(p.phone, search)}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 whitespace-nowrap max-w-[220px]">
                        {p.email ? (
                          <a
                            href={`mailto:${p.email}`}
                            className="hover:underline block truncate"
                            title={p.email}
                          >
                            {highlightMatch(p.email, search)}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Ενέργειες */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleViewNotes(p)}
                            title="Καρτέλα"
                            className="inline-flex items-center justify-center rounded-lg border border-[#e5e1d8] bg-white p-2 text-[#3b3a36] shadow-sm hover:bg-[#f6f3ee] focus:outline-none focus:ring-2 focus:ring-[#d7cfc2]/70"
                          >
                            <IdCard className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleEdit(p)}
                            title="Επεξεργασία"
                            className="inline-flex items-center justify-center rounded-lg border border-[#e5e1d8] bg-white p-2 text-[#3b3a36] shadow-sm hover:bg-[#f6f3ee] focus:outline-none focus:ring-2 focus:ring-[#d7cfc2]/70"
                          >
                            <PencilLine className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            onClick={() =>
                              router.push(`/admin/patients/history/${p.id}`)
                            }
                            title="Ιστορικό Επισκέψεων"
                            className="inline-flex items-center justify-center rounded-lg border border-[#e5e1d8] bg-white p-2 text-[#3b3a36] shadow-sm hover:bg-[#f6f3ee] focus:outline-none focus:ring-2 focus:ring-[#d7cfc2]/70"
                          >
                            <ScrollText className="w-4 h-4 text-purple-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            title="Διαγραφή"
                            className="inline-flex items-center justify-center rounded-lg border border-[#f0e6e6] bg-white p-2 text-red-600 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {notesModalOpen && selectedPatient && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="patient-card-title"
          >
            {/* Overlay */}
            <button
              aria-label="Κλείσιμο"
              onClick={() => setNotesModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            />

            {/* Patient Card */}
            <div className="relative w-full max-w-5xl rounded-2xl border border-[#e5e1d8] bg-gradient-to-b from-white/95 to-[#fdfcf9]/90 shadow-2xl backdrop-blur-xl overflow-hidden">
              {/* Header */}
              <div className="sticky top-0 flex items-center justify-between border-b border-[#eee7db] bg-white/80 px-6 sm:px-8 py-4 backdrop-blur">
                <h2
                  id="patient-card-title"
                  className="flex items-center gap-2 text-lg sm:text-xl font-semibold tracking-tight text-[#2f2e2b]"
                >
                  <UserCircle className="h-6 w-6 text-[#8c7c68]" />
                  Καρτέλα Ασθενούς
                </h2>
                <button
                  onClick={() => setNotesModalOpen(false)}
                  className="rounded-lg px-2 py-1 text-sm text-[#6b675f] hover:bg-[#f3f0ea] focus:outline-none focus:ring-2 focus:ring-[#d7cfc2]/70"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="max-h-[75vh] overflow-auto px-6 sm:px-8 py-6 space-y-8">
                {/* Contact Info */}
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#5f5b54]">
                    <span className="w-1.5 h-1.5 bg-[#8c7c68] rounded-full" />
                    Στοιχεία Ασθενούς
                  </h3>
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                    {[
                      [
                        "Ονοματεπώνυμο",
                        `${selectedPatient.first_name} ${selectedPatient.last_name}`,
                      ],
                      ["ΑΜΚΑ", selectedPatient.amka],
                      ["Email", selectedPatient.email],
                      ["Τηλέφωνο", selectedPatient.phone],
                      ["Ημ. Γέννησης", formatDate(selectedPatient.birth_date)],
                      ["Ηλικία", calculateAge(selectedPatient.birth_date)],
                      ["Φύλο", selectedPatient.gender],
                      ["Επάγγελμα", selectedPatient.occupation],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-xl border border-[#eee7db] bg-white px-3 py-2 shadow-sm"
                      >
                        <dt className="text-xs text-[#8c887f]">{label}</dt>
                        <dd className="font-medium text-[#2f2e2b]">
                          {value || "—"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>

                {/* History */}
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#5f5b54]">
                    <span className="w-1.5 h-1.5 bg-[#8c7c68] rounded-full" />
                    Ιστορικό & Συνήθειες
                  </h3>
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                    {[
                      [
                        "Πρώτη Επίσκεψη",
                        formatDate(selectedPatient.first_visit_date),
                      ],
                      ["Οικ. Κατάσταση", selectedPatient.marital_status],
                      ["Τέκνα", selectedPatient.children],
                      ["Κάπνισμα", selectedPatient.smoking],
                      ["Αλκοόλ", selectedPatient.alcohol],
                      ["Φάρμακα", selectedPatient.medications],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-xl border border-[#eee7db] bg-white px-3 py-2 shadow-sm"
                      >
                        <dt className="text-xs text-[#8c887f]">{label}</dt>
                        <dd className="font-medium text-[#2f2e2b]">
                          {value || "—"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>

                {/* Clinical */}
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#5f5b54]">
                    <span className="w-1.5 h-1.5 bg-[#8c7c68] rounded-full" />
                    Κλινικές Πληροφορίες
                  </h3>
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                    {[
                      [
                        "Γυναικολογικό Ιστορικό",
                        selectedPatient.gynecological_history,
                      ],
                      [
                        "Κληρονομικό Ιστορικό",
                        selectedPatient.hereditary_history,
                      ],
                      ["Παρούσα Νόσος", selectedPatient.current_disease],
                      ["Αντικειμενική Εξέταση", selectedPatient.physical_exam],
                      [
                        "Παρακλινικός Έλεγχος",
                        selectedPatient.preclinical_screening,
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-xl border border-[#eee7db] bg-white px-3 py-2 shadow-sm"
                      >
                        <dt className="text-xs text-[#8c887f]">{label}</dt>
                        <dd className="font-medium text-[#2f2e2b]">
                          {value || "—"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>

                {/* Notes */}
                <section>
                  <h3 className="mb-2 text-sm font-semibold text-[#5f5b54]">
                    Σημειώσεις
                  </h3>
                  <div className="rounded-xl border border-[#eee7db] bg-[#fcfaf6] px-4 py-3 shadow-sm text-sm text-[#3b3a36]">
                    {selectedPatient.notes?.trim() ||
                      "Δεν υπάρχουν σημειώσεις."}
                  </div>
                </section>

                {/* Updated At */}
                <p className="text-right text-xs text-[#8c887f]">
                  Τελευταία ενημέρωση:{" "}
                  {selectedPatient.updated_at
                    ? new Date(selectedPatient.updated_at).toLocaleString(
                        "el-GR"
                      )
                    : "—"}
                </p>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 flex flex-col sm:flex-row justify-end gap-3 border-t border-[#eee7db] bg-white/80 px-6 sm:px-8 py-4 backdrop-blur">
                <button
                  onClick={() => setNotesModalOpen(false)}
                  className="w-full sm:w-auto rounded-xl border border-[#e5e1d8] bg-white px-4 py-2 text-sm text-[#3b3a36] shadow-sm hover:bg-[#f6f3ee]"
                >
                  Κλείσιμο
                </button>
                <button
                  onClick={() => {
                    setNotesModalOpen(false);
                    router.push(`/admin/patients/${selectedPatient.id}`);
                  }}
                  className="w-full sm:w-auto rounded-xl bg-[#8c7c68] px-4 py-2 text-sm text-white shadow-sm transition hover:bg-[#6f6253]"
                >
                  Επεξεργασία
                </button>
                <button
                  onClick={() => {
                    setNotesModalOpen(false);
                    router.push(
                      `/admin/patients/history/${selectedPatient.id}`
                    );
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm text-white shadow-sm hover:bg-blue-700"
                >
                  <ScrollText className="h-4 w-4" />
                  Ιστορικό Επισκέψεων
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
      {deleteModalOpen && patientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Επιβεβαίωση Διαγραφής
            </h2>
            <p className="text-sm text-gray-600 text-center mb-4">
              Είστε σίγουροι ότι θέλετε να διαγράψετε τον ασθενή{" "}
              <span className="font-medium text-red-600">
                {`${patientToDelete.first_name} ${patientToDelete.last_name}`}
              </span>
              ;
            </p>

            {patientAppointments.length > 0 && (
              <p className="text-sm text-red-600 text-center mb-6">
                ⚠ Ο ασθενής έχει {patientAppointments.length} επιβεβαιωμένα
                επερχόμενα ραντεβού. Με την διαγραφή ασθενούς, θα ακυρωθούν
                σιωπηλά και όλα τα επερχόμενα ραντεβού του.
              </p>
            )}

            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setPatientToDelete(null);
                }}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Άκυρο
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Διαγραφή
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
