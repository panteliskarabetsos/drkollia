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

export default function ContactPage() {
  // tiny helper for copy-to-clipboard feedback
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // simple visual ack without deps
      const el = document.createElement("div");
      el.textContent = "Αντιγράφηκε";
      el.className =
        "fixed z-[60] bottom-6 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-sm bg-[#2f2e2b] text-white shadow";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    } catch {}
  };

  return (
    <main className="min-h-screen bg-[#fdfaf6] text-[#3b3a36]">
      {/* Hero */}
      <section
        className="relative grid place-items-center h-[48vh] md:h-[56vh] bg-center bg-cover"
        style={{ backgroundImage: "url('/contact-banner2.jpg')" }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.45)_0%,rgba(0,0,0,0.35)_40%,rgba(0,0,0,0.25)_100%)] backdrop-blur-[6px]" />
        <div className="relative z-10 text-center px-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-3"
          >
            Επικοινωνία
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7 }}
            className="text-base md:text-lg max-w-2xl mx-auto text-[#efeae0]"
          >
            Καλέστε μας ή κλείστε ηλεκτρονικά το ραντεβού σας. Θα χαρούμε να σας
            εξυπηρετήσουμε.
          </motion.p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-20 px-4 sm:px-8 md:px-12">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-serif font-semibold text-[#2f2e2c] tracking-tight mb-10 text-center"
          >
            Στοιχεία Επικοινωνίας
          </motion.h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Address */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden rounded-2xl border border-[#ece7df] bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="absolute -top-20 -right-24 h-56 w-56 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#efe6d9] via-transparent to-transparent opacity-70 pointer-events-none" />
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-[#f3eee6] border border-[#e8e1d8]">
                  <MapPin className="w-5 h-5 text-[#a78b64]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[#6f6b64] uppercase tracking-wide">
                    Διεύθυνση
                  </h3>
                  <p className="mt-1 text-[15px] font-medium">
                    Τάμπα 8, Ηλιούπολη 16342
                  </p>
                  <div className="mt-3 flex gap-2">
                    <a
                      href="https://www.google.com/maps/dir/?api=1&destination=Τάμπα+8,+Ηλιούπολη+163+42"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#e8e1d8] bg-white/80 px-3 py-1.5 text-sm hover:bg-[#f5efe6] transition"
                    >
                      <Navigation className="w-4 h-4" />
                      Οδηγίες
                    </a>
                    <button
                      onClick={() => copy("Τάμπα 8, Ηλιούπολη 16342")}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#e8e1d8] bg-white/80 px-3 py-1.5 text-sm hover:bg-[#f5efe6] transition"
                    >
                      Αντιγραφή
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Phone */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="relative overflow-hidden rounded-2xl border border-[#ece7df] bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#efe6d9] via-transparent to-transparent opacity-70 pointer-events-none" />
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-[#f3eee6] border border-[#e8e1d8]">
                  <Phone className="w-5 h-5 text-[#a78b64]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[#6f6b64] uppercase tracking-wide">
                    Τηλέφωνο
                  </h3>
                  <a
                    href="tel:+302109934316"
                    className="mt-1 block text-[15px] font-medium hover:underline"
                  >
                    +30 210 9934316
                  </a>
                  <div className="mt-3 flex gap-2">
                    <a
                      href="tel:+302109934316"
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#e8e1d8] bg-white/80 px-3 py-1.5 text-sm hover:bg-[#f5efe6] transition"
                    >
                      Κλήση
                    </a>
                    <button
                      onClick={() => copy("+302109934316")}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#e8e1d8] bg-white/80 px-3 py-1.5 text-sm hover:bg-[#f5efe6] transition"
                    >
                      Αντιγραφή
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden rounded-2xl border border-[#ece7df] bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-[#f3eee6] border border-[#e8e1d8]">
                  <Mail className="w-5 h-5 text-[#a78b64]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[#6f6b64] uppercase tracking-wide">
                    Email
                  </h3>
                  <a
                    href="mailto:gokollia@gmail.com"
                    className="mt-1 block text-[15px] font-medium hover:underline"
                  >
                    gokollia@gmail.com
                  </a>
                  <div className="mt-3 flex gap-2">
                    <a
                      href="mailto:gokollia@gmail.com"
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#e8e1d8] bg-white/80 px-3 py-1.5 text-sm hover:bg-[#f5efe6] transition"
                    >
                      Σύνταξη Email
                    </a>
                    <button
                      onClick={() => copy("gokollia@gmail.com")}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#e8e1d8] bg-white/80 px-3 py-1.5 text-sm hover:bg-[#f5efe6] transition"
                    >
                      Αντιγραφή
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Opening Hours */}
      <section className="py-16 px-4 sm:px-8 md:px-12 bg-[#faf7f3]">
        <div className="max-w-5xl mx-auto">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-4 inline-flex rounded-full border border-[#e8e1d8] bg-[#f3eee6] p-2">
              <Clock className="w-6 h-6 text-[#a78b64]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-[#2f2e2c] tracking-tight">
              Ώρες Λειτουργίας Ιατρείου
            </h2>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Δευτέρα", "10:00 – 13:00 & 17:30 – 21:00"],
              ["Τρίτη", "17:30 – 21:00"],
              ["Τετάρτη", "10:00 – 13:00"],
              ["Πέμπτη", "10:00 – 13:00 & 17:30 – 21:00"],
              ["Παρασκευή", "Κλειστά"],
              ["Σάββατο & Κυριακή", "Κλειστά"],
            ].map(([day, hours]) => (
              <div
                key={day}
                className="flex items-center justify-between rounded-xl border border-[#ece7df] bg-white px-4 py-3 shadow-sm"
              >
                <span className="text-[15px] font-medium">{day}</span>
                <span className="text-sm text-[#6a6257]">{hours}</span>
              </div>
            ))}
          </div>

          <p className="mt-4 text-center text-xs text-[#6a6257] italic">
            * Κατόπιν ραντεβού
          </p>
        </div>
      </section>

      {/* Appointment CTA */}
      <section className="py-20 px-4 sm:px-8 md:px-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl border border-[#e8e1d8] bg-[radial-gradient(100%_100%_at_0%_0%,#efe6d9_0%,#ffffff_60%)] p-8 text-center shadow-sm"
          >
            <div className="mx-auto mb-3 inline-flex rounded-full border border-[#e8e1d8] bg-white/70 p-2">
              <CalendarCheck className="w-7 h-7 text-[#a3895d]" />
            </div>
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
              Κλείστε Ραντεβού
            </h3>
            <p className="text-[15px] text-[#4a4944] max-w-xl mx-auto mb-6">
              Κλείστε το ραντεβού σας ηλεκτρονικά ή καλέστε στο ιατρείο για
              διαθεσιμότητα.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/appointments"
                className="inline-flex items-center justify-center rounded-full bg-[#8c7c68] px-5 py-2.5 text-white shadow-sm hover:bg-[#746856] transition"
              >
                Κλείστε Online
              </a>
              <a
                href="tel:+302109934316"
                className="inline-flex items-center justify-center rounded-full border border-[#e8e1d8] bg-white px-5 py-2.5 text-[#2f2e2b] shadow-sm hover:bg-[#f5efe6] transition"
              >
                Κλήση στο 210 9934316
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Map */}
      <section className="bg-[#f2eee8] py-16 px-4 sm:px-8 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <div className="mx-auto mb-4 inline-flex rounded-full border border-[#e8e1d8] bg-[#f3eee6] p-2">
              <Map className="w-7 h-7 text-[#a78b64]" />
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-serif font-semibold tracking-tight text-[#2f2e2c] mb-4"
            >
              Βρείτε μας στον χάρτη
            </motion.h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#e8e1d8] shadow-md bg-white">
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
              className="inline-flex items-center gap-1.5 rounded-md border border-[#e8e1d8] bg-white px-3 py-1.5 text-sm hover:bg-[#f5efe6] transition"
            >
              Άνοιγμα στο Google Maps
            </a>
            <a
              href="https://maps.apple.com/?daddr=Τάμπα+8,+Ηλιούπολη+163+42"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#e8e1d8] bg-white px-3 py-1.5 text-sm hover:bg-[#f5efe6] transition"
            >
              Άνοιγμα στο Apple Maps
            </a>
          </div>
        </div>
      </section>

      {/* Local Business structured data (SEO) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
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
            url:
              typeof window !== "undefined"
                ? window.location.origin
                : "https://",
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
          }),
        }}
      />
    </main>
  );
}
