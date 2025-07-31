"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function LegalPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-50 py-36 px-4">
      <div className="max-w-3xl mx-auto text-center">
        {/* Heading */}
        <h1 className="text-4xl font-semibold text-slate-900 mb-4 tracking-tight">
          Νομικές Πληροφορίες
        </h1>
        <p className="text-slate-600 mb-10 text-base">
          Ενημερωθείτε για τους όρους χρήσης και την πολιτική προστασίας των
          προσωπικών σας δεδομένων.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <button
            onClick={() => router.push("/terms")}
            className="group relative inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 font-medium hover:bg-slate-100 hover:text-slate-900 transition shadow-sm"
          >
            Όροι Χρήσης
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
          </button>

          <button
            onClick={() => router.push("/privacy-policy")}
            className="group relative inline-flex items-center justify-center px-6 py-3 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
          >
            Πολιτική Απορρήτου
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>

        {/* Contact */}
        <p className="text-sm text-slate-500">
          Για οποιαδήποτε νομική απορία, επικοινωνήστε στο{" "}
          <a
            href="mailto:gokollia@gmail.com"
            className="text-blue-600 hover:underline"
          >
            gokollia@gmail.com
          </a>
        </p>
      </div>
    </main>
  );
}
