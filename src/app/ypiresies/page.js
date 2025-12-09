// app/services/page.js
import Link from "next/link";
import {
  Stethoscope,
  Activity,
  HeartPulse,
  Syringe,
  Droplets,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Ιατρικές Υπηρεσίες | Γεωργία Κόλλια - Ενδοκρινολόγος",
  description:
    "Ενδοκρινολογική εκτίμηση, διαχείριση σακχαρώδη διαβήτη, παθήσεις θυρεοειδούς, παχυσαρκία, οστεοπόρωση και ορμονικές διαταραχές.",
};

const services = [
  {
    title: "Ενδοκρινολογική εκτίμηση",
    icon: Stethoscope,
    description:
      "Ολοκληρωμένη αξιολόγηση ορμονικής και μεταβολικής υγείας, με έμφαση στην εξατομίκευση και τον τρόπο ζωής του κάθε ανθρώπου.",
    tags: ["Ορμονικός έλεγχος", "Μεταβολισμός", "Προσαρμοσμένο πλάνο"],
  },
  {
    title: "Σακχαρώδης Διαβήτης",
    icon: Activity,
    description:
      "Διάγνωση και εντατική ρύθμιση σακχάρου, εκπαίδευση σε διατροφή, άσκηση και καθημερινή αυτοδιαχείριση.",
    tags: ["Τύπου 1 & 2", "Προδιαβήτης", "Εκπαίδευση ασθενούς"],
  },
  {
    title: "Παθήσεις θυρεοειδούς",
    icon: HeartPulse,
    description:
      "Αντιμετώπιση υποθυρεοειδισμού, υπερθυρεοειδισμού, όζων και αυτοάνοσων παθήσεων (Hashimoto, Graves).",
    tags: ["TSH / T3 / T4", "Αυτοάνοσα", "Όζοι θυρεοειδούς"],
  },
  {
    title: "Παχυσαρκία & μεταβολικό σύνδρομο",
    icon: Sparkles,
    description:
      "Ιατρική προσέγγιση στη ρύθμιση βάρους, με ασφαλή, σταδιακή αλλαγή και σύγχρονες φαρμακευτικές επιλογές όπου χρειάζεται.",
    tags: ["Ρύθμιση βάρους", "Λιπίδια", "Αρτηριακή πίεση"],
  },
  {
    title: "Οστεοπόρωση & οστικός μεταβολισμός",
    icon: Syringe,
    description:
      "Έλεγχος οστικής πυκνότητας, εκτίμηση κινδύνου καταγμάτων και εξατομικευμένη αγωγή σύμφωνα με τις κατευθυντήριες οδηγίες.",
    tags: ["DEXA", "Πρόληψη καταγμάτων", "Βιταμίνη D / ασβέστιο"],
  },
  {
    title: "Εφηβεία, κύηση & ορμονικές διαταραχές",
    icon: Droplets,
    description:
      "Διερεύνηση διαταραχών περιόδου, PCOS, ορμονικός έλεγχος στην κύηση, στην εφηβεία και στις μεταβάσεις της ζωής.",
    tags: ["PCOS", "Εγκυμοσύνη", "Εφηβική ενδοκρινολογία"],
  },
];

const visitSteps = [
  {
    title: "1. Συζήτηση & ιστορικό",
    text: "Ξεκινάμε με προσεκτική λήψη ιστορικού, αναλυτική συζήτηση για τα συμπτώματα και τους στόχους σας.",
  },
  {
    title: "2. Κλινική εξέταση",
    text: "Ακολουθεί στοχευμένη κλινική εξέταση και, όπου κρίνεται απαραίτητο, σύσταση για εργαστηριακό ή απεικονιστικό έλεγχο.",
  },
  {
    title: "3. Ερμηνεία & πλάνο",
    text: "Εξηγούμε αναλυτικά τα ευρήματα και συνδιαμορφώνουμε ένα εξατομικευμένο θεραπευτικό πλάνο.",
  },
  {
    title: "4. Παρακολούθηση",
    text: "Με τακτικές επανεκτιμήσεις και συνεχή υποστήριξη, προσαρμόζουμε τη θεραπεία σταδιακά όπου χρειάζεται.",
  },
];

