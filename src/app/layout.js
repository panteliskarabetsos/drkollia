import { Noto_Serif } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Analytics } from "@vercel/analytics/next";
const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-noto-serif",
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
          ${notoSerif.variable}
          font-serif
          h-full flex flex-col text-[#433f39] bg-[#f7f4ee]
          antialiased selection:bg-[#fcefc0] selection:text-[#4c3f2c]
        `}
      >
        <Header />
        <main className="flex-grow pt-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
