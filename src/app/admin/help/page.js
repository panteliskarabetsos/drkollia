"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import {
  ArrowLeft,
  BarChart3,
  CalendarPlus,
  ChevronDown,
  ExternalLink,
  IdCard,
  Info,
  Link2,
  Printer,
  ScrollText,
  Search as SearchIcon,
  Settings2,
  ShieldCheck,
  LifeBuoy,
  Bug,
  Image as ImageIcon,
} from "lucide-react";

/* --------------------------------------------------------
   HELP PAGE (Admin)
   - Sticky header with search + status + incident + print
   - Category chips (filters)
   - Smarter search (supports JSX answers via searchText)
   - Live system stats
   - Quick actions + keyboard shortcuts
   - Print-friendly layout
--------------------------------------------------------- */

/* ------------------ FAQ CONTENT ------------------ */
const rawFaqs = [
  // Ραντεβού
  {
    category: "Ραντεβού",
    question: "Πώς μπορώ να καταχωρήσω ραντεβού;",
    answer:
      "Μεταβείτε στη σελίδα «Ραντεβού» και πατήστε το κουμπί + επάνω δεξιά. Αναζητήστε υπάρχοντα ασθενή (όνομα, τηλέφωνο, email ή ΑΜΚΑ) ή πατήστε «Νέος Ασθενής». Επιλέξτε ημερομηνία, λόγο επίσκεψης, (προτεινόμενη) διάρκεια και ώρα και πατήστε «Καταχώρηση». Ο ασθενής λαμβάνει αυτόματα email επιβεβαίωσης.",
  },
  {
    category: "Ραντεβού",
    question: "Πώς μπορώ να ακυρώσω ραντεβού;",
    answer:
      "Από τη σελίδα «Ραντεβού», επιλέξτε το ραντεβού και πατήστε «Ακύρωση». Μετά την ακύρωση, ο ασθενής ενημερώνεται αυτόματα μέσω email.",
  },
  {
    category: "Ραντεβού",
    question: "Χρειάζεται λογαριασμός για να κλείσει ραντεβού ένας ασθενής;",
    answer:
      "Όχι. Οι ασθενείς μπορούν να κλείσουν ραντεβού χωρίς λογαριασμό. Η αντιστοίχιση γίνεται με ΑΜΚΑ ή τηλέφωνο κατά την καταχώρηση.",
  },
  {
    category: "Ραντεβού",
    question: "Τι σημαίνει η διάρκεια στο ραντεβού;",
    answer:
      "Προεπιλογές διάρκειας: «Εξέταση» 30′, «Αξιολόγηση Αποτελεσμάτων» 15′, «Ιατρικός Επισκέπτης» 15′. Το σύστημα προτείνει ωράρια ώστε να μην «σπάνε» τα 30′ slots.",
  },
  {
    category: "Ραντεβού",
    question: "Μπορούν να κλείσουν ραντεβού ηλεκτρονικά Ιατρικοί Επισκέπτες;",
    answer:
      "Ναι, υπάρχει ειδική επιλογή. Ωστόσο επιτρέπονται έως δύο ραντεβού Ιατρικών Επισκεπτών ανά μήνα. Αν συμπληρωθεί το όριο, εμφανίζεται μήνυμα για τηλεφωνική συνεννόηση ή επιλογή άλλου μήνα.",
  },
  {
    category: "Ραντεβού",
    question: "Τι σημαίνουν τα status;",
    answer:
      "🟡 pending → σε εκκρεμότητα • 🔵 scheduled → προγραμματισμένο • 🟢 approved → εγκεκριμένο • 🟣 rejected → απορρίφθηκε • 🔴 cancelled → ακυρώθηκε • ⚪ completed → ολοκληρώθηκε.",
  },

  // Ασθενείς
  {
    category: "Ασθενείς",
    question: "Πώς προσθέτω νέο ασθενή;",
    answer:
      "Στη σελίδα «Ασθενείς» πατήστε «Νέος Ασθενής», συμπληρώστε τα απαιτούμενα πεδία και πατήστε «Δημιουργία Ασθενή». Νέος ασθενής μπορεί να δημιουργηθεί και από τη σελίδα «Ραντεβού» κατά την καταχώρηση νέου ραντεβού, επιλέγοντας «Νέος Ασθενής».",
  },
  {
    category: "Ασθενείς",
    question: "Πώς μπορώ να δω το ιστορικό επισκέψεων ενός ασθενούς;",
    answer: (
      <span>
        Στη σελίδα «Ασθενείς» πατήστε το εικονίδιο{" "}
        <ScrollText className="inline w-4 h-4 text-gray-600" /> (Ιστορικό) δίπλα
        στο όνομα του ασθενούς. Θα δείτε όλες τις προηγούμενες επισκέψεις με
        ημερομηνία, λόγο επίσκεψης και σημειώσεις.
      </span>
    ),
    // used for search
    searchText:
      "Πώς μπορώ να δω το ιστορικό επισκέψεων ενός ασθενούς; ιστορικό επισκέψεων ασθενή ραντεβού σημειώσεις",
  },
  {
    category: "Ασθενείς",
    question: "Πώς κρατώ ιστορικό ανά ασθενή;",
    answer: (
      <span>
        Από «Ασθενείς» πατήστε{" "}
        <ScrollText className="inline w-4 h-4 text-gray-600" /> (Ιστορικό) ή από
        «Ραντεβού» πατήστε <IdCard className="inline w-4 h-4 text-gray-600" />{" "}
        και έπειτα «Ιστορικό Ασθενή». Καταχωρήστε σημειώσεις (διαγνώσεις,
        θεραπείες κ.λπ.). Ορατό μόνο σε διαχειριστές.
      </span>
    ),
    searchText:
      "Πώς κρατώ ιστορικό ανά ασθενή; ιστορικό επισκέψεων σημειώσεις διαγνώσεις θεραπείες",
  },

  // Πρόσβαση / Διαχείριση
  {
    category: "Πρόσβαση",
    question: "Πώς μπορώ να δημιουργήσω νέο λογαριασμό διαχειριστή;",
    answer:
      "Από τον πίνακα διαχείρισης, ανοίξτε την ενότητα «Πρόσβαση» και πατήστε «Νέος Διαχειριστής». Συμπληρώστε τα στοιχεία και πατήστε «Δημιουργία Λογαριασμού». Μόνο οι υπάρχοντες διαχειριστές μπορούν να δημιουργούν νέους.",
  },

  // Πρόγραμμα Ιατρείου
  {
    category: "Πρόγραμμα Ιατρείου",
    question: "Πώς μπορώ να σταματήσω προσωρινά να δέχομαι ραντεβού;",
    answer:
      "Στη σελίδα «Πρόγραμμα Ιατρείου» απενεργοποιήστε τον διακόπτη «Δεχόμαστε νέα ραντεβού». Οι ασθενείς δεν θα μπορούν να κλείσουν νέο ραντεβού μέχρι να τον ενεργοποιήσετε ξανά.",
  },
  {
    category: "Πρόγραμμα Ιατρείου",
    question: "Τι είναι οι «Εξαιρέσεις» στο πρόγραμμα ιατρείου;",
    answer:
      "Οι «Εξαιρέσεις» δηλώνουν ημέρες ή ώρες όπου δεν δέχεστε ραντεβού, ανεξάρτητα από το βασικό εβδομαδιαίο πρόγραμμα (π.χ. αργίες, άδεια, έκτακτα). Το σύστημα αποτρέπει αυτόματα κρατήσεις στα αντίστοιχα διαστήματα.",
  },
  {
    category: "Πρόγραμμα Ιατρείου",
    question: "Πώς μπορώ να αλλάξω το ωράριο του ιατρείου;",
    answer:
      "Μεταβείτε στη σελίδα «Πρόγραμμα Ιατρείου». Στο «Βασικό Εβδομαδιαίο Πρόγραμμα» ορίζετε τα ωράρια ανά ημέρα (με δυνατότητα σπαστού ωραρίου). Για προσωρινές αλλαγές χρησιμοποιήστε «Εξαιρέσεις». Οι αλλαγές εφαρμόζονται αυτόματα στη διαθεσιμότητα. Αν προσθέσετε εξαίρεση πάνω σε προγραμματισμένο ραντεβού που δεν μπορείτε να εξυπηρετήσετε, ακυρώστε το χειροκίνητα.",
  },

  // Email & Ειδοποιήσεις
  {
    category: "Email & Ειδοποιήσεις",
    question: "Πότε στέλνονται αυτοματοποιημένα email στον ασθενή;",
    answer:
      "Αυτόματα email αποστέλλονται όταν καταχωρείται νέο ραντεβού, όταν ακυρώνεται ένα ραντεβού και ως υπενθύμιση μία ημέρα πριν από το ραντεβού. Τα email περιλαμβάνουν λεπτομέρειες και οδηγίες.",
  },

  // Εκτύπωση & Εξαγωγή
  {
    category: "Εκτύπωση & Εξαγωγή",
    question: "Πώς εκτυπώνω τη λίστα ραντεβού;",
    answer:
      "Στη σελίδα «Ραντεβού», από το ημερολόγιο δεξιά, επιλέξτε ημερομηνία ή εύρος ημερομηνιών και πατήστε το εικονίδιο 🖨️ «Εκτύπωση».",
  },
  {
    category: "Εκτύπωση & Εξαγωγή",
    question: "Πώς κατεβάζω τη λίστα ραντεβού σε αρχείο Excel;",
    answer:
      "Στη σελίδα «Ραντεβού», από το ημερολόγιο δεξιά, επιλέξτε ημερομηνία ή εύρος ημερομηνιών και πατήστε το εικονίδιο 📥 «Εξαγωγή σε Excel».",
  },

  // Δεδομένα & Απόρρητο
  {
    category: "Δεδομένα & Απόρρητο",
    question: "Τι δεδομένα διατηρούνται στο σύστημα;",
    answer:
      "Διατηρούνται στοιχεία επικοινωνίας και ιστορικό επισκέψεων έως οριστική διαγραφή. Τα ραντεβού διατηρούνται έως 3 μήνες και έπειτα διαγράφονται αυτόματα.",
  },

  // Κατάσταση Συστήματος
  {
    category: "Κατάσταση Συστήματος",
    question: "Πού βλέπω την κατάσταση λειτουργίας (status) του συστήματος;",
    answer: (
      <span>
        Επισκεφθείτε την ειδική σελίδα κατάστασης:{" "}
        <a
          href="https://status.drkollia.com"
          target="_blank"
          rel="noreferrer"
          className="underline hover:no-underline"
        >
          status.drkollia.com
        </a>
        . Εκεί θα δείτε τρέχουσες ενημερώσεις και ιστορικό συμβάντων.
      </span>
    ),
    searchText:
      "Πού βλέπω την κατάσταση λειτουργίας status του συστήματος; status page διαθεσιμότητα συστήματος",
  },
  {
    category: "Κατάσταση Συστήματος",
    question: "Πώς αναφέρω πρόβλημα;",
    answer: (
      <span>
        Ανοίξτε τη σελίδα{" "}
        <a
          href="/admin/report-incident"
          className="underline hover:no-underline"
        >
          Αναφορά Προβλήματος (IT)
        </a>
        . Συμπληρώστε τίτλο/περιοχή/επίδραση, περιγραφή και{" "}
        <b>επισυνάψτε εικόνες</b> (σύρετε-απόθεση ή επιλογή αρχείων). Το μήνυμα
        αποστέλλεται απευθείας στην IT με CC στον αποστολέα (αν επιλεγεί).
      </span>
    ),
    searchText:
      "Πώς αναφέρω πρόβλημα; αναφορά incident bug screenshot φωτογραφίες τεχνικός υποστήριξη IT",
  },
];

