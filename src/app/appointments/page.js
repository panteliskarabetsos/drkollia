'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function BookAppointmentPage() {
  const router = useRouter();
  const [visitType, setVisitType] = useState('Νέος Ασθενής');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const allSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  useEffect(() => {
    if (!date) return;
    const fetchBookedSlots = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_time')
        .gte('appointment_time', `${date}T00:00:00Z`)
        .lte('appointment_time', `${date}T23:59:59Z`)
        .in('status', ['scheduled', 'approved']);

      if (!error) {
        const booked = data.map((appt) => new Date(appt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        const free = allSlots.filter(slot => !booked.includes(slot));
        setAvailableSlots(free);
      }
    };
    fetchBookedSlots();
  }, [date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const appointmentTime = new Date(`${date}T${time}:00`);
      const { error } = await supabase.from('appointments').insert([
        {
          reason: `${visitType} - ${reason}`,
          appointment_time: appointmentTime,
          duration_minutes: 30,
          status: 'pending',
          notes: '',
        }
      ]);

      if (error) throw error;

      setSuccess(true);
      setReason('');
      setDate('');
      setTime('');
    } catch (err) {
      setError('Κάτι πήγε στραβά. Προσπαθήστε ξανά.');
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#f9f8f6] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <h1 className="text-lg font-semibold mb-4 text-center">Κλείστε Ραντεβού</h1>

        {success && <p className="text-green-600 text-sm mb-4">Το ραντεβού καταχωρήθηκε με επιτυχία.</p>}
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <label className="block text-sm font-medium text-gray-700 mb-2">Είστε:</label>
        <div className="flex gap-4 mb-4">
          <label className="inline-flex items-center text-sm">
            <input
              type="radio"
              name="visitType"
              value="Νέος Ασθενής"
              checked={visitType === 'Νέος Ασθενής'}
              onChange={(e) => setVisitType(e.target.value)}
              className="form-radio text-[#8c7c68]"
            />
            <span className="ml-2">Νέος Ασθενής</span>
          </label>
          <label className="inline-flex items-center text-sm">
            <input
              type="radio"
              name="visitType"
              value="Επανεξέταση"
              checked={visitType === 'Επανεξέταση'}
              onChange={(e) => setVisitType(e.target.value)}
              className="form-radio text-[#8c7c68]"
            />
            <span className="ml-2">Επανεξέταση</span>
          </label>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-2">Λόγος επίσκεψης</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#8c7c68]"
          placeholder="π.χ. Ορμονολογικός έλεγχος"
        />

        <label className="block text-sm font-medium text-gray-700 mb-2">Ημερομηνία</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#8c7c68]"
        />

        <label className="block text-sm font-medium text-gray-700 mb-2">Ώρα</label>
        <select
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#8c7c68]"
        >
          <option value="">Επιλέξτε ώρα</option>
          {availableSlots.map((slot) => (
            <option key={slot} value={slot}>{slot}</option>
          ))}
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-[#8c7c68] text-white rounded-md hover:bg-[#6f6253] text-sm"
        >
          {loading ? 'Καταχώρηση...' : 'Καταχώρηση Ραντεβού'}
        </button>
      </form>
    </main>
  );
}