"use client";

import { usePathname } from "next/navigation";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Toaster } from "sonner";

export default function ClientShell({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <>
      {!isAdmin && <Header />}

      <Toaster position="top-right" richColors expand offset={80} />

      {/* Admin pages render their own header via /admin/layout.js */}
      <main className={`flex-grow w-full ${isAdmin ? "" : "pt-8"}`}>
        {children}
      </main>

      {!isAdmin && <Footer />}
    </>
  );
}
