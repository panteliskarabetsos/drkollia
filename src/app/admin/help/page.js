"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import {
  ChevronDown,
  ArrowLeft,
  ScrollText,
  IdCard,
  Printer,
  ShieldCheck,
  Info,
  BarChart3,
  CalendarPlus,
  Plus,
  Settings2,
  Search,
} from "lucide-react";

const faqs = [
  {
    question: "Πώς μπορώ να καταχωρήσω ραντεβού;",
    answer:
      "Μεταβείτε στη σελίδα «Ραντεβού» και πατήστε το κουμπί + επάνω δεξιά. Αναζητήστε υπάρχοντα ασθενή (όνομα, τηλέφωνο, email ή ΑΜΚΑ) ή πατήστε «Νέος Ασθενής». Επιλέξτε ημερομηνία, λόγο επίσκεψης, (προτεινόμενη) διάρκεια και ώρα και πατήστε «Καταχώρηση». Ο ασθενής λαμβάνει αυτόματα email επιβεβαίωσης.",
  },
  {
    question: "Πώς μπορώ να ακυρώσω ραντεβού;",
    answer:
      "Από τη σελίδα «Ραντεβού», επιλέξτε το ραντεβού και πατήστε «Ακύρωση». Μετά την ακύρωση, ο ασθενής ενημερώνεται αυτόματα μέσω email.",
  },
  {
    question: "Πώς προσθέτω νέο ασθενή;",
    answer:
      "Στη σελίδα «Ασθενείς» πατήστε «Νέος Ασθενής», συμπληρώστε τα απαιτούμενα πεδία και πατήστε «Δημιουργία Ασθενή». Νέος ασθενής μπορεί να δημιουργηθεί και από τη σελίδα «Ραντεβού» κατά την καταχώρηση νέου ραντεβού, επιλέγοντας «Νέος Ασθενής».",
  },

  {
    question: "Χρειάζεται λογαριασμός για να κλείσει ραντεβού ένας ασθενής;",
    answer:
      "Όχι. Οι ασθενείς μπορούν να κλείσουν ραντεβού χωρίς λογαριασμό. Η αντιστοίχιση γίνεται με ΑΜΚΑ ή τηλέφωνο κατά την καταχώρηση.",
  },
  {
    question: "Πώς μπορώ να δημιουργήσω νέο λογαριασμό διαχειριστή;",
    answer:
      "Από τον πίνακα διαχείρισης, ανοίξτε την ενότητα «Πρόσβαση» και πατήστε «Νέος Διαχειριστής». Συμπληρώστε τα στοιχεία και πατήστε «Δημιουργία Λογαριασμού». Μόνο οι υπάρχοντες διαχειριστές μπορούν να δημιουργούν νέους.",
  },
  {
    question: "Πότε στέλνονται αυτοματοποιημένα email στον ασθενή;",
    answer:
      "Αυτόματα email αποστέλλονται όταν καταχωρείται νέο ραντεβού, όταν ακυρώνεται ένα ραντεβού και ως υπενθύμιση μία ημέρα πριν από το ραντεβού. Τα email περιλαμβάνουν λεπτομέρειες και οδηγίες.",
  },
  {
    question: "Πώς μπορώ να δω το ιστορικό επισκέψεων ενός ασθενούς;",
    answer: (
      <span>
        Στη σελίδα «Ασθενείς» πατήστε το εικονίδιο{" "}
        <ScrollText className="inline w-4 h-4 text-gray-600" /> (Ιστορικό) δίπλα
        στο όνομα του ασθενούς. Θα δείτε όλες τις προηγούμενες επισκέψεις με
        ημερομηνία, λόγο επίσκεψης και σημειώσεις.
      </span>
    ),
  },
  {
    question: "Πώς μπορώ να σταματήσω προσωρινά να δέχομαι ραντεβού;",
    answer:
      "Στη σελίδα «Πρόγραμμα Ιατρείου» απενεργοποιήστε τον διακόπτη «Δεχόμαστε νέα ραντεβού». Οι ασθενείς δεν θα μπορούν να κλείσουν νέο ραντεβού μέχρι να τον ενεργοποιήσετε ξανά.",
  },
  {
    question: "Τι είναι οι «Εξαιρέσεις» στο πρόγραμμα ιατρείου;",
    answer:
      "Οι «Εξαιρέσεις» δηλώνουν ημέρες ή ώρες όπου δεν δέχεστε ραντεβού, ανεξάρτητα από το βασικό εβδομαδιαίο πρόγραμμα (π.χ. αργίες, άδεια, έκτακτα). Το σύστημα αποτρέπει αυτόματα κρατήσεις στα αντίστοιχα διαστήματα.",
  },
  {
    question: "Πώς μπορώ να αλλάξω το ωράριο του ιατρείου;",
    answer:
      "Μεταβείτε στη σελίδα «Πρόγραμμα Ιατρείου». Στο «Βασικό Εβδομαδιαίο Πρόγραμμα» ορίζετε τα ωράρια ανά ημέρα (με δυνατότητα σπαστού ωραρίου). Για προσωρινές αλλαγές χρησιμοποιήστε «Εξαιρέσεις». Οι αλλαγές εφαρμόζονται αυτόματα στη διαθεσιμότητα. Αν προσθέσετε εξαίρεση πάνω σε προγραμματισμένο ραντεβού που δεν μπορείτε να εξυπηρετήσετε, ακυρώστε το χειροκίνητα.",
  },
  {
    question: "Τι σημαίνουν οι στήλες της λίστας ραντεβού;",
    answer:
      "Όνομα, Τηλέφωνο, ΑΜΚΑ, Λόγος Επίσκεψης, Ώρα, Διάρκεια, Κατάσταση (Status), Ενέργειες.",
  },
  {
    question: "Τι σημαίνουν τα status;",
    answer:
      "🟡 pending → Έχει καταχωρηθεί και αναμένει ενέργεια. 🔵 scheduled → Έχει προγραμματιστεί ώρα/ημερομηνία. 🟢 approved → Το ραντεβού έχει εγκριθεί. 🟣 rejected → Το αίτημα απορρίφθηκε. 🔴 cancelled → Το ραντεβού ακυρώθηκε. ⚪ completed → Ολοκληρώθηκε και καταγράφηκε στο ιστορικό.",
  },
  {
    question: "Πώς εκτυπώνω τη λίστα ραντεβού;",
    answer:
      "Στη σελίδα «Ραντεβού», από το ημερολόγιο δεξιά, επιλέξτε ημερομηνία ή εύρος ημερομηνιών και πατήστε το εικονίδιο 🖨️ «Εκτύπωση».",
  },
  {
    question: "Πώς κατεβάζω τη λίστα ραντεβού σε αρχείο Excel;",
    answer:
      "Στη σελίδα «Ραντεβού», από το ημερολόγιο δεξιά, επιλέξτε ημερομηνία ή εύρος ημερομηνιών και πατήστε το εικονίδιο 📥 «Εξαγωγή σε Excel» για να κατεβάσετε το αρχείο .xlsx.",
  },
  {
    question: "Τι γίνεται όταν ολοκληρωθεί ένα ραντεβού;",
    answer:
      "Όταν περάσει η ώρα ενός ραντεβού χωρίς ακύρωση, το σύστημα το χαρακτηρίζει αυτόματα ως completed. ",
  },
  {
    question: "Τι σημαίνει η διάρκεια στο ραντεβού;",
    answer:
      "Η διάρκεια δείχνει πόσο διαρκεί το ραντεβού και ορίζεται κατά την καταχώρηση (μπορεί να αλλάξει από διαχειριστή). Προεπιλογές: «Εξέταση» 30′, «Αξιολόγηση Αποτελεσμάτων» 15′, «Ιατρικός Επισκέπτης» 15′. Επιπλέον, κάθε ημέρα δεσμεύεται αυτόματα τουλάχιστον ένα συνεχόμενο 30′ (δύο 15′) αποκλειστικά για «Αξιολόγηση Αποτελεσμάτων». Αν αυτό το 30′ κλείσει, δεσμεύεται το επόμενο διαθέσιμο 30′.",
  },
  {
    question: "Μπορούν να κλείσουν ραντεβού ηλεκτρονικά Ιατρικοί Επισκέπτες;",
    answer:
      "Ναι, υπάρχει ειδική επιλογή. Ωστόσο επιτρέπονται έως δύο ραντεβού Ιατρικών Επισκεπτών ανά μήνα. Αν συμπληρωθεί το όριο, εμφανίζεται μήνυμα για τηλεφωνική συνεννόηση ή επιλογή άλλου μήνα.",
  },
  {
    question: "Πώς μπορώ να κρατήσω ιστορικό για κάθε ασθενή;",
    answer: (
      <span>
        Από τη σελίδα «Ασθενείς» πατήστε{" "}
        <ScrollText className="inline w-4 h-4 text-gray-600" /> (Ιστορικό) ή από
        τη «Ραντεβού» πατήστε το εικονίδιο{" "}
        <IdCard className="inline w-4 h-4 text-gray-600" /> και έπειτα «Ιστορικό
        Ασθενή». Καταχωρήστε σημειώσεις (διαγνώσεις, θεραπείες κ.λπ.). Το
        ιστορικό είναι ορατό μόνο σε διαχειριστές και διατηρείται ακόμη κι αν
        διαγραφούν παλιά ραντεβού.
      </span>
    ),
  },
  {
    question: "Τι δεδομένα διατηρούνται στο σύστημα;",
    answer:
      "Διατηρούνται στοιχεία επικοινωνίας και ιστορικό επισκέψεων κάθε ασθενούς έως ότου τα διαγράψετε. Τα ραντεβού διατηρούνται εως και 3 μήνες και έπειτα διαγράφονται αυτόματα για εξοικονόμηση χώρου.",
  },
];

