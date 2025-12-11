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
      {/* =================== Hero =================== */}
      <section className="relative h-[60vh] md:h-[68vh] min-h-[420px] overflow-hidden bg-[#fdfaf6]">
        {/* Blurred background image */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/banner-about.jpg')] bg-cover bg-center scale-105 blur-sm" />
        </div>

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/20" />

        {/* Bottom fade into page background */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent via-[#fdfaf6]/40 to-[#fdfaf6]" />

        {/* Content */}
        <div className="relative z-10 flex h-full items-center">
          <div className="max-w-5xl mx-auto px-6">
            <div className="max-w-xl space-y-4">
              <p className="text-[11px] tracking-[0.22em] uppercase text-white/70">
                Ενδοκρινολογία • Θυρεοειδής • Μεταβολισμός
              </p>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight text-white">
                Σχετικά με τη Δρ. Γεωργία Κόλλια
              </h1>

              <p className="text-sm md:text-base text-white/80 leading-relaxed">
                Στο ιατρείο της Δρ. Κόλλια, η ενδοκρινολογία συναντά την ηρεμία
                και τον σεβασμό. Κάθε επίσκεψη είναι μια ευκαιρία να κατανοήσετε
                καλύτερα το σώμα σας και να βάλετε ξανά την ισορροπία στην
                καθημερινότητά σας.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =================== Profile =================== */}
      <section className="py-16 md:py-20 px-6 bg-[#fdfaf6]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-[1.5fr_1.2fr] gap-14 items-center">
          {/* Text */}
          <div className="space-y-6 text-center md:text-left">
            <p className="inline-flex items-center gap-2 rounded-full bg-white border border-[#ece0d3] px-3 py-1 text-[11px] tracking-[0.16em] uppercase text-[#7a7469]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Προσωπική Φροντίδα Υγείας
            </p>

            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#3b3a36]">
              Η Δρ. Γεωργία Κόλλια
            </h2>

            <ul className="space-y-3 text-sm text-[#5b5853]">
              <li className="flex items-start gap-2">
                <span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-[#8c7c68]" />
                <p>
                  Ιδιαίτερη εμπειρία σε{" "}
                  <span className="font-semibold">
                    διαταραχές θυρεοειδούς, αυτοάνοσα νοσήματα και μεταβολικό
                    σύνδρομο
                  </span>
                  .
                </p>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-[#8c7c68]" />
                <p>
                  Στήριξη σε κάθε στάδιο της πορείας – από την πρώτη διάγνωση,
                  μέχρι τη μακροχρόνια παρακολούθηση και σταθεροποίηση.
                </p>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-[#8c7c68]" />
                <p>
                  Έμφαση στη{" "}
                  <span className="font-semibold">
                    σαφή, κατανοητή ενημέρωση
                  </span>{" "}
                  και στην απομυθοποίηση δύσκολων όρων και εξετάσεων.
                </p>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-[#8c7c68]" />
                <p>
                  Πρακτικές, εφαρμόσιμες οδηγίες που προσαρμόζονται στη δουλειά,
                  την οικογένεια και τον τρόπο ζωής του κάθε ασθενούς.
                </p>
              </li>
            </ul>
          </div>

          {/* Portrait */}
          <div className="mx-auto w-full max-w-sm">
            <div className="overflow-hidden rounded-3xl border border-[#e8dfd3] bg-white">
              <Image
                src="/doctor.jpg"
                alt="Δρ. Γεωργία Κόλλια"
                width={480}
                height={520}
                className="object-cover w-full h-full"
                priority={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =================== Care Philosophy =================== */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[1.3fr_1.4fr] gap-10 items-start">
          <div className="space-y-5">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#3b3a36]">
              Φιλοσοφία Φροντίδας
            </h2>
            <p className="text-sm md:text-[0.98rem] text-[#4a4944] leading-relaxed">
              Η ενδοκρινολογία αγγίζει ευαίσθητες πτυχές της υγείας – από την
              ενέργεια και το βάρος μέχρι τη διάθεση και τη γονιμότητα. Για τη
              Δρ. Κόλλια, η θεραπεία δεν είναι μόνο η σωστή δόση ενός φαρμάκου,
              αλλά η δημιουργία ενός πλαισίου στο οποίο ο ασθενής αισθάνεται
              ασφαλής, ενημερωμένος και σεβαστός.
            </p>
            <p className="text-sm md:text-[0.98rem] text-[#4a4944] leading-relaxed">
              Κάθε θεραπευτικό πλάνο προσαρμόζεται στην καθημερινότητα, τις
              προτεραιότητες και τις ανησυχίες του ασθενούς, με στόχο τη
              μακροπρόθεσμη ισορροπία – όχι μια «γρήγορη» λύση.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: "Ακρόαση χωρίς βιασύνη",
                text: "Χρόνος για να περιγράψετε την πορεία σας, όχι μόνο τις εξετάσεις σας.",
              },
              {
                title: "Διαφάνεια & ενημέρωση",
                text: "Αναλυτική εξήγηση των επιλογών θεραπείας και των πιθανών βημάτων.",
              },
              {
                title: "Ρεαλιστικοί στόχοι",
                text: "Θεραπευτικά πλάνα που λαμβάνουν υπόψη δουλειά, οικογένεια και ρυθμούς ζωής.",
              },
              {
                title: "Μακροχρόνια σχέση",
                text: "Συνεχής παρακολούθηση και αναπροσαρμογή, όταν αυτό χρειαστεί.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[#eee2d6] bg-[#fffdf9] p-4"
              >
                <h3 className="text-sm font-semibold text-[#2f2e2b] mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs md:text-sm text-[#6a675f] leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== Expertise & Journey =================== */}
      <section className="py-18 md:py-20 px-6 bg-[#fdfaf6]">
        <div className="max-w-6xl mx-auto space-y-10">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-center">
            Εξειδίκευση & Πορεία
          </h2>

          <div className="grid md:grid-cols-2 gap-14 text-[#4a4944]">
            {/* Expertise list */}
            <div>
              <h3 className="text-xl font-medium text-[#3b3a36] mb-4">
                Τομείς Εξειδίκευσης
              </h3>
              <ul className="space-y-3 text-sm md:text-[0.97rem]">
                {[
                  "Διαταραχές θυρεοειδούς (υπο-/υπερθυρεοειδισμός, Hashimoto, Graves).",
                  "Διαβήτης τύπου 1 & 2 και προδιαβήτης.",
                  "Παχυσαρκία, μεταβολικό σύνδρομο και ρύθμιση βάρους.",
                  "Πολυκυστικές ωοθήκες (PCOS) και διαταραχές κύκλου.",
                  "Ορμονικές διαταραχές γυναικών, εγκυμοσύνη, εμμηνόπαυση.",
                  "Οστεοπόρωση και μεταβολικά νοσήματα των οστών.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 w-1.5 h-1.5 bg-[#8c7c68] rounded-full shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-xl font-medium text-[#3b3a36] mb-4">
                Επαγγελματική Πορεία
              </h3>
              <ol className="relative border-s border-[#e8e1d8] ps-5 space-y-6 text-sm md:text-[0.96rem]">
                {[
                  {
                    Icon: GraduationCap,
                    title: "Ιατρική εκπαίδευση & ειδίκευση",
                    body: "Ολοκλήρωση ιατρικών σπουδών και ειδίκευση στην Ενδοκρινολογία – Διαβήτη – Μεταβολισμό, με συμμετοχή σε κλινικά τμήματα υψηλών απαιτήσεων.",
                  },
                  {
                    Icon: Hospital,
                    title: "Κλινική εμπειρία",
                    body: "Πολυετής παρουσία σε δημόσια και ιδιωτικά κέντρα, με αντιμετώπιση ευρέος φάσματος ενδοκρινολογικών περιστατικών.",
                  },
                  {
                    Icon: BookOpen,
                    title: "Συμμετοχή σε συνέδρια & ημερίδες",
                    body: "Τακτική ενημέρωση για τις νεότερες κατευθυντήριες οδηγίες και τις εξελίξεις στη θεραπεία ενδοκρινολογικών νοσημάτων.",
                  },
                  {
                    Icon: Award,
                    title: "Συνεχής μετεκπαίδευση",
                    body: "Σεμινάρια, πιστοποιήσεις και εξειδικευμένα εκπαιδευτικά προγράμματα με στόχο τη διαρκή αναβάθμιση των παρεχόμενων υπηρεσιών.",
                  },
                ].map(({ Icon, title, body }, i) => (
                  <li key={i} className="ms-2">
                    <span className="absolute -start-3 mt-1 grid h-5 w-5 place-items-center rounded-full border border-[#e8e1d8] bg-white">
                      <Icon className="w-3.5 h-3.5 text-[#8c7c68]" />
                    </span>
                    <h4 className="font-semibold text-[#2f2e2b] mb-0.5">
                      {title}
                    </h4>
                    <p className="text-[#6a675f] leading-relaxed">{body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* =================== First Visit =================== */}
      <section className="py-16 md:py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#3b3a36] mb-3">
              Τι να περιμένετε στην πρώτη επίσκεψη
            </h2>
            <p className="text-sm md:text-[0.97rem] text-[#5a5348] leading-relaxed">
              Στόχος της πρώτης επίσκεψης είναι να κατανοήσουμε ολοκληρωμένα το
              ιστορικό σας και να σχεδιάσουμε μαζί τα επόμενα βήματα. Δεν
              υπάρχει «τυπικό» ραντεβού – κάθε συνάντηση προσαρμόζεται στις
              ανάγκες σας.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                step: "1",
                title: "Αναλυτική συζήτηση",
                text: "Ιστορικό, συμπτώματα, ανησυχίες και προσωπικοί στόχοι συζητούνται διεξοδικά.",
              },
              {
                step: "2",
                title: "Εξέταση & έλεγχος",
                text: "Κλινική εξέταση και αξιολόγηση προηγούμενων εξετάσεων αίματος ή απεικονιστικών ευρημάτων.",
              },
              {
                step: "3",
                title: "Πλάνο δράσης",
                text: "Πρόταση θεραπευτικού/διαγνωστικού πλάνου με σαφείς οδηγίες και προγραμματισμό επανελέγχου.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl border border-[#e8dfd2] bg-[#fffdf9] px-5 py-6"
              >
                <div className="absolute -top-3 left-5 w-7 h-7 rounded-full bg-[#c8ad85] text-white text-xs flex items-center justify-center font-semibold">
                  {item.step}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-[#2f2e2b] mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs md:text-sm text-[#6a675f] leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#e8e1d8] to-transparent" />

      {/* =================== Values =================== */}
      <section className="py-16 px-6 bg-[#fdfaf6]">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Σεβασμός & εμπιστοσύνη",
              text: "Ο ασθενής ενημερώνεται πλήρως και συμμετέχει ενεργά στη λήψη αποφάσεων.",
            },
            {
              title: "Επιστημονική τεκμηρίωση",
              text: "Θεραπείες βασισμένες σε διεθνείς κατευθυντήριες οδηγίες και σύγχρονα δεδομένα.",
            },
            {
              title: "Πρακτικές λύσεις",
              text: "Ρεαλιστικές προτάσεις που λαμβάνουν υπόψη το καθημερινό σας πρόγραμμα.",
            },
          ].map(({ title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-[#ece7df] bg-white p-5"
            >
              <h4 className="text-[15px] font-semibold text-[#2f2e2b]">
                {title}
              </h4>
              <p className="mt-2 text-sm text-[#6a675f] leading-relaxed">
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#e8e1d8] to-transparent" />

      {/* =================== Testimonials =================== */}
      <section className="bg-[#fdfaf6] py-16 px-4 sm:px-8">
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
    <section className="py-10 px-4">
      <div
        ref={containerRef}
        tabIndex={0}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className="max-w-2xl mx-auto text-center outline-none"
        aria-roledescription="carousel"
        aria-label="Απόψεις Ασθενών"
      >
        <h2 className="text-2xl md:text-3xl font-semibold text-[#6d5b44] mb-10 tracking-tight">
          Απόψεις Ασθενών
        </h2>

        <div className="relative">
          <article
            className={`relative rounded-3xl px-8 md:px-10 py-10 md:py-12 border border-[#eee3d5] bg-white/80 transition-all duration-400 ease-in-out ${
              fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
            }`}
            aria-live="polite"
          >
            <Stars rating={testimonials[index].stars} />
            <p className="text-[#4f473c] text-base md:text-lg italic leading-relaxed mb-6">
              “{testimonials[index].text}”
            </p>
            <div className="text-[#7c6650] text-sm font-semibold mt-4">
              — {testimonials[index].name}
              <span className="block text-xs font-normal text-[#a39584] mt-1">
                {testimonials[index].source}
              </span>
            </div>
          </article>

          {/* arrows */}
          <div className="flex justify-between absolute top-1/2 left-0 right-0 px-2 -translate-y-1/2">
            <button
              onClick={prev}
              aria-label="Προηγούμενη κριτική"
              className="p-2 rounded-full bg-white/90 hover:bg-white shadow-sm transition"
            >
              <ChevronLeft className="w-5 h-5 text-[#a28f75]" />
            </button>
            <button
              onClick={next}
              aria-label="Επόμενη κριτική"
              className="p-2 rounded-full bg-white/90 hover:bg-white shadow-sm transition"
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
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 border ${
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
