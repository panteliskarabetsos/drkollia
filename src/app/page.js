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
  Heart,
  Car,
} from "lucide-react";
import { useOnline } from "../lib/useOnline";
const notoSerif = Noto_Serif({ subsets: ["latin"], weight: ["400", "700"] });

export default function Home() {
  return (
    <main
      className={`min-h-screen bg-[#fdfaf6] text-[#3b3a36] ${notoSerif.className}`}
    >
      {/* ======================= Hero (unchanged) ======================= */}
      <section className="relative flex flex-col items-center justify-center h-[100vh] text-center px-6 overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-b from-[#ece5da]/80 to-[#fdfaf6]/95 backdrop-blur-sm z-0" />

        <div className="relative z-10 max-w-3xl animate-fadeInUp duration-1000 ease-out">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            Ενδοκρινολογία & Ορμονική Ευεξία
          </h1>
          <p className="text-lg md:text-xl text-[#3b3a36] mb-10">
            Επιστημονική γνώση και ανθρώπινη προσέγγιση για την υγεία σας.
            Θυρεοειδής, ορμόνες, μεταβολισμός — με φροντίδα.
          </p>
          <Link
            href="/appointments"
            className="inline-block text-[#3b3a36] border border-[#3b3a36] px-6 py-2 rounded-full hover:bg-[#3b3a36] hover:text-white transition"
          >
            Κλείστε Ραντεβού
          </Link>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center animate-bounce text-[#8c7c68]">
          <span className="text-sm tracking-wide mb-1">Scroll</span>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </section>

      {/* Hairline separator */}
      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#e8e1d8] to-transparent" />

      {/* ======================= Η Ιατρός ======================= */}
      <section className="py-24 px-6 bg-[#faf7f3]">
        <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          {/* ambient orbs */}
          <div className="pointer-events-none absolute -top-16 -left-24 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,_#efe6d9_0%,transparent_60%)] opacity-70" />
          <div className="space-y-6 text-center md:text-left">
            <h2 className="text-4xl font-semibold tracking-tight">Η Ιατρός</h2>
            <p className="text-[1.05rem] text-[#4a4944] leading-relaxed">
              Η Δρ. Κόλλια ειδικεύεται στην ενδοκρινολογία με έμφαση στον
              θυρεοειδή και τον μεταβολισμό. Προσφέρει εξατομικευμένη φροντίδα,
              συνδυάζοντας εμπειρία και σύγχρονη επιστημονική γνώση.
            </p>

            {/* quick highlights */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[#5b5853]">
              <li className="inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8c7c68]" />{" "}
                Εξατομικευμένα πλάνα θεραπείας
              </li>
              <li className="inline-flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[#8c7c68]" /> Ολιστική
                προσέγγιση ασθενούς
              </li>
              <li className="inline-flex items-center gap-2">
                <ActivitySquare className="w-4 h-4 text-[#8c7c68]" /> Επίκαιρα
                επιστημονικά πρωτόκολλα
              </li>
              <li className="inline-flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-[#8c7c68]" /> Διακριτικότητα
                & σεβασμός
              </li>
            </ul>

            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 text-[#2f2e2b] border border-[#2f2e2b] px-6 py-2.5 rounded-full hover:bg-[#2f2e2b] hover:text-white transition duration-300 shadow-sm"
            >
              Δείτε Περισσότερα
            </Link>
          </div>

          <div className="max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl ring-1 ring-[#e8e1d8]">
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
      <section className="py-24 px-6 bg-[#f2eee8]">
        <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          {/* ambient accents */}
          <div className="pointer-events-none absolute -top-16 -right-24 h-56 w-56 rounded-full bg-[radial-gradient(ellipse_at_center,_#efe6d9_0%,transparent_60%)] opacity-70" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-[radial-gradient(ellipse_at_center,_#f5ede2_0%,transparent_60%)] opacity-70" />

          {/* image first on mobile, second on desktop */}
          <div className="order-1 md:order-none space-y-3">
            <div className="max-w-lg mx-auto  relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-[#e8e1d8]">
              <Image
                src="/iatreio.jpg"
                alt="Clinic Interior"
                width={640}
                height={520}
                className="object-cover w-full h-full will-change-transform hover:scale-[1.02] transition-transform duration-700"
                priority={false}
              />
              {/* overlay badge */}
              <div className="absolute left-4 bottom-4 inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur px-3 py-1 shadow-sm border border-[#e8e1d8] text-sm text-[#3b3a36]">
                <MapPin className="w-4 h-4 text-[#8c7c68]" />
                Ηλιούπολη
              </div>
            </div>
          </div>

          {/* text + details */}
          <div className="space-y-6 text-center md:text-left">
            <h2 className="text-4xl font-semibold tracking-tight">
              Το Ιατρείο
            </h2>
            <p className="text-[1.05rem] text-[#4a4944] leading-relaxed">
              Ένας κομψός, φιλόξενος χώρος που προάγει τη γαλήνη και την
              εμπιστοσύνη. Σχεδιασμένος ώστε να αισθάνεστε άνεση και ασφάλεια σε
              κάθε επίσκεψη.
            </p>

            {/* key highlights */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#5b5853]">
              <li className="inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8c7c68]" /> Πιστή τήρηση
                πρωτοκόλλων & απολύμανσης
              </li>

              <li className="inline-flex items-center gap-2">
                <Car className="w-4 h-4 text-[#8c7c68]" /> Άνετη πρόσβαση &
                στάθμευση γύρω από το ιατρείο
              </li>
            </ul>

            {/* info chips */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#e8e1d8] bg-white/80 px-3 py-1.5 text-xs text-[#3b3a36]">
                <Clock className="w-4 h-4 text-[#8c7c68]" /> Κατόπιν ραντεβού
              </span>
            </div>

            <div className="pt-2">
              <Link
                href="/iatreio"
                className="inline-flex items-center justify-center gap-2 text-[#2f2e2b] border border-[#2f2e2b] px-6 py-2.5 rounded-full hover:bg-[#2f2e2b] hover:text-white transition duration-300 shadow-sm"
              >
                Δείτε Περισσότερα
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Hairline separator */}
      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#e8e1d8] to-transparent" />

      {/* ======================= Ώρες Λειτουργίας ======================= */}
      <section className="py-20 px-6 bg-[#faf7f3]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <div className="mx-auto mb-4 inline-flex rounded-full border border-[#e8e1d8] bg-[#f3eee6] p-2">
              <Clock className="w-6 h-6 text-[#a78b64]" />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-semibold tracking-tight text-[#2f2e2c]">
              Ώρες Λειτουργίας Ιατρείου
            </h2>
          </div>

          {/* hours grid */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Δευτέρα", "10:00 – 13:00 & 17:30 – 21:00"],
              ["Τρίτη", "17:30 – 21:00"],
              ["Τετάρτη", "10:00 – 13:00"],
              ["Πέμπτη", "10:00 – 13:00 & 17:30 – 21:00"],
              ["Παρασκευή", "Κλειστά"],
              ["Σάββατο & Κυριακή", "Κλειστά"],
            ].map(([day, hours]) => (
              <div
                key={day}
                className="flex items-center justify-between rounded-xl border border-[#ece7df] bg-white px-4 py-3 shadow-sm"
              >
                <span className="text-[15px] font-medium">{day}</span>
                <span className="text-sm text-[#6a6257]">{hours}</span>
              </div>
            ))}
          </div>

          <p className="mt-4 text-center text-xs text-[#6a6257] italic">
            * Κατόπιν ραντεβού
          </p>
        </div>
      </section>

      {/* ======================= CTA ======================= */}
      <section
        id="contact"
        className="relative py-28 px-6 bg-[#3b3a36] text-white text-center overflow-hidden"
      >
        {/* texture */}
        <div className="absolute inset-0 opacity-10">
          <Image src="/cta.jpg" alt="cta image" fill className="object-cover" />
        </div>
        {/* soft vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,transparent_0%,rgba(0,0,0,0.3)_70%,rgba(0,0,0,0.45)_100%)]" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <h2 className="text-4xl font-bold tracking-tight">
            Κλείστε Ραντεβού
          </h2>
          <p className="text-lg">
            Κάντε το πρώτο βήμα προς την ισορροπία. Επικοινωνήστε σήμερα.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/appointments"
              className="inline-flex items-center justify-center rounded-full bg-white/95 text-[#3b3a36] px-6 py-3 shadow-sm hover:bg-white transition"
            >
              Κλείστε Online
            </Link>
            <a
              href="tel:+302109934316"
              className="inline-flex items-center justify-center rounded-full border border-white/80 px-6 py-3 hover:bg-white hover:text-[#3b3a36] transition"
            >
              Κλήση στο 210 9934316
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
