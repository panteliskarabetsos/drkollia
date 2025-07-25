'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { supabase } from '../../../../lib/supabaseClient';
import { Plus, Stethoscope, FileText, NotebookPen, X } from 'lucide-react';

export default function PatientHistoryPage() {
  const { id } = useParams();

  const [visitNotes, setVisitNotes] = useState([]);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
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

  const handleSubmit = async () => {
    if (!newVisit.visit_date) return;

    const { error } = await supabase.from('visit_notes').insert({
      ...newVisit,
      patient_id: id,
    });

    if (!error) {
      setModalOpen(false);
      setNewVisit({ visit_date: '', physical_exam: '', preclinical_screening: '', notes: '' });
      const { data } = await supabase
        .from('visit_notes')
        .select('*')
        .eq('patient_id', id)
        .order('visit_date', { ascending: false });
      setVisitNotes(data);
    }
  };

  if (loading) return <main className="p-10">Φόρτωση ιστορικού...</main>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f9f9f9] via-[#f4f1ec] to-[#e8e5de] px-6 py-12">
      <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-xl p-6 md:p-10">

        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 mb-1">Ιστορικό Επισκέψεων</h1>
            <p className="text-sm text-gray-500">Ασθενής: <strong>{patient?.full_name}</strong></p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-[#8c7c68] hover:bg-[#6f6253] text-white text-sm px-4 py-2 rounded-xl shadow transition"
          >
            <Plus className="w-4 h-4" />
            Καταχώρηση Επίσκεψης
          </button>
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

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-lg w-full relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setModalOpen(false)}
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold mb-4 text-center">Καταχώρηση Νέας Επίσκεψης</h2>

            <div className="flex flex-col gap-4 text-sm">
              <div>
                <label className="block text-gray-600 mb-1">Ημερομηνία</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={newVisit.visit_date}
                  onChange={(e) => setNewVisit({ ...newVisit, visit_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Αντικειμενική Εξέταση</label>
                <textarea
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows="3"
                  value={newVisit.physical_exam}
                  onChange={(e) => setNewVisit({ ...newVisit, physical_exam: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Παρακλινικός Έλεγχος</label>
                <textarea
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows="3"
                  value={newVisit.preclinical_screening}
                  onChange={(e) => setNewVisit({ ...newVisit, preclinical_screening: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Σημειώσεις</label>
                <textarea
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows="3"
                  value={newVisit.notes}
                  onChange={(e) => setNewVisit({ ...newVisit, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={handleSubmit}
                className="bg-[#8c7c68] text-white px-5 py-2 rounded-xl hover:bg-[#6f6253] transition"
              >
                Αποθήκευση
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
