"use client";

import Image from "next/image";
import Link from "next/link";
import { Noto_Serif } from "next/font/google";
import {
  Clock,
  Stethoscope,
  ActivitySquare,
  HeartPulse,
  ShieldCheck,
  MapPin,
  Car,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const notoSerif = Noto_Serif({ subsets: ["latin"], weight: ["400", "700"] });

const HOURS = [
  { day: "Δευτέρα", hours: "10:00 – 13:00 & 17:30 – 21:00" },
  { day: "Τρίτη", hours: "17:30 – 21:00" },
  { day: "Τετάρτη", hours: "10:00 – 13:00" },
  { day: "Πέμπτη", hours: "10:00 – 13:00 & 17:30 – 21:00" },
  { day: "Παρασκευή", hours: "Κλειστά" },
  { day: "Σάββατο & Κυριακή", hours: "Κλειστά" },
];

const SPECIALTIES = [
  {
    icon: <HeartPulse className="w-5 h-5" />,
    title: "Θυρεοειδής & Αυτοάνοσα",
    desc: "Διάγνωση και παρακολούθηση παθήσεων θυρεοειδούς, Hashimoto, Graves.",
  },
  {
    icon: <ActivitySquare className="w-5 h-5" />,
    title: "Μεταβολισμός & Βάρος",
    desc: "Ρύθμιση μεταβολισμού, προγράμματα απώλειας βάρους, μεταβολικό σύνδρομο.",
  },
  {
    icon: <Stethoscope className="w-5 h-5" />,
    title: "Ορμόνες Γυναικών",
    desc: "Διαταραχές κύκλου, πολυκυστικές ωοθήκες, εγκυμοσύνη, εμμηνόπαυση.",
  },
];

// Cache 5'
let cachedAcceptOnline = null;
let cachedAcceptOnlineUpdatedAt = 0;
const SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchAcceptsOnlineFromDB() {
  const now = Date.now();

  if (
    cachedAcceptOnline !== null &&
    now - cachedAcceptOnlineUpdatedAt < SETTINGS_CACHE_TTL_MS
  ) {
    return cachedAcceptOnline;
  }

  const { data, error } = await supabase
    .from("clinic_settings")
    .select("accept_new_appointments")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Failed to load clinic_settings:", error);
    cachedAcceptOnline = false;
  } else if (data) {
    cachedAcceptOnline = !!data.accept_new_appointments;
  } else {
    cachedAcceptOnline = false;
  }

  cachedAcceptOnlineUpdatedAt = now;
  return cachedAcceptOnline;
}

