import { Inter } from "next/font/google"; // ή Roboto, Open_Sans
import clsx from "clsx";

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
      {children}
    </div>
  );
}
