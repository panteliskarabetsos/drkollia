'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaEdit, FaTrash, FaStickyNote, FaFilter, FaSearch, FaMinus, FaPlus, FaHistory } from 'react-icons/fa';
import { FiX, FiPlus, FiMinus } from 'react-icons/fi';
import { HiAdjustmentsHorizontal } from 'react-icons/hi2';
import { StickyNote, PencilLine, Trash2, ScrollText } from 'lucide-react';

function removeDiacritics(str) {
   if (typeof str !== 'string') return '';
  return str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}
function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}



export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [sortOption, setSortOption] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [ageRange, setAgeRange] = useState([0, 100]);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const minInterval = useRef(null);
  const maxInterval = useRef(null);



const highlightMatch = (text, query) => {
  if (!query || typeof text !== 'string') return text;

  const cleanText = removeDiacritics(text);
  const cleanQuery = removeDiacritics(query);

  const regex = new RegExp(`(${cleanQuery})`, 'gi');
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
      const query = removeDiacritics(search);
      const matchesSearch =
        removeDiacritics(`${p.first_name} ${p.last_name}` || '').includes(query) ||
        removeDiacritics(p.amka || '').includes(query) ||
        removeDiacritics(p.email || '').includes(query) ||
        removeDiacritics(p.phone || '').includes(query);

      const matchesGender = genderFilter ? p.gender === genderFilter : true;

      let age = null;
      if (p.birth_date) {
        const birth = new Date(p.birth_date);
        const today = new Date();
        age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      }

    const matchesAge = (age === null) || (age >= ageRange[0] && age <= ageRange[1]);


      return matchesSearch && matchesGender && matchesAge;
    });

    if (sortOption === 'name') {
      results.sort((a, b) =>
        `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
      );
    } else if (sortOption === 'age') {
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
    } else if (sortOption === 'amka') {
      results.sort((a, b) => (a.amka || '').localeCompare(b.amka || ''));
    } else if (sortOption === 'updated_at') {
        results.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }
    setFiltered(results);
  }, [search, genderFilter, ageRange, sortOption, patients]);

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
      await fetchPatients();
      setSearch('');
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

  const handleHold = (type, operation) => {
  const interval = setInterval(() => {
    setAgeRange((prev) => {
      const newMin = type === 'min' ? operation === 'inc' ? Math.min(prev[0] + 1, 100) : Math.max(prev[0] - 1, 0) : prev[0];
      const newMax = type === 'max' ? operation === 'inc' ? Math.min(prev[1] + 1, 100) : Math.max(prev[1] - 1, 0) : prev[1];
      if (newMin <= newMax) return [newMin, newMax];
      return prev;
    });
  }, 100);
  if (type === 'min') minInterval.current = interval;
  else maxInterval.current = interval;
};

const clearHold = (type) => {
  if (type === 'min' && minInterval.current) clearInterval(minInterval.current);
  if (type === 'max' && maxInterval.current) clearInterval(maxInterval.current);
};


  return (
  <main className="min-h-screen bg-gradient-to-br from-[#f7f5f2] via-[#ece9e6] to-[#dcd8d3] text-[#3a3a38] font-sans">

      <section className="max-w-7xl mx-auto px-6 py-26">
      {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 mb-10">
          {/* Left Buttons */}
          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={() => router.push('/admin')}
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
            onClick={() => router.push('/admin/patients/new')}
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
                            onMouseDown={() => handleHold('min', 'dec')}
                            onMouseUp={() => clearHold('min')}
                            onMouseLeave={() => clearHold('min')}
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
                              if (newMin <= ageRange[1]) setAgeRange([newMin, ageRange[1]]);
                            }}
                            className="w-14 px-2 py-1 text-center text-sm border border-gray-300 rounded-xl bg-white/70 backdrop-blur"
                          />
                          <button
                            onMouseDown={() => handleHold('min', 'inc')}
                            onMouseUp={() => clearHold('min')}
                            onMouseLeave={() => clearHold('min')}
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
                            onMouseDown={() => handleHold('max', 'dec')}
                            onMouseUp={() => clearHold('max')}
                            onMouseLeave={() => clearHold('max')}
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
                              if (newMax >= ageRange[0]) setAgeRange([ageRange[0], newMax]);
                            }}
                            className="w-14 px-2 py-1 text-center text-sm border border-gray-300 rounded-xl bg-white/70 backdrop-blur"
                          />
                          <button
                            onMouseDown={() => handleHold('max', 'inc')}
                            onMouseUp={() => clearHold('max')}
                            onMouseLeave={() => clearHold('max')}
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
                  setGenderFilter('');
                  setAgeRange([0, 100]);
                  setSortOption('');
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
          <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow">
          <table className="min-w-full text-sm text-left text-gray-700">

           <thead className="bg-[#f3f3f2] text-gray-600 uppercase text-xs tracking-wider shadow-sm">

                <tr>
                  {['Όνομα', 'ΑΜΚΑ', 'Ηλικία', 'Φύλο', 'Τηλέφωνο', 'Email', 'Ενέργειες'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">

                {filtered.map((p) => (
                  <tr key={p.id}  className="hover:bg-[#f9f9f8] transition duration-200">
                    
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                     {highlightMatch(`${p.first_name} ${p.last_name}`, search)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {highlightMatch(p.amka || '-', search)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.birth_date ? calculateAge(p.birth_date) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {p.gender === 'male' ? 'Άνδρας' : p.gender === 'female' ? 'Γυναίκα' : 'Άλλο'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {highlightMatch(p.phone || '-', search)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {highlightMatch(p.email || '-', search)}
                    </td>
                        <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {/* Σημειώσεις */}
                        <button
                          onClick={() => handleViewNotes(p)}
                          title="Σημειώσεις"
                          className="p-2 rounded-full hover:bg-blue-100"
                        >
                          <StickyNote className="text-blue-500 hover:text-blue-700 w-4 h-4" />
                        </button>

                        {/* Επεξεργασία */}
                        <button
                          onClick={() => handleEdit(p)}
                          title="Επεξεργασία"
                          className="p-2 rounded-full hover:bg-green-100"
                        >
                          <PencilLine className="text-green-500 hover:text-green-700 w-4 h-4" />
                        </button>

                        {/* Ιστορικό Επισκέψεων */}
                        <button
                          onClick={() => router.push(`/admin/patients/history/${p.id}`)}
                          title="Ιστορικό Επισκέψεων"
                          className="p-2 rounded-full hover:bg-purple-100"
                        >
                          <ScrollText className="text-purple-500 hover:text-purple-700 w-4 h-4" />
                        </button>

                        {/* Διαγραφή */}
                        <button
                          onClick={() => handleDelete(p)}
                          title="Διαγραφή"
                          className="p-2 rounded-full hover:bg-red-100"
                        >
                          <Trash2 className="text-red-500 hover:text-red-700 w-4 h-4" />
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
              <h2 className="text-lg font-semibold text-center mb-4 flex items-center justify-center gap-2">
                <FaStickyNote className="text-[#8c7c68]" />
                Στοιχεία Ασθενούς
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <p><strong>Ονοματεπώνυμο:</strong> {`${selectedPatient.first_name} ${selectedPatient.last_name}`}</p>
                <p><strong>ΑΜΚΑ:</strong> {selectedPatient.amka || '-'}</p>
                <p><strong>Email:</strong> {selectedPatient.email || '-'}</p>
                <p><strong>Τηλέφωνο:</strong> {selectedPatient.phone || '-'}</p>
                <p><strong>Ημ. Γέννησης:</strong> {formatDate(selectedPatient.birth_date) || '-'}</p>
                <p><strong>Ηλικία:</strong> {calculateAge(selectedPatient.birth_date)}</p>
                <p><strong>Φύλο:</strong> {selectedPatient.gender || '-'}</p>
                <p><strong>Επάγγελμα:</strong> {selectedPatient.occupation || '-'}</p>
                <p><strong>Ημ. Πρώτης Επίσκεψης:</strong> {formatDate(selectedPatient.first_visit_date) || '-'}</p>
                <p><strong>Οικογενειακή Κατάσταση:</strong> {selectedPatient.marital_status || '-'}</p>
                <p><strong>Τέκνα:</strong> {selectedPatient.children || '-'}</p>
                <p><strong>Κάπνισμα:</strong> {selectedPatient.smoking || '-'}</p>
                <p><strong>Αλκοόλ:</strong> {selectedPatient.alcohol || '-'}</p>
                <p><strong>Φάρμακα:</strong> {selectedPatient.medications || '-'}</p>
                <p><strong>Γυναικολογικό Ιστορικό:</strong> {selectedPatient.gynecological_history || '-'}</p>
                <p><strong>Κληρονομικό Ιστορικό:</strong> {selectedPatient.hereditary_history || '-'}</p>
                <p><strong>Παρούσα Νόσος:</strong> {selectedPatient.current_disease || '-'}</p>
                <p><strong>Αντικειμενική Εξέταση:</strong> {selectedPatient.physical_exam || '-'}</p>
                <p><strong>Παράκλινικός Έλεγχος:</strong> {selectedPatient.preclinical_screening || '-'}</p>
              </div>
              <div className="mt-6 text-sm bg-gray-50 p-4 rounded">
                <p><strong>Σημειώσεις:</strong></p>
                <p className="whitespace-pre-wrap text-gray-600 mt-2">{selectedPatient.notes?.trim() || 'Δεν υπάρχουν σημειώσεις.'}</p>
              </div>
             <p className="mt-4 text-xs text-gray-400 text-right">
                Τελευταία ενημέρωση: {formatDateTime(selectedPatient.updated_at) }
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
              Είστε σίγουροι ότι θέλετε να διαγράψετε τον ασθενή{' '}
            <span className="font-medium text-red-600">
              {`${patientToDelete.first_name} ${patientToDelete.last_name}`}
            </span>
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
