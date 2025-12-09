"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  PhoneCall,
  Clock3,
} from "lucide-react";

const Carousel = dynamic(
  () => import("react-responsive-carousel").then((mod) => mod.Carousel),
  { ssr: false }
);
import "react-responsive-carousel/lib/styles/carousel.min.css";

export default function ClinicPage() {
  return (
    <main className="min-h-screen bg-[#f6f2eb] text-[#262522]">
      {/* Hero */}
      <section className="relative flex items-center justify-center h-[52vh] md:h-[62vh] bg-[url('/iatreio-banner.png')] bg-cover bg-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.55)_0,_rgba(0,0,0,0.35)_32%,rgba(0,0,0,0.55)_100%)] backdrop-blur-[2px]" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-4 py-1 text-[10px] md:text-xs uppercase tracking-[0.32em] text-[#f7f1e4]/80 mb-5">
            Ιατρείο Ενδοκρινολογίας
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-semibold tracking-tight text-[#fdf7ec] mb-3">
            Το Ιατρείο
          </h1>

          <p className="text-sm md:text-base text-[#f3e7d5] leading-relaxed max-w-2xl mx-auto">
            Ένας ήρεμος, φιλόξενος χώρος αφιερωμένος στη φροντίδα της υγείας
            σας, με έμφαση στη λεπτομέρεια και τον σεβασμό προς τον ασθενή.
          </p>

          {/* Quick info chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs md:text-[13px]">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 backdrop-blur border border-white/25 text-[#f7f1e4]">
              <MapPin className="w-4 h-4" />
              Τάμπα 8, Ηλιούπολη
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 backdrop-blur border border-white/25 text-[#f7f1e4]">
              <PhoneCall className="w-4 h-4" />
              210 9934316
            </span>
          </div>
        </div>
      </section>

      {/* Location & Info */}
      <section className="-mt-10 md:-mt-16 pb-16 md:pb-20 px-4 sm:px-6 md:px-10 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl border border-[#e5ddd0] bg-white/80 shadow-[0_18px_50px_rgba(15,14,10,0.10)] backdrop-blur-sm px-6 sm:px-8 md:px-10 py-9 md:py-10">
            <div className="flex flex-col gap-10 md:flex-row md:items-start">
              {/* Left: Text */}
              <div className="md:flex-1">
                <h2 className="text-xl md:text-2xl font-serif font-semibold tracking-tight text-[#262522] mb-3">
                  Πού θα μας βρείτε
                </h2>
                <p className="text-sm md:text-[15px] text-[#4c4943] leading-relaxed">
                  Το ιατρείο βρίσκεται στην Ηλιούπολη, σε σημείο εύκολα
                  προσβάσιμο με όλα τα μέσα. Ο χώρος έχει σχεδιαστεί ώστε να
                  προσφέρει ηρεμία, ιδιωτικότητα και άνεση σε κάθε στάδιο της
                  επίσκεψής σας.
                </p>
                <p className="mt-3 text-xs md:text-[13px] text-[#7a746a] leading-relaxed">
                  Υπάρχει εύκολη πρόσβαση από κεντρικούς δρόμους και δυνατότητα
                  στάθμευσης στην ευρύτερη περιοχή.
                </p>

                <Link
                  href="/contact#map"
                  className="inline-flex items-center gap-2 mt-7 rounded-full border border-[#292723]/15 bg-white px-4.5 py-2.5 text-xs md:text-sm font-medium text-[#292723] shadow-sm backdrop-blur-sm transition hover:border-[#292723]/40 hover:bg-[#292723] hover:text-white hover:-translate-y-0.5"
                >
                  <MapPin className="w-4 h-4" />
                  Βρείτε μας στον χάρτη
                </Link>
              </div>

              {/* Right: Compact Info Card */}
              <div className="md:w-[320px]">
                <div className="rounded-2xl border border-[#ebe3d6] bg-[#fbf8f3] shadow-sm px-5 py-6 space-y-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[#9a8f7e] mb-1.5">
                      Διεύθυνση
                    </p>
                    <div className="flex items-start gap-3 text-sm text-[#33302a]">
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#8c7b66]" />
                      <p className="leading-relaxed">
                        Τάμπα 8
                        <br />
                        Ηλιούπολη, 163 42
                      </p>
                    </div>
                  </div>

                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#e4ddcf] to-transparent" />

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[#9a8f7e] mb-1.5">
                      Τηλέφωνο
                    </p>
                    <div className="flex items-center gap-3 text-sm text-[#33302a]">
                      <PhoneCall className="h-4 w-4 flex-shrink-0 text-[#8c7b66]" />
                      <a
                        href="tel:2109934316"
                        className="font-medium hover:underline"
                      >
                        210 9934316
                      </a>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[#9a8f7e] mb-1.5">
                      Ραντεβού
                    </p>
                    <div className="flex items-start gap-3 text-xs text-[#37342f]">
                      <Clock3 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#8c7b66]" />
                      <p className="leading-relaxed">
                        Τα ραντεβού πραγματοποιούνται κατόπιν συνεννόησης, μέσω
                        τηλεφωνικής επικοινωνίας ή της ηλεκτρονικής πλατφόρμας.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinic Images Carousel */}
      <section className="pb-20 px-4 sm:px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between gap-3 px-1">
            <div>
              <h3 className="text-lg md:text-xl font-serif font-semibold text-[#262522] mb-1">
                Μια ματιά στον χώρο
              </h3>
              <p className="text-xs md:text-sm text-[#6b665d]">
                Επιλεγμένες εικόνες από τον χώρο αναμονής και το ιατρείο.
              </p>
            </div>
          </div>

          <div className="relative rounded-[1.75rem] border border-[#e8e0d1] bg-[#fdf9f3] shadow-[0_22px_60px_rgba(15,14,10,0.10)] overflow-hidden">
            <Carousel
              autoPlay
              infiniteLoop
              showThumbs={false}
              showStatus={false}
              emulateTouch
              swipeable
              interval={5500}
              transitionTime={800}
              showIndicators
              renderArrowPrev={(onClickHandler, hasPrev, label) =>
                hasPrev && (
                  <button
                    onClick={onClickHandler}
                    title={label}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white/75 text-[#2d2b27] shadow-md backdrop-blur-sm transition hover:bg-white hover:border-black/10"
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white/75 text-[#2d2b27] shadow-md backdrop-blur-sm transition hover:bg-white hover:border-black/10"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )
              }
              renderIndicator={(onClickHandler, isSelected, index, label) => (
                <button
                  key={index}
                  onClick={onClickHandler}
                  title={label}
                  className={`mx-1 h-1.5 rounded-full transition-all ${
                    isSelected
                      ? "w-6 bg-[#60564a]"
                      : "w-2.5 bg-[#c8bfb1]/70 hover:bg-[#a79c8a]"
                  }`}
                />
              )}
            >
              {[
                "/iatreio3.jpg",
                "/iatreio1.jpg",
                "/iatreio2.jpg",
                "/iatreio4.jpg",
              ].map((src, index) => (
                <div
                  key={index}
                  className="relative h-[48vh] sm:h-[54vh] w-full overflow-hidden group"
                >
                  <Image
                    src={src}
                    alt={`Clinic ${index + 1}`}
                    fill
                    className="object-cover w-full h-full transition-transform duration-[1400ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-[1.03]"
                    priority={index === 0}
                  />

                  {/* Subtle bottom gradient */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#f6f2eb] via-[#f6f2eb]/70 to-transparent" />

                  {/* Minimal caption */}
                  <div className="absolute left-4 right-4 bottom-4 flex items-center justify-between gap-3 text-[11px] md:text-xs text-[#35322d]">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 shadow-sm backdrop-blur-md">
                      Χώρος Ιατρείου
                    </span>
                    <span className="hidden md:inline-flex text-[10px] uppercase tracking-[0.2em] text-[#8f8374]">
                      {index + 1} / 4
                    </span>
                  </div>
                </div>
              ))}
            </Carousel>
          </div>
        </div>
      </section>
    </main>
  );
}
