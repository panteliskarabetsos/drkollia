import { Inter } from "next/font/google"; // ή Roboto, Open_Sans
import clsx from "clsx";
import "../globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter", // άλλαξε ανάλογα
});

export default function AdminLayout({ children }) {
  return (
    <div
      className={clsx(
        inter.variable,
        "font-sans bg-[#fdfaf6] text-[#3b3a36] antialiased selection:bg-[#fcefc0] min-h-screen"
      )}
    >
      <Toaster
        position="top-right"
        richColors
        expand
        offset={80} // moves it 60px down from the top
      />
      {children}
    </div>
  );
}
