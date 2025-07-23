'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
export default function NewAppointmentPage() {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('');
  const [formData, setFormData] = useState({
    appointment_date: null,
    appointment_time: null,
    duration_minutes: 30,
    notes: '',
  });
  const [bookedSlots, setBookedSlots] = useState([]);

  useEffect(() => {
    const fetchPatients = async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, email, amka, phone')
        .order('full_name', { ascending: true });

      if (!error) setPatients(data);
    };
    fetchPatients();
  }, []);
  useEffect(() => {
  const fetchBookedSlots = async () => {
    if (!formData.appointment_date) return;

    const start = new Date(formData.appointment_date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('appointments')
      .select('appointment_time, duration_minutes')
      .gte('appointment_time', start.toISOString())
      .lte('appointment_time', end.toISOString());

    if (error) {
      console.error('Error fetching booked slots:', error);
      return;
    }

    const taken = [];

    data.forEach(({ appointment_time, duration_minutes }) => {
      const startTime = new Date(appointment_time);
      const totalSlots = Math.ceil(duration_minutes / 15);
      for (let i = 0; i < totalSlots; i++) {
        const t = new Date(startTime);
        t.setMinutes(t.getMinutes() + i * 15);
        taken.push(`${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`);
      }
    });

    setBookedSlots(taken);
  };

  fetchBookedSlots();
}, [formData.appointment_date]);


    const filteredPatients = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
        p.full_name.toLowerCase().includes(term) ||
        p.amka?.includes(term) ||
        p.phone?.includes(term)
    );
    });


  const timeRanges = {
    morning: { label: 'Πρωί (08:00 - 13:00)', start: 8, end: 13 },
    afternoon: { label: 'Μεσημέρι (13:00 - 17:00)', start: 13, end: 17 },
    evening: { label: 'Απόγευμα (17:00 - 21:00)', start: 17, end: 21 },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
const { data: user, error: userError } = await supabase.auth.getUser();
console.log('User check:', user, userError);

    if (!selectedPatient) {
      alert('Πρέπει να επιλέξετε ασθενή');
      return;
    }

    if (!formData.appointment_date || !formData.appointment_time) {
      alert('Πρέπει να επιλέξετε ημερομηνία και ώρα');
      return;
    }

    const [hour, minute] = formData.appointment_time.split(':').map(Number);
    const combinedDate = new Date(formData.appointment_date);
    
    combinedDate.setHours(hour);
    combinedDate.setMinutes(minute);
    combinedDate.setSeconds(0);
    combinedDate.setMilliseconds(0);

    const { data, error } = await supabase.from('appointments').insert([
    {
        patient_id: selectedPatient.id,
        appointment_time: combinedDate.toISOString(),
        duration_minutes: formData.duration_minutes,
        notes: formData.notes,
        reason: 'Γενικός Έλεγχος',
        status: 'approved' 
    },
    ]);


    console.log('Insert response:', { data, error });

    if (error) {
      alert('Σφάλμα κατά την καταχώρηση.');
      console.error('Insert error:', error);
    } else {
      router.push('/admin/appointments');
    }

    const { data: userData, error: authError } = await supabase.auth.getUser();
        console.log('Authenticated user:', userData?.user?.id);
        if (authError) console.error('Auth error:', authError);

  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f9f9f9] px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-xl p-6 md:p-8 rounded-2xl shadow-md border border-gray-200"
      >
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Καταχώρηση Ραντεβού</h2>

        <div className="mb-5">
          <label className="block text-sm mb-1 text-gray-600">Αναζήτηση Ασθενή</label>
          <input
            type="text"
            placeholder="Πληκτρολογήστε όνομα..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedPatient(null);
            }}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
          {searchTerm && !selectedPatient && (
            <ul className="mt-2 border rounded-lg max-h-40 overflow-y-auto text-sm bg-white">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <li
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatient(patient);
                      setSearchTerm(patient.full_name);
                    }}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  >
                   {patient.full_name} ({patient.email})<br />
                        <span className="text-xs text-gray-500">ΑΜΚΑ: {patient.amka} | Τηλ: {patient.phone}</span>
                  </li>
                ))
              ) : (
                <li className="px-4 py-2 text-gray-400">Δεν βρέθηκε ασθενής</li>
              )}
            </ul>
          )}
          {selectedPatient && (
            <p className="mt-2 text-sm text-green-600">
              Επιλέχθηκε: <strong>{selectedPatient.full_name}</strong>
            </p>
          )}
        </div>

        <div className="mb-5">
          <label className="block text-sm mb-1 text-gray-600">Ημερομηνία</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.appointment_date
                  ? format(formData.appointment_date, 'dd/MM/yyyy')
                  : 'Επιλέξτε ημερομηνία'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.appointment_date}
                onSelect={(date) => {
                  setFormData({ ...formData, appointment_date: date });
                  setFormData((prev) => ({ ...prev, appointment_time: null }));
                  setSelectedTimeRange('');
                }}
                disabled={{ before: new Date() }}
                showOutsideDays
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {formData.appointment_date && (
          <div className="mb-5">
            <label className="block text-sm mb-1 text-gray-600">Εύρος Ώρας</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(timeRanges).map(([key, range]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelectedTimeRange(key);
                    setFormData({ ...formData, appointment_time: null });
                  }}
                  className={`px-3 py-2 text-sm rounded-lg border ${
                    selectedTimeRange === key
                      ? 'bg-gray-800 text-white'
                      : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {formData.appointment_date && selectedTimeRange && (
          <div className="mb-5">
            <label className="block text-sm mb-2 text-gray-600">Ώρα</label>
            <div className="grid grid-cols-4 gap-2">
             {generateTimeSlots(timeRanges[selectedTimeRange].start, timeRanges[selectedTimeRange].end, 15)
                .map((time) => {
                    const isBooked = bookedSlots.includes(time);
                    return (
                    <button
                        key={time}
                        type="button"
                        onClick={() => !isBooked && setFormData({ ...formData, appointment_time: time })}
                        className={`px-3 py-2 text-sm rounded-lg border ${
                        isBooked
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : formData.appointment_time === time
                            ? 'bg-gray-800 text-white'
                            : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
                        }`}
                        disabled={isBooked}
                    >
                        {time}
                    </button>
                    );
                })}

            </div>
          </div>
        )}

       <div className="mb-5">
            <label className="block text-sm mb-1 text-gray-600">Διάρκεια</label>
            <select
                value={formData.duration_minutes === '' ? 'custom' : formData.duration_minutes}
                onChange={(e) => {
                const val = e.target.value;
                if (val === 'custom') {
                    setFormData({ ...formData, duration_minutes: '' });
                } else {
                    setFormData({ ...formData, duration_minutes: parseInt(val) });
                }
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
                <option value={60}>1 ώρα</option>
                <option value={45}>45 λεπτά</option>
                <option value={30}>30 λεπτά</option>
                <option value={15}>15 λεπτά</option>
                <option value="custom">Προσαρμοσμένη</option>
            </select>

            {formData.duration_minutes === '' && (
                <div className="mt-2 flex gap-2">
                <input
                    type="number"
                    min="0"
                    max="8"
                    placeholder="Ώρες"
                    onChange={(e) => {
                    const hours = parseInt(e.target.value) || 0;
                    const currentMinutes = formData._custom_minutes || 0;
                    setFormData({
                        ...formData,
                        duration_minutes: hours * 60 + currentMinutes,
                        _custom_hours: hours,
                    });
                    }}
                    className="w-1/2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
                <input
                    type="number"
                    min="0"
                    max="59"
                    step="5"
                    placeholder="Λεπτά"
                    onChange={(e) => {
                    const minutes = parseInt(e.target.value) || 0;
                    const currentHours = formData._custom_hours || 0;
                    setFormData({
                        ...formData,
                        duration_minutes: currentHours * 60 + minutes,
                        _custom_minutes: minutes,
                    });
                    }}
                    className="w-1/2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
                </div>
            )}
            </div>

        
        <div className="mb-6">
          <label className="block text-sm mb-1 text-gray-600">Σημειώσεις</label>
          <textarea
            rows="3"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700 transition"
        >
          Καταχώρηση Ραντεβού
        </button>
      </form>
    </main>
  );
}

function generateTimeSlots(startHour, endHour, intervalMinutes) {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += intervalMinutes) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      slots.push(`${hh}:${mm}`);
    }
  }
  return slots;
}