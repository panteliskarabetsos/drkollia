'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { UserPlus, Users } from 'lucide-react';

export default function NewAppointmentPage() {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [newPatientMode, setNewPatientMode] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    full_name: '',
    phone: '',
    email: '',
    amka: ''
  });
  const [selectedTimeRange, setSelectedTimeRange] = useState('');
  const [formData, setFormData] = useState({
    appointment_date: null,
    appointment_time: null,
    duration_minutes: 30,
    customDuration: '',
    reason: '',
    notes: ''
  });
  const [bookedSlots, setBookedSlots] = useState([]);
  const filteredPatients = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(term) ||
      p.amka?.toLowerCase().includes(term) ||
      p.phone?.toLowerCase().includes(term)
    );
  });

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

      if (error) return;

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

  const timeRanges = {
    morning: { label: 'Πρωί (08:00 - 13:00)', start: 8, end: 13 },
    afternoon: { label: 'Μεσημέρι (13:00 - 17:00)', start: 13, end: 17 },
    evening: { label: 'Απόγευμα (17:00 - 21:00)', start: 17, end: 21 }
  };



const handleSubmit = async (e) => {
  e.preventDefault();
  let patientId = selectedPatient?.id;

  const duration = formData.duration_minutes === 'custom'
    ? parseInt(formData.customDuration)
    : parseInt(formData.duration_minutes);

  if (isNaN(duration) || duration <= 0) {
    return alert('Η διάρκεια του ραντεβού δεν είναι έγκυρη.');
  }

  if (newPatientMode) {
    const trimmedAmka = newPatientData.amka?.trim();
    if (trimmedAmka) {
      const { data: existingAmka } = await supabase
        .from('patients')
        .select('id')
        .eq('amka', trimmedAmka)
        .single();

      if (existingAmka) {
        alert('Υπάρχει ήδη ασθενής με αυτό το ΑΜΚΑ.');
        return;
      }
    }

    const { data, error: patientError } = await supabase
      .from('patients')
      .insert([{
        full_name: newPatientData.full_name.trim(),
        phone: newPatientData.phone?.trim() || null,
        email: newPatientData.email?.trim() || null,
        amka: newPatientData.amka?.trim() || null,
        gender: 'other'
      }])
      .select();

    if (patientError || !data || data.length === 0) {
      console.error('❌ Patient insert error:', patientError);
      return alert('Σφάλμα κατά την καταχώρηση νέου ασθενή.');
    }

    patientId = data[0].id;
  }

  if (!patientId || !formData.appointment_date || !formData.appointment_time) {
    return alert('Πρέπει να συμπληρωθούν όλα τα απαραίτητα πεδία.');
  }

  const [hour, minute] = formData.appointment_time.split(':').map(Number);
  const combinedDate = new Date(formData.appointment_date);
  combinedDate.setHours(hour);
  combinedDate.setMinutes(minute);
  combinedDate.setSeconds(0);
  combinedDate.setMilliseconds(0);

  const { error } = await supabase.from('appointments').insert([
    {
      patient_id: patientId,
      appointment_time: combinedDate.toISOString(),
      duration_minutes: duration,
      notes: formData.notes,
      reason: formData.reason,
      status: 'approved'
    }
  ]);

  if (error) {
    alert('Σφάλμα κατά την καταχώρηση ραντεβού.');
    console.error('Appointment insert error:', error);
  } else {
    router.push('/admin/appointments');
  }
};

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f9f9f9] px-14 py-12 ">
     <form onSubmit={handleSubmit} className="bg-white w-full max-w-2xl p-8 md:p-10 rounded-3xl shadow-lg border border-[#e4dfd4] transition-shadow hover:shadow-xl">
      <h2 className="text-3xl font-serif font-semibold mb-8 text-[#3b3a36] tracking-tight text-center">
          Καταχώρηση Ραντεβού
        </h2>
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={() => setNewPatientMode(!newPatientMode)}
            className="inline-flex items-center gap-2 px-4 py-1.5 border border-[#ccc7bd] text-sm text-[#3b3a36] rounded-full hover:bg-[#f0ede6] transition-all shadow-sm hover:shadow-md"
          >
            {newPatientMode ? (
              <>
                <Users className="w-4 h-4" />
                Επιλογή Υπάρχοντα Ασθενή
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Νέος Ασθενής
              </>
            )}
          </button>
        </div>
        {newPatientMode ? (
          <div className="mb-6 grid grid-cols-1 gap-3">
            <input
              type="text"
              placeholder="Ονοματεπώνυμο"
              value={newPatientData.full_name}
              onChange={(e) => setNewPatientData({ ...newPatientData, full_name: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="Τηλέφωνο"
              value={newPatientData.phone}
              onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg"
            />
            <input
              type="email"
              placeholder="Email"
              value={newPatientData.email}
              onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="ΑΜΚΑ"
              value={newPatientData.amka}
              onChange={(e) => setNewPatientData({ ...newPatientData, amka: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg"
            />
          </div>
        ) : (
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
              className="px-4 py-2 border border-[#d6d3cb] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#b5aa96] transition w-full"
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
        )}

        {/* Επιλογή Ημερομηνίας */}
        <div className="mb-5">
          <label className="block text-sm mb-1 text-gray-600">Ημερομηνία</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.appointment_date ? format(formData.appointment_date, 'dd/MM/yyyy') : 'Επιλέξτε ημερομηνία'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.appointment_date}
                onSelect={(date) => {
                  setFormData({ ...formData, appointment_date: date, appointment_time: null });
                  setSelectedTimeRange('');
                }}
                disabled={{ before: new Date() }}
                showOutsideDays
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Ώρες Διαθεσιμότητας */}
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
                    selectedTimeRange === key ? 'bg-gray-800 text-white' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Διάρκεια Ραντεβού */}
        <div className="mb-5">
          <label className="block text-sm mb-1 text-gray-600">Διάρκεια Ραντεβού</label>
          <select
            value={formData.duration_minutes}
            onChange={(e) =>
              setFormData({ ...formData, duration_minutes: e.target.value, customDuration: '' })
            }
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            <option value="15">15 λεπτά</option>
            <option value="30">30 λεπτά</option>
            <option value="45">45 λεπτά</option>
            <option value="60">1 ώρα</option>
            <option value="custom">Προσαρμογή</option>
          </select>
        </div>

        {/* Προσαρμοσμένη διάρκεια */}
        {formData.duration_minutes === 'custom' && (
          <div className="mb-5">
            <label className="block text-sm mb-1 text-gray-600">Προσαρμοσμένη Διάρκεια (σε λεπτά)</label>
            <input
              type="number"
              min="5"
              step="5"
              placeholder="π.χ. 20"
              value={formData.customDuration}
              onChange={(e) => setFormData({ ...formData, customDuration: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
        )}

        {/* Λόγος Επίσκεψης */}
        <div className="mb-5">
          <label className="block text-sm mb-1 text-gray-600">Λόγος Επίσκεψης</label>
          <input
            type="text"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            placeholder="π.χ. Έλεγχος θυρεοειδούς"
          />
        </div>

        {/* Επιλογή Ώρας */}
        {formData.appointment_date && selectedTimeRange && (
          <div className="mb-5">
            <label className="block text-sm mb-2 text-gray-600">Ώρα</label>
            <div className="grid grid-cols-4 gap-2">
              {generateTimeSlots(timeRanges[selectedTimeRange].start, timeRanges[selectedTimeRange].end, 15).map((time) => {
                const isBooked = bookedSlots.includes(time);
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => !isBooked && setFormData({ ...formData, appointment_time: time })}
                    className={`px-3 py-2 text-sm rounded-lg border ${
                      isBooked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                      formData.appointment_time === time ? 'bg-gray-800 text-white' :
                      'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
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

        {/* Σημειώσεις */}
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