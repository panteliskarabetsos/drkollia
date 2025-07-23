'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient'; // adjust path if needed
import Link from 'next/link';
export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
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
      <main className="min-h-screen flex items-center justify-center bg-[#fdfaf6] text-[#3b3a36]">
        <p>Έλεγχος σύνδεσης...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fdfaf6] text-[#3b3a36]">

    <section className="py-20 px-6 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">Πίνακας Διαχείρισης</h1>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {/* Ραντεβού */}
        <div className="p-6 rounded-xl border border-[#e0d8ca] bg-white shadow hover:shadow-md transition">
          <h2 className="text-xl font-semibold mb-2">Ραντεβού</h2>
          <p className="text-sm text-[#5a5955] mb-4">Δείτε και διαχειριστείτε τα ραντεβού.</p>
          <Link href="/admin/appointments">
            <button className="text-sm text-white bg-[#8c7c68] px-4 py-2 rounded hover:bg-[#6f6253]">
              Διαχείριση
            </button>
          </Link>
        </div>

        {/* Ασθενείς */}
        <div className="p-6 rounded-xl border border-[#e0d8ca] bg-white shadow hover:shadow-md transition">
          <h2 className="text-xl font-semibold mb-2">Ασθενείς</h2>
          <p className="text-sm text-[#5a5955] mb-4">Δείτε το αρχείο ασθενών.</p>
          <Link href="/admin/patients">
            <button className="text-sm text-white bg-[#8c7c68] px-4 py-2 rounded hover:bg-[#6f6253]">
              Διαχείριση
            </button>
          </Link>
        </div>

        {/* Μηνύματα */}
        <div className="p-6 rounded-xl border border-[#e0d8ca] bg-white shadow hover:shadow-md transition">
          <h2 className="text-xl font-semibold mb-2">Μηνύματα</h2>
          <p className="text-sm text-[#5a5955] mb-4">Δείτε τα μηνύματα από τη φόρμα επικοινωνίας.</p>
          <Link href="/admin/messages">
            <button className="text-sm text-white bg-[#8c7c68] px-4 py-2 rounded hover:bg-[#6f6253]">
              Προβολή
            </button>
          </Link>
        </div>
      </div>
    </section>


    </main>
  );
}
