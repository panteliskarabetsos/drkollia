'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaEdit, FaTrash, FaStickyNote } from 'react-icons/fa';

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
      } else {
        await fetchPatients();
      }
    };
    checkAuthAndFetch();
  }, []);

  useEffect(() => {
    const results = patients.filter((p) => {
      const query = search.toLowerCase();
      return (
        p.full_name.toLowerCase().includes(query) ||
        p.amka?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query) ||
        p.phone?.toLowerCase().includes(query)
      );
    });
    setFiltered(results);
  }, [search, patients]);

  const fetchPatients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setPatients(data);
    setLoading(false);
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `(${age} ετών)`;
  };

  const handleViewNotes = (patient) => {
    setSelectedPatient(patient);
    setEditedNotes(patient.notes || '');
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
      .from('patients')
      .delete()
      .eq('id', patientToDelete.id);

    if (!error) {
      await fetchPatients(); // await added
      setSearch(''); // reset search to refresh filtered list
    }

    setDeleteModalOpen(false);
    setPatientToDelete(null);
  };


  const handleSaveNotes = async () => {
    if (!selectedPatient) return;
    const { error } = await supabase
      .from('patients')
      .update({ notes: editedNotes })
      .eq('id', selectedPatient.id);
    if (!error) {
      setPatients((prev) =>
        prev.map((p) => p.id === selectedPatient.id ? { ...p, notes: editedNotes } : p)
      );
      setNotesModalOpen(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fdfaf6] text-[#3b3a36]">
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#8c7c68]"
          >
            <FaArrowLeft className="text-xs" />
            <span>Επιστροφή στο Dashboard</span>
          </button>
          <button
            onClick={() => router.push('/admin/patients/new')}
            className="px-4 py-2 bg-[#8c7c68] text-white rounded-md hover:bg-[#6f6253]"
          >
            + Νέος Ασθενής
          </button>
        </div>

        <input
          type="text"
          placeholder="Αναζήτηση με όνομα, ΑΜΚΑ, email ή τηλέφωνο..."
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#8c7c68] mb-6"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <p className="text-center text-gray-500">Φόρτωση...</p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase tracking-wide text-xs">
                <tr>
                  {['Όνομα', 'ΑΜΚΑ', 'Ημ. Γέννησης', 'Ηλικία', 'Φύλο', 'Τηλέφωνο', 'Email', 'Ενέργειες'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{p.full_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{p.amka || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{p.birth_date || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{p.birth_date ? calculateAge(p.birth_date) : '-'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {p.gender === 'male' ? 'Άνδρας' : p.gender === 'female' ? 'Γυναίκα' : 'Άλλο'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{p.phone}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{p.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewNotes(p)}
                          title="Σημειώσεις"
                          className="p-2 rounded-full hover:bg-blue-100"
                        >
                          <FaStickyNote className="text-blue-500 hover:text-blue-700 text-sm" />
                        </button>
                        <button
                          onClick={() => handleEdit(p)}
                          title="Επεξεργασία"
                          className="p-2 rounded-full hover:bg-green-100"
                        >
                          <FaEdit className="text-green-500 hover:text-green-700 text-sm" />
                        </button>
                        <button
                            onClick={() => handleDelete(p)}
                            title="Διαγραφή"
                            className="p-2 rounded-full hover:bg-red-100"
                          >
                            <FaTrash className="text-red-500 hover:text-red-700 text-sm" />
                          </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {notesModalOpen && selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-10">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-3xl mx-4">
              <h2 className="text-xl font-semibold mb-4 text-center">Στοιχεία Ασθενούς</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <p><strong>Ονοματεπώνυμο:</strong> {selectedPatient.full_name}</p>
                <p><strong>ΑΜΚΑ:</strong> {selectedPatient.amka || '-'}</p>
                <p><strong>Email:</strong> {selectedPatient.email || '-'}</p>
                <p><strong>Τηλέφωνο:</strong> {selectedPatient.phone || '-'}</p>
                <p><strong>Ημ. Γέννησης:</strong> {selectedPatient.birth_date || '-'}</p>
                <p><strong>Ηλικία:</strong> {calculateAge(selectedPatient.birth_date)}</p>
                <p><strong>Φύλο:</strong> {selectedPatient.gender || '-'}</p>
                <p><strong>Επάγγελμα:</strong> {selectedPatient.occupation || '-'}</p>
                <p><strong>Ημ. Πρώτης Επίσκεψης:</strong> {selectedPatient.first_visit_date || '-'}</p>
                <p><strong>Οικογενειακή Κατάσταση:</strong> {selectedPatient.marital_status || '-'}</p>
                <p><strong>Τέκνα:</strong> {selectedPatient.children || '-'}</p>
                <p><strong>Κάπνισμα:</strong> {selectedPatient.smoking || '-'}</p>
                <p><strong>Αλκοόλ:</strong> {selectedPatient.alcohol || '-'}</p>
                <p><strong>Φάρμακα:</strong> {selectedPatient.medications || '-'}</p>
                <p><strong>Γυναικολογικό Ιστορικό:</strong> {selectedPatient.gynecological_history || '-'}</p>
                <p><strong>Κληρονομικό Ιστορικό:</strong> {selectedPatient.hereditary_history || '-'}</p>
                <p><strong>Παρούσα Νόσος:</strong> {selectedPatient.current_disease || '-'}</p>
                <p><strong>Αντικειμενική Εξέταση:</strong> {selectedPatient.physical_exam || '-'}</p>
                <p><strong>Προκλινικός Έλεγχος:</strong> {selectedPatient.preclinical_screening || '-'}</p>
              </div>
              <div className="mt-6 text-sm bg-gray-50 p-4 rounded">
                <p><strong>Σημειώσεις:</strong></p>
                <p className="whitespace-pre-wrap text-gray-600 mt-2">{selectedPatient.notes?.trim() || 'Δεν υπάρχουν σημειώσεις.'}</p>
              </div>
              <p className="mt-4 text-xs text-gray-400 text-right">
                Τελευταία ενημέρωση: {selectedPatient.updated_at ? new Date(selectedPatient.updated_at).toLocaleString('el-GR') : '-'}
              </p>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setNotesModalOpen(false)}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                >Κλείσιμο</button>
                <button
                  onClick={() => {
                    setNotesModalOpen(false);
                    router.push(`/admin/patients/${selectedPatient.id}`);
                  }}
                  className="px-4 py-2 text-sm bg-[#8c7c68] text-white rounded hover:bg-[#6f6253]"
                >Επεξεργασία</button>
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
            <p className="text-sm text-gray-600 text-center mb-6">
              Είστε σίγουρος/η ότι θέλετε να διαγράψετε τον ασθενή{' '}
              <span className="font-medium text-red-600">{patientToDelete.full_name}</span>;
            </p>
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
