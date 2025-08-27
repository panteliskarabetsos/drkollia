"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { supabase } from "../../../../lib/supabaseClient";
import {
  Plus,
  Stethoscope,
  FileText,
  NotebookPen,
  X,
  Trash2,
  Pencil,
  ArrowLeft,
  StickyNote,
  Save,
  XCircle,
  AlertTriangle,
  IdCard,
  BookText,
} from "lucide-react";

export default function PatientHistoryPage() {
  const { id } = useParams();
  const router = useRouter();

  const [visitNotes, setVisitNotes] = useState([]);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [newVisit, setNewVisit] = useState({
    visit_date: "",
    physical_exam: "",
    preclinical_screening: "",
    notes: "",
  });
  const checkAuthAndFetch = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    const { data: patientData } = await supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .single();
    setPatient(patientData);

    const { data: notesData } = await supabase
      .from("visit_notes")
      .select("*")
      .eq("patient_id", id)
      .order("visit_date", { ascending: false });
    setVisitNotes(notesData);

    setLoading(false);
  };

  useEffect(() => {
    if (!id) return;

    checkAuthAndFetch();
  }, [id]);

  const refreshNotes = async () => {
    const { data } = await supabase
      .from("visit_notes")
      .select("*")
      .eq("patient_id", id)
      .order("visit_date", { ascending: false });
    setVisitNotes(data);
  };

  const handleSubmit = async () => {
    if (!newVisit.visit_date) return;

    if (editMode && editingId) {
      await supabase
        .from("visit_notes")
        .update({
          ...newVisit,
        })
        .eq("id", editingId);
    } else {
      await supabase.from("visit_notes").insert({
        ...newVisit,
        patient_id: id,
      });
    }

    setModalOpen(false);
    setEditMode(false);
    setEditingId(null);
    setNewVisit({
      visit_date: "",
      physical_exam: "",
      preclinical_screening: "",
      notes: "",
    });
    refreshNotes();
  };

  const handleEdit = (note) => {
    setNewVisit({
      visit_date: note.visit_date.split("T")[0],
      physical_exam: note.physical_exam,
      preclinical_screening: note.preclinical_screening,
      notes: note.notes,
    });
    setEditingId(note.id);
    setEditMode(true);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!noteToDelete) return;
    await supabase.from("visit_notes").delete().eq("id", noteToDelete);
    setDeleteModalOpen(false);
    setNoteToDelete(null);
    refreshNotes();
  };

  const formatDate = (date) =>
    date ? format(new Date(date), "dd/MM/yyyy") : "-";

  const calculateAge = (birthDate) => {
    if (!birthDate) return "-";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDateTime = (date) =>
    date ? format(new Date(date), "dd/MM/yyyy HH:mm") : "-";

  if (loading) return <main className="p-10">Φόρτωση ιστορικού...</main>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f9f9f9] via-[#f4f1ec] to-[#e8e5de] px-6 py-22">
      <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-xl p-6 md:p-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 mb-1">
              Ιστορικό Επισκέψεων
            </h1>
            <p className="text-sm text-gray-500">
              Ασθενής:{" "}
              <strong>
                {`${patient?.first_name || ""} ${
                  patient?.last_name || ""
                }`.trim()}
              </strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-3 md:ml-auto">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Πίσω
            </button>
            <button
              onClick={() => setNotesModalOpen(true)}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-[#c1b4a2] text-[#8c7c68] hover:bg-[#f3f0eb] transition"
            >
              <StickyNote className="w-4 h-4" /> Καρτέλα Ασθενούς
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 bg-[#8c7c68] hover:bg-[#6f6253] text-white text-sm px-4 py-2 rounded-xl shadow transition"
            >
              <Plus className="w-4 h-4" /> Καταχώρηση Επίσκεψης
            </button>
          </div>
        </div>

        {visitNotes.length === 0 ? (
          <p className="text-center text-gray-500">
            Δεν υπάρχουν καταχωρημένες επισκέψεις.
          </p>
        ) : (
          <div className="space-y-8">
            {visitNotes.map((note) => {
              const items = [
                {
                  label: "Αντικειμενική Εξέταση",
                  icon: <FileText className="w-4 h-4" />,
                  color: "text-blue-600",
                  value: note.physical_exam,
                },
                {
                  label: "Παρακλινικός Έλεγχος",
                  icon: <NotebookPen className="w-4 h-4" />,
                  color: "text-amber-600",
                  value: note.preclinical_screening,
                },
                {
                  label: "Σημειώσεις",
                  icon: <NotebookPen className="w-4 h-4" />,
                  color: "text-green-600",
                  value: note.notes,
                },
              ].filter(
                ({ value }) => (value ?? "").toString().trim().length > 0
              );

              return (
                <article
                  key={note.id}
                  className="group relative overflow-hidden rounded-2xl border border-[#e5e1d8] bg-white shadow-sm transition hover:shadow-md hover:bg-[#fdfcfb]"
                >
                  {/* timeline spine */}
                  <div className="absolute left-4 top-0 bottom-0 hidden sm:block">
                    <div className="h-full w-px bg-gradient-to-b from-[#d9d2c7] via-[#eee7db] to-transparent" />
                  </div>
                  <div className="absolute left-3 top-6 hidden sm:block">
                    <span className="block h-3 w-3 rounded-full bg-[#8c7c68] ring-2 ring-white shadow" />
                  </div>

                  <div className="p-5 sm:pl-12">
                    {/* Header */}
                    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                      <h2 className="flex items-center gap-2 text-base font-semibold text-[#2f2e2b]">
                        <Stethoscope className="w-5 h-5 text-[#8c7c68]" />
                        <span className="inline-flex items-center rounded-full bg-[#fcfaf6] px-3 py-1 text-sm font-medium border border-[#e7e1d6]">
                          {format(new Date(note.visit_date), "dd/MM/yyyy")}
                        </span>
                      </h2>
                      <div className="flex items-center gap-2">
                        {note.doctor && (
                          <span className="text-xs text-[#6b675f] bg-[#f6f3ee] border border-[#e7e1d6] px-2.5 py-1 rounded-full">
                            {note.doctor}
                          </span>
                        )}
                        <button
                          onClick={() => handleEdit(note)}
                          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition"
                          title="Επεξεργασία"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setNoteToDelete(note.id);
                            setDeleteModalOpen(true);
                          }}
                          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
                          title="Διαγραφή"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </header>

                    {/* Content */}
                    {items.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-[#ddd5c9] bg-[#fcfaf6] px-4 py-3 text-sm text-[#6b675f]">
                        Δεν υπάρχουν καταχωρημένες λεπτομέρειες για αυτή την
                        επίσκεψη.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {items.map(({ label, icon, color, value }) => (
                          <section
                            key={label}
                            className="rounded-xl border border-[#eee7db] bg-white px-3 py-2 shadow-sm"
                          >
                            <p
                              className={`mb-1 flex items-center gap-2 text-xs font-medium ${color}`}
                            >
                              {icon}
                              {label}
                            </p>
                            <p className="whitespace-pre-wrap text-sm text-[#3b3a36] leading-relaxed">
                              {value}
                            </p>
                          </section>
                        ))}
                      </div>
                    )}

                    {/* Footer meta */}
                    {(note.created_at || note.updated_at) && (
                      <footer className="mt-4 text-right text-[11px] text-[#8c887f]">
                        {note.updated_at ? (
                          <>
                            Τελευταία ενημέρωση:{" "}
                            {format(
                              new Date(note.updated_at),
                              "dd/MM/yyyy HH:mm"
                            )}
                          </>
                        ) : (
                          <>
                            Καταχώρηση:{" "}
                            {format(
                              new Date(note.created_at),
                              "dd/MM/yyyy HH:mm"
                            )}
                          </>
                        )}
                      </footer>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {notesModalOpen && patient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
          {/* Overlay */}
          <button
            aria-label="Κλείσιμο"
            onClick={() => setNotesModalOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Card */}
          <div className="relative w-full max-w-4xl rounded-2xl border border-[#e5e1d8] bg-gradient-to-b from-white/95 to-[#fdfcf9]/90 shadow-2xl backdrop-blur-xl overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-[#eee7db] bg-white/80 px-6 py-4 backdrop-blur">
              <h2 className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-[#2f2e2b]">
                <IdCard className="w-6 h-6 text-[#8c7c68]" />
                Καρτέλα Ασθενούς
              </h2>
              <button
                onClick={() => setNotesModalOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-[#6b675f] hover:bg-[#f3f0ea]"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[75vh] overflow-auto px-6 sm:px-8 py-6 space-y-8">
              {/* Contact Info */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-[#5f5b54]">
                  Στοιχεία Ασθενούς
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {[
                    [
                      "Ονοματεπώνυμο",
                      `${patient.first_name} ${patient.last_name}`,
                    ],
                    ["ΑΜΚΑ", patient.amka],
                    ["Email", patient.email],
                    ["Τηλέφωνο", patient.phone],
                    ["Ημ. Γέννησης", formatDate(patient.birth_date)],
                    ["Ηλικία", calculateAge(patient.birth_date)],
                    ["Φύλο", patient.gender],
                    ["Επάγγελμα", patient.occupation],
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
                <h3 className="mb-3 text-sm font-semibold text-[#5f5b54]">
                  Ιστορικό & Συνήθειες
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {[
                    [
                      "Ημ. Πρώτης Επίσκεψης",
                      formatDate(patient.first_visit_date),
                    ],
                    ["Οικογενειακή Κατάσταση", patient.marital_status],
                    ["Τέκνα", patient.children],
                    ["Κάπνισμα", patient.smoking],
                    ["Αλκοόλ", patient.alcohol],
                    ["Φάρμακα", patient.medications],
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
                <h3 className="mb-3 text-sm font-semibold text-[#5f5b54]">
                  Κλινικές Πληροφορίες
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {patient.gender?.toLowerCase() !== "άνδρας" && (
                    <div className="rounded-xl border border-[#eee7db] bg-white px-3 py-2 shadow-sm">
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
                  {patient.notes?.trim() || "Δεν υπάρχουν σημειώσεις."}
                </div>
              </section>

              {/* Updated At */}
              <p className="text-right text-xs text-[#8c887f]">
                Τελευταία ενημέρωση: {formatDateTime(patient.updated_at)}
              </p>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[#eee7db] bg-white/80 px-6 py-4 backdrop-blur">
              <button
                onClick={() => setNotesModalOpen(false)}
                className="rounded-xl border border-[#e5e1d8] bg-white px-4 py-2 text-sm text-[#3b3a36] hover:bg-[#f6f3ee]"
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-10 px-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-xl border border-gray-200">
            <h2 className="text-xl font-semibold text-center mb-6 text-[#4b3f30] flex items-center justify-center gap-2">
              {editMode ? (
                <Pencil className="w-5 h-5" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              {editMode ? "Επεξεργασία Επίσκεψης" : "Καταχώρηση Νέας Επίσκεψης"}
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ημερομηνία Επίσκεψης
                </label>
                <input
                  type="date"
                  value={newVisit.visit_date}
                  onChange={(e) =>
                    setNewVisit({ ...newVisit, visit_date: e.target.value })
                  }
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#8c7c68] focus:ring-[#8c7c68] text-sm px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Αντικειμενική Εξέταση
                </label>
                <textarea
                  rows={3}
                  value={newVisit.physical_exam}
                  onChange={(e) =>
                    setNewVisit({ ...newVisit, physical_exam: e.target.value })
                  }
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#8c7c68] focus:ring-[#8c7c68] text-sm px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Παρακλινικός Έλεγχος
                </label>
                <textarea
                  rows={3}
                  value={newVisit.preclinical_screening}
                  onChange={(e) =>
                    setNewVisit({
                      ...newVisit,
                      preclinical_screening: e.target.value,
                    })
                  }
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#8c7c68] focus:ring-[#8c7c68] text-sm px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Σημειώσεις
                </label>
                <textarea
                  rows={4}
                  value={newVisit.notes}
                  onChange={(e) =>
                    setNewVisit({ ...newVisit, notes: e.target.value })
                  }
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#8c7c68] focus:ring-[#8c7c68] text-sm px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setEditMode(false);
                  setEditingId(null);
                  setNewVisit({
                    visit_date: "",
                    physical_exam: "",
                    preclinical_screening: "",
                    notes: "",
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <XCircle className="w-4 h-4" /> Ακύρωση
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-[#8c7c68] text-white rounded-lg hover:bg-[#6f6253] shadow"
              >
                <Save className="w-4 h-4" />{" "}
                {editMode ? "Αποθήκευση" : "Καταχώρηση"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-10">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-500 w-6 h-6" />
              <h2 className="text-lg font-semibold text-gray-800">
                Επιβεβαίωση Διαγραφής
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Είστε σίγουροι ότι θέλετε να διαγράψετε αυτήν την επίσκεψη; Η
              ενέργεια δεν μπορεί να αναιρεθεί.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Ακύρωση
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
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
