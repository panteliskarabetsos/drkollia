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
  const [form, setForm] = useState({
    full_name: '',
    amka: '',
    email: '',
    phone: '',
    birth_date: '',
    gender: '',
    notes: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);


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

  // ✅ Απλό search hook (δεν αλλάζει σειρά)
  useEffect(() => {
    const results = patients.filter((p) =>
      p.full_name.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(results);
  }, [search, patients]);

  const fetchPatients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching patients:', error.message);
    } else {
      setPatients(data);
    }
    setLoading(false);
  };



  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `(${age} ετών)`;
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      full_name: '',
      amka: '',
      email: '',
      phone: '',
      birth_date: '',
      gender: '',
      notes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

    const handleSubmit = (e) => {
        e.preventDefault();
        setMessage(null);

        const requiredFields = ['full_name', 'amka', 'phone', 'email', 'birth_date', 'gender'];
        const missingFields = requiredFields.filter((field) => !form[field]?.trim());

        if (missingFields.length > 0) {
            setShowIncompleteModal(true);
            setPendingSubmit(true);
            return;
        }

        // If all required, proceed
        proceedSubmission();
        };


  const handleEdit = (patient) => {
        setForm(patient);
        setEditingId(patient.id);
        setMessage(null);
        setShowForm(true);
    };

        const handleDelete = (patient) => {
        setPatientToDelete(patient);
        setDeleteModalOpen(true);
    };

    const proceedSubmission = async () => {
        setSubmitting(true);
        setShowIncompleteModal(false);

        // Αντικαθιστούμε κενή ημερομηνία με null
        const cleanedForm = {
            ...form,
            birth_date: form.birth_date?.trim() === '' ? null : form.birth_date,
            gender: form.gender?.trim() === '' ? null : form.gender,
        };

        // Βασικός client-side έλεγχος
        if (!cleanedForm.full_name.trim()) {
            setMessage({ type: 'error', text: 'Το όνομα είναι υποχρεωτικό.' });
            setSubmitting(false);
            return;
        }

        let error;
        if (editingId) {
            ({ error } = await supabase
            .from('patients')
            .update(cleanedForm)
            .eq('id', editingId));
        } else {
            ({ error } = await supabase
            .from('patients')
            .insert([cleanedForm]));
        }

        if (error) {
            let msg = 'Σφάλμα κατά την αποθήκευση.';
            if (error.message.includes('invalid input syntax for type date')) {
            msg = 'Η ημερομηνία δεν είναι έγκυρη.';
            } else if (error.message.includes('patients_gender_check')) {
            msg = 'Το φύλο πρέπει να είναι Άνδρας, Γυναίκα ή Άλλο.';
            } else if (error.message.includes('null value in column "full_name"')) {
            msg = 'Το όνομα είναι υποχρεωτικό.';
            }
            setMessage({ type: 'error', text: msg });
        } else {
            setMessage({
            type: 'success',
            text: editingId ? 'Ο ασθενής ενημερώθηκε.' : 'Ο ασθενής προστέθηκε.',
            });
            resetForm();
            fetchPatients();
        }
        setSubmitting(false);
        setPendingSubmit(false);
    };
    const handleViewNotes = (patient) => {
    setSelectedPatient(patient);
    setEditedNotes(patient.notes || '');
    setNotesModalOpen(true);
    };
    const confirmDelete = async () => {
        if (!patientToDelete) return;

        const { error } = await supabase.from('patients').delete().eq('id', patientToDelete.id);

        if (!error) {
            fetchPatients();
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
        prev.map((p) =>
            p.id === selectedPatient.id ? { ...p, notes: editedNotes } : p
        )
        );
        setNotesModalOpen(false);
    }
    };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f8f4ee] via-[#fbf9f5] to-[#fdfaf6] text-[#3b3a36]">

      <section className="max-w-6xl mx-auto px-4 py-16">
         <div className="mt-10 flex justify-start">
            <button
                onClick={() => router.push('/admin')}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#8c7c68] transition"
            >
                <FaArrowLeft className="text-xs" />
                <span>Επιστροφή στο Dashboard</span>
            </button>
        </div>
        <h1 className="text-3xl font-bold mb-6 text-center">Ασθενείς</h1>

        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Αναζήτηση ασθενή..."
            className="w-full max-w-sm px-4 py-2 border rounded bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="ml-4 px-4 py-2 bg-[#8c7c68] text-white rounded hover:bg-[#6f6253]"
          >
            Προσθήκη Ασθενή
          </button>
        </div>

        {showForm && (
       <form
            onSubmit={handleSubmit}
            className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm space-y-6 mt-8"
            >
            <h2 className="text-xl font-semibold text-gray-800">
                {editingId ? 'Επεξεργασία Ασθενούς' : 'Καταχώρηση Νέου Ασθενούς'}
            </h2>

            {message && (
                <div className={`text-sm ${message.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                {message.text}
                </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
                {[
                { name: 'full_name', label: 'Ονοματεπώνυμο' },
                { name: 'amka', label: 'ΑΜΚΑ' },
                { name: 'email', label: 'Email', type: 'email' },
                { name: 'phone', label: 'Τηλέφωνο' },
                { name: 'birth_date', label: 'Ημ. Γέννησης', type: 'date' }
                ].map(({ name, label, type }) => (
                <div key={name}>
                    <label htmlFor={name} className="text-sm text-gray-600">{label}</label>
                  <input
                    id={name}
                    name={name}
                    type={type || 'text'}
                    value={form[name]}
                    onChange={handleInputChange}
                    placeholder=" "
                    className="peer w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
                    />
                    <label
                    htmlFor={name}
                    className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500 peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 transition-all"
                    >
                    {label}
                    </label>
                </div>
                ))}

                <div>
                <label htmlFor="gender" className="text-sm text-gray-600">Φύλο</label>
                <select
                    id="gender"
                    name="gender"
                    value={form.gender}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
                >
                    <option value="">Επιλέξτε</option>
                    <option value="male">Άνδρας</option>
                    <option value="female">Γυναίκα</option>
                    <option value="other">Άλλο</option>
                </select>
                </div>
            </div>
            <div className="relative">
            <textarea
                id="notes"
                name="notes"
                rows={4}
                value={form.notes ?? ''}
                onChange={handleInputChange}
                placeholder=" "
                className="peer w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
            />
            <label
                htmlFor="notes"
                className="absolute left-3 -top-2.5 text-xs bg-white px-1 text-gray-500 peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 transition-all"
            >
                Σημειώσεις
            </label>
            </div>

           <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">

                <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50"
                >
                Άκυρο
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className={`px-5 py-2 text-sm text-white rounded-md transition ${
                        submitting ? 'bg-gray-400' : 'bg-[#8c7c68] hover:bg-[#6f6253]'
                    }`}
                    >
                    {editingId ? 'Αποθήκευση' : 'Καταχώρηση'}
            </button>
            </div>
            </form>

            )}


        {loading ? (
          <p className="text-center">Φόρτωση...</p>
        ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
  <table className="min-w-full divide-y divide-gray-200 text-sm">
    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-xs">
      <tr>
        {['Όνομα', 'ΑΜΚΑ', 'Ημ. Γέννησης', 'Ηλικία', 'Φύλο', 'Τηλέφωνο', 'Email', 'Ενέργειες'].map((h) => (
          <th key={h} className="px-4 py-3 text-left">{h}</th>
        ))}
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100 bg-white">
      {filtered.map((p) => (
        <tr key={p.id} className="hover:bg-gray-50 transition">
          <td className="px-4 py-3 font-medium text-gray-900">{p.full_name}</td>
          <td className="px-4 py-3">{p.amka || '-'}</td>
          <td className="px-4 py-3">{p.birth_date || '-'}</td>
          <td className="px-4 py-3 text-gray-500">{p.birth_date ? calculateAge(p.birth_date) : '-'}</td>
          <td className="px-4 py-3">
            <span className="text-xs text-gray-700 px-2 py-0.5 rounded-full bg-gray-100">
              {p.gender === 'male' ? 'Άνδρας' : p.gender === 'female' ? 'Γυναίκα' : 'Άλλο'}
            </span>
          </td>
          <td className="px-4 py-3">{p.phone}</td>
          <td className="px-4 py-3">{p.email}</td>
          <td className="px-4 py-3">
            <div className="flex gap-2 text-gray-500">
          <div className="flex items-center gap-2">
            <button
                onClick={() => handleViewNotes(p)}
                title="Σημειώσεις"
                className="group p-2 rounded-full hover:bg-blue-100 transition-colors"
            >
                <FaStickyNote className="text-blue-500 group-hover:text-blue-700 text-sm" />
            </button>
            <button
                onClick={() => handleEdit(p)}
                title="Επεξεργασία"
                className="group p-2 rounded-full hover:bg-green-100 transition-colors"
            >
                <FaEdit className="text-green-500 group-hover:text-green-700 text-sm" />
            </button>
            <button
                onClick={() => handleDelete(p)}
                title="Διαγραφή"
                className="group p-2 rounded-full hover:bg-red-100 transition-colors"
            >
                <FaTrash className="text-red-500 group-hover:text-red-700 text-sm" />
            </button>
            </div>

            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
          {notesModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1c1c]/70 backdrop-blur-md">
                <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-3xl mx-4">
                <h3 className="text-2xl font-semibold mb-4 text-center text-[#3b3a36]">Σημειώσεις Ασθενούς</h3>

                <p className="mb-2 text-sm text-gray-500 text-center">
                    {selectedPatient?.full_name}
                </p>

                <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    rows={12}
                    className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-[#fdfaf6] text-[#3b3a36] text-base leading-relaxed shadow-inner resize-none focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
                    placeholder="Γράψτε σημειώσεις για τον ασθενή..."
                />

                <div className="flex justify-end mt-6 gap-4">
                    <button
                    onClick={() => {
                        setNotesModalOpen(false);
                        setSelectedPatient(null);
                        setEditedNotes('');
                    }}
                    className="px-5 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                    >
                    Άκυρο
                    </button>
                    <button
                    onClick={handleSaveNotes}
                    className="px-5 py-2 rounded-md bg-[#8c7c68] text-white hover:bg-[#6f6253] transition"
                    >
                    Αποθήκευση
                    </button>
                </div>
                </div>
            </div>
            )}
            {deleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full text-center">
                    <h2 className="text-lg font-semibold mb-4">Επιβεβαίωση Διαγραφής</h2>
                    <p className="mb-6">
                        Είσαι σίγουρος ότι θέλεις να διαγράψεις τον ασθενή{' '}
                        <span className="font-semibold">{patientToDelete?.full_name}</span>;
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                        onClick={() => setDeleteModalOpen(false)}
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        >
                        Άκυρο
                        </button>
                        <button
                        onClick={confirmDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                        Ναι, διαγραφή
                        </button>
                    </div>
                    </div>
                </div>
                )}
                {showIncompleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-white max-w-lg w-full p-6 rounded-lg shadow-xl">
                        <h2 className="text-xl font-semibold mb-4">Ελλιπή στοιχεία</h2>
                        <p className="mb-6">Θέλετε να καταχωρήσετε τον ασθενή με ελλιπή στοιχεία;</p>
                        <div className="flex justify-end gap-4">
                            <button
                            onClick={() => {
                                setShowIncompleteModal(false);
                                setPendingSubmit(false);
                            }}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                            >
                            Προσθήκη στοιχείων
                            </button>
                            <button
                            onClick={proceedSubmission}
                            className="px-4 py-2 bg-[#8c7c68] text-white rounded hover:bg-[#6f6253]"
                            >
                            Καταχώρηση
                            </button>
                        </div>
                        </div>
                    </div>
                    )}
          </div>
        )}
      </section>
    </main>
  );
}
