'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaEdit, FaTrash, FaStickyNote, FaFilter, FaSearch, FaMinus, FaPlus } from 'react-icons/fa';

function removeDiacritics(str) {
  return str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
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
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    const cleanParts = cleanText.split(new RegExp(`(${cleanQuery})`, 'gi'));
    return cleanParts.map((part, i) =>
      removeDiacritics(part) === cleanQuery
        ? <mark key={i} className="bg-yellow-200 text-black px-1 rounded">{text.substr(cleanText.indexOf(part), part.length)}</mark>
        : text.substr(cleanText.indexOf(part), part.length)
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
        removeDiacritics(p.full_name).includes(query) ||
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

      const matchesAge = age !== null && age >= ageRange[0] && age <= ageRange[1];

      return matchesSearch && matchesGender && matchesAge;
    });

    if (sortOption === 'name') {
      results.sort((a, b) => a.full_name.localeCompare(b.full_name));
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
    <main className="min-h-screen bg-gradient-to-br from-[#fdfaf6] to-[#f4f1ec] text-[#3b3a36]">
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
          <div className="flex gap-2 items-center">
            <button
              onClick={() => router.push('/admin')}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#8c7c68] backdrop-blur-md bg-white/30 px-3 py-1.5 rounded-full shadow-sm"
            >
              <FaArrowLeft className="text-sm" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-[#8c7c68] px-2 py-1 rounded-full hover:bg-white/50 backdrop-blur"
            >
              <FaFilter className="text-sm" />
              <span>Φίλτρα</span>
            </button>
          </div>
          <button
            onClick={() => router.push('/admin/patients/new')}
            className="px-4 py-2 bg-[#8c7c68] text-white rounded-full hover:bg-[#6f6253] text-xs shadow-md"
          >
            + Νέος Ασθενής
          </button>
        </div>
        <div className="mb-4">
        <div className="relative w-full max-w-xs">
           {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/60 backdrop-blur z-50">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#8c7c68]"></div>
        </div>
      )}
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Αναζήτηση ασθενή με όνομα, ΑΜΚΑ, τηλέφωνο, email"
            className="w-full pl-2 pr-2 py-1.5 border border-gray-200 rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-[#8c7c68] bg-white/60 backdrop-blur placeholder:text-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
        {showFilters && (
          <div className="bg-white/60 backdrop-blur-md border border-gray-100 rounded-xl p-4 mb-10 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Φίλτρα</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Φύλο</label>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#8c7c68] bg-white/80 backdrop-blur"
                >
                  <option value="">Όλα</option>
                  <option value="male">Άνδρας</option>
                  <option value="female">Γυναίκα</option>
                  <option value="other">Άλλο</option>
                </select>
              </div>
              <div>
  <label className="block text-xs text-gray-500 mb-1">Ηλικία</label>
  <div className="flex items-center gap-1">
    <button onMouseDown={() => handleHold('min', 'dec')} onMouseUp={() => clearHold('min')} onMouseLeave={() => clearHold('min')} className="px-2 py-1 bg-gray-200 rounded-full text-xs">
      <FaMinus />
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
      className="w-14 px-2 py-1 border border-gray-300 rounded-md text-xs text-center"
    />
    <button onMouseDown={() => handleHold('min', 'inc')} onMouseUp={() => clearHold('min')} onMouseLeave={() => clearHold('min')} className="px-2 py-1 bg-gray-200 rounded-full text-xs">
      <FaPlus />
    </button>
    <span className="text-gray-400">–</span>
    <button onMouseDown={() => handleHold('max', 'dec')} onMouseUp={() => clearHold('max')} onMouseLeave={() => clearHold('max')} className="px-2 py-1 bg-gray-200 rounded-full text-xs">
      <FaMinus />
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
      className="w-14 px-2 py-1 border border-gray-300 rounded-md text-xs text-center"
    />
    <button onMouseDown={() => handleHold('max', 'inc')} onMouseUp={() => clearHold('max')} onMouseLeave={() => clearHold('max')} className="px-2 py-1 bg-gray-200 rounded-full text-xs">
      <FaPlus />
    </button>
  </div>
</div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Ταξινόμηση</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#8c7c68] bg-white/80 backdrop-blur"
                >
                  <option value="">Καμία</option>
                  <option value="name">Αλφαβητικά</option>
                  <option value="age">Κατά ηλικία</option>
                  <option value="amka">Κατά ΑΜΚΑ</option>
                  <option value="updated_at">Τελευταία Επεξεργασία</option>
                </select>
              </div>
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={() => {
                  setGenderFilter('');
                  setAgeRange([0, 100]);
                  setSortOption('');
                }}
                className="text-xs px-4 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 border border-gray-300"
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
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-[#f6f4f2] text-gray-700 uppercase tracking-wide text-xs">
                <tr>
                  {['Όνομα', 'ΑΜΚΑ', 'Ημ. Γέννησης', 'Ηλικία', 'Φύλο', 'Τηλέφωνο', 'Email', 'Ενέργειες'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {highlightMatch(p.full_name, search)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {highlightMatch(p.amka || '-', search)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.birth_date || '-'}
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
                        <button onClick={() => handleViewNotes(p)} title="Σημειώσεις" className="p-2 rounded-full hover:bg-blue-100">
                          <FaStickyNote className="text-blue-500 hover:text-blue-700 text-sm" />
                        </button>
                        <button onClick={() => handleEdit(p)} title="Επεξεργασία" className="p-2 rounded-full hover:bg-green-100">
                          <FaEdit className="text-green-500 hover:text-green-700 text-sm" />
                        </button>
                        <button onClick={() => handleDelete(p)} title="Διαγραφή" className="p-2 rounded-full hover:bg-red-100">
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
              Είστε σίγουροι ότι θέλετε να διαγράψετε τον ασθενή{' '}
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
