'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay } from 'date-fns';
import { Plus, ArrowLeft, UserCircle, Trash2, StickyNote,Check,X,Ban,AlertTriangle,IdCard } from 'lucide-react';
import { el } from 'date-fns/locale';

export default function AdminAppointmentsPage() {
  
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
const [sessionExists, setSessionExists] = useState(false);

useEffect(() => {
  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setTimeout(() => {
        router.push('/login'); // αποφυγή scroll reset λόγω immediate redirect
      }, 0);
    } else {
      setSessionExists(true);
    }
    setSessionChecked(true);
  };

  checkAuth();
}, []);
const normalize = (text) =>
  text
    ?.normalize("NFD")                      // διαχωρίζει γράμμα και τόνο
    .replace(/\p{Diacritic}/gu, "")        // αφαιρεί τους τόνους
    .toLowerCase();         

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointmentNote, setSelectedAppointmentNote] = useState(null);
  const [appointmentNoteModalOpen, setAppointmentNoteModalOpen] = useState(false);
  const [editNoteModalOpen, setEditNoteModalOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [editingNote, setEditingNote] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'month'
  const [dateRange, setDateRange] = useState(undefined);
  const [searchQuery, setSearchQuery] = useState('')
  const greekLocale = {
  ...el,
  options: {
    ...el.options,
    weekStartsOn: 1, // Ξεκινά η εβδομάδα από Δευτέρα
  },
};
const normalizeText = (text) =>
  text
    ?.normalize("NFD")                    // διαχωρίζει γράμμα και τόνο
    .replace(/\p{Diacritic}/gu, "")      // αφαιρεί τόνους
    .toLowerCase();                      // πεζά γράμματα

const filteredAppointments = appointments.filter((appt) => {
  const apptDate = new Date(appt.appointment_time);

  let isInRange = false;
  if (dateRange?.from && dateRange?.to) {
    const from = new Date(dateRange.from);
    from.setHours(0, 0, 0, 0);

    const to = new Date(dateRange.to);
    to.setHours(23, 59, 59, 999);

    isInRange = apptDate >= from && apptDate <= to;
  } else {
    isInRange = isSameDay(apptDate, selectedDate);
  }

  if (!isInRange) return false;

  // Εφαρμογή φίλτρου αναζήτησης
  if (searchQuery.trim() !== "") {
    const q = normalizeText(searchQuery);

    const fullName = normalizeText(`${appt.patients?.first_name ?? ""} ${appt.patients?.last_name ?? ""}`);
    const phone = normalizeText(appt.patients?.phone ?? "");
    const amka = normalizeText(appt.patients?.amka ?? "");
    const reason = normalizeText(appt.reason ?? "");

    return (
      fullName.includes(q) ||
      phone.includes(q) ||
      amka.includes(q) ||
      reason.includes(q)
    );
  }

  return true;
});

    const groupedAppointments = filteredAppointments.reduce((groups, appt) => {
    const dateKey = new Date(appt.appointment_time).toLocaleDateString('el-GR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(appt);
    return groups;
  }, {});

const handleDeleteAppointment = async () => {
  console.log('Deleting ID:', deleteTargetId);
  const { data, error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', deleteTargetId);

  if (error) {
    console.error('Error deleting appointment:', error);
    alert('Σφάλμα κατά τη διαγραφή.');
  } else {
    console.log('Appointment deleted:', data);
    setAppointments(prev => prev.filter(a => a.id !== deleteTargetId));
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
  }
  
};

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setCurrentTime(new Date());
  //   }, 1000);
  //   return () => clearInterval(interval);
  // }, []);


  useEffect(() => {
  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_time,
        reason,
        status,
        notes,
        duration_minutes, 
        is_exception,
        patients:patient_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          amka
        )
      `)
      .order('appointment_time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error.message);
    } else {
      setAppointments(data);
    }

    setLoading(false);
  };

  if (sessionExists) {
    fetchAppointments();
  }
}, [sessionExists]);


const updateStatus = async (id, status) => {
  const appointment = appointments.find(app => app.id === id);
  if (!appointment) return;

  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id);

  if (error) {
    alert('Σφάλμα κατά την ενημέρωση.');
    return;
  }

  // Ενημέρωση τοπικού state
  setAppointments(prev =>
    prev.map(app => (app.id === id ? { ...app, status } : app))
  );

  // Αν είναι ακύρωση, στείλε email
  if (status === 'cancelled' && appointment.patients?.email) {
    try {
      await fetch('/api/send-cancellation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: appointment.patients.email,
          name: `${appointment.patients.first_name} ${appointment.patients.last_name}`,
          date: appointment.appointment_time,
          reason: appointment.reason,
        }),
      });
    } catch (err) {
      console.error('❌ Σφάλμα αποστολής email ακύρωσης:', err);
    }
  }
};



if (!sessionChecked) return <main className="min-h-screen flex items-center justify-center">Έλεγχος σύνδεσης...</main>;
if (!sessionExists) return null;

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center">Φόρτωση...</main>;
  }
  
function calculateAge(birthDateStr) {
  if (!birthDateStr) return '-';
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

  return (
  <main className="min-h-screen bg-[#f9f9f9] text-[#3b3a36] py-22 px-4 relative">
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 relative">
      {cancelDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-200">
            
            {/* Icon + Title */}
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-yellow-100 text-yellow-600 p-2 rounded-full">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">
                Επιβεβαίωση Ακύρωσης
              </h2>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Είστε σίγουροι ότι θέλετε να ακυρώσετε αυτό το ραντεβού;
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCancelDialogOpen(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Άκυρο
              </button>
              <button
                onClick={() => {
                  updateStatus(cancelTargetId, 'cancelled');
                  setCancelDialogOpen(false);
                }}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-500"
              >
                Ναι, ακύρωση
              </button>
            </div>
          </div>
        </div>
      )}
      <button
          onClick={() => router.push('/admin')}
          className="absolute top-4 left-4 text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2 rounded-full transition-colors duration-200"
          title="Επιστροφή στο Dashboard"
        >
          <ArrowLeft size={20} />
      </button>

      <button
        onClick={() => router.push('/admin/appointments/new')}
        className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-md transition"
        title="Καταχώρηση Ραντεβού"
      >
        <Plus size={20} />
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
    {/* Αριστερά - Τίτλος */}
    <div className="text-center md:text-left">
      <h1 className="text-2xl font-semibold">Λίστα Ραντεβού</h1>
      <p className="text-sm text-gray-500">Επιλέξτε ημερομηνία για προβολή</p>
    </div>



    {/* Κέντρο - Ώρα */}
    <div className="flex-1 flex justify-center">
      <div className="text-6xl font-extralight text-gray-700 tracking-widest">
        {format(currentTime, 'HH:mm')}
      </div>
    </div>

    {/* Δεξιά - Calendar */}
    <Calendar
      mode="range"
         locale={greekLocale}
      selected={dateRange}
      onSelect={setDateRange}
        disabled={{ before: new Date() }}
                  modifiers={{
                  weekend: (date) => [0, 6].includes(date.getDay()), // Κυριακή = 0, Σάββατο = 6
                }}
                modifiersClassNames={{
                  weekend: 'text-gray-400 opacity-60', // πιο "faded"
                }}
      className="rounded-md border border-gray-200 shadow"
    />

  </div>

{/* search bar  */}
<div className="mb-8 flex justify-start w-full">
  <div className="relative w-full max-w-sm">
    <input
      type="text"
      placeholder="Αναζήτηση ασθενούς..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8c7c68] focus:border-transparent text-sm text-gray-700 placeholder-gray-400 transition"
    />
    <svg
      className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z"
      />
    </svg>
  </div>
</div>

  
  {Object.keys(groupedAppointments).length === 0 ? (
  <p className="text-center text-gray-500">
    Δεν υπάρχουν ραντεβού για την επιλεγμένη {dateRange?.from && dateRange?.to ? 'περίοδο.' : 'ημερομηνία.'}
  </p>
) : (
  Object.entries(groupedAppointments).map(([date, appts]) => (
    <div key={date} className="mb-10">
      <h2 className="text-lg font-semibold text-gray-700 mb-3">{date}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-t border-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3">Όνομα</th>
              <th className="px-4 py-3">Τηλέφωνο</th>
              <th className="px-4 py-3">ΑΜΚΑ</th>
              <th className="px-4 py-3">Λόγος Επίσκεψης</th>
              <th className="px-4 py-3">Ώρα</th>
              <th className="px-4 py-3">Διάρκεια</th>
              <th className="px-4 py-3">Κατάσταση</th>
              <th className="px-4 py-3 text-right">Ενέργειες</th>
            </tr>
          </thead>
          <tbody>
            {appts.map((appt, i) => {
              const time = new Date(appt.appointment_time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
            const statusColor = {
              approved: 'bg-green-200 text-green-800',
              rejected: 'bg-red-100 text-red-800',
              scheduled: 'bg-yellow-100 text-yellow-800',
              completed: 'bg-blue-100 text-blue-800',
            }[ 
              (appt.status === 'approved' && new Date(appt.appointment_time) < new Date())
                ? 'completed'
                : appt.status
            ] || 'bg-gray-100 text-gray-700';

              return (
                
               <tr
                      key={appt.id}
                      className={
                        appt.is_exception
                          ? 'bg-red-100'
                          : i % 2
                            ? 'bg-gray-50 hover:bg-gray-100 animate-bg-transition'
                            : 'bg-white hover:bg-gray-100 animate-bg-transition'
                      }
                    >
                          <td className="px-4 py-2">
                            <strong>{appt.patients ? `${appt.patients.first_name} ${appt.patients.last_name}` : '-'}</strong>

                            {appt.patients?.id && (
                              <button
                                onClick={async () => {
                                  const { data, error } = await supabase
                                    .from('patients')
                                    .select('*')
                                    .eq('id', appt.patients.id)
                                    .single();
                                  if (!error) {
                                    setSelectedPatient(data);
                                    setNotesModalOpen(true);
                                  }
                                }}
                                title="Προβολή καρτέλας ασθενούς"
                                className="ml-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded-full transition-colors duration-200"
                              >
                              <IdCard className="w-4 h-4 text-blue-600" />
                              </button>
                            )}
                          </td>
                  <td className="px-4 py-3 text-gray-600">{appt.patients?.phone || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{appt.patients?.amka || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{appt.reason?.trim() || '-'}</td>
                  <td className="px-4 py-3">{time}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {appt.duration_minutes ? `${appt.duration_minutes} λεπτά` : '-'}
                  </td>
                  <td className="px-4 py-3">
                <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${statusColor}`}>
                  {(appt.status === 'approved' && new Date(appt.appointment_time) < new Date())
                    ? 'completed'
                    : appt.status}
                    {appt.is_exception && (
                        <span className="ml-2 text-orange-400 text-xs font-semibold">(εξαίρεση)</span>
                      )}
                </span>
              </td>

                  <td className="px-4 py-3 text-right">
                <div className="inline-flex items-center gap-2 flex-wrap justify-end">
                  {/* Σχόλια */}
                  <button
                    onClick={() => {
                      setSelectedAppointmentNote(appt.notes);
                      setAppointmentNoteModalOpen(true);
                    }}
                    className={`p-1.5 rounded-full border transition ${
                      appt.notes?.trim()
                        ? 'text-blue-700 border-blue-300 hover:bg-blue-50'
                        : 'text-gray-400 border-gray-200 hover:bg-gray-50'
                    }`}
                    title="Προβολή σημειώσεων"
                  >
                    <StickyNote className="w-4 h-4" />
                  </button>

                  {/* Οι υπόλοιπες ενέργειες μόνο αν ΔΕΝ είναι completed */}
                  {!(
                    appt.status === 'completed' ||
                    (appt.status === 'approved' && new Date(appt.appointment_time) < new Date())
                  ) && (
                    <>
                      {/* Έγκριση */}
                      {appt.status === 'scheduled' && (
                        <button
                          onClick={() => updateStatus(appt.id, 'approved')}
                          className="p-1.5 rounded-full border border-green-300 text-green-700 hover:bg-green-50"
                          title="Έγκριση"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      {/* Απόρριψη */}
                      {appt.status === 'scheduled' && (
                        <button
                          onClick={() => updateStatus(appt.id, 'rejected')}
                          className="p-1.5 rounded-full border border-red-300 text-red-700 hover:bg-red-50"
                          title="Απόρριψη"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}

                      {/* Ακύρωση */}
                      {appt.status === 'approved' && (
                        <button
                          onClick={() => {
                            setCancelTargetId(appt.id);
                            setCancelDialogOpen(true);
                          }}
                          className="p-1.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100"
                          title="Ακύρωση"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}

                      {/* Διαγραφή */}
                      {appt.status === 'cancelled' && (
                        <button
                          onClick={() => {
                            setDeleteTargetId(appt.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="p-1.5 rounded-full border border-red-300 text-red-600 hover:bg-red-50"
                          title="Διαγραφή"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </td>

                </tr>
                
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  ))
)}

            </div>
        {appointmentNoteModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 py-10">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Σημειώσεις Ραντεβού</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {selectedAppointmentNote?.trim() || 'Δεν υπάρχουν σημειώσεις.'}
              </p>
              <div className="mt-6 flex justify-between items-center">
                <button
                  onClick={() => setAppointmentNoteModalOpen(false)}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                >
                  Κλείσιμο
                </button>
                <button
                  onClick={() => {
                    setEditNoteModalOpen(true);
                    setEditingAppointmentId(
                      appointments.find(appt => appt.notes === selectedAppointmentNote)?.id || null
                    );
                    setEditingNote(selectedAppointmentNote || '');
                    setAppointmentNoteModalOpen(false);
                  }}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-500"
                >
                  Επεξεργασία
                </button>
              </div>
            </div>
          </div>
        )}
      {notesModalOpen && selectedPatient && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8 px-4">
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-4xl mx-auto">
      {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-6 flex items-center justify-center gap-2">
          <UserCircle className="w-6 h-6 text-[#8c7c68]" />
          Καρτέλα Ασθενούς
        </h2>

      {/* Contact Info */}
      <div className="mb-6">
        <h3 className="text-md font-semibold text-gray-700 mb-2 border-b pb-1">
          Στοιχεία Επικοινωνίας
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
          <p><strong>Ονοματεπώνυμο:</strong> {selectedPatient.first_name} {selectedPatient.last_name}</p>
          <p><strong>ΑΜΚΑ:</strong> {selectedPatient.amka || '-'}</p>
          <p><strong>Email:</strong> {selectedPatient.email || '-'}</p>
          <p><strong>Τηλέφωνο:</strong> {selectedPatient.phone || '-'}</p>
          <p><strong>Ημ. Γέννησης:</strong> {selectedPatient.birth_date || '-'}</p>
          <p><strong>Ηλικία:</strong> {calculateAge(selectedPatient.birth_date)}</p>
          <p><strong>Φύλο:</strong> {selectedPatient.gender || '-'}</p>
          <p><strong>Επάγγελμα:</strong> {selectedPatient.occupation || '-'}</p>
        </div>
      </div>

      {/* History */}
      <div className="mb-6">
        <h3 className="text-md font-semibold text-gray-700 mb-2 border-b pb-1">
          Ιστορικό & Συνήθειες
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
          <p><strong>Πρώτη Επίσκεψη:</strong> {selectedPatient.first_visit_date || '-'}</p>
          <p><strong>Οικογενειακή Κατάσταση:</strong> {selectedPatient.marital_status || '-'}</p>
          <p><strong>Τέκνα:</strong> {selectedPatient.children || '-'}</p>
          <p><strong>Κάπνισμα:</strong> {selectedPatient.smoking || '-'}</p>
          <p><strong>Αλκοόλ:</strong> {selectedPatient.alcohol || '-'}</p>
          <p><strong>Φάρμακα:</strong> {selectedPatient.medications || '-'}</p>
        </div>
      </div>

      {/* Clinical */}
      <div className="mb-6">
        <h3 className="text-md font-semibold text-gray-700 mb-2 border-b pb-1">
          Κλινικές Πληροφορίες
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
          <p><strong>Γυναικολογικό Ιστορικό:</strong> {selectedPatient.gynecological_history || '-'}</p>
          <p><strong>Κληρονομικό Ιστορικό:</strong> {selectedPatient.hereditary_history || '-'}</p>
          <p><strong>Παρούσα Νόσος:</strong> {selectedPatient.current_disease || '-'}</p>
          <p><strong>Αντικειμενική Εξέταση:</strong> {selectedPatient.physical_exam || '-'}</p>
          <p><strong>Προκλινικός Έλεγχος:</strong> {selectedPatient.preclinical_screening || '-'}</p>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 mb-4">
        <p className="font-semibold mb-2">Σημειώσεις:</p>
        <p className="whitespace-pre-wrap text-gray-600">
          {selectedPatient.notes?.trim() || 'Δεν υπάρχουν σημειώσεις.'}
        </p>
      </div>

      {/* Updated At */}
      <p className="text-xs text-gray-400 text-right mb-4">
        Τελευταία ενημέρωση: {selectedPatient.updated_at ? new Date(selectedPatient.updated_at).toLocaleString('el-GR') : '-'}
      </p>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
        <button
          onClick={() => setNotesModalOpen(false)}
          className="w-full sm:w-auto px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition"
        >
          Κλείσιμο
        </button>
        <button
          onClick={() => {
            setNotesModalOpen(false);
            router.push(`/admin/patients/${selectedPatient.id}`);
          }}
          className="w-full sm:w-auto px-4 py-2 text-sm bg-[#8c7c68] text-white rounded hover:bg-[#6f6253] transition"
        >
          Επεξεργασία
        </button>
      </div>
    </div>
  </div>
)}

        {editNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 py-10">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Επεξεργασία Σημειώσεων Ραντεβού</h2>
            <textarea
              rows={5}
              className="w-full border rounded-lg p-2 text-sm text-gray-700"
              value={editingNote}
              onChange={(e) => setEditingNote(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setEditNoteModalOpen(false)}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              >
                Άκυρο
              </button>
              <button
                onClick={async () => {
                  const { error } = await supabase
                    .from('appointments')
                    .update({ notes: editingNote })
                    .eq('id', editingAppointmentId);

                  if (!error) {
                    setAppointments(prev =>
                      prev.map(appt =>
                        appt.id === editingAppointmentId ? { ...appt, notes: editingNote } : appt
                      )
                    );
                    setEditNoteModalOpen(false);
                  } else {
                    alert('Σφάλμα κατά την αποθήκευση σημειώσεων.');
                  }
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-500"
              >
                Αποθήκευση
              </button>
            </div>
          </div>
        </div>
      )}
      
  {deleteDialogOpen && (
  <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-200">
      
      {/* Icon + Τίτλος */}
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-red-100 text-red-600 p-2 rounded-full">
          <Trash2 className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Επιβεβαίωση Διαγραφής</h2>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Θέλετε σίγουρα να διαγράψετε αυτό το ραντεβού; Η ενέργεια δεν μπορεί να αναιρεθεί.
      </p>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => setDeleteDialogOpen(false)}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          Άκυρο
        </button>
        <button
          onClick={handleDeleteAppointment}
          className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-500 flex items-center gap-1"
        >
          <Trash2 className="w-4 h-4" />
          Διαγραφή
        </button>
      </div>
      
    </div>
    
  </div>
)}

  </main>
  );
}