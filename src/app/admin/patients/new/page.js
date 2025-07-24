'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { FaArrowLeft } from 'react-icons/fa';

export default function NewPatientPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: '',
    amka: '',
    email: '',
    phone: '',
    birth_date: '',
    gender: '',
    occupation: '',
    first_visit_date: '',
    marital_status: '',
    children: '',
    smoking: '',
    alcohol: '',
    medications: '',
    gynecological_history: '',
    hereditary_history: '',
    current_disease: '',
    physical_exam: '',
    preclinical_screening: '',
    notes: '',
    customSmoking: '',
    customAlcohol: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [fullNameError, setFullNameError] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (e.target.name === 'full_name' && e.target.value.trim() !== '') {
      setFullNameError(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!form.full_name.trim()) {
      setFullNameError(true);
      setMessage({ type: 'error', text: 'Το πεδίο Ονοματεπώνυμο είναι υποχρεωτικό.' });
      setLoading(false);
      return;
    }

    const genderMap = {
      'Άνδρας': 'male',
      'Γυναίκα': 'female',
      'Άλλο': 'other',
    };
    const preparedForm = {
      ...form,
      gender: genderMap[form.gender] || null,
      smoking: form.smoking === 'Προσαρμογή' ? form.customSmoking : form.smoking,
      alcohol: form.alcohol === 'Προσαρμογή' ? form.customAlcohol : form.alcohol,
    };

    const { customSmoking, customAlcohol, ...cleanedForm } = preparedForm;

    if (cleanedForm.birth_date === '') cleanedForm.birth_date = null;
    if (cleanedForm.first_visit_date === '') cleanedForm.first_visit_date = null;

    const { error } = await supabase.from('patients').insert([cleanedForm]);

    if (error) {
      setMessage({ type: 'error', text: 'Σφάλμα κατά την αποθήκευση.' });
      console.error('Supabase insert error:', error.message, error.details, error);
    } else {
      setMessage({ type: 'success', text: 'Ο ασθενής καταχωρήθηκε με επιτυχία.' });
      router.push('/admin/patients');
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#f2f5f4] py-12 px-4 text-[#3a3a38]">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-3xl p-10 border border-[#cfd8d6]">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            <FaArrowLeft />
          </button>
        </div>

        <h1 className="text-4xl font-bold text-center text-[#4a4a48] mb-10 tracking-tight">
          Καταχώρηση Νέου Ασθενούς
        </h1>

        {message && (
          <div className={`mb-6 text-center text-sm font-medium ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-14">
          <Section title="🧾 Στοιχεία Επικοινωνίας">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputField
                name="full_name"
                label="Ονοματεπώνυμο"
                placeholder="π.χ. Ιωάννης Παπαδόπουλος"
                value={form.full_name}
                onChange={handleChange}
                required
                error={fullNameError}
              />
              <InputField name="amka" label="ΑΜΚΑ" placeholder="π.χ. 01019999999" value={form.amka} onChange={handleChange} />
              <InputField name="email" label="Email" type="email" placeholder="example@email.com" value={form.email} onChange={handleChange} />
              <InputField name="phone" label="Τηλέφωνο" placeholder="π.χ. 6981234567" value={form.phone} onChange={handleChange} />
              <InputField name="birth_date" label="Ημ. Γέννησης" type="date" value={form.birth_date} onChange={handleChange} />
              <SelectField
                    name="gender"
                    label="Φύλο"
                    value={form.gender}
                    onChange={handleChange}
                    options={[
                        { label: 'Άνδρας', value: 'male' },
                        { label: 'Γυναίκα', value: 'female' },
                        { label: 'Άλλο', value: 'other' }
                    ]}
              />
              <InputField name="occupation" label="Επάγγελμα" value={form.occupation} onChange={handleChange} />
              <InputField name="first_visit_date" label="Ημ. Προσέλευσης" type="date" value={form.first_visit_date ?? ''} onChange={handleChange} />
              <SelectField
                name="children"
                label="Τέκνα"
                value={form.children}
                onChange={handleChange}
                options={['Κανένα', '1 παιδί', '2 παιδιά', '3+ παιδιά']}
              />

              <SelectField
                    name="marital_status"
                    label="Οικογενειακή Κατάσταση"
                    value={form.marital_status}
                    onChange={handleChange}
                    options={['Άγαμος/η', 'Έγγαμος/η', 'Διαζευγμένος/η', 'Χήρος/α']}
              />
            </div>
          </Section>

          <Section title="📋 Κλινικές Πληροφορίες">
            <div className="grid grid-cols-1 gap-6">
              <TextAreaField name="gynecological_history" label="Γυναικολογικό Ιστορικό" value={form.gynecological_history} onChange={handleChange} />
              <TextAreaField name="hereditary_history" label="Κληρονομικό Ιστορικό" value={form.hereditary_history} onChange={handleChange} />
              <TextAreaField name="current_disease" label="Παρούσα Νόσος" value={form.current_disease} onChange={handleChange} />
              <TextAreaField name="physical_exam" label="Αντικειμενική Εξέταση" value={form.physical_exam} onChange={handleChange} />
              <TextAreaField name="preclinical_screening" label="Προκλινικός Έλεγχος" value={form.preclinical_screening} onChange={handleChange} />
              <TextAreaField name="notes" label="Σημειώσεις" value={form.notes} onChange={handleChange} />
              <SelectField
                name="smoking"
                label="Καπνιστής"
                value={form.smoking}
                onChange={handleChange}
                options={['Όχι', 'Περιστασιακά', 'Καθημερινά', 'Πρώην καπνιστής', 'Προσαρμογή']}
                 />
                {form.smoking === 'Προσαρμογή' && (
                <InputField
                    name="customSmoking"
                    label="Προσαρμοσμένη Τιμή (Καπνιστής)"
                    value={form.customSmoking}
                    onChange={handleChange}
                />
              )}

              <SelectField
                name="alcohol"
                label="Κατανάλωση Αλκοόλ"
                value={form.alcohol}
                onChange={handleChange}
                options={['Όχι', 'Σπάνια', 'Συχνά', 'Καθημερινά', 'Προσαρμογή']}
                />

                {form.alcohol === 'Προσαρμογή' && (
                <InputField
                    name="customAlcohol"
                    label="Προσαρμοσμένη Τιμή (Αλκοόλ)"
                    value={form.customAlcohol}
                    onChange={handleChange}
                />
                )}
              <TextAreaField name="medications" label="Φάρμακα" value={form.medications} onChange={handleChange} />
            </div>
          </Section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#2e2c28] hover:bg-[#1f1e1b] text-white px-7 py-2.5 rounded-lg text-sm font-semibold tracking-wide shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Αποθήκευση...' : 'Καταχώρηση'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

// Components
const Section = ({ title, children }) => (
    <section className="rounded-2xl border border-[#dce6e4] bg-white/70 px-6 py-8 shadow-sm">
     <h2 className="text-lg font-semibold mb-6 text-[#4a4a48] tracking-tight">{title}</h2>
      {children}
  </section>
);

const InputField = ({ name, label, type = 'text', placeholder, value, onChange }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-[#514f4b] mb-1">{label}</label>
    <input
      type={type}
      name={name}
      id={name}
      placeholder={placeholder}
      value={value ?? ''}   
      onChange={onChange}
      className="w-full px-3 py-2 border border-[#d6d3cb] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#9e9483] transition"
    />
  </div>
);

const SelectField = ({ name, label, value, onChange, options }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-[#514f4b] mb-1">{label}</label>
    <select
      name={name}
      id={name}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-[#d6d3cb] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#9e9483] transition"
    >
      <option value="">Επιλέξτε</option>
      {options.map((opt) => {
        if (typeof opt === 'string') {
          return <option key={opt} value={opt}>{opt}</option>;
        } else if (typeof opt === 'object' && opt.value) {
          return <option key={opt.value} value={opt.value}>{opt.label}</option>;
        }
        return null;
      })}
    </select>
  </div>
);


const TextAreaField = ({ name, label, value, onChange }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-[#514f4b] mb-1">{label}</label>
    <textarea
      name={name}
      id={name}
      rows={4}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-[#d6d3cb] rounded-md text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#9e9483] transition"
    />
  </div>
);
