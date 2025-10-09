import { Noto_Serif } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import ClientShell from "./ClientShell"; // client wrapper
import Script from "next/script";

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
  themeColor: "#f7f4ee",
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
        {/* Offline rescue: if a JS chunk fails to load (e.g. stale cached HTML points
           to a new bundle URL), redirect to a static offline page that needs no JS. */}
        <Script
          id="offline-rescue"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  function goOffline(){
    // Use your static fallback (served from /public)
    location.replace('/admin-offline.html');
  }
  addEventListener('error', function(e){
    var msg = String(e && e.message || '');
    // Next/Workbox chunk load failures
    if (msg.includes('ChunkLoadError') || msg.includes('Loading chunk')) goOffline();
  }, true);
  addEventListener('unhandledrejection', function(e){
    var m = String((e && e.reason && e.reason.message) || e);
    if (m.includes('ChunkLoadError') || m.includes('Loading chunk')) goOffline();
  });
})();`,
          }}
        />

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
