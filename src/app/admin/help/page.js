"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import {
  ChevronDown,
  ArrowLeft,
  ScrollText,
  IdCard,
  ShieldCheck,
  Info,
  BarChart3,
  CalendarPlus,
  Plus,
  Settings2,
  Search,
  Printer,
} from "lucide-react";

/* ------------------ FAQ CONTENT ------------------ */
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
    question: "Τι σημαίνουν τα status;",
    answer:
      "🟡 pending → σε εκκρεμότητα • 🔵 scheduled → προγραμματισμένο • 🟢 approved → εγκεκριμένο • 🟣 rejected → απορρίφθηκε • 🔴 cancelled → ακυρώθηκε • ⚪ completed → ολοκληρώθηκε.",
  },
  {
    question: "Πώς εκτυπώνω τη λίστα ραντεβού;",
    answer:
      "Στη σελίδα «Ραντεβού», από το ημερολόγιο δεξιά, επιλέξτε ημερομηνία ή εύρος ημερομηνιών και πατήστε το εικονίδιο 🖨️ «Εκτύπωση».",
  },
  {
    question: "Πώς κατεβάζω τη λίστα ραντεβού σε αρχείο Excel;",
    answer:
      "Στη σελίδα «Ραντεβού», από το ημερολόγιο δεξιά, επιλέξτε ημερομηνία ή εύρος ημερομηνιών και πατήστε το εικονίδιο 📥 «Εξαγωγή σε Excel».",
  },
  {
    question: "Τι σημαίνει η διάρκεια στο ραντεβού;",
    answer:
      "Προεπιλογές διάρκειας: «Εξέταση» 30′, «Αξιολόγηση Αποτελεσμάτων» 15′, «Ιατρικός Επισκέπτης» 15′. Το σύστημα προτείνει ωράρια ώστε να μην «σπάνε» τα 30′ slots.",
  },
  {
    question: "Μπορούν να κλείσουν ραντεβού ηλεκτρονικά Ιατρικοί Επισκέπτες;",
    answer:
      "Ναι, υπάρχει ειδική επιλογή. Ωστόσο επιτρέπονται έως δύο ραντεβού Ιατρικών Επισκεπτών ανά μήνα. Αν συμπληρωθεί το όριο, εμφανίζεται μήνυμα για τηλεφωνική συνεννόηση ή επιλογή άλλου μήνα.",
  },
  {
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
  },
  {
    question: "Τι δεδομένα διατηρούνται στο σύστημα;",
    answer:
      "Διατηρούνται στοιχεία επικοινωνίας και ιστορικό επισκέψεων έως οριστική διαγραφή. Τα ραντεβού διατηρούνται έως 3 μήνες και έπειτα διαγράφονται αυτόματα.",
  },
];

/* ------------------ UTILS ------------------ */
const slug = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-");