export default function Home() {
  const [acceptsOnline, setAcceptsOnline] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const value = await fetchAcceptsOnlineFromDB();
        if (!cancelled) {
          setAcceptsOnline(value);
        }
      } catch (e) {
        console.error("Error checking online appointments:", e);
        if (!cancelled) {
          setAcceptsOnline(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main
      className={`min-h-screen bg-[#fdfaf6] text-[#3b3a36] ${notoSerif.className}`}
    >
      {/* ======================= HERO (UNCHANGED) ======================= */}
      <section className="relative flex flex-col items-center justify-center h-screen min-h-screen px-4 sm:px-6 lg:px-8 pt-16 pb-14 text-center overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/background.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* overlay */}
        <div className="absolute inset-0 bg-[#fdfaf6]/80 backdrop-blur-[12px] backdrop-brightness-110 z-0" />

        <div className="relative z-10 mx-auto max-w-2xl sm:max-w-3xl lg:max-w-4xl space-y-5 sm:space-y-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.1rem] font-semibold leading-tight tracking-tight text-[#2f2e2b]">
            Ενδοκρινολογία &amp; Ορμονική Ευεξία
          </h1>

          <p className="text-sm sm:text-[15px] md:text-base text-[#5b5853] max-w-xl mx-auto">
            Ήρεμη, σύγχρονη φροντίδα για τον θυρεοειδή, τον μεταβολισμό και τις
            ορμόνες σας.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/appointments"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-[#3b3a36] text-white px-8 py-3 text-sm md:text-base shadow-sm hover:bg-[#272623] transition"
            >
              Κλείστε Ραντεβού
            </Link>
            <Link
              href="#hours"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-[#3b3a36]/40 text-[#3b3a36] px-8 py-3 text-sm md:text-base hover:bg-[#3b3a36] hover:text-white bg-white/70 transition"
            >
              Ώρες Λειτουργίας
            </Link>
          </div>

          <div className="flex flex-col items-center gap-1 text-xs text-[#8b857b]">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-4 h-4 text-[#8c7c68]" />
                Ηλιούπολη
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-4 h-4 text-[#8c7c68]" />
                Κατόπιν ραντεβού
              </span>
            </div>

            {acceptsOnline === null ? (
              <span className="inline-flex items-center gap-1 text-[#8b857b]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Έλεγχος διαθεσιμότητας ηλεκτρονικών ραντεβού…
              </span>
            ) : (
              <span
                className={[
                  "inline-flex items-center gap-1 text-center",
                  acceptsOnline ? "text-emerald-700/80" : "text-amber-700/80",
                ].join(" ")}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {acceptsOnline
                  ? "Το ιατρείο δέχεται ηλεκτρονικά ραντεβού."
                  : "Προσωρινά δεν δεχόμαστε ηλεκτρονικά ραντεβού – καλέστε στο 210 9934316."}
              </span>
            )}
          </div>
        </div>

        {/* Scroll indicator (kept for md+ so it doesn’t crowd small screens) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center text-[#8c7c68]">
          <span className="text-[11px] tracking-[0.18em] uppercase mb-1">
            Scroll
          </span>
          <div className="w-6 h-10 rounded-full border border-[#cbbfad] flex items-start justify-center p-1">
            <div className="w-1 h-2 rounded-full bg-[#8c7c68] animate-bounce" />
          </div>
        </div>
      </section>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#e8e1d8] to-transparent" />

      {/* ======================= ΕΞΕΙΔΙΚΕΥΣΕΙΣ ======================= */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8 bg-[#f7f2eb]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#f1ebe3] border border-[#e4ddd1] px-3 py-1 text-[11px] tracking-[0.16em] uppercase text-[#7a7469] mb-4">
              <ActivitySquare className="w-3.5 h-3.5" />
              Κύριες Εξειδικεύσεις
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[#252422] mb-3">
              Ιατρική φροντίδα γύρω από τις ορμόνες
            </h2>
            <p className="text-sm md:text-base text-[#5b5853]">
              Από τον θυρεοειδή έως τον μεταβολισμό και την ορμονική ισορροπία
              της γυναίκας, η φροντίδα προσαρμόζεται στις ανάγκες σας.
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:gap-5 md:grid-cols-3 auto-rows-fr">
            {SPECIALTIES.map((item) => (
              <div
                key={item.title}
                className="flex flex-col rounded-2xl border border-[#e6dfd4] bg-white px-4 sm:px-5 py-5 shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all"
              >
                <div className="inline-flex items-center justify-center rounded-xl bg-[#f3ede4] text-[#8c7c68] p-2 mb-3 w-10 h-10">
                  {item.icon}
                </div>
                <h3 className="text-[15px] sm:text-base font-semibold text-[#252422] mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-[#5b5853] leading-relaxed flex-1">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#e8e1d8] to-transparent" />

      {/* ======================= Η Ιατρός ======================= */}
      <section className="py-16 sm:py-20 lg:py-22 px-4 sm:px-6 lg:px-8 bg-[#faf7f3]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-[1.1fr_0.9fr] gap-10 md:gap-12 items-center">
          <div className="space-y-5 sm:space-y-6 text-center md:text-left">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#f1ebe3] border border-[#e4ddd1] px-3 py-1 text-[11px] tracking-[0.16em] uppercase text-[#7a7469]">
              <Stethoscope className="w-3.5 h-3.5" />Η Ιατρός
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[#252422]">
              Η Δρ. Γεωργία Κόλλια
            </h2>
            <p className="text-sm sm:text-[0.98rem] md:text-[1.05rem] text-[#4a4944] leading-relaxed max-w-xl md:max-w-none mx-auto md:mx-0">
              Η Δρ. Κόλλια ειδικεύεται στην ενδοκρινολογία με έμφαση στον
              θυρεοειδή, τον μεταβολισμό και τις ορμονικές διαταραχές. Προσφέρει
              εξατομικευμένη παρακολούθηση, συνδυάζοντας εμπειρία και σύγχρονη
              επιστημονική γνώση.
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-[#5b5853]">
              <li className="inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8c7c68]" />
                Εξατομικευμένα πλάνα θεραπείας
              </li>
              <li className="inline-flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[#8c7c68]" />
                Ολιστική προσέγγιση ασθενούς
              </li>
              <li className="inline-flex items-center gap-2">
                <ActivitySquare className="w-4 h-4 text-[#8c7c68]" />
                Επίκαιρα επιστημονικά πρωτόκολλα
              </li>
              <li className="inline-flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-[#8c7c68]" />
                Διακριτικότητα &amp; σεβασμός
              </li>
            </ul>

            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 text-[#252422] border border-[#252422] px-6 py-2.5 rounded-full hover:bg-[#252422] hover:text-white transition duration-300 shadow-sm mt-2"
            >
              Δείτε Περισσότερα
            </Link>
          </div>

          <div className="max-w-xs sm:max-w-md mx-auto rounded-3xl overflow-hidden shadow-xl ring-1 ring-[#e8e1d8] bg-white">
            <Image
              src="/doctor.jpg"
              alt="Dr. Georgia Kollia"
              width={640}
              height={520}
              className="object-cover w-full h-full will-change-transform hover:scale-[1.02] transition-transform duration-700"
              priority={false}
            />
          </div>
        </div>
      </section>

      {/* ======================= Το Ιατρείο ======================= */}
      <section className="py-16 sm:py-20 lg:py-22 px-4 sm:px-6 lg:px-8 bg-[#f3eee6]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-[0.95fr_1.05fr] gap-10 md:gap-12 items-center">
          <div className="order-1 md:order-none">
            <div className="max-w-xs sm:max-w-md md:max-w-lg mx-auto relative rounded-3xl overflow-hidden shadow-xl ring-1 ring-[#e8e1d8] bg-white">
              <Image
                src="/iatreio.jpg"
                alt="Clinic Interior"
                width={640}
                height={520}
                className="object-cover w-full h-full will-change-transform hover:scale-[1.02] transition-transform duration-700"
                priority={false}
              />
              <div className="absolute left-3 bottom-3 sm:left-4 sm:bottom-4 inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur px-3 py-1 shadow-sm border border-[#e8e1d8] text-xs sm:text-sm text-[#3b3a36]">
                <MapPin className="w-4 h-4 text-[#8c7c68]" />
                Ηλιούπολη
              </div>
            </div>
          </div>

          <div className="space-y-5 sm:space-y-6 text-center md:text-left">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#f1ebe3] border border-[#e4ddd1] px-3 py-1 text-[11px] tracking-[0.16em] uppercase text-[#7a7469]">
              <HeartPulse className="w-3.5 h-3.5" />
              Το Ιατρείο
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[#252422]">
              Ένας χώρος γαλήνης &amp; εμπιστοσύνης
            </h2>
            <p className="text-sm sm:text-[0.98rem] md:text-[1.05rem] text-[#4a4944] leading-relaxed max-w-xl md:max-w-none mx-auto md:mx-0">
              Κομψός, φιλόξενος χώρος που προάγει τη γαλήνη και την εμπιστοσύνη.
              Σχεδιασμένος ώστε να αισθάνεστε άνεση και ασφάλεια σε κάθε
              επίσκεψη.
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#5b5853]">
              <li className="inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8c7c68]" />
                Πιστή τήρηση πρωτοκόλλων &amp; απολύμανσης
              </li>

              <li className="inline-flex items-center gap-2">
                <Car className="w-4 h-4 text-[#8c7c68]" />
                Άνετη πρόσβαση &amp; στάθμευση γύρω από το ιατρείο
              </li>
            </ul>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#e4ddd1] bg-white/80 px-3 py-1.5 text-xs text-[#3b3a36]">
                <Clock className="w-4 h-4 text-[#8c7c68]" /> Κατόπιν ραντεβού
              </span>
            </div>

            <div className="pt-2">
              <Link
                href="/iatreio"
                className="inline-flex items-center justify-center gap-2 text-[#252422] border border-[#252422] px-6 py-2.5 rounded-full hover:bg-[#252422] hover:text-white transition duration-300 shadow-sm"
              >
                Δείτε Περισσότερα
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#e8e1d8] to-transparent" />

      {/* ======================= Ώρες Λειτουργίας ======================= */}
      <section
        className="py-16 sm:py-18 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#faf7f3]"
        id="hours"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <div className="mx-auto mb-4 inline-flex rounded-full border border-[#e4ddd1] bg-[#f2ebe1] p-2">
              <Clock className="w-6 h-6 text-[#8c7b66]" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold tracking-tight text-[#252422]">
              Ώρες Λειτουργίας Ιατρείου
            </h2>
            <p className="mt-2 text-sm text-[#6a6257]">
              Επισκέψεις αποκλειστικά κατόπιν ραντεβού.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HOURS.map(({ day, hours }) => {
              const isClosed = hours.includes("Κλειστά");
              return (
                <div
                  key={day}
                  className={[
                    "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded-xl px-4 py-3 shadow-sm border",
                    isClosed
                      ? "border-[#eee8df] bg-[#f7f2ea]"
                      : "border-[#ebe3d6] bg-white",
                  ].join(" ")}
                >
                  <span className="text-[15px] font-medium text-[#252422]">
                    {day}
                  </span>
                  <span
                    className={[
                      "text-sm",
                      isClosed ? "text-[#b0a79c] italic" : "text-[#6a6257]",
                    ].join(" ")}
                  >
                    {hours}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-center text-xs text-[#6a6257] italic">
            * Για άμεση διαθεσιμότητα, καλέστε στο{" "}
            <a href="tel:+302109934316" className="underline">
              210 9934316
            </a>
            .
          </p>
        </div>
      </section>

      {/* ======================= CTA ======================= */}
      <section
        id="contact"
        className="relative py-18 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#2f2e2b] text-white text-center overflow-hidden"
      >
        <div className="absolute inset-0 opacity-15">
          <Image
            src="/cta.jpg"
            alt="cta image"
            fill
            className="object-cover pointer-events-none"
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,transparent_0%,rgba(0,0,0,0.4)_70%,rgba(0,0,0,0.6)_100%)]" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-5 sm:space-y-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            Κλείστε Ραντεβού
          </h2>
          <p className="text-base sm:text-lg text-white/90">
            Κάντε το πρώτο βήμα προς την ορμονική ισορροπία και την καλύτερη
            ποιότητα ζωής. Η ομάδα μας είναι εδώ για να σας βοηθήσει.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/appointments"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-white/95 text-[#2f2e2b] px-6 py-3 shadow-sm hover:bg-white transition"
            >
              Κλείστε Online
            </Link>
            <a
              href="tel:+302109934316"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-white/80 px-6 py-3 hover:bg-white hover:text-[#2f2e2b] transition"
            >
              Κλήση στο 210 9934316
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
