'use client'
import Image from "next/image";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";


const Carousel = dynamic(() => import("react-responsive-carousel").then(mod => mod.Carousel), { ssr: false });
import "react-responsive-carousel/lib/styles/carousel.min.css";
import Header from "../components/Header";

export default function ClinicPage() {
  return (
    <main className="min-h-screen bg-[#fdfaf6] text-[#3b3a36]">
        <Header />
      {/* Hero Banner */}
      <section className="relative flex items-center justify-center h-[60vh] bg-[url('/iatreio.png')] bg-cover bg-center text-white">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative z-10 text-center px-6">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Το Ιατρείο</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-[#f4f0e8]">
            Ένας σύγχρονος και φιλόξενος χώρος για την φροντίδα της υγείας σας.
          </p>
        </div>
      </section>

      {/* Location Info */}
      <section className="py-20 px-6 bg-[#fdfaf6]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-6">Πού θα μας βρείτε</h2>
          <p className="text-lg text-[#4a4944] max-w-2xl mx-auto">
            Το ιατρείο βρίσκεται στο κέντρο της πόλης, σε σημείο εύκολα προσβάσιμο με όλα τα μέσα. Ο χώρος έχει σχεδιαστεί για να προσφέρει ηρεμία και άνεση, με ιδιαίτερη προσοχή στη λεπτομέρεια και στη διακριτικότητα.
          </p>
          <p className="mt-4 text-md text-[#5a5955]">Τάμπα 8, Ηλιούπολη, 163 42 | Τηλ: 210 9934316</p>
         <Link
            href="/contact#map"
            className="inline-block mt-10 text-[#3b3a36] border border-[#3b3a36] px-5 py-2 rounded-full hover:bg-[#3b3a36] hover:text-white transition"
            >
            Βρείτε μας στον χάρτη
            </Link>
        </div>
      </section>
 
        {/* Clinic Images Carousel */}
       <section className="relative bg-[#fdfaf6] py-24 px-4">
        <div className="max-w-6xl mx-auto rounded-[2rem] overflow-hidden shadow-2xl border border-[#e8e2d6] relative">
            <Carousel
            autoPlay
            infiniteLoop
            showThumbs={false}
            showStatus={false}
            interval={6000}
            transitionTime={900}
            emulateTouch
            swipeable
            renderArrowPrev={(onClickHandler, hasPrev, label) =>
        hasPrev && (
            <button
            onClick={onClickHandler}
            title={label}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/30 hover:bg-white/50 text-[#3b3a36] p-2 rounded-full backdrop-blur-md transition-all"
            >
            <ChevronLeft className="w-5 h-5" />
            </button>
        )
        }
        renderArrowNext={(onClickHandler, hasNext, label) =>
        hasNext && (
            <button
            onClick={onClickHandler}
            title={label}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/30 hover:bg-white/50 text-[#3b3a36] p-2 rounded-full backdrop-blur-md transition-all"
            >
            <ChevronRight className="w-5 h-5" />
            </button>
        )
        }
    >
      {["/iatreio1.jpg", "/iatreio2.jpg", "/iatreio3.jpg"].map((src, index) => (
        <div key={index} className="relative h-[55vh] sm:h-[60vh] w-full overflow-hidden group">
          {/* Ambient gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#fdfaf6]/70 via-white/20 to-transparent z-10" />

          <Image
            src={src}
            alt={`Clinic ${index + 1}`}
            fill
            className="object-cover w-full h-full transition-transform duration-1000 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-[1.02]"
            priority={index === 0}
          />
        </div>
      ))}
    </Carousel>
  </div>
</section>

    </main>
  );
}
