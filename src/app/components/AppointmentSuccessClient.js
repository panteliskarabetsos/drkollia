"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle,
  CalendarCheck2,
  Clock,
  FileText,
  MailCheck,
} from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
export default function AppointmentSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const ref = searchParams.get("ref");
  const name = searchParams.get("name");
  const dateStr = searchParams.get("date");
  const reason = searchParams.get("reason");

  const [countdown, setCountdown] = useState(20);

  // Guard invalid params
  useEffect(() => {
    if (ref !== "ok" || !name || !dateStr || !reason) {
      router.replace("/");
    }
  }, [ref, name, dateStr, reason, router]);

  // Tick down every second (no setInterval, works fine with Strict Mode)
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  // Redirect when countdown hits 0 (separate effect = no Router update during setState)
  useEffect(() => {
    if (countdown === 0) {
      router.push("/");
    }
  }, [countdown, router]);

  if (ref !== "ok") return null;

  const date = new Date(dateStr);
  const formattedDate = format(date, "eeee dd MMMM yyyy", { locale: el });
  const formattedTime = format(date, "HH:mm");

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f9f9f9] px-4 py-24">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-white/90 backdrop-blur-lg border border-[#e0ddd6] rounded-3xl shadow-xl p-10 max-w-lg w-full text-center"
      >
        <CheckCircle
          className="mx-auto text-green-600 mb-4"
          size={48}
          strokeWidth={1.5}
        />
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">
          Ευχαριστούμε, {name}!
        </h1>
        <p className="text-gray-600 mb-6">
          Το ραντεβού σας επιβεβαιώθηκε με επιτυχία.
        </p>

        <div className="bg-gray-100 rounded-xl p-5 text-left text-sm text-gray-800 space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="text-gray-600" size={18} />
            <span>
              <strong>Ημερομηνία:</strong> {formattedDate}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="text-gray-600" size={18} />
            <span>
              <strong>Ώρα:</strong> {formattedTime}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="text-gray-600" size={18} />
            <span>
              <strong>Λόγος:</strong> {reason}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="text-gray-600" size={18} />
            <span>
              <strong>Πληρωμή:</strong> Στο ιατρείο
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center text-green-700 mb-6 text-sm">
          <MailCheck className="mr-2" size={20} />
          <span>Θα λάβετε σύντομα email επιβεβαίωσης.</span>
        </div>

        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
        >
          Επιστροφή στην αρχική σελίδα
        </button>

        <p className="text-sm text-gray-400 mt-4">
          Αυτόματη επιστροφή σε {countdown} δευτερόλεπ
          {countdown === 1 ? "το" : "τα"}...
        </p>
      </motion.div>
    </main>
  );
}
