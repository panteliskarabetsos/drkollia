"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { supabase } from "../../../../lib/supabaseClient";
import {
  Plus,
  Stethoscope,
  FileText,
  NotebookPen,
  Trash2,
  Pencil,
  ArrowLeft,
  StickyNote,
  Save,
  XCircle,
  AlertTriangle,
  IdCard,
  BookText,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(date) {
  if (!date) return "—";
  try {
    return format(new Date(date), "dd/MM/yyyy", { locale: el });
  } catch {
    return "—";
  }
}

function formatDateTime(date) {
  if (!date) return "—";
  try {
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: el });
  } catch {
    return "—";
  }
}

function calculateAge(birthDate) {
  if (!birthDate) return "—";
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function lockBodyScroll(locked) {
  if (typeof document === "undefined") return;
  document.body.style.overflow = locked ? "hidden" : "";
}

export default function PatientHistoryPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();

  const [visitNotes, setVisitNotes] = useState([]);
  const [patient, setPatient] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // "desc" | "asc"
  const [expandedId, setExpandedId] = useState(null);

  const [newVisit, setNewVisit] = useState({
    visit_date: "",
    physical_exam: "",
    preclinical_screening: "",
    notes: "",
  });

  // Body scroll lock when any modal open
  useEffect(() => {
    const anyOpen = modalOpen || notesModalOpen || deleteModalOpen;
    lockBodyScroll(anyOpen);
    return () => lockBodyScroll(false);
  }, [modalOpen, notesModalOpen, deleteModalOpen]);

  const resetVisitForm = useCallback(() => {
    setEditMode(false);
    setEditingId(null);
    setNewVisit({
      visit_date: "",
      physical_exam: "",
      preclinical_screening: "",
      notes: "",
    });
  }, []);

  const loadPage = useCallback(async () => {
    if (!id) return;

    setErrorMsg("");
    setLoading(true);

    try {
      const {
        data: { session },
        error: sessionErr,
      } = await supabase.auth.getSession();

      if (sessionErr) throw sessionErr;

      if (!session) {
        router.replace("/login");
        return;
      }

      const [patientRes, notesRes] = await Promise.all([
        supabase.from("patients").select("*").eq("id", id).single(),
        supabase
          .from("visit_notes")
          .select("*")
          .eq("patient_id", id)
          .order("visit_date", { ascending: false }),
      ]);

      if (patientRes.error) throw patientRes.error;
      if (notesRes.error) throw notesRes.error;

      setPatient(patientRes.data || null);
      setVisitNotes(notesRes.data || []);
    } catch (err) {
      setErrorMsg(
        err?.message || "Κάτι πήγε στραβά κατά τη φόρτωση. Δοκιμάστε ξανά."
      );
      setPatient(null);
      setVisitNotes([]);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const refreshNotes = useCallback(async () => {
    if (!id) return;
    setErrorMsg("");
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("visit_notes")
        .select("*")
        .eq("patient_id", id)
        .order("visit_date", { ascending: false });

      if (error) throw error;
      setVisitNotes(data || []);
    } catch (err) {
      setErrorMsg(err?.message || "Αποτυχία ανανέωσης επισκέψεων.");
    } finally {
      setRefreshing(false);
    }
  }, [id]);

  const handleSubmit = useCallback(async () => {
    if (!newVisit.visit_date || saving) return;

    setErrorMsg("");
    setSaving(true);

    try {
      const payload = {
        visit_date: newVisit.visit_date,
        physical_exam: newVisit.physical_exam,
        preclinical_screening: newVisit.preclinical_screening,
        notes: newVisit.notes,
      };

      if (editMode && editingId) {
        const { error } = await supabase
          .from("visit_notes")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("visit_notes").insert({
          ...payload,
          patient_id: id,
        });

        if (error) throw error;
      }

      setModalOpen(false);
      resetVisitForm();
      await refreshNotes();
    } catch (err) {
      setErrorMsg(
        err?.message ||
          "Αποτυχία αποθήκευσης. Ελέγξτε τα πεδία και ξαναδοκιμάστε."
      );
    } finally {
      setSaving(false);
    }
  }, [newVisit, saving, editMode, editingId, id, resetVisitForm, refreshNotes]);

  const handleEdit = useCallback((note) => {
    setErrorMsg("");
    setNewVisit({
      visit_date: note?.visit_date ? String(note.visit_date).split("T")[0] : "",
      physical_exam: note?.physical_exam || "",
      preclinical_screening: note?.preclinical_screening || "",
      notes: note?.notes || "",
    });
    setEditingId(note.id);
    setEditMode(true);
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!noteToDelete || deleting) return;
    setErrorMsg("");
    setDeleting(true);

    try {
      const { error } = await supabase
        .from("visit_notes")
        .delete()
        .eq("id", noteToDelete);

      if (error) throw error;

      setDeleteModalOpen(false);
      setNoteToDelete(null);
      await refreshNotes();
    } catch (err) {
      setErrorMsg(err?.message || "Αποτυχία διαγραφής.");
    } finally {
      setDeleting(false);
    }
  }, [noteToDelete, deleting, refreshNotes]);

  const fullName = useMemo(() => {
    const n = `${patient?.first_name || ""} ${patient?.last_name || ""}`.trim();
    return n || "Ασθενής";
  }, [patient]);

  const age = useMemo(() => calculateAge(patient?.birth_date), [patient]);

  const totalVisits = visitNotes.length;
  const lastVisitDate =
    totalVisits > 0 && visitNotes[0]?.visit_date
      ? formatDate(visitNotes[0].visit_date)
      : "—";

  const firstVisitDate = patient?.first_visit_date
    ? formatDate(patient.first_visit_date)
    : "—";

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = [...(visitNotes || [])];

    if (q) {
      arr = arr.filter((n) => {
        const hay = [
          formatDate(n.visit_date),
          n.reason,
          n.doctor,
          n.physical_exam,
          n.preclinical_screening,
          n.notes,
        ]
          .filter(Boolean)
          .join(" · ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    arr.sort((a, b) => {
      const da = a?.visit_date ? new Date(a.visit_date).getTime() : 0;
      const db = b?.visit_date ? new Date(b.visit_date).getTime() : 0;
      return sortOrder === "asc" ? da - db : db - da;
    });

    return arr;
  }, [visitNotes, search, sortOrder]);

  const closeVisitModal = useCallback(() => {
    setModalOpen(false);
    resetVisitForm();
  }, [resetVisitForm]);

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-10 bg-[#fbfaf7] relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#e9e2d7] blur-3xl opacity-70" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#efe8dd] blur-3xl opacity-70" />
        </div>

        <div className="relative max-w-md mx-auto rounded-2xl border border-[#e5e1d8] bg-white/70 backdrop-blur-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Stethoscope className="w-6 h-6 text-[#8c7c68]" />
            <h1 className="text-lg font-semibold text-[#2f2e2b]">
              Φόρτωση ιστορικού…
            </h1>
          </div>
          <div className="space-y-3">
            <div className="h-3 w-2/3 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-3 w-1/2 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-3 w-3/4 rounded-full bg-gray-200 animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10 bg-[#fbfaf7] relative overflow-hidden">
      {/* ambient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[#e9e2d7] blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-[#efe8dd] blur-3xl opacity-70" />
        <div className="absolute -bottom-28 left-1/3 h-80 w-80 rounded-full bg-[#f2eee6] blur-3xl opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.04),transparent_55%)]" />
      </div>

      <div className="relative max-w-5xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-[#e5e1d8] bg-white/70 backdrop-blur hover:bg-white transition shadow-sm w-fit"
          >
            <ArrowLeft className="w-4 h-4" /> Πίσω στη λίστα ασθενών
          </button>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <button
              onClick={refreshNotes}
              disabled={refreshing}
              className={cn(
                "inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-[#e5e1d8] bg-white/70 backdrop-blur hover:bg-white transition shadow-sm",
                refreshing && "opacity-60 cursor-not-allowed"
              )}
              title="Ανανέωση"
            >
              <RefreshCw
                className={cn("w-4 h-4", refreshing && "animate-spin")}
              />
              Ανανέωση
            </button>

            <button
              onClick={() => setNotesModalOpen(true)}
              className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-[#d7cdbf] bg-white/80 text-[#6f6253] hover:bg-white transition shadow-sm"
            >
              <StickyNote className="w-4 h-4" /> Καρτέλα Ασθενούς
            </button>

            <button
              onClick={() => {
                setErrorMsg("");
                resetVisitForm();
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-[#8c7c68] hover:bg-[#6f6253] text-white text-sm px-4 py-2 rounded-xl shadow-md"
            >
              <Plus className="w-4 h-4" /> Καταχώρηση Επίσκεψης
            </button>
          </div>
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div className="rounded-2xl border border-red-200 bg-red-50/80 backdrop-blur px-4 py-3 text-sm text-red-800 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
            <button
              onClick={() => setErrorMsg("")}
              className="text-red-700 hover:text-red-900"
              aria-label="Κλείσιμο"
            >
              ✕
            </button>
          </div>
        )}

        {/* Patient summary */}
        <section className="rounded-2xl border border-[#e5e1d8] bg-white/70 backdrop-blur-xl shadow-sm p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <IdCard className="w-5 h-5 text-[#8c7c68]" />
                <p className="text-xs uppercase tracking-wide text-[#7d786f]">
                  Ασθενής
                </p>
              </div>

              <h1 className="text-2xl font-semibold text-[#2f2e2b]">
                {fullName}
              </h1>
              <p className="mt-1 text-sm text-[#6b675f]">
                Ιστορικό επισκέψεων & κλινικών σημειώσεων.
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {age !== "—" && (
                  <span className="inline-flex items-center rounded-full bg-white/70 border border-[#e5e1d8] px-2.5 py-1 text-[#4b3f30]">
                    Ηλικία: <span className="ml-1 font-medium">{age}</span>
                  </span>
                )}
                {patient?.gender && (
                  <span className="inline-flex items-center rounded-full bg-white/70 border border-[#e5e1d8] px-2.5 py-1 text-[#4b3f30]">
                    Φύλο:{" "}
                    <span className="ml-1 font-medium">
                      {patient.gender || "—"}
                    </span>
                  </span>
                )}
                {patient?.occupation && (
                  <span className="inline-flex items-center rounded-full bg-white/70 border border-[#e5e1d8] px-2.5 py-1 text-[#4b3f30]">
                    Επάγγελμα:{" "}
                    <span className="ml-1 font-medium">
                      {patient.occupation}
                    </span>
                  </span>
                )}
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 sm:gap-4 text-sm sm:w-72">
              <div className="rounded-xl border border-[#e5e1d8] bg-white/80 px-3 py-2 shadow-sm">
                <dt className="text-[11px] text-[#7d786f]">
                  Σύνολο Επισκέψεων
                </dt>
                <dd className="mt-1 text-lg font-semibold text-[#2f2e2b]">
                  {totalVisits}
                </dd>
              </div>
              <div className="rounded-xl border border-[#e5e1d8] bg-white/80 px-3 py-2 shadow-sm">
                <dt className="text-[11px] text-[#7d786f]">
                  Τελευταία Επίσκεψη
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#2f2e2b]">
                  {lastVisitDate}
                </dd>
              </div>
              <div className="rounded-xl border border-[#e5e1d8] bg-white/80 px-3 py-2 shadow-sm col-span-2">
                <dt className="text-[11px] text-[#7d786f]">
                  Ημ. Πρώτης Επίσκεψης
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#2f2e2b]">
                  {firstVisitDate}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Visit history */}
        <section className="rounded-2xl border border-[#e5e1d8] bg-white/70 backdrop-blur-xl shadow-sm p-5 sm:p-6">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookText className="w-5 h-5 text-[#8c7c68]" />
                <h2 className="text-lg sm:text-xl font-semibold text-[#2f2e2b]">
                  Ιστορικό Επισκέψεων
                </h2>
              </div>
              <p className="text-sm text-[#6b675f]">
                Αναζήτηση, ταξινόμηση και προβολή λεπτομερειών ανά επίσκεψη.
              </p>
            </div>

            {/* toolbar */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c887f]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Αναζήτηση (ημ/νία, κείμενο, λόγος, ιατρός...)"
                  className="w-full sm:w-96 pl-9 pr-3 py-2 text-sm rounded-xl border border-[#e5e1d8] bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#cbbba6]"
                />
              </div>

              <button
                onClick={() =>
                  setSortOrder((p) => (p === "desc" ? "asc" : "desc"))
                }
                className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-xl border border-[#e5e1d8] bg-white/80 hover:bg-white transition"
                title="Αλλαγή ταξινόμησης"
              >
                {sortOrder === "desc" ? (
                  <>
                    <ChevronDown className="w-4 h-4" /> Νεότερα
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-4 h-4" /> Παλαιότερα
                  </>
                )}
              </button>
            </div>
          </header>

          {filteredNotes.length === 0 ? (
            <div className="mt-2 rounded-2xl border border-dashed border-[#d9d2c7] bg-white/60 px-6 py-8 text-center">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f0e9dd] text-[#8c7c68] mb-3">
                <Stethoscope className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-[#3b3a36]">
                {visitNotes.length === 0
                  ? "Δεν υπάρχουν καταχωρημένες επισκέψεις."
                  : "Δεν βρέθηκαν αποτελέσματα για την αναζήτηση."}
              </p>
              <p className="mt-1 text-xs text-[#8c887f]">
                {visitNotes.length === 0
                  ? "Ξεκινήστε καταχωρώντας την πρώτη επίσκεψη."
                  : "Δοκιμάστε διαφορετικές λέξεις-κλειδιά."}
              </p>

              {visitNotes.length === 0 && (
                <button
                  onClick={() => {
                    setErrorMsg("");
                    resetVisitForm();
                    setModalOpen(true);
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#8c7c68] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#6f6253]"
                >
                  <Plus className="w-4 h-4" />
                  Καταχώρηση Πρώτης Επίσκεψης
                </button>
              )}
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              {filteredNotes.map((note) => {
                const isOpen = expandedId === note.id;

                const blocks = [
                  {
                    label: "Αντικειμενική Εξέταση",
                    icon: <FileText className="w-4 h-4" />,
                    tone: "text-[#2f2e2b]",
                    value: note.physical_exam,
                  },
                  {
                    label: "Παρακλινικός Έλεγχος",
                    icon: <NotebookPen className="w-4 h-4" />,
                    tone: "text-[#2f2e2b]",
                    value: note.preclinical_screening,
                  },
                  {
                    label: "Σημειώσεις",
                    icon: <NotebookPen className="w-4 h-4" />,
                    tone: "text-[#2f2e2b]",
                    value: note.notes,
                  },
                ].filter((b) => (b.value ?? "").toString().trim().length > 0);

                const preview =
                  (
                    note.notes ||
                    note.physical_exam ||
                    note.preclinical_screening ||
                    ""
                  )
                    .toString()
                    .trim()
                    .slice(0, 140) +
                  (String(note.notes || "").length > 140 ? "…" : "");

                return (
                  <article
                    key={note.id}
                    className="rounded-2xl border border-[#e5e1d8] bg-white/80 backdrop-blur shadow-sm hover:shadow-md transition"
                  >
                    {/* header row */}
                    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0e9dd] text-[#8c7c68]">
                          <Stethoscope className="w-5 h-5" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-[#fcfaf6] px-3 py-1 text-sm font-medium border border-[#e7e1d6]">
                              {note.visit_date
                                ? formatDate(note.visit_date)
                                : "Ημερομηνία μη διαθέσιμη"}
                            </span>

                            {note.reason && (
                              <span className="inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-xs border border-[#e5e1d8] text-[#6b675f]">
                                Λόγος:{" "}
                                <span className="ml-1 font-medium text-[#3b3a36]">
                                  {note.reason}
                                </span>
                              </span>
                            )}

                            {note.doctor && (
                              <span className="inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-xs border border-[#e5e1d8] text-[#6b675f]">
                                Ιατρός:{" "}
                                <span className="ml-1 font-medium text-[#3b3a36]">
                                  {note.doctor}
                                </span>
                              </span>
                            )}
                          </div>

                          {!isOpen && preview.trim() && (
                            <p className="mt-2 text-sm text-[#6b675f]">
                              {preview}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() =>
                            setExpandedId((p) =>
                              p === note.id ? null : note.id
                            )
                          }
                          className="px-3 py-2 text-sm rounded-xl border border-[#e5e1d8] bg-white/70 hover:bg-white transition"
                        >
                          {isOpen ? "Σύμπτυξη" : "Λεπτομέρειες"}
                        </button>

                        <button
                          onClick={() => handleEdit(note)}
                          className="p-2 rounded-xl border border-[#e5e1d8] bg-white/70 text-[#6b675f] hover:bg-white hover:text-blue-600 transition"
                          title="Επεξεργασία"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setNoteToDelete(note.id);
                            setDeleteModalOpen(true);
                          }}
                          className="p-2 rounded-xl border border-[#e5e1d8] bg-white/70 text-[#6b675f] hover:bg-white hover:text-red-600 transition"
                          title="Διαγραφή"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* details */}
                    {isOpen && (
                      <div className="px-5 pb-5">
                        {blocks.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-[#d9d2c7] bg-[#fcfaf6] px-4 py-3 text-sm text-[#6b675f]">
                            Δεν υπάρχουν καταχωρημένες λεπτομέρειες για αυτή την
                            επίσκεψη.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {blocks.map((b) => (
                              <section
                                key={b.label}
                                className="rounded-xl border border-[#eee7db] bg-white/80 px-3 py-3 shadow-sm"
                              >
                                <p className="mb-1 flex items-center gap-2 text-xs font-semibold text-[#5f5b54]">
                                  {b.icon}
                                  {b.label}
                                </p>
                                <p className="whitespace-pre-wrap text-sm text-[#2f2e2b] leading-relaxed">
                                  {b.value}
                                </p>
                              </section>
                            ))}
                          </div>
                        )}

                        {(note.created_at || note.updated_at) && (
                          <footer className="mt-4 text-right text-[11px] text-[#8c887f]">
                            {note.updated_at ? (
                              <>
                                Τελευταία ενημέρωση:{" "}
                                {formatDateTime(note.updated_at)}
                              </>
                            ) : (
                              <>Καταχώρηση: {formatDateTime(note.created_at)}</>
                            )}
                          </footer>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Patient card modal */}
      {notesModalOpen && patient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10"
          onKeyDown={(e) => e.key === "Escape" && setNotesModalOpen(false)}
        >
          <button
            aria-label="Κλείσιμο"
            onClick={() => setNotesModalOpen(false)}
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-4xl rounded-2xl border border-[#e5e1d8] bg-white/80 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="sticky top-0 flex items-center justify-between border-b border-[#eee7db] bg-white/70 px-6 py-4 backdrop-blur">
              <h2 className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-[#2f2e2b]">
                <IdCard className="w-6 h-6 text-[#8c7c68]" />
                Καρτέλα Ασθενούς
              </h2>
              <button
                onClick={() => setNotesModalOpen(false)}
                className="rounded-xl px-3 py-2 text-sm text-[#6b675f] hover:bg-white/70"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto px-6 sm:px-8 py-6 space-y-8">
              <section>
                <h3 className="mb-3 text-sm font-semibold text-[#5f5b54]">
                  Στοιχεία Ασθενούς
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {[
                    ["Ονοματεπώνυμο", fullName],
                    ["ΑΜΚΑ", patient.amka],
                    ["Email", patient.email],
                    ["Τηλέφωνο", patient.phone],
                    ["Ημ. Γέννησης", formatDate(patient.birth_date)],
                    ["Ηλικία", age],
                    ["Φύλο", patient.gender],
                    ["Επάγγελμα", patient.occupation],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-[#eee7db] bg-white/80 px-3 py-2 shadow-sm"
                    >
                      <dt className="text-xs text-[#8c887f]">{label}</dt>
                      <dd className="font-medium text-[#2f2e2b]">
                        {value || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-[#5f5b54]">
                  Ιστορικό & Συνήθειες
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {[
                    ["Ημ. Πρώτης Επίσκεψης", firstVisitDate],
                    ["Οικογενειακή Κατάσταση", patient.marital_status],
                    ["Τέκνα", patient.children],
                    ["Κάπνισμα", patient.smoking],
                    ["Αλκοόλ", patient.alcohol],
                    ["Φάρμακα", patient.medications],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-[#eee7db] bg-white/80 px-3 py-2 shadow-sm"
                    >
                      <dt className="text-xs text-[#8c887f]">{label}</dt>
                      <dd className="font-medium text-[#2f2e2b]">
                        {value || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-[#5f5b54]">
                  Κλινικές Πληροφορίες
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {patient.gender?.toLowerCase() !== "άνδρας" && (
                    <div className="rounded-xl border border-[#eee7db] bg-white/80 px-3 py-2 shadow-sm">
                      <dt className="text-xs text-[#8c887f]">
                        Γυναικολογικό Ιστορικό
                      </dt>
                      <dd className="font-medium text-[#2f2e2b]">
                        {patient.gynecological_history || "—"}
                      </dd>
                    </div>
                  )}
                  {[
                    ["Κληρονομικό Ιστορικό", patient.hereditary_history],
                    ["Παρούσα Νόσος", patient.current_disease],
                    ["Αντικειμενική Εξέταση", patient.physical_exam],
                    ["Παρακλινικός Έλεγχος", patient.preclinical_screening],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-[#eee7db] bg-white/80 px-3 py-2 shadow-sm"
                    >
                      <dt className="text-xs text-[#8c887f]">{label}</dt>
                      <dd className="font-medium text-[#2f2e2b]">
                        {value || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-[#5f5b54]">
                  Σημειώσεις
                </h3>
                <div className="rounded-xl border border-[#eee7db] bg-[#fcfaf6]/70 px-4 py-3 shadow-sm text-sm text-[#3b3a36]">
                  {patient.notes?.trim() || "Δεν υπάρχουν σημειώσεις."}
                </div>
              </section>

              <p className="text-right text-xs text-[#8c887f]">
                Τελευταία ενημέρωση: {formatDateTime(patient.updated_at)}
              </p>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[#eee7db] bg-white/70 px-6 py-4 backdrop-blur">
              <button
                onClick={() => setNotesModalOpen(false)}
                className="rounded-xl border border-[#e5e1d8] bg-white/70 px-4 py-2 text-sm text-[#3b3a36] hover:bg-white"
              >
                Κλείσιμο
              </button>
              <button
                onClick={() => {
                  setNotesModalOpen(false);
                  router.push(`/admin/patients/${patient.id}`);
                }}
                className="rounded-xl bg-[#8c7c68] px-4 py-2 text-sm text-white hover:bg-[#6f6253]"
              >
                Επεξεργασία
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / edit visit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm overflow-y-auto py-10 px-4"
          onKeyDown={(e) => e.key === "Escape" && closeVisitModal()}
        >
          <div className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl w-full max-w-xl border border-[#e5e1d8]">
            <h2 className="text-xl font-semibold text-center mb-6 text-[#2f2e2b] flex items-center justify-center gap-2">
              {editMode ? (
                <Pencil className="w-5 h-5" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              {editMode ? "Επεξεργασία Επίσκεψης" : "Καταχώρηση Νέας Επίσκεψης"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5f5b54] mb-1">
                  Ημερομηνία Επίσκεψης <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newVisit.visit_date}
                  onChange={(e) =>
                    setNewVisit((p) => ({ ...p, visit_date: e.target.value }))
                  }
                  className="block w-full rounded-xl border-[#e5e1d8] bg-white/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#cbbba6] text-sm px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#5f5b54] mb-1">
                    Αντικειμενική Εξέταση
                  </label>
                  <textarea
                    rows={4}
                    value={newVisit.physical_exam}
                    onChange={(e) =>
                      setNewVisit((p) => ({
                        ...p,
                        physical_exam: e.target.value,
                      }))
                    }
                    className="block w-full rounded-xl border-[#e5e1d8] bg-white/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#cbbba6] text-sm px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5f5b54] mb-1">
                    Παρακλινικός Έλεγχος
                  </label>
                  <textarea
                    rows={4}
                    value={newVisit.preclinical_screening}
                    onChange={(e) =>
                      setNewVisit((p) => ({
                        ...p,
                        preclinical_screening: e.target.value,
                      }))
                    }
                    className="block w-full rounded-xl border-[#e5e1d8] bg-white/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#cbbba6] text-sm px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5f5b54] mb-1">
                  Σημειώσεις
                </label>
                <textarea
                  rows={5}
                  value={newVisit.notes}
                  onChange={(e) =>
                    setNewVisit((p) => ({ ...p, notes: e.target.value }))
                  }
                  className="block w-full rounded-xl border-[#e5e1d8] bg-white/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#cbbba6] text-sm px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={closeVisitModal}
                disabled={saving}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-[#e5e1d8] bg-white/70 text-[#3b3a36] hover:bg-white",
                  saving && "opacity-60 cursor-not-allowed"
                )}
              >
                <XCircle className="w-4 h-4" /> Ακύρωση
              </button>

              <button
                onClick={handleSubmit}
                disabled={!newVisit.visit_date || saving}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-[#8c7c68] text-white hover:bg-[#6f6253] shadow",
                  (!newVisit.visit_date || saving) &&
                    "opacity-60 cursor-not-allowed"
                )}
              >
                <Save className="w-4 h-4" />
                {saving
                  ? "Αποθήκευση..."
                  : editMode
                  ? "Αποθήκευση"
                  : "Καταχώρηση"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm px-4 py-10">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-[#e5e1d8]">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="text-red-500 w-6 h-6" />
              <h2 className="text-lg font-semibold text-[#2f2e2b]">
                Επιβεβαίωση Διαγραφής
              </h2>
            </div>
            <p className="text-sm text-[#6b675f] mb-6">
              Είστε σίγουροι ότι θέλετε να διαγράψετε αυτήν την επίσκεψη; Η
              ενέργεια δεν μπορεί να αναιρεθεί.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className={cn(
                  "px-4 py-2 text-sm rounded-xl border border-[#e5e1d8] bg-white/70 hover:bg-white",
                  deleting && "opacity-60 cursor-not-allowed"
                )}
              >
                Ακύρωση
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={cn(
                  "px-4 py-2 text-sm rounded-xl bg-red-500 text-white hover:bg-red-600",
                  deleting && "opacity-60 cursor-not-allowed"
                )}
              >
                {deleting ? "Διαγραφή..." : "Διαγραφή"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
