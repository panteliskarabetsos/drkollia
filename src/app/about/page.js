"use client";

import Image from "next/image";
import { Noto_Serif } from "next/font/google";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Header from "../components/Header";

const notoSerif = Noto_Serif({ subsets: ["latin"], weight: ["400", "700"] });


export default function AboutPage() {
  return (
    <main className={`min-h-screen bg-[#fdfaf6] text-[#3b3a36] ${notoSerif.className}`}>
      <Header />

      {/* Hero Section */}
      <section className="relative h-[70vh] bg-[url('/banner-about.jpg')] bg-cover bg-center flex items-center justify-center text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/10 backdrop-blur-sm" />
        <div className="relative z-10 text-center px-6">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Σχετικά με τη Δρ. Κόλλια</h1>
          <p className="text-lg md:text-xl text-[#f4f0e8] max-w-2xl mx-auto">
            Επιστημονική ακρίβεια με ανθρώπινο πρόσωπο. Μια ολιστική προσέγγιση στην υγεία.
          </p>
        </div>
      </section>

      {/* Bio Section */}
      <section className="py-24 px-6 bg-[#f7f3ec]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="overflow-hidden rounded-[1.5rem] shadow-xl border-[5px] border-[#ece6dd]">
            <Image
              src="/doctor.jpg"
              alt="Δρ. Γεωργία Κόλλια"
              width={600}
              height={600}
              className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
            />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-semibold mb-6">Η Δρ. Γεωργία Κόλλια</h2>
            <p className="text-[#4a4944] text-lg leading-relaxed">
              Με πολυετή πορεία και εξειδίκευση στην ενδοκρινολογία, η Δρ. Κόλλια προσφέρει φροντίδα με επίκεντρο τον άνθρωπο.
              Η προσέγγισή της βασίζεται στην επιστημονική γνώση, την ενσυναίσθηση και την εξατομίκευση. Μέσω συνεχούς επιμόρφωσης,
              παραμένει στην αιχμή της ιατρικής εξέλιξης, προσφέροντας ουσιαστικές λύσεις σε κάθε ασθενή.
            </p>
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section className="py-24 px-6 bg-[#fdfaf6]">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-14">Εξειδίκευση & Πορεία</h2>
          <div className="grid md:grid-cols-2 gap-16 text-left text-[#4a4944] text-lg">
            <div>
              <h3 className="font-semibold text-xl mb-4 border-b pb-2 border-[#dcd4c6]">Τομείς Εξειδίκευσης</h3>
              <ul className="list-disc list-inside space-y-3">
                <li>Διαταραχές Θυρεοειδούς</li>
                <li>Διαβήτης τύπου 1 & 2</li>
                <li>Παχυσαρκία και Μεταβολικό Σύνδρομο</li>
                <li>Πολυκυστικές Ωοθήκες (PCOS)</li>
                <li>Ορμονικές Διαταραχές & Εμμηνόπαυση</li>
                <li>Οστεοπόρωση & Μεταβολικά Νοσήματα Οστών</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-xl mb-4 border-b pb-2 border-[#dcd4c6]">Επαγγελματική Πορεία</h3>
              <ul className="list-disc list-inside space-y-3">
                <li>Ειδίκευση στην Ενδοκρινολογία & Διαβήτη</li>
                <li>Κλινική εμπειρία σε πανεπιστημιακά νοσοκομεία</li>
                <li>Συμμετοχή σε διεθνή συνέδρια & επιστημονικές εργασίες</li>
                <li>Συνεχής μετεκπαίδευση και σεμινάρια</li>
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
    name: "Ελένη Μ.",
    text: "Η κυρία Κόλλια με βοήθησε να βρω την ορμονική ισορροπία μου με προσοχή και κατανόηση. Εξαιρετική επαγγελματίας.",
    source: "Google",
    stars: 5,
  },
  {
    name: "Αντώνης Κ.",
    text: "Άμεση εξυπηρέτηση, ανθρώπινη προσέγγιση και γνώση. Τη συστήνω ανεπιφύλακτα.",
    source: "Google",
    stars: 4.5,
  },
  {
    name: "Μαρία Σ.",
    text: "Εντυπωσιάστηκα από τη λεπτομέρεια στην προσέγγιση και την εμπιστοσύνη που σου εμπνέει από την πρώτη στιγμή.",
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
    <section className="bg-[#fffaf4] py-12 px-4">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-2xl font-medium mb-8 text-[#8a7555]">Απόψεις Ασθενών</h2>

        <div className="relative">
          <div
            className={`relative bg-white/70 rounded-xl px-6 py-8 shadow border border-[#f1e9db] transition-all duration-500 ease-in-out ${
              fade ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            <Stars rating={testimonials[index].stars} />

            <p className="text-[#5f5749] text-base italic leading-relaxed mb-4 transition-opacity duration-300">
              “{testimonials[index].text}”
            </p>
        <div className="text-[#b39b77] text-sm font-semibold">
            — {testimonials[index].name}
            <span className="block text-xs font-normal text-[#a4957b] mt-1">
                {testimonials[index].source}
            </span>
         </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between absolute top-1/2 left-0 right-0 px-2 transform -translate-y-1/2">
            <button onClick={prev} className="p-1 hover:opacity-70">
              <ChevronLeft className="w-4 h-4 text-[#b5a689]" />
            </button>
            <button onClick={next} className="p-1 hover:opacity-70">
              <ChevronRight className="w-4 h-4 text-[#b5a689]" />
            </button>
          </div>
        </div>

        {/* Dots */}
        <div className="mt-5 flex justify-center gap-1">
          {testimonials.map((_, i) => (
            <span
              key={i}
              onClick={() => changeIndex(i)}
              className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${
                index === i ? "bg-[#bba98c]" : "bg-[#e6dcc9]"
              }`}
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

