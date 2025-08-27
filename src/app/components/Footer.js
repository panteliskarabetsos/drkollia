import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="py-6 px-4 bg-slate-950 text-slate-400 text-center text-sm border-t border-slate-800"
      data-aos="fade-in"
    >
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Copyright & Contact Info */}
        <div className="space-y-1">
          <p className="text-slate-500 tracking-wide">
            © 2025{" "}
            <span className="font-medium text-white">Dr. Kollia Georgia</span> ·
            All rights reserved
          </p>
          <p className="text-slate-500">
            Τάμπα 8, Ηλιούπολη 163 42 ·{" "}
            <a href="tel:+302109934316" className="hover:text-white transition">
              +30 210 9934316
            </a>{" "}
            ·{" "}
            <a
              href="mailto:gokollia@gmail.com"
              className="hover:text-white transition"
            >
              gokollia@gmail.com
            </a>
          </p>
        </div>

        {/* Legal + Admin */}
        <div className="flex justify-center flex-wrap gap-4 text-slate-500 text-xs">
          <Link
            href="/legal"
            className="hover:text-white hover:underline transition"
          >
            Νομικά
          </Link>
          <span className="hidden sm:inline">|</span>
          <Link
            href="/login"
            className="hover:text-white hover:underline font-medium transition"
          >
            Είσοδος Διαχειριστή
          </Link>
        </div>
        {/* Developer Credit */}
        <div className="mt-4 text-[10px] text-slate-600">
          Developed by{" "}
          <a
            href="https://panteliskarabetsos.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white hover:underline transition"
          >
            Pantelis Karabetsos
          </a>
        </div>
      </div>
    </footer>
  );
}
