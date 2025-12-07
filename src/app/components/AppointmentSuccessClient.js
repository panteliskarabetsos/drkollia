"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  CalendarCheck2,
  Clock,
  FileText,
  MailCheck,
} from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

const TOTAL_SECONDS = 20;

export default function AppointmentSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const ref = searchParams.get("ref");
  const name = searchParams.get("name");
  const dateStr = searchParams.get("date");
  const reason = searchParams.get("reason");

  const [countdown, setCountdown] = useState(TOTAL_SECONDS);

  // Guard invalid params
  useEffect(() => {
    if (ref !== "ok" || !name || !dateStr || !reason) {
      router.replace("/");
    }
  }, [ref, name, dateStr, reason, router]);

  // Tick down every second
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  // Redirect when countdown hits 0
  useEffect(() => {
    if (countdown === 0) {
      router.push("/");
    }
  }, [countdown, router]);

  if (ref !== "ok") return null;

  const date = new Date(dateStr);
  const formattedDate = format(date, "eeee dd MMMM yyyy", { locale: el });
  const formattedTime = format(date, "HH:mm");
  const progress = ((TOTAL_SECONDS - countdown) / TOTAL_SECONDS) * 100;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f3e7db,_#fdfaf6_55%)] flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-[#e0ddd6] bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-md"
      >
        {/* Decorative top accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#d3bba2] via-[#b89a7c] to-[#8b7159]" />

        <div className="p-8 sm:p-10">
          {/* Status pill */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                <CalendarCheck2 className="h-3.5 w-3.5" />
              </span>
              <span>Το ραντεβού καταχωρήθηκε</span>
            </div>

            <span className="hidden text-[11px] text-neutral-500 sm:inline">
              Κωδικός επιβεβαίωσης δημιουργήθηκε επιτυχώς
            </span>
          </div>

          {/* Icon + heading */}
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.45 }}
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50"
            >
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </motion.div>

            <h1 className="text-2xl font-semibold tracking-tight text-[#2f2e2b] sm:text-3xl">
              Ευχαριστούμε, {name}!
            </h1>
            <p className="mt-2 text-sm text-neutral-600 sm:text-base">
              Το ραντεβού σας έχει επιβεβαιωθεί και σας περιμένουμε στο ιατρείο
              την προγραμματισμένη ώρα.
            </p>
          </div>

          {/* Appointment details card */}
          <div className="mt-8 rounded-2xl border border-[#e7e2d9] bg-[#f8f4ee] px-5 py-4 sm:px-6 sm:py-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7b65]">
              Στοιχεία ραντεβού
            </h2>

            <div className="space-y-3 text-sm text-[#3f3e3a]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
                  <CalendarCheck2 className="h-4 w-4 text-[#8c7b65]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500">
                    Ημερομηνία
                  </p>
                  <p className="text-sm font-semibold">{formattedDate}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
                  <Clock className="h-4 w-4 text-[#8c7b65]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500">Ώρα</p>
                  <p className="text-sm font-semibold">{formattedTime}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
                  <FileText className="h-4 w-4 text-[#8c7b65]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500">
                    Λόγος επίσκεψης
                  </p>
                  <p className="text-sm font-semibold break-words">{reason}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-[#8c7b65]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500">
                    Πληρωμή
                  </p>
                  <p className="text-sm font-semibold">Στο ιατρείο</p>
                </div>
              </div>
            </div>
          </div>

          {/* Email info */}
          <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs text-emerald-900 sm:text-sm">
            <MailCheck className="h-4 w-4" />
            <span>
              Θα λάβετε σύντομα email επιβεβαίωσης. Αν δεν το βρείτε, ελέγξτε
              και τον φάκελο ανεπιθύμητης αλληλογραφίας.
            </span>
          </div>

          {/* Actions */}
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/")}
                className="inline-flex items-center justify-center rounded-2xl bg-[#2f2e2b] px-6 py-2.5 text-sm font-medium tracking-tight text-white shadow-md transition hover:-translate-y-0.5 hover:bg-black hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d1c3ad] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdfaf6]"
              >
                Επιστροφή στην αρχική
              </button>

              <button
                onClick={() => router.push("/appointments")}
                className="inline-flex items-center justify-center rounded-2xl border border-[#d9cdbf] bg-white px-4 py-2.5 text-sm font-medium text-[#5a5348] shadow-sm transition hover:-translate-y-0.5 hover:border-[#b99d7e] hover:bg-[#f8f1e7]"
              >
                Κλείστε νέο ραντεβού
              </button>
            </div>

            {/* Countdown + progress */}
            <div className="w-full sm:w-48">
              <p
                className="text-[11px] text-neutral-500 text-center sm:text-right"
                aria-live="polite"
              >
                Αυτόματη επιστροφή σε{" "}
                <span className="font-semibold text-neutral-700">
                  {countdown}
                </span>{" "}
                δευτερόλεπτα
                {countdown === 1 ? "το" : "τα"}.
              </p>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200/70">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-[#b99d7e] to-[#8b7159] transition-[width] duration-1000 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
