// app/layout.js (NO "use client")
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

  // PWA
  manifest: "/manifest.json",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0b" },
  ],
  applicationName: "Γεωργία Κόλλια",
  appleWebApp: {
    capable: true,
    title: "Γεωργία Κόλλια",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },

  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      "/favicon.ico",
    ],
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#8c7c68" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="el" className="h-full" suppressHydrationWarning>
      <body
        className={`
          ${notoSerif.variable}
          font-serif h-full flex flex-col text-[#433f39] bg-[#f7f4ee]
          antialiased selection:bg-[#fcefc0] selection:text-[#4c3f2c]
        `}
      >
        <ClientShell>{children}</ClientShell>

        <SpeedInsights />
        <Analytics />

        <noscript>
          <div style={{ padding: "8px", textAlign: "center", fontSize: 12 }}>
            Για καλύτερη εμπειρία, ενεργοποιήστε το JavaScript.
          </div>
        </noscript>
      </body>
    </html>
  );
}
