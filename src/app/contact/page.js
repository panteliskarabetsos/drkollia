"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { MapPin, Phone, Mail, Clock, CalendarCheck } from "lucide-react";
import { motion } from "framer-motion";

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
            Είμαστε εδώ για να σας εξυπηρετήσουμε. Επικοινωνήστε μαζί μας τηλεφωνικά ή μέσω email.
          </motion.p>
        </div>
      </section>
<section className="py-24 px-4 md:px-6 bg-[#f7f4ee]">
  <div className="max-w-6xl mx-auto">
    <motion.h2
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      viewport={{ once: true }}
      className="text-4xl font-bold mb-6 text-center text-[#3b3a36] tracking-tight"
    >
      Στοιχεία Επικοινωνίας
    </motion.h2>

    <motion.p
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.2 }}
      viewport={{ once: true }}
      className="text-[#4a4944] text-base md:text-lg leading-relaxed mb-16 max-w-2xl text-center mx-auto"
    >
      Επικοινωνήστε μαζί μας για πληροφορίες, καθοδήγηση ή προγραμματισμό ραντεβού. Θα χαρούμε να σας εξυπηρετήσουμε.
    </motion.p>

    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
      {/* Card Template */}
      {[
        {
          title: "Διεύθυνση",
          icon: <MapPin className="w-5 h-5 text-[#a3895d]" />,
          content: "Τάμπα 8, Ηλιούπολη",
        },
        {
          title: "Τηλέφωνο",
          icon: <Phone className="w-5 h-5 text-[#a3895d]" />,
          content: (
            <a href="tel:2109934316" className="hover:underline">
              210 9934316
            </a>
          ),
        },
        {
          title: "Email",
          icon: <Mail className="w-5 h-5 text-[#a3895d]" />,
          content: (
            <a href="mailto:gokollia@gmail.com" className="hover:underline">
              gokollia@gmail.com
            </a>
          ),
        },
      ].map(({ title, icon, content }, index) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#f2eee8] p-3 rounded-full group-hover:scale-105 transition-transform">
              {icon}
            </div>
            <h3 className="text-lg font-semibold text-[#3b3a36]">{title}</h3>
          </div>
          <div className="text-[#4a4944] text-sm">{content}</div>
        </motion.div>
      ))}

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
              Καλέστε μας ή κλείστε το ραντεβού σας ηλεκτρονικά  για να προγραμματίσετε το ραντεβού σας με τη Δρ. Κόλλια.
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
      <section className="bg-[#f2eee8] py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-3xl font-semibold tracking-tight mb-6"
          >
            Βρείτε μας στον χάρτη
          </motion.h2>
          <div className="overflow-hidden rounded-xl shadow-xl transition-transform"
          >
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
