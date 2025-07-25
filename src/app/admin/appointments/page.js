'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay } from 'date-fns';
import { Plus, ArrowLeft, MessageSquareText, Trash2, StickyNote,Check,X,Ban,AlertTriangle } from 'lucide-react';
import { FaStickyNote } from 'react-icons/fa';
import { DateRange } from 'react-day-picker';

export default function AdminAppointmentsPage() {
  const router = useRouter();
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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    const fetchAppointments = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_time,
        reason,
        status,
        notes,
        patients:patient_id (
          id,
          full_name,
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

    fetchAppointments();
  }, [router]);

  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setAppointments(prev =>
        prev.map(app => (app.id === id ? { ...app, status } : app))
      );
    } else {
      alert('Σφάλμα κατά την ενημέρωση.');
    }
  };

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
      selected={dateRange}
      onSelect={setDateRange}
      disabled={{ before: new Date() }}
      className="rounded-md border border-gray-200 shadow"
    />

  </div>
      {appointments.filter(appt => {
        const apptDate = new Date(appt.appointment_time);

        if (dateRange?.from && dateRange?.to) {
          const from = new Date(dateRange.from);
          from.setHours(0, 0, 0, 0);

          const to = new Date(dateRange.to);
          to.setHours(23, 59, 59, 999);

          return apptDate >= from && apptDate <= to;
        } else {
          return isSameDay(apptDate, selectedDate);
        }
      }).length === 0 ? (
        <p className="text-center text-gray-500">
          Δεν υπάρχουν ραντεβού για την επιλεγμένη {dateRange?.from && dateRange?.to ? 'περίοδο.' : 'ημερομηνία.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-t border-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Όνομα</th>
                <th className="px-4 py-3">Τηλέφωνο</th>
                <th className="px-4 py-3">ΑΜΚΑ</th>
                <th className="px-4 py-3">Λόγος Επίσκεψης</th>
                <th className="px-4 py-3">Ημερομηνία</th>
                <th className="px-4 py-3">Ώρα</th>
                <th className="px-4 py-3">Κατάσταση</th>
                <th className="px-4 py-3 text-right">Ενέργειες</th>
              </tr>
            </thead>
            <tbody>
          {appointments
            .filter((appt) => {
              const apptDate = new Date(appt.appointment_time);

              if (dateRange?.from && dateRange?.to) {
                const from = new Date(dateRange.from);
                from.setHours(0, 0, 0, 0);

                const to = new Date(dateRange.to);
                to.setHours(23, 59, 59, 999);

                return apptDate >= from && apptDate <= to;
              }

              return isSameDay(apptDate, selectedDate);
            })
            .sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time))
            .map((appt, i) => {

                  const date = new Date(appt.appointment_time);
                  const formattedDate = date.toLocaleDateString();
                  const formattedTime = date.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const statusColor = {
                    approved: 'bg-green-100 text-green-800',
                    rejected: 'bg-red-100 text-red-800',
                    scheduled: 'bg-yellow-100 text-yellow-800',
                  }[appt.status] || 'bg-gray-100 text-gray-700';

                  return (
                   <tr key={appt.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2">
                <span>{appt.patients?.full_name || '-'}</span>
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
                    title="Προβολή καρτέλας ασθενή"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaStickyNote className="text-sm" />
                  </button>
                )}
                  </td>

                  <td className="px-4 py-3 text-gray-600">{appt.patients?.phone || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{appt.patients?.amka || '-'}</td>
                   <td className="px-4 py-3 text-gray-600">
                    {appt.reason?.trim() || '-'}
                  </td>
                  <td className="px-4 py-3">{formattedDate}</td>
                  <td className="px-4 py-3">{formattedTime}</td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${statusColor}`}
                    >
                      {appt.status}
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
                         </div>
                       </td>
                       </tr>
                    );
                  })}
              </tbody>
            </table>
           </div>
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
                <p><strong>Πκλινικός Έλεγχος:</strong> {selectedPatient.preclinical_screening || '-'}</p>
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
            <h2 className=" text-lg font-semibold text-gray-800">Επιβεβαίωση Διαγραφής</h2>
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
              onClick={async () => {
                const { error } = await supabase
                  .from('appointments')
                  .delete()
                  .eq('id', deleteTargetId);

                if (!error) {
                  setAppointments(prev => prev.filter(a => a.id !== deleteTargetId));
                  setDeleteDialogOpen(false);
                } else {
                  alert('Σφάλμα κατά τη διαγραφή.');
                }
              }}
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