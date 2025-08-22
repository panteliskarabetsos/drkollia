"use client";

import { MapPin, Phone, Mail, Clock, CalendarCheck, Map } from "lucide-react";
import { motion } from "framer-motion";
import { MapPinLine, PhoneCall, EnvelopeSimple } from "@phosphor-icons/react";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#fdfaf6] text-[#3b3a36]">
      {/* Hero Section */}
      <section className="relative flex items-center justify-center h-[60vh] bg-[url('/contact-banner2.jpg')] bg-cover bg-center text-white">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative z-10 text-center px-6">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-4"
          >
            Επικοινωνία
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-lg md:text-xl max-w-2xl mx-auto text-[#eae7e0] leading-relaxed"
          >
            Είμαστε εδώ για να σας βοηθήσουμε. Επικοινωνήστε μαζί μας τηλεφωνικά
            ή κλείστε το ραντεβού σας ηλεκτρονικά.
          </motion.p>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-8 md:px-12 bg-[#fdfaf6]">
        <div className="max-w-4xl mx-auto">
          {/* Τίτλος */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-serif font-semibold text-[#2f2e2c] tracking-tight mb-16 text-center"
          >
            Στοιχεία Επικοινωνίας
          </motion.h2>

          {/* Contact Info */}
          <ul className="space-y-10 divide-y divide-[#ece7df]">
            {[
              {
                icon: <MapPin size={28} className="text-[#a78b64]" />,
                label: "Διεύθυνση",
                value: "Τάμπα 8, Ηλιούπολη",
              },
              {
                icon: <Phone size={28} className="text-[#a78b64]" />,
                label: "Τηλέφωνο",
                value: (
                  <a
                    href="tel:2109934316"
                    className="hover:underline text-[#2f2e2c] transition-all"
                  >
                    210 9934316
                  </a>
                ),
              },
              {
                icon: <Mail size={28} className="text-[#a78b64]" />,
                label: "Email",
                value: (
                  <a
                    href="mailto:gokollia@gmail.com"
                    className="hover:underline text-[#2f2e2c] transition-all"
                  >
                    gokollia@gmail.com
                  </a>
                ),
              },
            ].map(({ icon, label, value }, index) => (
              <motion.li
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col sm:flex-row sm:items-center justify-between pt-6"
              >
                <div className="flex items-center gap-4 text-[#5b554f]">
                  <div className="p-3 bg-[#f3eee6] rounded-full shadow-md hover:scale-105 transition-transform duration-200">
                    {icon}
                  </div>
                  <span className="text-sm sm:text-base uppercase tracking-wide font-semibold text-[#7a766f]">
                    {label}
                  </span>
                </div>
                <div className="mt-3 sm:mt-0 text-base font-medium text-right sm:text-left max-w-sm">
                  {value}
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* --- Section: Ώρες Λειτουργίας --- */}
      <section className="py-24 px-6 bg-[#faf7f3] animate-fadeInUp duration-1000">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-3 bg-[#f3eee6] rounded-full shadow-md">
              <Clock className="w-8 h-8 text-[#a78b64]" />
            </div>
          </div>

          {/* Τίτλος */}
          <h2 className="text-3xl md:text-4xl font-serif font-semibold tracking-tight text-[#2f2e2c]">
            Ώρες Λειτουργίας Ιατρείου
          </h2>

          {/* Ώρες */}
          <div className="text-lg text-[#4a4944] leading-relaxed space-y-1">
            <p>
              <strong>Δευτέρα:</strong> 10:00 - 13:00 & 17:30 - 21:00
            </p>
            <p>
              <strong>Τρίτη:</strong> 17:30 - 21:00
            </p>
            <p>
              <strong>Τετάρτη:</strong> 10:00 - 13:00
            </p>
            <p>
              <strong>Πέμπτη:</strong> 10:00 - 13:00 & 17:30 - 21:00
            </p>
            <p>
              <strong>Παρασκευή, Σάββατο & Κυριακή:</strong> Κλειστά
            </p>
            <p className="mt-4 text-sm italic text-[#6a6257]">
              *Κατόπιν ραντεβού
            </p>
          </div>
        </div>
      </section>

      {/* Appointment CTA Section */}
      <section id="map" className="bg-[#fdfaf6] py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-center mb-4">
              <CalendarCheck className="w-10 h-10 text-[#a3895d]" />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight mb-3">
              Κλείστε Ραντεβού
            </h2>
            <p className="text-md text-[#4a4944] max-w-xl mx-auto mb-6 leading-relaxed">
              Καλέστε μας ή κλείστε το ραντεβού σας ηλεκτρονικά για να
              προγραμματίσετε το ραντεβού σας με τη Δρ. Κόλλια.
            </p>
            <a
              href="/appointments"
              className="inline-block px-6 py-3 bg-[#a3895d] text-white rounded-2xl shadow-md hover:bg-[#917856] transition-all"
            >
              Κλείστε Ραντεβού
            </a>
          </motion.div>
        </div>
      </section>

      {/* Google Map Section */}
      <section className="bg-[#f2eee8] py-14 px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-[#f3eee6] rounded-full shadow-md inline-flex">
              <Map className="w-8 h-8 text-[#a78b64]" />
            </div>
          </div>

          {/* Τίτλος */}
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-serif font-semibold tracking-tight text-[#2f2e2c] mb-6"
          >
            Βρείτε μας στον χάρτη
          </motion.h2>

          {/* Map Iframe */}
          <div className="overflow-hidden rounded-xl shadow-xl transition-transform">
            <iframe
              title="Χάρτης Ιατρείου"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3146.912224914925!2d23.757584712562426!3d37.932480971829136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14a1bd0f225a3365%3A0xe9b3abe9577e3797!2zzprPjM67zrvOuc6xIM6TzrXPic-BzrPOr86xIM6ULg!5e0!3m2!1sel!2sgr!4v1753129616014!5m2!1sel!2sgr"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
