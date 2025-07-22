"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { MapPin, Phone, Mail, Clock, CalendarCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#fdfaf6] text-[#3b3a36]">
      <Header />

      {/* Hero Section */}
      <section className="relative flex items-center justify-center h-[60vh] bg-[url('/contact-banner2.jpg')] bg-cover bg-center text-white">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative z-10 text-center px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-bold mb-4"
          >
            Επικοινωνία
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-lg md:text-xl max-w-2xl mx-auto text-[#f4f0e8]"
          >
          
          </motion.p>
        </div>
      </section>

      {/* Contact Info + Form */}
      <section className="py-20 px-6 bg-[#f7f4ee]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.7 }} 
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-semibold mb-6">Στοιχεία Επικοινωνίας</h2>
            <ul className="text-lg text-[#4a4944] space-y-4">
              <li className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#b6a079]" />
                Τάμπα 8, Ηλιούπολη
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#b6a079]" />
                Τηλέφωνο: 210 9934316
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#b6a079]" />
                Email: gokollia@gmail.com
              </li>
              <li className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#b6a079]" />
                Ώρες Λειτουργίας: Δευτέρα - Παρασκευή, 09:00 - 17:00
              </li>
            </ul>
          </motion.div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.7 }} 
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-semibold mb-6">Φόρμα Επικοινωνίας</h2>
            <form className="space-y-4">
              <div>
                <label className="block mb-1 text-sm">Ονοματεπώνυμο</label>
                <input type="text" className="w-full border border-[#ddd2c2] rounded-lg px-4 py-2 bg-white" />
              </div>
              <div>
                <label className="block mb-1 text-sm">Email</label>
                <input type="email" className="w-full border border-[#ddd2c2] rounded-lg px-4 py-2 bg-white" />
              </div>
              <div>
                <label className="block mb-1 text-sm">Μήνυμα</label>
                <textarea className="w-full border border-[#ddd2c2] rounded-lg px-4 py-2 bg-white h-32 resize-none" />
              </div>
              <button
                type="submit"
                className="mt-4 px-6 py-2 bg-[#b6a079] text-white rounded-lg hover:bg-[#9f8d6b] transition"
              >
                Αποστολή
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Appointment Section */}
      <section  id="map" className="bg-[#fdfaf6] py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-center mb-4">
              <CalendarCheck className="w-10 h-10 text-[#b6a079]" />
            </div>
            <h2 className="text-3xl font-semibold mb-4">Κλείστε Ραντεβού</h2>
            <p className="text-lg text-[#4a4944] max-w-xl mx-auto mb-6">
              Συμπληρώστε τη φόρμα ή καλέστε μας για να προγραμματίσετε το ραντεβού σας με τη Δρ. Κόλλια.
            </p>
            <a
              href="tel:2109934316"
              className="inline-block px-6 py-3 bg-[#b6a079] text-white rounded-lg hover:bg-[#9f8d6b] transition"
            >
              Κλήση για Ραντεβού
            </a>
          </motion.div>
        </div>
      </section>

      {/* Google Map */}
      <section className="bg-[#f2eee8] py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-6">Βρείτε μας στον χάρτη</h2>
          <div className="overflow-hidden rounded-2xl shadow-lg">
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