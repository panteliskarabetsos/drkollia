"use client";

import Image from "next/image";
import { Noto_Serif } from "next/font/google";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const notoSerif = Noto_Serif({ subsets: ["latin"], weight: ["400", "700"] });

export default function AboutPage() {
  return (
    <main
      className={`min-h-screen bg-[#fdfaf6] text-[#3b3a36] ${notoSerif.className}`}
    >
      {/* Hero Section */}
      <section className="relative h-[70vh] bg-[url('/banner-about.jpg')] bg-cover bg-center flex items-center justify-center text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/10 backdrop-blur-sm" />
        <div className="relative z-10 text-center px-6">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Σχετικά με τη Δρ. Κόλλια
          </h1>
          <p className="text-lg md:text-xl text-[#f4f0e8] max-w-2xl mx-auto">
            Επιστημονική ακρίβεια με ανθρώπινο πρόσωπο. Μια ολιστική προσέγγιση
            στην υγεία.
          </p>
        </div>
      </section>

      <section className="py-24 px-6 bg-[#f7f3ec]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="overflow-hidden rounded-3xl shadow-2xl border border-[#eae2d9]">
            <Image
              src="/doctor.jpg"
              alt="Δρ. Γεωργία Κόλλια"
              width={600}
              height={600}
              className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
            />
          </div>
          <div className="text-center md:text-left space-y-6">
            <h2 className="text-4xl font-semibold tracking-tight text-[#3b3a36]">
              Η Δρ. Γεωργία Κόλλια
            </h2>
            <p className="text-[#4a4944] text-[1.1rem] leading-relaxed">
              Με πολυετή πορεία και εξειδίκευση στην ενδοκρινολογία, η Δρ.
              Κόλλια προσφέρει φροντίδα με επίκεντρο τον άνθρωπο. Η προσέγγισή
              της βασίζεται στην επιστημονική γνώση, την ενσυναίσθηση και την
              εξατομίκευση. Μέσω συνεχούς επιμόρφωσης, παραμένει στην αιχμή της
              ιατρικής εξέλιξης, προσφέροντας ουσιαστικές λύσεις σε κάθε ασθενή.
            </p>
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section className="py-24 px-6 bg-[#fdfaf6]">
        <div className="max-w-6xl mx-auto text-center space-y-16">
          <h2 className="text-4xl font-semibold tracking-tight">
            Εξειδίκευση & Πορεία
          </h2>
          <div className="grid md:grid-cols-2 gap-16 text-left text-[#4a4944]">
            <div className="space-y-4">
              <h3 className="text-2xl font-medium text-[#3b3a36] mb-4">
                Τομείς Εξειδίκευσης
              </h3>
              <ul className="space-y-3">
                {[
                  "Διαταραχές Θυρεοειδούς",
                  "Διαβήτης τύπου 1 & 2",
                  "Παχυσαρκία και Μεταβολικό Σύνδρομο",
                  "Πολυκυστικές Ωοθήκες (PCOS)",
                  "Ορμονικές Διαταραχές & Εμμηνόπαυση",
                  "Οστεοπόρωση & Μεταβολικά Νοσήματα Οστών",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 w-2 h-2 bg-[#8c7c68] rounded-full shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-medium text-[#3b3a36] mb-4">
                Επαγγελματική Πορεία
              </h3>
              <ul className="space-y-3">
                {[
                  "Ειδίκευση στην Ενδοκρινολογία & Διαβήτη",
                  "Κλινική εμπειρία σε πανεπιστημιακά νοσοκομεία",
                  "Συμμετοχή σε διεθνή συνέδρια & επιστημονικές εργασίες",
                  "Συνεχής μετεκπαίδευση και σεμινάρια",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 w-2 h-2 bg-[#8c7c68] rounded-full shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#d8d2c8] to-transparent " />

      {/* Testimonials Carousel */}
      <section className="bg-[#fffaf4] py-20 px-4 sm:px-8">
        <Carousel />
      </section>
    </main>
  );
}

const testimonials = [
  {
    name: "Κωνσταντίνα Β.",
    text: "Εξαιρετική γιατρός και άνθρωπος. Ψάχνει την πάθηση εις βάθος και λύνει οποιαδήποτε απορία με απλό κατανοητό τρόπο. Πολύ ευγενική, ήρεμη, εμπνέει εμπιστοσύνη στον ασθενή. Τη συστήνω ανεπιφύλακτα.",
    source: "Google",
    stars: 5,
  },
  {
    name: "Κωνσταντίνα Κ.",
    text: "Εξαιρετική γιατρός! Απαντά σε οποιαδήποτε απορία αναλυτικά και είναι πάντα ευγενική! Την επισκέπτομαι σχεδόν είκοσι χρόνια και δεν την αλλάζω με τίποτα!",
    source: "Google",
    stars: 4.5,
  },
  {
    name: "Βιολέτα Β.",
    text: "Εξαιρετική ιατρός και άνθρωπος πάνω απ´όλα! Ευγενική πάντα μας δίνει απαντήσεις ακόμη και παραμονή Χριστουγέννων και μας εξυπηρετεί με τον καλύτερο τροπο! Δεν έχω ξαναδεί αυτό το ενδιαφέρον από κανέναν γιατρό!! Την συνιστώ ανεπιφύλακτα!!!",
    source: "Google",
    stars: 5,
  },
];

export function Carousel() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const changeIndex = (newIndex) => {
    setFade(false); // start fade-out
    setTimeout(() => {
      setIndex(newIndex);
      setFade(true); // fade-in
    }, 250);
  };

  const prev = () => {
    changeIndex((index - 1 + testimonials.length) % testimonials.length);
  };

  const next = () => {
    changeIndex((index + 1) % testimonials.length);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      next();
    }, 8000);
    return () => clearInterval(interval);
  }, [index]);

  return (
    <section className="bg-[#fffaf4] py-14 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-semibold text-[#6d5b44] mb-12 tracking-tight relative inline-block after:content-[''] after:block after:h-[2px] after:bg-[#d5c4ae] after:w-16 after:mx-auto after:mt-3">
          Απόψεις Ασθενών
        </h2>

        <div className="relative">
          <div
            className={`relative rounded-3xl px-10 py-12 shadow-xl border border-[#eee3d5] bg-white/60 backdrop-blur-md transition-all duration-500 ease-in-out ${
              fade ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            {/* Top Quote Icon */}
            <div className="flex justify-start mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 text-[#d6ba8a] opacity-70"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5h-2a4 4 0 00-4 4v4h4V9h2V5zM21 5h-2a4 4 0 00-4 4v4h4V9h2V5z"
                />
              </svg>
            </div>
            {/* Stars */}
            <Stars rating={testimonials[index].stars} />

            {/* Testimonial Text */}
            <p className="text-[#4f473c] text-lg italic leading-relaxed mb-6">
              “{testimonials[index].text}”
            </p>

            {/* Name & Source */}
            <div className="text-[#7c6650] text-sm font-semibold mt-6">
              — {testimonials[index].name}
              <span className="block text-xs font-normal text-[#a39584] mt-1">
                {testimonials[index].source}
              </span>
            </div>

            {/* Bottom Quote Icon */}
            <div className="flex justify-end mt-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 text-[#d6ba8a] opacity-70 rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5h-2a4 4 0 00-4 4v4h4V9h2V5zM21 5h-2a4 4 0 00-4 4v4h4V9h2V5z"
                />
              </svg>
            </div>

            {/* Optional subtle glow divider at bottom */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-[2px] bg-gradient-to-r from-transparent via-[#e8dac0] to-transparent rounded-full" />
          </div>

          {/* Navigation arrows */}
          <div className="flex justify-between absolute top-1/2 left-0 right-0 px-2 transform -translate-y-1/2">
            <button
              onClick={prev}
              className="p-2 rounded-full bg-white/70 hover:bg-white shadow-md transition"
            >
              <ChevronLeft className="w-5 h-5 text-[#a28f75]" />
            </button>
            <button
              onClick={next}
              className="p-2 rounded-full bg-white/70 hover:bg-white shadow-md transition"
            >
              <ChevronRight className="w-5 h-5 text-[#a28f75]" />
            </button>
          </div>
        </div>

        {/* Dots */}
        <div className="mt-6 flex justify-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => changeIndex(i)}
              className={`w-3 h-3 rounded-full transition-all duration-300 border ${
                index === i
                  ? "bg-[#c0a887] border-[#c0a887]"
                  : "bg-[#e8dfd3] border-[#d5cbbd] hover:scale-105"
              }`}
              aria-label={`Testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Stars({ rating }) {
  const maxStars = 5;

  return (
    <div className="flex justify-center mb-4" aria-label={`${rating} αστέρια`}>
      {Array.from({ length: maxStars }).map((_, i) => {
        const fillLevel =
          rating >= i + 1 ? "full" : rating >= i + 0.5 ? "half" : "empty";

        return (
          <svg
            key={i}
            className="w-4 h-4 mx-[1.5px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d6a84e"
            strokeWidth="1"
          >
            {fillLevel === "full" && (
              <path
                fill="#e3ba75"
                d="M12 17.3l6.18 3.7-1.64-7.03L21 9.24l-7.19-.61L12 2 10.19 8.63 3 9.24l5.46 4.73-1.64 7.03L12 17.3z"
              />
            )}
            {fillLevel === "half" && (
              <>
                <defs>
                  <linearGradient id={`half-${i}`}>
                    <stop offset="50%" stopColor="#e3ba75" />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <path
                  fill={`url(#half-${i})`}
                  d="M12 17.3l6.18 3.7-1.64-7.03L21 9.24l-7.19-.61L12 2 10.19 8.63 3 9.24l5.46 4.73-1.64 7.03L12 17.3z"
                />
              </>
            )}
            {fillLevel === "empty" && (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 17.3l6.18 3.7-1.64-7.03L21 9.24l-7.19-.61L12 2 10.19 8.63 3 9.24l5.46 4.73-1.64 7.03L12 17.3z"
              />
            )}
          </svg>
        );
      })}
    </div>
  );
}
