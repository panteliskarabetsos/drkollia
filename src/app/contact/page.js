"use client";

import {
  MapPin,
  Phone,
  Mail,
  Clock,
  CalendarCheck,
  Map,
  Navigation,
} from "lucide-react";
import { motion } from "framer-motion";

// 🔹 Stable site URL (no window)
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"; // ← change to your real domain

// 🔹 JSON-LD schema (pure constant, same on server & client)
const clinicSchema = {
  "@context": "https://schema.org",
  "@type": "MedicalClinic",
  name: "Ιατρείο Ενδοκρινολογίας - Δρ. Γεωργία Κόλλια",
  telephone: "+30 210 9934316",
  email: "gokollia@gmail.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Τάμπα 8",
    addressLocality: "Ηλιούπολη",
    postalCode: "16342",
    addressCountry: "GR",
  },
  url: siteUrl,
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Monday",
      opens: "10:00",
      closes: "21:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Tuesday",
      opens: "17:30",
      closes: "21:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Wednesday",
      opens: "10:00",
      closes: "13:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Thursday",
      opens: "10:00",
      closes: "21:00",
    },
  ],
};

export default function ContactPage() {
  // tiny helper for copy-to-clipboard feedback
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // simple visual ack without deps
      const el = document.createElement("div");
      el.textContent = "Αντιγράφηκε";
      el.className =
        "fixed z-[60] bottom-6 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-sm bg-[#262522] text-white shadow";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    } catch {}
  };

  // Opening hours with "today" highlight
  const today = new Date().getDay(); // 0 = Κυριακή, 1 = Δευτέρα, ...
  const openingHours = [
    { label: "Δευτέρα", hours: "10:00 – 13:00 & 17:30 – 21:00", dayIndex: 1 },
    { label: "Τρίτη", hours: "17:30 – 21:00", dayIndex: 2 },
    { label: "Τετάρτη", hours: "10:00 – 13:00", dayIndex: 3 },
    { label: "Πέμπτη", hours: "10:00 – 13:00 & 17:30 – 21:00", dayIndex: 4 },
    { label: "Παρασκευή", hours: "Κλειστά", dayIndex: 5 },
    { label: "Σάββατο & Κυριακή", hours: "Κλειστά", dayIndex: null },
  ];

  return (
    <main className="min-h-screen bg-[#f6f2eb] text-[#2f2e2b]">
      {/* Hero */}
      <section
        className="relative grid place-items-center h-[44vh] md:h-[52vh] bg-center bg-cover"
        style={{ backgroundImage: "url('/contact-banner4.jpg')" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.55)_0,_rgba(0,0,0,0.35)_40%,rgba(0,0,0,0.6)_100%)] backdrop-blur-[6px]" />

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-3 text-[10px] md:text-xs tracking-[0.25em] uppercase text-[#f1ebe3]/80"
          >
            Ενδοκρινολογικό Ιατρείο · Ηλιούπολη
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="text-3xl md:text-5xl lg:text-6xl font-serif font-semibold tracking-tight text-white mb-3"
          >
            Επικοινωνία
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.6 }}
            className="text-sm md:text-base max-w-xl mx-auto text-[#efeae0]"
          >
            Μπορείτε να επικοινωνείτε τηλεφωνικά για ραντεβού ή να
            προγραμματίσετε εύκολα την επόμενη επίσκεψή σας ηλεκτρονικά.
          </motion.p>

          {/* Quick info chips */}
          {/* <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.6 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs md:text-[13px]"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 backdrop-blur border border-white/20 text-[#f7f2ea]">
              <Phone className="w-4 h-4" />
              210 9934316
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 backdrop-blur border border-white/20 text-[#f7f2ea]">
              <MapPin className="w-4 h-4" />
              Τάμπα 8, Ηλιούπολη
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 backdrop-blur border border-white/20 text-[#f7f2ea]">
              <Mail className="w-4 h-4" />
              gokollia@gmail.com
            </span>
          </motion.div> */}
        </div>
      </section>

      {/* Content wrapper overlapping hero */}
      <section className="-mt-10 md:-mt-16 pb-18 md:pb-20 pt-4 px-4 sm:px-8 md:px-12 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Contact Cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-[#e3dbcf] bg-white/85 backdrop-blur-sm shadow-[0_18px_45px_rgba(18,15,10,0.10)] px-5 sm:px-8 md:px-10 py-9 md:py-10"
          >
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-[#252422] tracking-tight mb-2 text-center">
              Στοιχεία Επικοινωνίας
            </h2>
            <p className="text-xs md:text-sm text-[#6f6a61] text-center mb-8 max-w-xl mx-auto">
              Όλες οι βασικές πληροφορίες για να μας βρείτε και να κλείσετε το
              ραντεβού σας.
            </p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Address */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-[#ece6dc] bg-white px-5 py-5 shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#f4eee4] border border-[#e5ddd0]">
                    <MapPin className="w-5 h-5 text-[#8c7b66]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[11px] font-semibold text-[#7b7469] uppercase tracking-[0.18em]">
                      Διεύθυνση
                    </h3>
                    <p className="mt-1 text-[15px] font-medium text-[#2f2c27]">
                      Τάμπα 8, Ηλιούπολη 16342
                    </p>
                    <p className="mt-2 text-xs text-[#8a8276] leading-relaxed">
                      Κοντά στη Λεωφόρο Ειρήνης, με εύκολη πρόσβαση και
                      δυνατότητα στάθμευσης στην περιοχή.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href="https://www.google.com/maps/dir/?api=1&destination=Τάμπα+8,+Ηλιούπολη+163+42"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#e5ddd0] bg-white px-3 py-1.5 text-xs hover:bg-[#f5efe6] transition"
                      >
                        <Navigation className="w-4 h-4" />
                        Οδηγίες
                      </a>
                      <button
                        onClick={() => copy("Τάμπα 8, Ηλιούπολη 16342")}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#e5ddd0] bg-white px-3 py-1.5 text-xs hover:bg-[#f5efe6] transition"
                      >
                        Αντιγραφή
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Phone */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="rounded-2xl border border-[#ece6dc] bg-white px-5 py-5 shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#f4eee4] border border-[#e5ddd0]">
                    <Phone className="w-5 h-5 text-[#8c7b66]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[11px] font-semibold text-[#7b7469] uppercase tracking-[0.18em]">
                      Τηλέφωνο Ιατρείου
                    </h3>
                    <a
                      href="tel:+302109934316"
                      className="mt-1 block text-[15px] font-medium text-[#2f2c27] hover:underline"
                    >
                      +30 210 9934316
                    </a>
                    <p className="mt-2 text-xs text-[#8a8276] leading-relaxed">
                      Για κλείσιμο ραντεβού και πληροφορίες σχετικά με τις
                      υπηρεσίες του ιατρείου.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href="tel:+302109934316"
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#8c7c68] px-3 py-1.5 text-xs text-white shadow-sm hover:bg-[#746856] transition"
                      >
                        Κλήση Τώρα
                      </a>
                      <button
                        onClick={() => copy("+302109934316")}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#e5ddd0] bg-white px-3 py-1.5 text-xs hover:bg-[#f5efe6] transition"
                      >
                        Αντιγραφή
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Email */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl border border-[#ece6dc] bg-white px-5 py-5 shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#f4eee4] border border-[#e5ddd0]">
                    <Mail className="w-5 h-5 text-[#8c7b66]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[11px] font-semibold text-[#7b7469] uppercase tracking-[0.18em]">
                      Email Επικοινωνίας
                    </h3>
                    <a
                      href="mailto:gokollia@gmail.com"
                      className="mt-1 block text-[15px] font-medium text-[#2f2c27] hover:underline break-all"
                    >
                      gokollia@gmail.com
                    </a>
                    <p className="mt-2 text-xs text-[#8a8276] leading-relaxed">
                      Για αποστολή εξετάσεων ή σύντομες ιατρικές διευκρινίσεις
                      σε μη επείγουσες περιπτώσεις.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href="mailto:gokollia@gmail.com"
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#e5ddd0] bg-white px-3 py-1.5 text-xs hover:bg-[#f5efe6] transition"
                      >
                        Σύνταξη Email
                      </a>
                      <button
                        onClick={() => copy("gokollia@gmail.com")}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#e5ddd0] bg-white px-3 py-1.5 text-xs hover:bg-[#f5efe6] transition"
                      >
                        Αντιγραφή
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Opening Hours */}
      <section className="pb-16 pt-4 px-4 sm:px-8 md:px-12 bg-[#f8f4ee]">
        <div className="max-w-5xl mx-auto">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-4 inline-flex rounded-full border border-[#e4ddd1] bg-[#f2ebe1] p-2">
              <Clock className="w-6 h-6 text-[#8c7b66]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-[#252422] tracking-tight">
              Ώρες Λειτουργίας Ιατρείου
            </h2>
            <p className="mt-2 text-xs md:text-sm text-[#6f6a61]">
              Τα ραντεβού πραγματοποιούνται αποκλειστικά κατόπιν συνεννόησης.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {openingHours.map(({ label, hours, dayIndex }) => {
              const isToday = dayIndex === today;
              return (
                <div
                  key={label}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 shadow-sm border text-sm transition-all bg-white ${
                    isToday ? "border-[#d2c4af] shadow-md" : "border-[#ebe3d6]"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-[14px] font-medium text-[#2f2c27]">
                      {label}
                    </span>
                    <span className="text-xs text-[#6a6257]">{hours}</span>
                  </div>
                  {isToday && (
                    <span className="ml-3 whitespace-nowrap rounded-full border border-[#d2c4af] bg-[#f1e5d5] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-[#6e5838]">
                      Σήμερα
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-center text-xs text-[#6a6257] italic">
            * Η ακριβής ώρα ραντεβού επιβεβαιώνεται τηλεφωνικά ή μέσω της
            ηλεκτρονικής πλατφόρμας.
          </p>
        </div>
      </section>

      {/* Appointment CTA */}
      <section className="py-16 px-4 sm:px-8 md:px-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-[#e4ddd1] bg-[#fbf7f1] p-8 md:p-10 text-center shadow-[0_18px_45px_rgba(17,13,8,0.08)]"
          >
            <div className="mx-auto mb-4 inline-flex rounded-full border border-[#e4ddd1] bg-white/80 p-2">
              <CalendarCheck className="w-7 h-7 text-[#8c7b66]" />
            </div>
            <h3 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight mb-2 text-[#252422]">
              Κλείστε Ραντεβού
            </h3>
            <p className="text-[14px] md:text-[15px] text-[#4a4944] max-w-xl mx-auto mb-7">
              Μπορείτε να κλείσετε το ραντεβού σας ηλεκτρονικά ή να
              επικοινωνήσετε τηλεφωνικά με τη γραμματεία για διαθεσιμότητα.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/appointments"
                className="inline-flex items-center justify-center rounded-full bg-[#8c7c68] px-6 py-2.5 text-sm md:text-base text-white shadow-sm hover:bg-[#746856] transition"
              >
                Κλείστε Online
              </a>
              <a
                href="tel:+302109934316"
                className="inline-flex items-center justify-center rounded-full border border-[#e4ddd1] bg-white px-6 py-2.5 text-sm md:text-base text-[#252422] shadow-sm hover:bg-[#f5efe6] transition"
              >
                Κλήση στο 210 9934316
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Map */}
      <section id="map" className="bg-[#f2eee8] py-16 px-4 sm:px-8 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <div className="mx-auto mb-4 inline-flex rounded-full border border-[#e4ddd1] bg-[#f2ebe1] p-2">
              <Map className="w-7 h-7 text-[#8c7b66]" />
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-serif font-semibold tracking-tight text-[#252422] mb-2"
            >
              Βρείτε μας στον χάρτη
            </motion.h2>
            <p className="text-xs md:text-sm text-[#6f6a61] mb-6">
              Οδηγίες πρόσβασης μέσω Google Maps ή Apple Maps.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#e4ddd1] shadow-md bg-white">
            <iframe
              title="Χάρτης Ιατρείου"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3146.912224914925!2d23.757584712562426!3d37.932480971829136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14a1bd0f225a3365%3A0xe9b3abe9577e3797!2zzprPjM67zrvOuc6xIM6TzrXPic-BzrPOr86xIM6ULg!5e0!3m2!1sel!2sgr!4v1753129616014!5m2!1sel!2sgr"
              width="100%"
              height="420"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen=""
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=Τάμπα+8,+Ηλιούπολη+163+42"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#e4ddd1] bg-white px-3 py-1.5 text-xs md:text-sm hover:bg-[#f5efe6] transition"
            >
              Άνοιγμα στο Google Maps
            </a>
            <a
              href="https://maps.apple.com/?daddr=Τάμπα+8,+Ηλιούπολη+163+42"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#e4ddd1] bg-white px-3 py-1.5 text-xs md:text-sm hover:bg-[#f5efe6] transition"
            >
              Άνοιγμα στο Apple Maps
            </a>
          </div>
        </div>
      </section>

      {/* Local Business structured data (SEO) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(clinicSchema) }}
      />
    </main>
  );
}
