'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) {
        setAppointments(data);
      } else {
        console.error('Error fetching appointments:', error.message);
      }
      setLoading(false);
    };

    fetchAppointments();
  }, []);

  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setAppointments((prev) =>
        prev.map((appt) => (appt.id === id ? { ...appt, status } : appt))
      );
    }
  };

  const StatusBadge = ({ status }) => {
    let color = 'bg-gray-400';
    if (status === 'Εγκρίθηκε') color = 'bg-green-600';
    else if (status === 'Απορρίφθηκε') color = 'bg-red-600';

    return (
      <span className={`inline-block px-3 py-1 text-white text-xs rounded-full ${color}`}>
        {status || 'Σε αναμονή'}
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-[#fdfaf6] text-[#3b3a36]">
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold mb-8 text-center">Διαχείριση Ραντεβού</h1>

        {loading ? (
          <p className="text-center text-sm">Φόρτωση ραντεβού...</p>
        ) : appointments.length === 0 ? (
          <p className="text-center text-sm">Δεν υπάρχουν ραντεβού.</p>
        ) : (
          <div className="space-y-6">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-white rounded-xl p-6 border border-[#e0d8ca] shadow-sm hover:shadow transition"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2">
                  <h2 className="text-lg font-semibold">{appt.name}</h2>
                  <StatusBadge status={appt.status} />
                </div>
                <p><strong>Email:</strong> {appt.email}</p>
                <p><strong>Ημερομηνία:</strong> {appt.date}</p>
                <p><strong>Μήνυμα:</strong> {appt.message}</p>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => updateStatus(appt.id, 'Εγκρίθηκε')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm"
                  >
                    Έγκριση
                  </button>
                  <button
                    onClick={() => updateStatus(appt.id, 'Απορρίφθηκε')}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded text-sm"
                  >
                    Απόρριψη
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
