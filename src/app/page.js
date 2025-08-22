"use client";

import Image from "next/image";
import Link from "next/link";
import { Noto_Serif } from "next/font/google";
import Header from "./components/Header";
import { Clock } from "lucide-react";
const notoSerif = Noto_Serif({ subsets: ["latin"], weight: ["400", "700"] });

export default function Home() {
  return (
    <main
      className={`min-h-screen bg-[#fdfaf6] text-[#3b3a36] ${notoSerif.className}`}
    >
      {/* Hero Section */}
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

        {/* Main Content */}
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

        {/* Scroll Down Indicator */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center animate-bounce text-[#8c7c68]">
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

      <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#d8d2c8] to-transparent " />

      {/* --- Section: Η Ιατρός --- */}
      <section className="py-24 px-6 bg-[#faf7f3] animate-fadeInUp duration-1000">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-5 text-center md:text-left">
            <h2 className="text-4xl font-semibold tracking-tight">Η Ιατρός</h2>
            <p className="text-[1.1rem] text-[#4a4944] leading-relaxed">
              Η Δρ. Κόλλια ειδικεύεται στην ενδοκρινολογία με έμφαση στον
              θυρεοειδή και τον μεταβολισμό. Συνδυάζει την ιατρική ακρίβεια με
              προσωπική φροντίδα.
            </p>
            <Link
              href="/about"
              className="inline-block text-[#3b3a36] border border-[#3b3a36] px-6 py-2.5 rounded-full hover:bg-[#3b3a36] hover:text-white transition duration-300 shadow-md"
            >
              Δείτε Περισσότερα
            </Link>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-2xl hover:shadow-xl transition-shadow duration-500">
            <Image
              src="/doctor.jpg"
              alt="Dr. Georgia Kollia"
              width={600}
              height={500}
              className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      </section>

      {/* --- Section: Το Ιατρείο --- */}
      <section className="py-24 px-6 bg-[#f2eee8] animate-fadeInUp duration-1000">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="rounded-3xl overflow-hidden shadow-2xl hover:shadow-xl transition-shadow duration-500">
            <Image
              src="/iatreio.jpg"
              alt="Clinic Interior"
              width={600}
              height={500}
              className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="space-y-5 text-center md:text-left">
            <h2 className="text-4xl font-semibold tracking-tight">
              Το Ιατρείο
            </h2>
            <p className="text-[1.1rem] text-[#4a4944] leading-relaxed">
              Ένας φιλόξενος και κομψός χώρος για την υγειονομική σας φροντίδα.
            </p>
            <Link
              href="/iatreio"
              className="inline-block text-[#3b3a36] border border-[#3b3a36] px-6 py-2.5 rounded-full hover:bg-[#3b3a36] hover:text-white transition duration-300 shadow-md"
            >
              Δείτε Περισσότερα
            </Link>
          </div>
        </div>
      </section>

      <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#d8d2c8] to-transparent " />

      {/* --- Section: Ώρες Λειτουργίας --- */}
      <section className="py-14 px-6 bg-[#faf7f3] animate-fadeInUp duration-1000">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-3 bg-[#f3eee6] rounded-full shadow-md">
              <Clock className="w-8 h-8 text-[#a78b64]" />
            </div>
          </div>

          {/* Τίτλος */}
          <h2 className="text-3xl md:text-4xl font-serif font-semibold tracking-tight text-[#2f2e2c]">
            Ώρες Λειτουργίας Ιατρείου
          </h2>

          {/* Ώρες */}
          <div className="text-lg text-[#4a4944] leading-relaxed space-y-1">
            <p>
              <strong>Δευτέρα:</strong> 10:00 - 13:00 & 17:30 - 21:00
            </p>
            <p>
              <strong>Τρίτη:</strong> 17:30 - 21:00
            </p>
            <p>
              <strong>Τετάρτη:</strong> 10:00 - 13:00
            </p>
            <p>
              <strong>Πέμπτη:</strong> 10:00 - 13:00 & 17:30 - 21:00
            </p>
            <p>
              <strong>Παρασκευή, Σάββατο & Κυριακή:</strong> Κλειστά
            </p>
            <p className="mt-4 text-sm italic text-[#6a6257]">
              *Κατόπιν ραντεβού
            </p>
          </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section
        id="contact"
        className="relative py-28 px-6 bg-[#3b3a36] text-white text-center overflow-hidden animate-fadeInUp duration-1000"
      >
        <div className="absolute inset-0 opacity-10">
          <Image src="/cta.jpg" alt="cta image" fill className="object-cover" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <h2 className="text-4xl font-bold tracking-tight">
            Κλείστε Ραντεβού
          </h2>
          <p className="text-lg">
            Κάντε το πρώτο βήμα προς την ισορροπία. Επικοινωνήστε σήμερα.
          </p>
          <Link
            href="/contact"
            className="inline-block text-white border border-white px-6 py-3 rounded-full hover:bg-white hover:text-[#3b3a36] transition duration-300 shadow-md"
          >
            Επικοινωνία
          </Link>
        </div>
      </section>
    </main>
  );
}