export default function ServicesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f1ea] text-[#28221a]">
      {/* Ambient layered background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        {/* Soft vertical gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#f7f2eb] via-[#f5f1ea] to-[#f1ece5]" />

        {/* Warm blob top-right */}
        <div className="absolute -top-24 right-[-3rem] h-64 w-64 rounded-full bg-[#e6d3c2]/70 blur-3xl" />

        {/* Cool blob mid-left */}
        <div className="absolute top-1/3 -left-20 h-80 w-80 rounded-full bg-[#d8e4f0]/70 blur-3xl" />

        {/* Subtle central vertical divider */}
        <div className="absolute inset-y-10 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#d3c2b0]/60 to-transparent opacity-60" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        {/* Small page label / breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#8a7a69]">
          <span className="h-px w-6 bg-[#c5b39f]" />
          <span>Υπηρεσίες Ιατρείου</span>
        </div>

        {/* Hero */}
        <section className="relative mb-16 lg:mb-20">
          <div className="relative overflow-hidden rounded-[2.3rem] border border-white/70 bg-white/80 backdrop-blur-2xl shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
            <div className="absolute inset-0 opacity-80">
              <div className="absolute inset-0 bg-gradient-to-br from-[#f2e3d3] via-[#fdf9f3] to-[#dde8f0]" />
              <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_transparent)]" />
            </div>

            <div className="relative px-6 sm:px-10 lg:px-14 py-10 lg:py-14 flex flex-col lg:flex-row gap-10 lg:gap-14 items-stretch">
              {/* Left content */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-[#e4d6c8] px-3 py-1 text-[11px] font-medium tracking-[0.16em] text-[#7a6754] mb-4">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  ολιστική ενδοκρινολογική προσέγγιση
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-[2.55rem] leading-tight font-semibold text-[#2a241d] mb-4">
                  Ιατρικές υπηρεσίες
                  <span className="block text-[clamp(1.4rem,2vw,1.7rem)] text-[#8a7460] mt-1">
                    σχεδιασμένες γύρω από εσάς
                  </span>
                </h1>

                <p className="text-sm sm:text-[15px] leading-relaxed text-[#6d6459] max-w-xl">
                  Στο ιατρείο της Γεωργίας Κόλλια, κάθε περίπτωση
                  αντιμετωπίζεται με σεβασμό στη μοναδικότητα του ανθρώπου.
                  Συνδυάζονται τα σύγχρονα επιστημονικά δεδομένα με μια ζεστή,
                  ανθρώπινη προσέγγιση.
                </p>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-[#e7d8c8] px-3.5 py-1.5 text-[11px] text-[#6f5f50]">
                    <Sparkles className="w-3.5 h-3.5" />
                    Εξατομικευμένα θεραπευτικά πλάνα
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-[#d6e3ee] px-3.5 py-1.5 text-[11px] text-[#5b6570]">
                    <Activity className="w-3.5 h-3.5" />
                    Σύγχρονες κατευθυντήριες οδηγίες
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-[#e3d7e9] px-3.5 py-1.5 text-[11px] text-[#5b4b69]">
                    <HeartPulse className="w-3.5 h-3.5" />
                    Ισορροπία σώματος & νου
                  </span>
                </div>
              </div>

              {/* Right compact panel */}
              <div className="w-full lg:w-[34%] flex items-stretch">
                <div className="w-full h-full rounded-3xl bg-white/75 border border-white/80 shadow-[0_18px_55px_rgba(15,23,42,0.12)] px-5 py-5 flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#8b7a65] mb-2">
                      συχνά αίτια επίσκεψης
                    </p>
                    <div className="space-y-2.5 text-xs text-[#65594c]">
                      <div className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#b9916d]" />
                        <p>
                          Κόπωση, διακυμάνσεις βάρους, διαταραχές θυρεοειδούς
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#c68d95]" />
                        <p>
                          Αυξημένο σάκχαρο, προδιαβήτης, σακχαρώδης διαβήτης
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#7da2b5]" />
                        <p>Διαταραχές περιόδου, PCOS, ορμονικές μεταβολές</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#9e9ad4]" />
                        <p>
                          Οστεοπόρωση, μειωμένη οστική πυκνότητα, ιστορικό
                          καταγμάτων
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#efe3d5] flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8b7a65] mb-0.5">
                        επόμενο βήμα
                      </p>
                      <p className="text-xs text-[#5f554a]">
                        Με ένα ραντεβού, αποκτάτε ξεκάθαρο πλάνο για τα επόμενα
                        βήματα στη φροντίδα σας.
                      </p>
                    </div>
                    <Link
                      href="/appointments"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#7a654e] px-4 py-2 text-[12px] font-medium text-[#fdf8f2] shadow-lg shadow-[#7a654e]/30 hover:bg-[#6a5744] transition-colors"
                    >
                      Κλείστε ραντεβού
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services grid */}
        <section className="mb-16 lg:mb-20">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#2b241d]">
                Κύριοι τομείς εξειδίκευσης
              </h2>
              <div className="mt-2 h-px w-16 bg-gradient-to-r from-[#b79574] via-[#d2bda4] to-transparent rounded-full" />
              <p className="mt-3 text-sm text-[#6c6459] max-w-2xl">
                Κάθε ενότητα υπηρεσιών προσαρμόζεται στο ιστορικό, τις ανάγκες
                και τους στόχους σας – από την πρώτη αξιολόγηση μέχρι τη
                μακροχρόνια παρακολούθηση.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <article
                  key={service.title}
                  className="group relative h-full rounded-2xl border border-[#efe1d0] bg-white/90 backdrop-blur-sm shadow-[0_18px_50px_rgba(15,23,42,0.06)] flex flex-col transition-transform duration-200 hover:-translate-y-1.5 hover:shadow-[0_25px_70px_rgba(15,23,42,0.10)]"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 via-white/40 to-[#e9f0f4]/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-5 pb-4 flex-1">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f3e3d2] text-[#7a5e43] shadow-inner shadow-[#e2c7aa]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-semibold text-[#2f2820]">
                          {service.title}
                        </h3>
                        <p className="text-xs sm:text-[13px] leading-relaxed text-[#6a6157]">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {service.tags?.length ? (
                    <div className="relative px-5 pb-4 pt-1 border-t border-[#f1e4d5]">
                      <div className="flex flex-wrap gap-1.5">
                        {service.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full border border-[#e5d6c7] bg-[#fbf6ee] px-2.5 py-1 text-[11px] text-[#756957]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        {/* How a visit works */}
        <section className="mb-16 lg:mb-20">
          <div className="rounded-3xl border border-white/80 bg-white/80 backdrop-blur-xl px-6 sm:px-8 py-8 lg:py-10 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-[#2b241d]">
                  Πώς εξελίσσεται μία επίσκεψη
                </h2>
                <p className="mt-2 text-sm text-[#6c6459] max-w-xl">
                  Ο στόχος είναι να φύγετε με ψυχική ηρεμία, σαφή διάγνωση και
                  ένα πλάνο που να ταιριάζει ρεαλιστικά στην καθημερινότητά σας.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {visitSteps.map((step, idx) => (
                <div
                  key={step.title}
                  className="relative rounded-2xl border border-[#eee0d2] bg-[#fbf6ee]/90 px-4 py-4 text-xs sm:text-[13px] text-[#5f574e] overflow-hidden"
                >
                  <div className="absolute -top-6 -right-2 text-[3.6rem] font-semibold text-[#e4d4c4] opacity-40 select-none">
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                  <div className="relative">
                    <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#8a7b6a] mb-1.5">
                      {step.title}
                    </p>
                    <p className="leading-relaxed">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-4">
          <div className="rounded-3xl border border-[#e3d4c3] bg-gradient-to-r from-[#f3e3d3] via-[#fdf8f2] to-[#dde7f0] px-6 sm:px-8 py-7 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8a7a69] mb-1.5">
                ήρεμο επόμενο βήμα
              </p>
              <h2 className="text-lg sm:text-xl font-semibold text-[#2b241d]">
                Κλείστε μια επίσκεψη όταν νιώσετε έτοιμοι
              </h2>
              <p className="mt-1.5 text-sm text-[#6c6459] max-w-xl">
                Αν αναγνωρίζετε κάποιο από τα παραπάνω ή αν θέλετε μια πιο
                ολοκληρωμένη εικόνα για την ορμονική σας υγεία, ένα ραντεβού
                μπορεί να είναι η αρχή μιας πιο ισορροπημένης καθημερινότητας.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <Link
                href="/appointments"
                className="inline-flex items-center justify-center rounded-full bg-[#7a654e] px-6 py-2.5 text-sm font-medium text-[#fdf8f2] shadow-lg shadow-[#7a654e]/35 hover:bg-[#6a5744] transition-colors"
              >
                Κλείστε ραντεβού online
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              <p className="text-[11px] text-[#6c6459] sm:max-w-[220px]">
                Για επείγοντα ή ειδικές απορίες, μπορείτε πάντα να
                επικοινωνήσετε τηλεφωνικά με το ιατρείο.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
