"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import {
  CalendarDays,
  User,
  Clock,
  ShieldCheck,
  ArrowRight,
  Loader2,
  LifeBuoy, // <-- Lifejacket icon
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [loadingButton, setLoadingButton] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session) {
        router.push("/login");
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

  const items = [
    {
      title: "Ραντεβού",
      description: "Διαχείριση προγραμματισμένων ραντεβού.",
      href: "/admin/appointments",
      icon: <CalendarDays className="w-5 h-5 text-[#3a3a38]" />,
    },
    {
      title: "Ασθενείς",
      description: "Προβολή και επεξεργασία αρχείου ασθενών.",
      href: "/admin/patients",
      icon: <User className="w-5 h-5 text-[#3a3a38]" />,
    },
    {
      title: "Πρόγραμμα",
      description: "Διαχείριση προγράμματος λειτουργίας και εξαιρέσεων.",
      href: "/admin/schedule",
      icon: <Clock className="w-5 h-5 text-[#3a3a38]" />,
    },
    {
      title: "Πρόσβαση",
      description: "Διαχείριση λογαριασμών διαχειριστών.",
      href: "/admin/accounts",
      icon: <ShieldCheck className="w-5 h-5 text-[#3a3a38]" />,
    },
  ];

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#333] font-sans relative">
      <section className="py-22 px-4 max-w-6xl mx-auto">
        <h1 className="text-3xl font-medium text-center mb-12 tracking-tight">
          Πίνακας Διαχείρισης
        </h1>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="group border border-gray-200 bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition duration-200 hover:scale-[1.01] flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-3">
                {item.icon}
                <h2 className="text-lg font-semibold">{item.title}</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6">{item.description}</p>
              <button
                onClick={() => {
                  setLoadingButton(idx);
                  router.push(item.href);
                }}
                className="inline-flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-[#3a3a38] hover:text-white transition font-medium shadow-sm disabled:opacity-60"
                disabled={loadingButton !== null}
              >
                {loadingButton === idx ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Φόρτωση...
                  </>
                ) : (
                  <>
                    Μετάβαση
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Help Button with Hover Text */}
      <div className="fixed bottom-6 right-6 flex items-center space-x-2 group">
        {/* Hover text */}
        <span className="opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 bg-white text-gray-700 text-sm px-3 py-1 rounded-lg shadow-md">
          Χρειάζεστε βοήθεια?
        </span>

        {/* Icon button */}
        <button
          onClick={() => router.push("/help")}
          aria-label="Need help?"
          className="p-3 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          <LifeBuoy className="w-8 h-8" />
        </button>
      </div>
    </main>
  );
}
