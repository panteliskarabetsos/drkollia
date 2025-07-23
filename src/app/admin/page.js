'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fafafa] text-[#333]">
        <p className="text-sm text-gray-500">Έλεγχος σύνδεσης...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#333] font-sans">
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h1 className="text-3xl font-medium text-center mb-12 tracking-tight">Πίνακας Διαχείρισης</h1>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {[
            {
              title: 'Ραντεβού',
              description: 'Διαχείριση προγραμματισμένων ραντεβού.',
              href: '/admin/appointments',
            },
            {
              title: 'Ασθενείς',
              description: 'Προβολή και επεξεργασία αρχείου ασθενών.',
              href: '/admin/patients',
            },
            {
              title: 'Μηνύματα',
              description: 'Μηνύματα από τη φόρμα επικοινωνίας.',
              href: '/admin/messages',
            },
            {
              title: 'Πρόσβαση',
              description: 'Διαχείριση λογαριασμών διαχειριστών.',
              href: '/admin/accounts',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="border border-gray-200 bg-white rounded-xl p-5 hover:border-gray-300 transition"
            >
              <h2 className="text-lg font-semibold mb-1">{item.title}</h2>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">{item.description}</p>
              <Link href={item.href}>
                <button className="text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition">
                  Άνοιγμα
                </button>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
