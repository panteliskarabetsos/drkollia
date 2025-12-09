// src/app/layout.js
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

// Base URL for SEO / OpenGraph / sitemap
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.drkollia.com";

// Global structured data for the clinic
const clinicJsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalClinic",
  name: "Ιατρείο Ενδοκρινολογίας - Δρ. Γεωργία Κόλλια",
  description:
    "Ενδοκρινολογικό ιατρείο στην Ηλιούπολη με έμφαση στον θυρεοειδή, τον διαβήτη, τον μεταβολισμό και τις ορμονικές διαταραχές.",
  url: siteUrl,
  telephone: "+30 210 9934316",
  email: "gokollia@gmail.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Τάμπα 8",
    addressLocality: "Ηλιούπολη",
    postalCode: "16342",
    addressCountry: "GR",
  },
};

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Γεωργία Κόλλια - Ενδοκρινολόγος - Διαβητολόγος",
    template: "%s | Γεωργία Κόλλια - Ενδοκρινολόγος - Διαβητολόγος",
  },
  description:
    "Ενδοκρινολογία, Διαβήτης και Μεταβολισμός στην Ηλιούπολη. Ολοκληρωμένη φροντίδα θυρεοειδούς, βάρους και ορμονικής υγείας από τη Δρ. Γεωργία Κόλλια.",
  alternates: {
    canonical: "/",
  },

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

  // OpenGraph (for social share)
  openGraph: {
    type: "website",
    locale: "el_GR",
    url: siteUrl,
    siteName: "Ιατρείο Ενδοκρινολογίας - Δρ. Γεωργία Κόλλια",
    title: "Γεωργία Κόλλια - Ενδοκρινολόγος - Διαβητολόγος",
    description:
      "Σύγχρονο ενδοκρινολογικό ιατρείο στην Ηλιούπολη με έμφαση στον θυρεοειδή, τον διαβήτη, τον μεταβολισμό και τις ορμονικές διαταραχές.",
    images: [
      {
        url: "/og-image.jpg", // φτιάξε μια 1200x630 εικόνα με λογότυπο / όνομα
        width: 1200,
        height: 630,
        alt: "Ιατρείο Ενδοκρινολογίας - Δρ. Γεωργία Κόλλια",
      },
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
    <html lang="el" className="h-full w-full" suppressHydrationWarning>
      <head>
        {/* Global JSON-LD for the clinic (SEO) */}
        <Script
          id="clinic-json-ld"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(clinicJsonLd) }}
        />
      </head>
      <body
        className={`
          ${notoSerif.variable}
          font-serif h-full w-full flex flex-col text-[#433f39] bg-[#f7f4ee]
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