// -------------------- Utils --------------------
function startOfTodayLocal() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
}
function endOfTodayLocal() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionExists, setSessionExists] = useState(false);
  const [q, setQ] = useState("");
  const pathname = usePathname();
  const searchRef = useRef(null);

  const [stats, setStats] = useState({
    acceptsNew: null,
    pendingCount: null,
    todayCount: null,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const router = useRouter();

  // -------- Auth guard --------
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
      } else {
        setSessionExists(true);
      }
      setSessionChecked(true);
    };
    checkAuth();
  }, [router]);

  // -------- Lightweight system checks --------
  useEffect(() => {
    const loadStats = async () => {
      setLoadingStats(true);
      try {
        const [
          { data: settings },
          { count: pendingCount },
          { count: todayCount },
        ] = await Promise.all([
          supabase
            .from("clinic_settings")
            .select("accept_new_appointments")
            .eq("id", 1)
            .single(),
          supabase
            .from("appointments")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("appointments")
            .select("id", { count: "exact", head: true })
            .gte("appointment_time", startOfTodayLocal().toISOString())
            .lte("appointment_time", endOfTodayLocal().toISOString()),
        ]);

        setStats({
          acceptsNew: settings?.accept_new_appointments ?? null,
          pendingCount: typeof pendingCount === "number" ? pendingCount : null,
          todayCount: typeof todayCount === "number" ? todayCount : null,
        });
      } catch (e) {
        // σιωπηλή αποτυχία – απλά αφήνουμε τα badges κενά
      } finally {
        setLoadingStats(false);
      }
    };
    loadStats();
  }, []);
  useEffect(() => {
    const isTyping = (el) => {
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      const editable = el.isContentEditable;
      return (
        editable || tag === "input" || tag === "textarea" || tag === "select"
      );
    };

    const onKey = (e) => {
      // Μην ενοχλείς όταν υπάρχουν modifiers
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // Μην ενοχλείς όταν ο χρήστης πληκτρολογεί κάπου
      if (isTyping(document.activeElement)) return;

      const key = e.key;

      // N — Νέο Ραντεβού
      if (key.toLowerCase() === "n") {
        e.preventDefault();
        router.push("/admin/appointments/new");
        return;
      }

      // P — Νέος Ασθενής
      if (key.toLowerCase() === "p") {
        e.preventDefault();
        router.push("/admin/patients/new");
        return;
      }

      // / — Εστίαση στην αναζήτηση FAQ (μόνο όταν είμαστε ήδη στη βοήθεια)
      if (key === "/" && pathname === "/admin/help") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      // ? — Άνοιγμα/Επιστροφή στη βοήθεια
      // το ? είναι shift + /
      if (key === "?" || (key === "/" && e.shiftKey)) {
        e.preventDefault();
        if (pathname !== "/admin/help") {
          router.push("/admin/help");
        } else {
          // είμαστε ήδη στη βοήθεια: scroll to top & focus search
          window.scrollTo({ top: 0, behavior: "smooth" });
          setTimeout(() => searchRef.current?.focus(), 250);
        }
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname, router]);

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("focus") === "1") {
      // give the page a tick to render before focusing
      setTimeout(() => {
        const el = document.querySelector(
          'input[placeholder="Αναζήτηση στο FAQ…"]'
        );
        el?.focus();
        el?.select?.();
      }, 120);
    }
  }, [searchParams]);

  // -------- FAQ search/filter --------
  const filteredFaqs = useMemo(() => {
    if (!q.trim()) return faqs;
    const needle = q.toLowerCase();
    return faqs.filter(
      (f) =>
        (typeof f.question === "string" &&
          f.question.toLowerCase().includes(needle)) ||
        (typeof f.answer === "string" &&
          f.answer.toLowerCase().includes(needle))
    );
  }, [q]);

  const toggleFAQ = (index) => setOpenIndex(openIndex === index ? null : index);

  if (!sessionChecked) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Έλεγχος πρόσβασης...
      </main>
    );
  }
  if (!sessionExists) return null;

  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "v1.0.0";

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#333] font-sans py-26 px-4 print:bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors no-print"
        >
          <ArrowLeft className="w-4 h-4" />
          Επιστροφή
        </button>

        {/* Title */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-3xl font-bold">Οδηγός Διαχειριστή</h1>
          <div className="flex items-center gap-2 no-print"></div>
        </div>

        {/* System checks */}
        <section className="mb-8 no-print">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border border-[#e5e1d8] bg-white rounded-xl p-4 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#6b675f]" />
              <div>
                <p className="text-xs text-gray-500">Δεχόμαστε νέα ραντεβού;</p>
                <p className="font-semibold">
                  {loadingStats
                    ? "—"
                    : stats.acceptsNew === null
                    ? "—"
                    : stats.acceptsNew
                    ? "Ναι"
                    : "Όχι"}
                </p>
              </div>
            </div>
            <div className="border border-[#e5e1d8] bg-white rounded-xl p-4 flex items-center gap-3">
              <Info className="w-5 h-5 text-[#6b675f]" />
              <div>
                <p className="text-xs text-gray-500">Εκκρεμούν (pending)</p>
                <p className="font-semibold">
                  {loadingStats || stats.pendingCount === null
                    ? "—"
                    : stats.pendingCount}
                </p>
              </div>
            </div>
            <div className="border border-[#e5e1d8] bg-white rounded-xl p-4 flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-[#6b675f]" />
              <div>
                <p className="text-xs text-gray-500">Σημερινά ραντεβού</p>
                <p className="font-semibold">
                  {loadingStats || stats.todayCount === null
                    ? "—"
                    : stats.todayCount}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-10 no-print">
          <h2 className="text-xl font-semibold mb-3">Γρήγορες Ενέργειες</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickAction
              icon={<CalendarPlus className="w-5 h-5" />}
              title="Νέο Ραντεβού"
              onClick={() => router.push("/admin/appointments/new")}
            />
            <QuickAction
              icon={<Plus className="w-5 h-5" />}
              title="Νέος Ασθενής"
              onClick={() => router.push("/admin/patients/new")}
            />
            <QuickAction
              icon={<Settings2 className="w-5 h-5" />}
              title="Πρόγραμμα Ιατρείου"
              onClick={() => router.push("/admin/schedule")}
            />
            <QuickAction
              icon={<BarChart3 className="w-5 h-5" />}
              title="Αναφορές"
              onClick={() => router.push("/admin/reports")}
            />
          </div>
        </section>

        {/* Search */}
        <section className="mb-6 no-print">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Αναζήτηση στο FAQ…"
              className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
          {q && (
            <p className="mt-2 text-xs text-gray-500">
              Βρέθηκαν {filteredFaqs.length} αποτελέσματα.
            </p>
          )}
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Συχνές Ερωτήσεις (FAQ)</h2>
          <div className="space-y-3">
            {filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg bg-white shadow-sm"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex justify-between items-center p-4 text-left"
                >
                  <span className="font-medium">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openIndex === index && (
                  <div className="px-4 pb-4 text-gray-600">{faq.answer}</div>
                )}
              </div>
            ))}
            {filteredFaqs.length === 0 && (
              <p className="text-sm text-gray-500">
                Δεν βρέθηκαν αποτελέσματα. Δοκιμάστε διαφορετικές
                λέξεις-κλειδιά.
              </p>
            )}
          </div>
        </section>

        {/* Keyboard shortcuts */}
        <section className="mb-10 no-print">
          <h2 className="text-xl font-semibold mb-3">
            Συντομεύσεις Πληκτρολογίου
          </h2>
          <ul className="text-sm text-gray-700 grid gap-2">
            <li>
              <kbd className="px-2 py-1 rounded border bg-white">N</kbd> —
              Άνοιγμα «Νέο Ραντεβού»
            </li>
            <li>
              <kbd className="px-2 py-1 rounded border bg-white">P</kbd> —
              Άνοιγμα «Νέος Ασθενής»
            </li>
            <li>
              <kbd className="px-2 py-1 rounded border bg-white">/</kbd> —
              Εστίαση στην αναζήτηση FAQ
            </li>
            <li>
              <kbd className="px-2 py-1 rounded border bg-white">?</kbd> —
              Άνοιγμα/Επιστροφή στη βοήθεια
            </li>
          </ul>
        </section>

        {/* Troubleshooting */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Troubleshooting</h2>
          <div className="space-y-3">
            <Trouble
              title="Δεν εμφανίζονται διαθέσιμες ώρες"
              body="Ελέγξτε αν: (1) το ιατρείο δέχεται νέα ραντεβού, (2) δεν υπάρχει Εξαίρεση για την ημέρα/ώρα, (3) ο λόγος επίσκεψης δεν απαιτεί δεσμευμένα slots (π.χ. Αξιολόγηση Αποτελεσμάτων)."
            />
            <Trouble
              title="Δεν στέλνονται emails"
              body="Επιβεβαιώστε ότι τα στοιχεία email ασθενούς είναι σωστά και ότι το API αποστολής είναι ενεργό. Επίσης, ελέγξτε στο Spam του παραλήπτη."
            />
            <Trouble
              title="Ο ασθενής δεν εντοπίζεται"
              body="Δοκιμάστε αναζήτηση με τηλέφωνο ή ΑΜΚΑ. Αν δεν υπάρχει καταχώρηση, δημιουργήστε «Νέος Ασθενής»."
            />
          </div>
        </section>

        {/* Data policy & app info */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-3">
            Πολιτική Διατήρησης Δεδομένων
          </h2>
          <p className="text-sm text-gray-700 mb-4">
            Στοιχεία επικοινωνίας και ιστορικό επισκέψεων διατηρούνται έως την
            οριστική διαγραφή τους. Τα ραντεβού διατηρούνται έως 3 μήνες και
            έπειτα διαγράφονται αυτόματα για εξοικονόμηση χώρου.
          </p>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>
              <span className="font-medium">Έκδοση:</span> {appVersion}
            </p>
            <p>
              Για βοήθεια:{" "}
              <a
                href="mailto:contact@pkarabetsos.com"
                className="underline hover:no-underline"
              >
                contact@pkarabetsos.com
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

// -------------------- Small components --------------------
function QuickAction({ icon, title, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-[#e5e1d8] bg-white px-4 py-3 text-left hover:bg-[#f7f5f1] transition"
    >
      <div className="inline-flex items-center justify-center rounded-lg border border-[#e5e1d8] bg-white/80 p-2 shadow-sm">
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-xs text-gray-500">Κάντε κλικ για μετάβαση</div>
      </div>
    </button>
  );
}

function Trouble({ title, body }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex justify-between items-center p-4 text-left"
      >
        <span className="font-medium">{title}</span>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-4 pb-4 text-gray-600 text-sm">{body}</div>}
    </div>
  );
}