const highlight = (text, needle) => {
  if (!needle || typeof text !== "string") return text;
  const parts = text.split(new RegExp(`(${needle})`, "ig"));
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

/* ------------------ PAGE ------------------ */
export default function HelpPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [openSlug, setOpenSlug] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionExists, setSessionExists] = useState(false);

  const [q, setQ] = useState("");
  const searchRef = useRef(null);

  const [stats, setStats] = useState({
    acceptsNew: null,
    pendingCount: null,
    todayCount: null,
  });
  const [loadingStats, setLoadingStats] = useState(true);

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
      } finally {
        setLoadingStats(false);
      }
    })();
  }, []);

  // ---- Keyboard shortcuts (N, P, /, ?)
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
      setOpenSlug(hash);
      setTimeout(() => {
        document.getElementById(`faq-${hash}`)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    }
  }, [searchParams]);

  // ---- Search / filter
  const filteredFaqs = useMemo(() => {
    if (!q.trim()) return faqs;
    const needle = q.toLowerCase();
    return faqs.filter((f) => {
      const qStr = typeof f.question === "string" ? f.question : "";
      const aStr = typeof f.answer === "string" ? f.answer : "";
      return (
        qStr.toLowerCase().includes(needle) ||
        aStr.toLowerCase().includes(needle)
      );
    });
  }, [q]);

  if (!sessionChecked) {
    return (
      <main className="min-h-screen grid place-items-center">
        Έλεγχος πρόσβασης...
      </main>
    );
  }
  if (!sessionExists) return null;

  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "v1.0.0";
  const needle = q.trim();

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#333] font-sans py-24 px-4 print:bg-white">
      <div className="max-w-5xl mx-auto">
        {/* Sticky header: back + search + print */}
        <div className="no-print sticky top-16 z-10 -mx-4 px-4 py-3 bg-[#fafafa]/85 backdrop-blur border-b border-[#eceae6]">
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
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
                title="Εκτύπωση"
              >
                <Printer className="w-4 h-4" />
                Εκτύπωση
              </button>
            </div>

            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Αναζήτηση στο FAQ…"
                className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Αναζήτηση στο FAQ"
              />
            </div>
          </div>
        </div>

        {/* Title + badges */}
        <div className="flex items-end justify-between gap-3 mt-6 mb-6">
          <h1 className="text-3xl font-bold">Οδηγός Διαχειριστή</h1>
          <div className="text-xs text-gray-500">Έκδοση: {appVersion}</div>
        </div>

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

        {/* Quick Actions */}
        <section className="mb-10 no-print">
          <h2 className="text-xl font-semibold mb-3">Γρήγορες Ενέργειες</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickAction
              icon={<CalendarPlus className="w-5 h-5" />}
              title="Νέο Ραντεβού"
              onClick={() => router.push("/admin/appointments/new")}
              hint="N"
            />
            <QuickAction
              icon={<Plus className="w-5 h-5" />}
              title="Νέος Ασθενής"
              onClick={() => router.push("/admin/patients/new")}
              hint="P"
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

        {/* Search results info */}
        {q && (
          <p className="mt-2 mb-4 text-xs text-gray-500">
            Βρέθηκαν {filteredFaqs.length} αποτελέσματα.
          </p>
        )}

        {/* FAQ list */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-3">Συχνές Ερωτήσεις (FAQ)</h2>
          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const id = slug(faq.question);
              const isOpen = openSlug === id;
              return (
                <article
                  key={id}
                  id={`faq-${id}`}
                  className="border border-gray-200 rounded-lg bg-white shadow-sm"
                >
                  <button
                    onClick={() => {
                      const next = isOpen ? null : id;
                      setOpenSlug(next);
                      const newHash = next ? `#${next}` : " ";
                      // push hash for deep link (no navigation reload)
                      history.replaceState(null, "", newHash);
                    }}
                    className="w-full flex justify-between items-center p-4 text-left"
                    aria-expanded={isOpen}
                    aria-controls={`panel-${id}`}
                  >
                    <span className="font-medium">
                      {typeof faq.question === "string"
                        ? highlight(faq.question, needle)
                        : faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    id={`panel-${id}`}
                    className={`px-4 overflow-hidden transition-[max-height,opacity] duration-300 ${
                      isOpen
                        ? "max-h-[600px] opacity-100 pb-4"
                        : "max-h-0 opacity-0"
                    }`}
                    aria-hidden={!isOpen}
                  >
                    <div className="text-gray-600 text-sm">
                      {typeof faq.answer === "string"
                        ? highlight(faq.answer, needle)
                        : faq.answer}
                    </div>
                  </div>
                </article>
              );
            })}
            {filteredFaqs.length === 0 && (
              <p className="text-sm text-gray-500">
                Δεν βρέθηκαν αποτελέσματα. Δοκιμάστε διαφορετικές
                λέξεις-κλειδιά.
              </p>
            )}
          </div>
        </section>

        {/* Keyboard shortcuts */}
        <section className="mb-16 no-print">
          <h2 className="text-xl font-semibold mb-3">
            Συντομεύσεις Πληκτρολογίου
          </h2>
          <ul className="text-sm text-gray-700 grid gap-2">
            <Shortcut k="N" label="Άνοιγμα «Νέο Ραντεβού»" />
            <Shortcut k="P" label="Άνοιγμα «Νέος Ασθενής»" />
            <Shortcut k="/" label="Εστίαση στην αναζήτηση FAQ" />
            <Shortcut k="?" label="Άνοιγμα/Επιστροφή στη βοήθεια" />
          </ul>
        </section>

        {/* Footer info */}
        <footer className="text-sm text-gray-600 flex items-center justify-between print:mt-8">
          <p>
            Για βοήθεια:{" "}
            <a
              href="mailto:contact@pkarabetsos.com"
              className="underline hover:no-underline"
            >
              contact@pkarabetsos.com
            </a>
          </p>
          <p>© {new Date().getFullYear()}</p>
        </footer>
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
      <kbd className="px-2 py-1 rounded border bg-white">{k}</kbd> — {label}
    </li>
  );
}
