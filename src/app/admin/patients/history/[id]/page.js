'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { supabase } from '../../../../lib/supabaseClient';
import { Plus, Stethoscope, FileText, NotebookPen, X, Trash2, Pencil, ArrowLeft, StickyNote } from 'lucide-react';

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
  const [newVisit, setNewVisit] = useState({
    visit_date: '',
    physical_exam: '',
    preclinical_screening: '',
    notes: ''
  });

  useEffect(() => {
    if (!id) return;

    const fetchHistory = async () => {
      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      const { data: notesData } = await supabase
        .from('visit_notes')
        .select('*')
        .eq('patient_id', id)
        .order('visit_date', { ascending: false });

      setPatient(patientData);
      setVisitNotes(notesData);
      setLoading(false);
    };

    fetchHistory();
  }, [id]);

  const refreshNotes = async () => {
    const { data } = await supabase
      .from('visit_notes')
      .select('*')
      .eq('patient_id', id)
      .order('visit_date', { ascending: false });
    setVisitNotes(data);
  };

  const handleSubmit = async () => {
    if (!newVisit.visit_date) return;

    if (editMode && editingId) {
      await supabase.from('visit_notes').update({
        ...newVisit
      }).eq('id', editingId);
    } else {
      await supabase.from('visit_notes').insert({
        ...newVisit,
        patient_id: id,
      });
    }

    setModalOpen(false);
    setEditMode(false);
    setEditingId(null);
    setNewVisit({ visit_date: '', physical_exam: '', preclinical_screening: '', notes: '' });
    refreshNotes();
  };

  const handleEdit = (note) => {
    setNewVisit({
      visit_date: note.visit_date.split('T')[0],
      physical_exam: note.physical_exam,
      preclinical_screening: note.preclinical_screening,
      notes: note.notes
    });
    setEditingId(note.id);
    setEditMode(true);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Να διαγραφεί η επίσκεψη;')) {
      await supabase.from('visit_notes').delete().eq('id', id);
      refreshNotes();
    }
  };

  const formatDate = (date) => date ? format(new Date(date), 'dd/MM/yyyy') : '-';

  const calculateAge = (birthDate) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDateTime = (date) => date ? format(new Date(date), 'dd/MM/yyyy HH:mm') : '-';

  if (loading) return <main className="p-10">Φόρτωση ιστορικού...</main>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f9f9f9] via-[#f4f1ec] to-[#e8e5de] px-6 py-22">
      <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-xl p-6 md:p-10">

    
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 mb-1">Ιστορικό Επισκέψεων</h1>
            <p className="text-sm text-gray-500">Ασθενής: <strong>{patient?.full_name}</strong></p>
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
              <StickyNote className="w-4 h-4" /> Στοιχεία Ασθενούς
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
          <p className="text-center text-gray-500">Δεν υπάρχουν καταχωρημένες επισκέψεις.</p>
        ) : (
          <div className="space-y-6">
            {visitNotes.map((note) => (
              <div key={note.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-[#8c7c68]" />
                    Επίσκεψη στις {format(new Date(note.visit_date), 'dd/MM/yyyy')}
                  </h2>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(note)} title="Επεξεργασία" className="p-2 rounded-full hover:bg-gray-100">
                      <Pencil className="w-4 h-4 text-blue-600" />
                    </button>
                    <button onClick={() => handleDelete(note.id)} title="Διαγραφή" className="p-2 rounded-full hover:bg-gray-100">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-700 space-y-3">
                  <div>
                    <p className="font-semibold flex items-center gap-2 text-[#444]">
                      <FileText className="w-4 h-4 text-blue-500" />
                      Αντικειμενική Εξέταση:
                    </p>
                    <p className="pl-6 text-gray-600 whitespace-pre-wrap">{note.physical_exam || '—'}</p>
                  </div>

                  <div>
                    <p className="font-semibold flex items-center gap-2 text-[#444]">
                      <NotebookPen className="w-4 h-4 text-amber-500" />
                      Παρακλινικός Έλεγχος:
                    </p>
                    <p className="pl-6 text-gray-600 whitespace-pre-wrap">{note.preclinical_screening || '—'}</p>
                  </div>

                  <div>
                    <p className="font-semibold flex items-center gap-2 text-[#444]">
                      <NotebookPen className="w-4 h-4 text-green-500" />
                      Σημειώσεις:
                    </p>
                    <p className="pl-6 text-gray-600 whitespace-pre-wrap">{note.notes || '—'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

   {notesModalOpen && patient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-10">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-3xl mx-4">
              <h2 className="text-lg font-semibold text-center mb-4 flex items-center justify-center gap-2">
                <StickyNote className="text-[#8c7c68] w-5 h-5" />
                Στοιχεία Ασθενούς
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <p><strong>Ονοματεπώνυμο:</strong> {patient.full_name}</p>
                <p><strong>ΑΜΚΑ:</strong> {patient.amka || '-'}</p>
                <p><strong>Email:</strong> {patient.email || '-'}</p>
                <p><strong>Τηλέφωνο:</strong> {patient.phone || '-'}</p>
                <p><strong>Ημ. Γέννησης:</strong> {formatDate(patient.birth_date)}</p>
                <p><strong>Ηλικία:</strong> {calculateAge(patient.birth_date)}</p>
                <p><strong>Φύλο:</strong> {patient.gender || '-'}</p>
                <p><strong>Επάγγελμα:</strong> {patient.occupation || '-'}</p>
                <p><strong>Ημ. Πρώτης Επίσκεψης:</strong> {formatDate(patient.first_visit_date)}</p>
                <p><strong>Οικογενειακή Κατάσταση:</strong> {patient.marital_status || '-'}</p>
                <p><strong>Τέκνα:</strong> {patient.children || '-'}</p>
                <p><strong>Κάπνισμα:</strong> {patient.smoking || '-'}</p>
                <p><strong>Αλκοόλ:</strong> {patient.alcohol || '-'}</p>
                <p><strong>Φάρμακα:</strong> {patient.medications || '-'}</p>
                <p><strong>Γυναικολογικό Ιστορικό:</strong> {patient.gynecological_history || '-'}</p>
                <p><strong>Κληρονομικό Ιστορικό:</strong> {patient.hereditary_history || '-'}</p>
                <p><strong>Παρούσα Νόσος:</strong> {patient.current_disease || '-'}</p>
                <p><strong>Αντικειμενική Εξέταση:</strong> {patient.physical_exam || '-'}</p>
                <p><strong>Παράκλινικός Έλεγχος:</strong> {patient.preclinical_screening || '-'}</p>
              </div>
              <div className="mt-6 text-sm bg-gray-50 p-4 rounded">
                <p><strong>Σημειώσεις:</strong></p>
                <p className="whitespace-pre-wrap text-gray-600 mt-2">{patient.notes?.trim() || 'Δεν υπάρχουν σημειώσεις.'}</p>
              </div>
              <p className="mt-4 text-xs text-gray-400 text-right">
                Τελευταία ενημέρωση: {formatDateTime(patient.updated_at)}
              </p>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setNotesModalOpen(false)}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                >Κλείσιμο</button>
                <button
                  onClick={() => {
                    setNotesModalOpen(false);
                    router.push(`/admin/patients/${patient.id}`);
                  }}
                  className="px-4 py-2 text-sm bg-[#8c7c68] text-white rounded hover:bg-[#6f6253]"
                >Επεξεργασία</button>
              </div>
            </div>
          </div>
        )}
      
    </main>
  );
}
