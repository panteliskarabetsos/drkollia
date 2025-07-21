"use client";
import Image from "next/image";
import Link from "next/link";
import { Noto_Serif } from "next/font/google";
import Header from "./components/Header";

const notoSerif = Noto_Serif({ subsets: ["latin"], weight: ["400", "700"] });

export default function Home() {
  return (
    <main className={`min-h-screen bg-[#fdfaf6] text-[#3b3a36] ${notoSerif.className}`}>
      <Header/>
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center h-[90vh] text-center px-6 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 fade-video"
        >
          <source src="/background.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#eae2d6]/80 to-[#fdfaf6]/90 backdrop-blur-sm z-0"></div>
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Ολιστική Ενδοκρινολογία & Μεταβολική Ευεξία
          </h1>
          <p className="text-lg md:text-xl text-[#3b3a36] mb-6">
            Ανακαλύψτε μια ανθρώπινη και εξατομικευμένη προσέγγιση στην υγεία σας, με έμφαση στον θυρεοειδή, την ορμονική ισορροπία και τη μακροχρόνια ευεξία — καθοδηγούμενη από την επιστήμη και τη φροντίδα.
          </p>
          <Link
            href="#contact"
            className="inline-block bg-[#8c7c68] text-white px-6 py-3 rounded-full shadow-md hover:bg-[#746856] transition"
          >
            Κλείστε Ραντεβού
          </Link>
        </div>
      </section>

      {/* Ώρες Ιατρείου Section */}
      <section className="py-20 px-6 bg-[#f2eee8]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-6">Ώρες Λειτουργίας Ιατρείου</h2>
          <div className="text-lg text-[#4a4944] leading-relaxed">
            <p>Δευτέρα - Παρασκευή: 09:00 - 14:00 & 17:00 - 20:00</p>
            <p>Σάββατο & Κυριακή: Κλειστά</p>
            <p className="mt-4 text-sm italic">*Κατόπιν ραντεβού</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-6 bg-[#fdfaf6]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2 relative group overflow-hidden rounded-2xl shadow-xl">
            <Image
              src="/doctor.jpg"
              alt="Dr. Maria Kalogeropoulou"
              width={500}
              height={500}
              className="rounded-2xl object-cover w-full h-full transition-transform duration-700 ease-in-out group-hover:scale-105 group-hover:brightness-105"
            />
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition duration-500 rounded-2xl" />
          </div>
          <div className="md:w-1/2 text-center md:text-left">
            <h2 className="text-3xl font-semibold mb-4">Η Ιατρός</h2>
            <p className="text-[#4a4944] text-lg">
              Η Δρ. Γεωργία Κόλλια είναι ενδοκρινολόγος με πολυετή εμπειρία, αφοσιωμένη στην παροχή επιστημονικά τεκμηριωμένης και ταυτόχρονα ανθρώπινης φροντίδας. Με εξειδίκευση στον θυρεοειδή, τις διαταραχές ορμονών και τον μεταβολισμό, προσφέρει εξατομικευμένες λύσεις υγείας με σεβασμό, ενσυναίσθηση και επαγγελματισμό.
            </p>
          </div>
        </div>
      </section>

      {/* Ιατρείο Section */}
      <section className="py-20 px-6 bg-[#f2eee8]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row-reverse items-center gap-12">
          <div className="md:w-1/2">
            <div className="relative group overflow-hidden shadow-xl rounded-2xl">
              <div className="relative group shadow-xl clip-diagonal-shape rounded-2xl">
                <Image
                  src="/clinic-interior.jpg"
                  alt="Ιατρείο Δρ. Καλογεροπούλου"
                  width={600}
                  height={400}
                  className="rounded-2xl transition-transform duration-700 ease-in-out group-hover:scale-105 group-hover:brightness-110 object-cover w-full h-full"
                />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-white/0 group-hover:bg-white/10 transition duration-500" />
            </div>
          </div>
          <div className="md:w-1/2 text-center md:text-left">
            <h2 className="text-3xl font-semibold mb-4">Το Ιατρείο</h2>
            <p className="text-[#4a4944] text-lg">
              Το ιατρείο βρίσκεται σε ένα ήσυχο και εύκολα προσβάσιμο σημείο της πόλης και έχει σχεδιαστεί με γνώμονα την άνεση και την ηρεμία του επισκέπτη. Με ζεστή ατμόσφαιρα, μοντέρνα διακόσμηση και υπερσύγχρονο εξοπλισμό, αποτελεί ιδανικό χώρο για την παροχή υψηλού επιπέδου ιατρικών υπηρεσιών, πάντα με σεβασμό και διακριτικότητα προς τον ασθενή.
            </p>
          </div>
        </div>
      </section>

      {/* Updated Contact CTA */}
      <section id="contact" className="relative py-24 px-6 bg-[#3b3a36] text-white text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image src="/cta.jpg" alt="cta image" fill className="object-cover" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Κλείστε το ραντεβού σας</h2>
          <p className="text-lg mb-8">
            Επικοινωνήστε μαζί μας για να προγραμματίσετε την πρώτη σας επίσκεψη και να κάνετε το πρώτο βήμα προς τη βελτίωση της υγείας σας.
          </p>
          <Link
            href="mailto:info@drkalogeropoulou.gr"
            className="inline-block bg-white text-[#3b3a36] font-semibold px-6 py-3 rounded-full shadow hover:bg-[#f7f4f0] transition"
          >
            Επικοινωνία
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#f2eee8] py-8 text-center text-sm text-[#5a5955]">
        &copy; {new Date().getFullYear()} Dr. Maria Kalogeropoulou. All rights reserved.
      </footer>
    </main>
  );
}

<style jsx global>{`
.clip-diagonal-shape {
  clip-path: polygon(10% 0, 100% 10%, 90% 100%, 0% 90%);
  border-radius: 1rem;
  overflow: hidden;
}
`}</style>