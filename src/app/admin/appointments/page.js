'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay } from 'date-fns';
import { Plus, ArrowLeft } from 'lucide-react';

export default function AdminAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

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
          status,
          patients:patient_id (
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

  return (
<main className="min-h-screen bg-[#f9f9f9] text-[#3b3a36] py-12 px-4 relative">
  <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 relative">
    {cancelDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Επιβεβαίωση Ακύρωσης</h2>
            <p className="text-sm text-gray-600 mb-4">
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
    mode="single"
    selected={selectedDate}
    onSelect={setSelectedDate}
    disabled={{ before: new Date() }}
    className="rounded-md border border-gray-200 shadow"
  />
</div>
    {appointments.filter(appt =>
      isSameDay(new Date(appt.appointment_time), selectedDate)
    ).length === 0 ? (
      <p className="text-center text-gray-500">Δεν υπάρχουν ραντεβού για την επιλεγμένη ημερομηνία.</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-t border-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3">Όνομα</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Τηλέφωνο</th>
              <th className="px-4 py-3">ΑΜΚΑ</th>
              <th className="px-4 py-3">Ημερομηνία</th>
              <th className="px-4 py-3">Ώρα</th>
              <th className="px-4 py-3">Κατάσταση</th>
              <th className="px-4 py-3 text-right">Ενέργειες</th>
            </tr>
          </thead>
          <tbody>
            {appointments
              .filter(appt =>
                isSameDay(new Date(appt.appointment_time), selectedDate)
              )
              .sort((a, b) =>
                new Date(a.appointment_time) - new Date(b.appointment_time)
              )
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
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {appt.patients?.full_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {appt.patients?.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {appt.patients?.phone || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {appt.patients?.amka || '-'}
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
                      <div className="inline-flex gap-2">
                        {appt.status === 'scheduled' && (
                          <>
                            <button
                              onClick={() => updateStatus(appt.id, 'approved')}
                              className="px-3 py-1 text-green-700 border border-green-300 rounded-lg hover:bg-green-50 text-xs"
                            >
                              Έγκριση
                            </button>
                            <button
                              onClick={() => updateStatus(appt.id, 'rejected')}
                              className="px-3 py-1 text-red-700 border border-red-300 rounded-lg hover:bg-red-50 text-xs"
                            >
                              Απόρριψη
                            </button>
                          </>
                        )}

                        {appt.status === 'approved' && (
                          <button
                            onClick={() => {
                              setCancelTargetId(appt.id);
                              setCancelDialogOpen(true);
                            }}
                            className="px-3 py-1 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 text-xs"
                          >
                            Ακύρωση
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
</main>
);

}