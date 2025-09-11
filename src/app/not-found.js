"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#faf8f3] via-[#f2eee8] to-[#e8e4dc] text-center px-6">
      {/* Animated circle background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-[#8c7c68]/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#8c7c68]/10 blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Big 404 */}
      <h1 className="relative text-[6rem] md:text-[8rem] font-extrabold text-[#8c7c68] tracking-tight leading-none drop-shadow-sm">
        404
      </h1>
      <p className="mt-4 text-lg text-[#3b3a36] max-w-md">
        Η σελίδα που αναζητάτε δεν βρέθηκε ή δεν είναι διαθέσιμη.
      </p>

      {/* Actions */}
      <div className="mt-10 flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#e5e1d8] bg-white/90 shadow-sm text-[#3b3a36] hover:bg-[#f6f4ef] hover:shadow-md transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Επιστροφή
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-transparent bg-[#8c7c68] text-white shadow-sm hover:bg-[#6f6354] hover:shadow-md transition"
        >
          <Home className="w-4 h-4" />
          Αρχική
        </Link>
      </div>
    </main>
  );
}
