import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Head from "next/head";
import Header from "./components/Header";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Γεωργία Κόλλια - Ενδοκρινολόγος - Διαβητολόγος",
  description:
    "Ενδοκρινολόγος - Διαβητολόγος | Ορμονική Υγεία & Φροντίδα Διαβήτη",
};

export default function RootLayout({ children }) {
  return (
    <html lang="el" className="scroll-smooth">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="theme-color" content="#f5efe4" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <body
        className={`
          ${geistSans.variable} ${geistMono.variable}
          font-sans antialiased text-[#433f39] bg-[#f7f4ee]
          selection:bg-[#fcefc0] selection:text-[#4c3f2c]
        `}
      >
        <Header />
        <main className="relative z-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
