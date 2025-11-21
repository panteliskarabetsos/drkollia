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
      <section className="relative h-[60vh] md:h-[68vh] bg-[url('/banner-about.jpg')] bg-cover bg-center flex items-center justify-center text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.5)_0%,rgba(0,0,0,0.2)_45%,rgba(0,0,0,0.6)_100%)] backdrop-blur-[2px]" />
        <div className="relative z-10 text-center px-6 max-w-3xl space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/40 px-3 py-1 text-xs tracking-[0.16em] uppercase">
            Ενδοκρινολογία • Θυρεοειδής • Μεταβολισμός
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Σχετικά με τη Δρ. Γεωργία Κόλλια
          </h1>
          <p className="text-base md:text-lg text-[#f4f0e8] max-w-2xl mx-auto">
            Στο ιατρείο της Δρ. Κόλλια, η ενδοκρινολογία συναντά την ηρεμία και
            τον σεβασμό. Κάθε επίσκεψη είναι μια ευκαιρία να κατανοήσετε
            καλύτερα το σώμα σας και να βάλετε ξανά την ισορροπία στην
            καθημερινότητά σας.
          </p>
        </div>
      </section>

      {/* Floating summary strip */}
      <section className="-mt-10 md:-mt-12 mb-10 px-4">
        <div className="max-w-5xl mx-auto grid gap-3 sm:grid-cols-3 bg-white/90 backdrop-blur-md rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-[#ebe2d8] px-4 py-4 md:px-6 md:py-5">
          {[
            {
              title: "Προσέγγιση",
              text: "Εξατομικευμένα πλάνα με βάση τις ανάγκες σας.",
            },
            {
              title: "Επικοινωνία",
              text: "Κατανοητές εξηγήσεις, χωρίς περίπλοκους όρους.",
            },
            {
              title: "Συνεργασία",
              text: "Μακροχρόνια παρακολούθηση και υποστήριξη.",
            },
          ].map((item) => (
            <div key={item.title} className="text-center sm:text-left">
              <p className="text-[13px] tracking-[0.12em] uppercase text-[#a28f7a] mb-1">
                {item.title}
              </p>
              <p className="text-xs md:text-sm text-[#50473c]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =================== Profile =================== */}
      <section className="py-16 md:py-20 px-6 bg-[#f7f3ec]">
        <div className="relative max-w-6xl mx-auto grid md:grid-cols-[1.7fr_1.1fr] gap-16 items-center">
          {/* ambient accent */}
          <div className="pointer-events-none absolute -top-20 -left-24 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,_#efe6d9_0%,transparent_60%)] opacity-70" />

          {/* Text */}
          <div className="space-y-6 text-center md:text-left relative z-10">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#f3ede4] border border-[#e8e1d8] px-3 py-1 text-[11px] tracking-[0.16em] uppercase text-[#7a7469]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8c7c68]" />
              Προσωπική Φροντίδα Υγείας
            </p>

            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#3b3a36]">
              Η Δρ. Γεωργία Κόλλια
            </h2>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[#5b5853]">
              <li className="inline-flex items-start gap-2">
                <span className="mt-[6px] w-2 h-2 rounded-full bg-[#8c7c68]" />
                <p>
                  Ιδιαίτερη εμπειρία σε{" "}
                  <span className="font-semibold">
                    διαταραχές θυρεοειδούς, αυτοάνοσα νοσήματα και μεταβολικό
                    σύνδρομο
                  </span>
                  .
                </p>
              </li>
              <li className="inline-flex items-start gap-2">
                <span className="mt-[6px] w-2 h-2 rounded-full bg-[#8c7c68]" />
                <p>
                  Στήριξη σε κάθε στάδιο της πορείας – από την πρώτη διάγνωση,
                  μέχρι τη μακροχρόνια παρακολούθηση και σταθεροποίηση.
                </p>
              </li>
              <li className="inline-flex items-start gap-2">
                <span className="mt-[6px] w-2 h-2 rounded-full bg-[#8c7c68]" />
                <p>
                  Έμφαση στη{" "}
                  <span className="font-semibold">
                    σαφή, κατανοητή ενημέρωση
                  </span>{" "}
                  και στην απομυθοποίηση δύσκολων όρων και εξετάσεων.
                </p>
              </li>
              <li className="inline-flex items-start gap-2">
                <span className="mt-[6px] w-2 h-2 rounded-full bg-[#8c7c68]" />
                <p>
                  Πρακτικές, εφαρμόσιμες οδηγίες που προσαρμόζονται στη δουλειά,
                  την οικογένεια και τον τρόπο ζωής του κάθε ασθενούς.
                </p>
              </li>
            </ul>

            {/* quick highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[#5b5853] pt-2">
              <div className="inline-flex items-start gap-2">
                <span className="mt-[6px] w-2 h-2 rounded-full bg-[#8c7c68]" />
                <p>
                  Ιδιαίτερη έμφαση σε{" "}
                  <span className="font-semibold">
                    θυρεοειδοπάθειες, μεταβολικές διαταραχές και ορμόνες
                    γυναικών
                  </span>
                  .
                </p>
              </div>
              <div className="inline-flex items-start gap-2">
                <span className="mt-[6px] w-2 h-2 rounded-full bg-[#8c7c68]" />
                <p>
                  Ήρεμο, δομημένο πλαίσιο ενημέρωσης για{" "}
                  <span className="font-semibold">
                    καλύτερη κατανόηση των εξετάσεων και του θεραπευτικού πλάνου
                  </span>
                  .
                </p>
              </div>
              <div className="inline-flex items-start gap-2">
                <span className="mt-[6px] w-2 h-2 rounded-full bg-[#8c7c68]" />
                <p>
                  Εστίαση στη{" "}
                  <span className="font-semibold">
                    μακροχρόνια παρακολούθηση
                  </span>{" "}
                  και όχι σε αποσπασματικές επισκέψεις.
                </p>
              </div>
              <div className="inline-flex items-start gap-2">
                <span className="mt-[6px] w-2 h-2 rounded-full bg-[#8c7c68]" />
                <p>
                  Προσαρμογή της θεραπείας στην{" "}
                  <span className="font-semibold">
                    καθημερινότητα, τις συνήθειες και τους στόχους
                  </span>{" "}
                  του ασθενούς.
                </p>
              </div>
            </div>
          </div>

          {/* Portrait */}
          <div className="mx-auto w-full max-w-sm">
            <div className="overflow-hidden rounded-3xl shadow-2xl border border-[#eae2d9] ring-1 ring-[#e8e1d8] bg-[#fdfaf6]">
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

      {/* =================== Care Philosophy =================== */}
      <section className="py-16 px-6 bg-[#fffaf4]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.4fr_1.6fr] gap-12 items-start">
          <div className="space-y-5">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#3b3a36] mb-2">
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
                className="rounded-2xl border border-[#ece4d8] bg-white/90 p-4 shadow-sm"
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
      <section className="py-20 px-6 bg-[#fdfaf6]">
        <div className="max-w-6xl mx-auto space-y-12">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">
            Εξειδίκευση & Πορεία
          </h2>

          <div className="grid md:grid-cols-2 gap-16 text-[#4a4944]">
            {/* Expertise list */}
            <div>
              <h3 className="text-2xl font-medium text-[#3b3a36] mb-4">
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
                    body: "Σεμινάρια, πιστοποιήσεις και εξειδικευμένα εκπαιδευτικά προγράμματα με στόχο την διαρκή αναβάθμιση των παρεχόμενων υπηρεσιών.",
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
      <section className="py-18 md:py-20 px-6 bg-[#f7f2ea]">
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
                className="relative rounded-2xl border border-[#e8dfd2] bg-white/90 px-5 py-6 shadow-sm"
              >
                <div className="absolute -top-3 left-5 w-7 h-7 rounded-full bg-[#c8ad85] text-white text-xs flex items-center justify-center font-semibold shadow-md">
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
      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#e8e1d8] to-transparent" />

      {/* =================== Values (quick cards) =================== */}
      <section className="py-16 px-6 bg-[#fffaf4]">
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
              className="rounded-2xl border border-[#ece7df] bg-white p-5 shadow-sm"
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
            className={`relative rounded-3xl px-8 md:px-10 py-10 md:py-12 shadow-xl border border-[#eee3d5] bg-white/70 backdrop-blur-md transition-all duration-500 ease-in-out ${
              fade ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
            aria-live="polite"
          >
            {/* Top quotes */}
            <div className="flex justify-start mb-3 md:mb-4">
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
            <p className="text-[#4f473c] text-base md:text-lg italic leading-relaxed mb-6">
              “{testimonials[index].text}”
            </p>
            <div className="text-[#7c6650] text-sm font-semibold mt-4">
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
