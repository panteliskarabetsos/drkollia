import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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
    <html lang="el" className="h-full">
      <body
        className={`
          ${geistSans.variable} ${geistMono.variable}
          h-full flex flex-col text-[#433f39] bg-[#f7f4ee]
          font-sans antialiased selection:bg-[#fcefc0] selection:text-[#4c3f2c]
        `}
      >
        <Header />
        <main className="flex-grow pt-20">{children}</main> 
        <Footer />
      </body>
    </html>
  );
}