/* ------------------ UTILS ------------------ */
const escapeRegExp = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const slug = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-");

const highlight = (text, needle) => {
  if (!needle || typeof text !== "string") return text;
  const safe = escapeRegExp(needle);
  const parts = text.split(new RegExp(`(${safe})`, "ig"));
  return parts.map((p, i) =>
    p.toLowerCase() === needle.toLowerCase() ? (
      <mark key={i} className="bg-yellow-100 rounded px-0.5">
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    )
  );
};

function startOfTodayLocal() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
}
function endOfTodayLocal() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

/* ------------------ PAGE ------------------ */
export default function HelpPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [openAll, setOpenAll] = useState(false);
  const [openSlug, setOpenSlug] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionExists, setSessionExists] = useState(false);

  const [q, setQ] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const searchRef = useRef(null);

  const [stats, setStats] = useState({
    acceptsNew: null,
    pendingCount: null,
    todayCount: null,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "v1.0.0";
  const needle = q.trim().toLowerCase();

  // ---- Auth guard
  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) router.replace("/login");
      else setSessionExists(true);
      setSessionChecked(true);
    })();
  }, [router]);

  // ---- Live system badges
  useEffect(() => {
    (async () => {
      setLoadingStats(true);
      try {
        const [settingsRes, pendingRes, todayRes] = await Promise.all([
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
          acceptsNew: settingsRes?.data?.accept_new_appointments ?? null,
          pendingCount:
            typeof pendingRes?.count === "number" ? pendingRes.count : null,
          todayCount:
            typeof todayRes?.count === "number" ? todayRes.count : null,
        });
      } catch (e) {
        // keep stats as null if something goes wrong
        console.error("Failed to load help stats", e);
      } finally {
        setLoadingStats(false);
      }
    })();
  }, []);

  // ---- Keyboard shortcuts (N, P, /, ?, I)
  useEffect(() => {
    const isTyping = (el) => {
      const tag = el?.tagName?.toLowerCase();
      return (
        el?.isContentEditable ||
        tag === "input" ||
        tag === "textarea" ||
        tag === "select"
      );
    };
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTyping(document.activeElement)) return;

      const k = e.key;
      if (k.toLowerCase() === "n") {
        e.preventDefault();
        router.push("/admin/appointments/new");
      } else if (k.toLowerCase() === "p") {
        e.preventDefault();
        router.push("/admin/patients/new");
      } else if (k.toLowerCase() === "i") {
        e.preventDefault();
        router.push("/admin/report-incident");
      } else if (k === "/" && pathname === "/admin/help") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (k === "?" || (k === "/" && e.shiftKey)) {
        e.preventDefault();
        if (pathname !== "/admin/help") router.push("/admin/help");
        else {
          window.scrollTo({ top: 0, behavior: "smooth" });
          setTimeout(() => searchRef.current?.focus(), 200);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname, router]);

  // ---- Read ?focus=1 and #hash
  useEffect(() => {
    if (searchParams.get("focus") === "1") {
      setTimeout(() => {
        searchRef.current?.focus();
        searchRef.current?.select?.();
      }, 120);
    }
    const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (hash) {
      setOpenAll(false);
      setOpenSlug(hash);
      setTimeout(() => {
        document.getElementById(`faq-${hash}`)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    }
  }, [searchParams]);

  // ---- Categories / grouping
  const categories = useMemo(
    () => Array.from(new Set(rawFaqs.map((f) => f.category))),
    []
  );

  // Prepare searchable FAQs (so search also works for JSX answers with searchText)
  const searchableFaqs = useMemo(
    () =>
      rawFaqs.map((f) => {
        const qStr =
          typeof f.question === "string" ? f.question : f.searchText || "";
        const aStr =
          typeof f.answer === "string" ? f.answer : f.searchText || "";
        const catStr = f.category || "";
        return {
          ...f,
          _search: `${catStr} ${qStr} ${aStr} ${
            f.searchText || ""
          }`.toLowerCase(),
        };
      }),
    []
  );

  // ---- Filtered data
  const filteredByCategory = useMemo(() => {
    const base = searchableFaqs.filter((f) => {
      if (activeCategory !== "all" && f.category !== activeCategory) {
        return false;
      }
      if (!needle) return true;
      return f._search.includes(needle);
    });

    const grouped = categories.map((cat) => ({
      category: cat,
      faqs: base.filter((f) => f.category === cat),
    }));
    return grouped.filter((g) => g.faqs.length > 0);
  }, [needle, activeCategory, searchableFaqs, categories]);

  const resultsCount = filteredByCategory.reduce(
    (acc, g) => acc + g.faqs.length,
    0
  );

  // ---- helpers
  const updateHash = useCallback((nextSlug) => {
    const url = new URL(window.location.href);
    if (nextSlug) url.hash = nextSlug;
    else url.hash = "";
    history.replaceState(null, "", url.toString());
  }, []);

  const clearSearch = () => {
    setQ("");
    setActiveCategory("all");
  };

  if (!sessionChecked) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#fafafa]">
        Έλεγχος πρόσβασης...
      </main>
    );
  }
  if (!sessionExists) return null;

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#2f2e2c] font-sans pb-24 print:bg-white">
      {/* Top gradient banner */}
      <div className="sticky top-0 z-10 -mb-10 h-8 bg-gradient-to-b from-[#f4efe7] to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 pt-20">
        {/* Header */}
        <div className="no-print sticky top-14 z-20 -mx-4 px-4 py-3 bg-[#fafafa]/85 backdrop-blur border-b border-[#eceae6]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
                title="Πίσω"
              >
                <ArrowLeft className="w-4 h-4" />
                Πίσω
              </button>

              {/* Status link */}
              <a
                href="https://status.drkollia.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[#e5e1d8] bg-white/80 px-3 py-1.5 text-xs text-gray-700 shadow-sm hover:bg-white transition"
                title="Κατάσταση Συστήματος"
              >
                <span className="font-medium">Κατάσταση</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Report Incident header button */}
              <button
                onClick={() => router.push("/admin/report-incident")}
                className="inline-flex items-center gap-2 rounded-full border border-[#e5e1d8] bg-[#111827] px-3 py-1.5 text-xs text-white shadow-sm hover:bg-black transition"
                title="Αναφορά Προβλήματος (I)"
              >
                <Bug className="w-3.5 h-3.5" />
                Αναφορά Προβλήματος
              </button>

              {/* Print button */}
              <button
                type="button"
                onClick={() => window.print()}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#e5e1d8] bg-white/80 px-3 py-1.5 text-xs text-gray-700 shadow-sm hover:bg-white transition"
                title="Εκτύπωση σελίδας βοήθειας"
              >
                <Printer className="w-3.5 h-3.5" />
                Εκτύπωση
              </button>
            </div>

            <div className="relative w-full sm:w-[32rem]">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Αναζήτηση στο βοήθημα… (/)"
                className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-20 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Αναζήτηση στο FAQ"
              />
              {(q || activeCategory !== "all") && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-600 underline"
                >
                  Εκκαθάριση
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Title row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mt-8 mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Οδηγός Διαχειριστή
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Χρήσιμες οδηγίες, συντομεύσεις και κατάσταση συστήματος.
            </p>
          </div>
          <div className="text-xs text-gray-500 text-right">
            <div>Έκδοση: {appVersion}</div>
            <div>Τελευταία εκτύπωση μέσω Ctrl + P</div>
          </div>
        </div>

        {/* Small tip box */}
        <div className="no-print mb-5 rounded-xl border border-[#e7e3db] bg-white px-4 py-3 text-xs text-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-500" />
            <span>
              Συντομεύσεις:{" "}
              <kbd className="px-1.5 py-0.5 rounded border bg-[#fafafa]">?</kbd>{" "}
              για άνοιγμα βοήθειας,{" "}
              <kbd className="px-1.5 py-0.5 rounded border bg-[#fafafa]">/</kbd>{" "}
              για αναζήτηση,{" "}
              <kbd className="px-1.5 py-0.5 rounded border bg-[#fafafa]">N</kbd>{" "}
              για νέο ραντεβού.
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <span className="hidden sm:inline">Εκτύπωση σελίδας:</span>
            <kbd className="px-1.5 py-0.5 rounded border bg-[#fafafa] text-[11px]">
              Ctrl
            </kbd>
            +
            <kbd className="px-1.5 py-0.5 rounded border bg-[#fafafa] text-[11px]">
              P
            </kbd>
          </div>
        </div>

        {/* Category chips */}
        <div className="no-print mb-6 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={classNames(
              "text-xs rounded-full border px-3 py-1.5 shadow-sm bg-white/80 text-gray-700 hover:bg-white transition whitespace-nowrap",
              activeCategory === "all" &&
                "bg-[#111827] text-white border-[#111827]"
            )}
          >
            Όλα
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={classNames(
                "text-xs rounded-full border px-3 py-1.5 bg-white/80 text-gray-700 hover:bg-white transition whitespace-nowrap",
                activeCategory === cat &&
                  "bg-[#111827] text-white border-[#111827]"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Incident CTA */}
        <section className="no-print mb-8">
          <div className="rounded-2xl border border-[#e5e1d8] bg-gradient-to-br from-white via-[#fcfbf9] to-[#f7f5f1] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <LifeBuoy className="w-5 h-5 text-[#6b675f]" />
              </div>
              <div>
                <h3 className="font-semibold">Κάτι δεν λειτουργεί σωστά;</h3>
                <p className="text-sm text-gray-600">
                  Αναφέρετε άμεσα το πρόβλημα στον τεχνικό για{" "}
                  <b>άμεση επίλυση</b>.
                </p>
                <ul className="text-xs text-gray-500 list-disc ml-5 mt-2 space-y-1">
                  <li>Περιγράψτε το πρόβλημα που αντιμετωπίζετε.</li>
                  <li>Άμεση ενημέρωση τεχνικού.</li>
                  <li className="flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-gray-500" />
                    Υποστηρίζει έως 5 εικόνες, συνολικά μέχρι 10MB.
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/admin/report-incident")}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-white bg-[#111827] hover:bg-black transition"
              >
                <Bug className="w-4 h-4" />
                Άνοιγμα Αναφοράς
              </button>
            </div>
          </div>
        </section>

        {/* System badges */}
        <section className="mb-8 no-print">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              icon={<ShieldCheck className="w-5 h-5 text-[#6b675f]" />}
              label="Δεχόμαστε νέα ραντεβού;"
              value={
                loadingStats
                  ? "—"
                  : stats.acceptsNew === null
                  ? "—"
                  : stats.acceptsNew
                  ? "Ναι"
                  : "Όχι"
              }
            />
            <StatCard
              icon={<Info className="w-5 h-5 text-[#6b675f]" />}
              label="Εκκρεμούν (pending)"
              value={
                loadingStats || stats.pendingCount === null
                  ? "—"
                  : stats.pendingCount
              }
            />
            <StatCard
              icon={<BarChart3 className="w-5 h-5 text-[#6b675f]" />}
              label="Σημερινά ραντεβού"
              value={
                loadingStats || stats.todayCount === null
                  ? "—"
                  : stats.todayCount
              }
            />
          </div>
        </section>

        {/* Layout: TOC + content */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          {/* TOC */}
          <aside className="no-print hidden lg:block sticky self-start top-28 h-[calc(100vh-7rem)] overflow-auto pr-2">
            <nav aria-label="Πίνακας περιεχομένων" className="space-y-1">
              {filteredByCategory.map((g) => (
                <a
                  key={g.category}
                  href={`#cat-${slug(g.category)}`}
                  className="block rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-white border border-transparent hover:border-[#eceae6]"
                >
                  {g.category}{" "}
                  <span className="text-gray-400">({g.faqs.length})</span>
                </a>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <div>
            {/* Quick Actions */}
            <section className="mb-8 no-print">
              <h2 className="text-xl font-semibold mb-3">Γρήγορες Ενέργειες</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <QuickAction
                  icon={<CalendarPlus className="w-5 h-5" />}
                  title="Νέο Ραντεβού"
                  onClick={() => router.push("/admin/appointments/new")}
                  hint="N"
                />
                <QuickAction
                  icon={<BarChart3 className="w-5 h-5" />}
                  title="Αναφορές"
                  onClick={() => router.push("/admin/reports")}
                />
                <QuickAction
                  icon={<Settings2 className="w-5 h-5" />}
                  title="Πρόγραμμα Ιατρείου"
                  onClick={() => router.push("/admin/schedule")}
                />
                <QuickAction
                  icon={<Bug className="w-5 h-5" />}
                  title="Αναφορά Προβλήματος"
                  onClick={() => router.push("/admin/report-incident")}
                  hint="I"
                />
              </div>
            </section>

            {/* Search results info + controls */}
            <div className="no-print flex items-center justify-between mb-3">
              {q || activeCategory !== "all" ? (
                <p className="text-xs text-gray-500">
                  Βρέθηκαν {resultsCount} αποτελέσματα.
                </p>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setOpenAll(true);
                    setOpenSlug(null);
                    updateHash("");
                  }}
                  className="text-xs underline text-gray-600"
                >
                  Άνοιγμα όλων
                </button>
                <span className="text-gray-300">•</span>
                <button
                  onClick={() => {
                    setOpenAll(false);
                    setOpenSlug(null);
                    updateHash("");
                  }}
                  className="text-xs underline text-gray-600"
                >
                  Κλείσιμο όλων
                </button>
              </div>
            </div>

            {/* FAQ grouped by category */}
            {filteredByCategory.map(({ category, faqs }) => (
              <section key={category} className="mb-10">
                <h2
                  id={`cat-${slug(category)}`}
                  className="text-xl font-semibold mb-3"
                >
                  {category}
                </h2>
                <div className="space-y-3">
                  {faqs.map((faq) => {
                    const id = slug(faq.question);
                    const isOpen = openAll || openSlug === id;
                    return (
                      <article
                        key={id}
                        id={`faq-${id}`}
                        className="border border-[#e9e5db] rounded-xl bg-white shadow-sm"
                      >
                        <header className="flex items-center justify-between gap-2 p-4">
                          <button
                            onClick={() => {
                              const next = isOpen ? null : id;
                              setOpenAll(false);
                              setOpenSlug(next);
                              updateHash(next);
                            }}
                            className="flex-1 text-left"
                            aria-expanded={isOpen}
                            aria-controls={`panel-${id}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium">
                                {typeof faq.question === "string"
                                  ? highlight(faq.question, needle)
                                  : faq.question}
                              </span>
                              <ChevronDown
                                className={classNames(
                                  "w-5 h-5 shrink-0 transition-transform text-gray-500",
                                  isOpen && "rotate-180"
                                )}
                              />
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              const url = `${window.location.origin}${window.location.pathname}#${id}`;
                              navigator.clipboard?.writeText(url);
                            }}
                            className="inline-flex items-center justify-center p-2 rounded-lg border border-transparent hover:border-[#eceae6] text-gray-500"
                            title="Αντιγραφή συνδέσμου ερώτησης"
                            aria-label="Αντιγραφή συνδέσμου ερώτησης"
                          >
                            <Link2 className="w-4 h-4" />
                          </button>
                        </header>
                        <div
                          id={`panel-${id}`}
                          className={classNames(
                            "px-4 overflow-hidden transition-[max-height,opacity] duration-300",
                            isOpen
                              ? "max-h-[800px] opacity-100 pb-4"
                              : "max-h-0 opacity-0"
                          )}
                          aria-hidden={!isOpen}
                        >
                          <div className="text-gray-700 text-sm leading-relaxed">
                            {typeof faq.answer === "string"
                              ? highlight(faq.answer, needle)
                              : faq.answer}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}

            {/* Keyboard shortcuts */}
            <section className="mb-12 no-print">
              <h2 className="text-xl font-semibold mb-3">
                Συντομεύσεις Πληκτρολογίου
              </h2>
              <ul className="text-sm text-gray-700 grid sm:grid-cols-2 gap-2">
                <Shortcut k="N" label="Άνοιγμα «Νέο Ραντεβού»" />
                <Shortcut k="P" label="Άνοιγμα «Νέος Ασθενής»" />
                <Shortcut k="I" label="Άνοιγμα «Αναφορά Προβλήματος»" />
                <Shortcut k="/" label="Εστίαση στην αναζήτηση βοήθειας" />
                <Shortcut k="?" label="Άνοιγμα/Επιστροφή στη βοήθεια" />
              </ul>
            </section>

            {/* Footer */}
            <footer className="text-sm text-gray-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 print:mt-8">
              <p>
                Για βοήθεια:{" "}
                <a
                  href="mailto:contact@pkarabetsos.com"
                  className="underline hover:no-underline"
                >
                  contact@pkarabetsos.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <span>Κατάσταση:</span>
                <a
                  href="https://status.drkollia.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline hover:no-underline"
                >
                  status.drkollia.com <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </p>
              <p>© {new Date().getFullYear()}</p>
            </footer>
          </div>
        </div>
      </div>

      {/* print styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            background: white !important;
          }
        }
      `}</style>
    </main>
  );
}

/* ------------------ SMALL COMPONENTS ------------------ */
function StatCard({ icon, label, value }) {
  return (
    <div className="border border-[#e5e1d8] bg-white rounded-xl p-4 flex items-center gap-3">
      <div>{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

function QuickAction({ icon, title, onClick, hint }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl border border-[#e5e1d8] bg-white px-4 py-3 text-left hover:bg-[#f7f5f1] transition"
    >
      <div className="inline-flex items-center justify-center rounded-lg border border-[#e5e1d8] bg-white/80 p-2 shadow-sm group-hover:scale-105 transition">
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-medium flex items-center gap-2">
          {title}
          {hint && (
            <kbd className="px-1.5 py-0.5 text-[10px] rounded border bg-white text-gray-600">
              {hint}
            </kbd>
          )}
        </div>
        <div className="text-xs text-gray-500">Κάντε κλικ για μετάβαση</div>
      </div>
    </button>
  );
}

function Shortcut({ k, label }) {
  return (
    <li className="flex items-center gap-2">
      <kbd className="px-2 py-1 rounded border bg-white text-xs">{k}</kbd> —{" "}
      {label}
    </li>
  );
}
