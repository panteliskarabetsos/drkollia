"use client";

import Image from "next/image";
import { Noto_Serif } from "next/font/google";
import { useEffect, useState, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Award,
  BookOpen,
  Hospital,
  ShieldCheck,
} from "lucide-react";

const notoSerif = Noto_Serif({ subsets: ["latin"], weight: ["400", "700"] });

export default function AboutPage() {
  return (
    <main
      className={`min-h-screen bg-[#fdfaf6] text-[#3b3a36] ${notoSerif.className}`}
    >
      {/* =================== Hero (unchanged) =================== */}
      <section className="relative h-[70vh] bg-[url('/banner-about.jpg')] bg-cover bg-center flex items-center justify-center text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/10 backdrop-blur-sm" />
        <div className="relative z-10 text-center px-6">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Σχετικά με τη Δρ. Κόλλια
          </h1>
          <p className="text-lg md:text-xl text-[#f4f0e8] max-w-2xl mx-auto">
            Επιστημονική ακρίβεια με ανθρώπινο πρόσωπο.
          </p>
        </div>
      </section>

      {/* =================== Profile =================== */}
      <section className="py-20 px-6 bg-[#f7f3ec]">
        <div className="relative max-w-6xl mx-auto grid md:grid-cols-[2fr_1fr] gap-16 items-center">
          {/* ambient accent */}
          <div className="pointer-events-none absolute -top-16 -left-24 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,_#efe6d9_0%,transparent_60%)] opacity-70" />
          {/* Text */}
          <div className="space-y-6 text-center md:text-left">
            <h2 className="text-4xl font-semibold tracking-tight text-[#3b3a36]">
              Η Δρ. Γεωργία Κόλλια
            </h2>
            <p className="text-[#4a4944] text-[1.05rem] leading-relaxed">
              Με πολυετή πορεία στην ενδοκρινολογία, η Δρ. Κόλλια συνδυάζει
              τεκμηριωμένη ιατρική, ενσυναίσθηση και εξατομικευμένη φροντίδα.
              Παραμένει στην αιχμή της επιστήμης μέσω συνεχούς επιμόρφωσης και
              συνεργασίας με σύγχρονα κέντρα.
            </p>

            {/* badges */}
            <div className="flex flex-wrap gap-2">
              {[
                { Icon: ShieldCheck, label: "Εξατομικευμένη φροντίδα" },
                // { Icon: BookOpen, label: "Επίκαιρα πρωτόκολλα" },
                // { Icon: Hospital, label: "Συνεργασία με κλινικές" },
              ].map(({ Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-[#e8e1d8] bg-white/80 px-3 py-1.5 text-xs text-[#3b3a36]"
                >
                  <Icon className="w-4 h-4 text-[#8c7c68]" /> {label}
                </span>
              ))}
            </div>
          </div>

          {/* Smaller portrait */}
          <div className="mx-auto w-full max-w-sm">
            <div className="overflow-hidden rounded-3xl shadow-2xl border border-[#eae2d9] ring-1 ring-[#e8e1d8]">
              <Image
                src="/doctor.jpg"
                alt="Δρ. Γεωργία Κόλλια"
                width={480}
                height={520}
                className="object-cover w-full h-full transition-transform duration-700 hover:scale-[1.02]"
                priority={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =================== Expertise & Journey =================== */}
      <section className="py-20 px-6 bg-[#fdfaf6]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center mb-12">
            Εξειδίκευση & Πορεία
          </h2>

          <div className="grid md:grid-cols-2 gap-16 text-[#4a4944]">
            {/* Expertise list */}
            <div>
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
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 w-2 h-2 bg-[#8c7c68] rounded-full shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-2xl font-medium text-[#3b3a36] mb-4">
                Επαγγελματική Πορεία
              </h3>
              <ol className="relative border-s border-[#e8e1d8] ps-5 space-y-6">
                {[
                  {
                    Icon: GraduationCap,
                    title: "Ειδίκευση στην Ενδοκρινολογία & Διαβήτη",
                    body: "Εκπαίδευση σε αναγνωρισμένα κέντρα με έμφαση στη διάγνωση και παρακολούθηση.",
                  },
                  {
                    Icon: Hospital,
                    title: "Κλινική εμπειρία σε δημόσια νοσοκομεία",
                    body: "Ευρύ φάσμα περιστατικών και διεπιστημονική συνεργασία.",
                  },
                  {
                    Icon: BookOpen,
                    title: "Συμμετοχή σε διεθνή συνέδρια & εργασίες",
                    body: "Παρουσιάσεις, ενημέρωση για νεότερα δεδομένα και κατευθυντήριες οδηγίες.",
                  },
                  {
                    Icon: Award,
                    title: "Συνεχής μετεκπαίδευση",
                    body: "Πιστοποιήσεις & σεμινάρια σε σύγχρονες θεραπείες.",
                  },
                ].map(({ Icon, title, body }, i) => (
                  <li key={i} className="ms-2">
                    <span className="absolute -start-3 mt-1 grid h-5 w-5 place-items-center rounded-full border border-[#e8e1d8] bg-white">
                      <Icon className="w-3.5 h-3.5 text-[#8c7c68]" />
                    </span>
                    <h4 className="font-semibold text-[#2f2e2b]">{title}</h4>
                    <p className="text-sm text-[#6a675f]">{body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* =================== Values (quick cards) =================== */}
      <section className="py-16 px-6 bg-[#fffaf4]">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Σεβασμός & Εμπιστοσύνη",
              text: "Ακούμε με προσοχή, σχεδιάζουμε μαζί.",
            },
            {
              title: "Επιστημονική Ακρίβεια",
              text: "Θεραπείες βάσει κατευθυντήριων οδηγιών.",
            },
            {
              title: "Συνεχής Υποστήριξη",
              text: "Σαφείς οδηγίες, διαρκής επικοινωνία.",
            },
          ].map(({ title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-[#ece7df] bg-white p-5 shadow-sm"
            >
              <h4 className="text-[15px] font-semibold text-[#2f2e2b]">
                {title}
              </h4>
              <p className="mt-2 text-sm text-[#6a675f]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#e8e1d8] to-transparent" />

      {/* =================== Testimonials =================== */}
      <section className="bg-[#fffaf4] py-20 px-4 sm:px-8">
        <Carousel />
      </section>
    </main>
  );
}

/* =================== Carousel =================== */
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
  const [isHover, setIsHover] = useState(false);
  const containerRef = useRef(null);

  const changeIndex = (newIndex) => {
    setFade(false);
    setTimeout(() => {
      setIndex(newIndex);
      setFade(true);
    }, 220);
  };

  const prev = () =>
    changeIndex((index - 1 + testimonials.length) % testimonials.length);
  const next = () => changeIndex((index + 1) % testimonials.length);

  // Auto-advance with pause-on-hover
  useEffect(() => {
    if (isHover) return;
    const id = setInterval(next, 8000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, isHover]);

  // Keyboard support
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [prev, next]);

  return (
    <section className="py-14 px-4">
      <div
        ref={containerRef}
        tabIndex={0}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className="max-w-2xl mx-auto text-center outline-none"
        aria-roledescription="carousel"
        aria-label="Απόψεις Ασθενών"
      >
        <h2 className="text-3xl font-semibold text-[#6d5b44] mb-12 tracking-tight relative inline-block after:content-[''] after:block after:h-[2px] after:bg-[#d5c4ae] after:w-16 after:mx-auto after:mt-3">
          Απόψεις Ασθενών
        </h2>

        <div className="relative">
          <article
            className={`relative rounded-3xl px-10 py-12 shadow-xl border border-[#eee3d5] bg-white/60 backdrop-blur-md transition-all duration-500 ease-in-out ${
              fade ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
            aria-live="polite"
          >
            {/* Top quotes */}
            <div className="flex justify-start mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 text-[#d6ba8a] opacity-70"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7 7H5a3 3 0 0 0-3 3v5h5v-5h0V7Zm12 0h-2a3 3 0 0 0-3 3v5h5v-5h0V7Z" />
              </svg>
            </div>

            <Stars rating={testimonials[index].stars} />
            <p className="text-[#4f473c] text-lg italic leading-relaxed mb-6">
              “{testimonials[index].text}”
            </p>
            <div className="text-[#7c6650] text-sm font-semibold mt-6">
              — {testimonials[index].name}
              <span className="block text-xs font-normal text-[#a39584] mt-1">
                {testimonials[index].source}
              </span>
            </div>

            {/* subtle glow divider */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-[2px] bg-gradient-to-r from-transparent via-[#e8dac0] to-transparent rounded-full" />
          </article>

          {/* arrows */}
          <div className="flex justify-between absolute top-1/2 left-0 right-0 px-2 -translate-y-1/2">
            <button
              onClick={prev}
              aria-label="Προηγούμενη κριτική"
              className="p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition"
            >
              <ChevronLeft className="w-5 h-5 text-[#a28f75]" />
            </button>
            <button
              onClick={next}
              aria-label="Επόμενη κριτική"
              className="p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition"
            >
              <ChevronRight className="w-5 h-5 text-[#a28f75]" />
            </button>
          </div>
        </div>

        {/* dots */}
        <div className="mt-6 flex justify-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => changeIndex(i)}
              aria-label={`Μετάβαση στην κριτική ${i + 1}`}
              className={`w-3 h-3 rounded-full transition-all duration-300 border ${
                index === i
                  ? "bg-[#c0a887] border-[#c0a887]"
                  : "bg-[#e8dfd3] border-[#d5cbbd] hover:scale-105"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* =================== Stars =================== */
function Stars({ rating }) {
  const max = 5;
  return (
    <div className="flex justify-center mb-4" aria-label={`${rating} αστέρια`}>
      {Array.from({ length: max }).map((_, i) => {
        const fill =
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
            {fill === "full" && (
              <path
                fill="#e3ba75"
                d="M12 17.3l6.18 3.7-1.64-7.03L21 9.24l-7.19-.61L12 2 10.19 8.63 3 9.24l5.46 4.73-1.64 7.03L12 17.3z"
              />
            )}
            {fill === "half" && (
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
            {fill === "empty" && (
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
