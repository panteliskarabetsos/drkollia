// app/layout.js  (NO "use client")
import { Noto_Serif } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import ClientShell from "./ClientShell"; // client wrapper

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-noto-serif",
});

export const metadata = {
  title: "Γεωργία Κόλλια - Ενδοκρινολόγος - Διαβητολόγος",
  description:
    "Ενδοκρινολογία - Διαβήτης - Μεταβολισμός | Ορμονική Υγεία & Φροντίδα Διαβήτη",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="el" className="h-full">
      <body
        className={`
          ${notoSerif.variable}
          font-serif h-full flex flex-col text-[#433f39] bg-[#f7f4ee]
          antialiased selection:bg-[#fcefc0] selection:text-[#4c3f2c]
        `}
      >
        {/* All client-only decisions go inside ClientShell */}
        <ClientShell>{children}</ClientShell>

        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
