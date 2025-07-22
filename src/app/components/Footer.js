import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="py-10 bg-slate-950 text-slate-400 text-center text-sm"
      data-aos="fade-in"
    >
      <p className="mb-2">© 2025 Dr. Kollia Georgia | All rights reserved</p>
      <p>Τάμπα 8, Ηλιούπολη 163 42 · +30 210 9934316 · gokollia@gmail.com</p>

      <div className="mt-4">
        <Link
          href="/login"
          className="inline-block text-slate-300 hover:text-white underline transition"
        >
          Είσοδος Διαχειριστή
        </Link>
      </div>
    </footer>
  );
}
