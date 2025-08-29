"use client";

import { Inter } from "next/font/google";
import clsx from "clsx";
import "../globals.css";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/app/lib/supabaseClient";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, LayoutDashboard } from "lucide-react";
import {
  CalendarDays,
  Users,
  Clock,
  BarChart3,
  RefreshCcw,
  LifeBuoy,
  History,
} from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export default function AdminLayout({ children }) {
  const router = useRouter();

  const pathname = usePathname();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setSyncing(true);

      // tell all admin pages to refresh their client-side data
      window.dispatchEvent(new CustomEvent("admin:refresh"));

      // also useful if you have any server components inside pages
      router.refresh();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      className={clsx(
        inter.variable,
        "font-sans bg-[#fdfaf6] text-[#3b3a36] antialiased selection:bg-[#fcefc0] min-h-screen"
      )}
    >
      {/* Toaster */}
      <Toaster position="top-right" richColors expand offset={80} />

      {/* Admin Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-[#e5e1d8] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          {/* Left: Logo / Title */}
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition"
            onClick={() => router.push("/admin")}
            title="Μετάβαση στον πίνακα"
            aria-label="Πίνακας Διαχείρισης"
          >
            <LayoutDashboard className="w-6 h-6 text-[#8c7c68]" />
            <span className="font-semibold text-lg text-[#2f2e2b] tracking-tight">
              Πίνακας Διαχείρισης
            </span>
          </div>

          {/* Center: Quick Nav (scrollable on mobile) */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              {
                href: "/admin/appointments",
                label: "Ραντεβού",
                icon: CalendarDays,
              },
              { href: "/admin/patients", label: "Ασθενείς", icon: Users },
              { href: "/admin/schedule", label: "Πρόγραμμα", icon: Clock },
              { href: "/admin/reports", label: "Αναφορές", icon: BarChart3 },
              {
                href: "/admin/past-appointments",
                label: "Ιστορικό Ραντεβού",
                icon: History,
              },
            ].map(({ href, label, icon: Icon }) => (
              <button
                key={href}
                onClick={() => router.push(href)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-transparent hover:border-[#e5e1d8] hover:bg-[#f6f4ef] text-sm text-[#3a3a38] transition"
                title={label}
              >
                <Icon className="w-4 h-4 text-[#8c7c68]" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Mobile: condensed scrollable pills */}
          <nav className="md:hidden -mx-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 px-2">
              {[
                { href: "/admin/appointments", label: "Ραντεβού" },
                { href: "/admin/patients", label: "Ασθενείς" },
                { href: "/admin/schedule", label: "Πρόγραμμα" },
                { href: "/admin/reports", label: "Αναφορές" },
                { href: "/admin/past-appointments", label: "Παλαιά" },
              ].map(({ href, label }) => (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className="px-3 py-1.5 rounded-full border border-[#e5e1d8] bg-white text-xs text-[#3a3a38] whitespace-nowrap hover:bg-[#f6f4ef] transition"
                  title={label}
                >
                  {label}
                </button>
              ))}
            </div>
          </nav>

          {/* Right: Quick actions */}
          <div className="flex items-center gap-2">
            {/* Sync past → completed (optional: requires /api/mark-completed as we built) */}
            {/* <button
              onClick={handleSync}
              disabled={syncing}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#e5e1d8] bg-white text-sm transition disabled:opacity-50
    ${syncing ? "animate-pulse scale-95" : "hover:bg-[#f6f4ef]"}`}
              title="Συγχρονισμός ραντεβού & ασθενών"
            >
              <RefreshCcw
                className={`w-4 h-4 text-[#8c7c68] ${
                  syncing ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">
                {syncing ? "Συγχρονισμός…" : "Συγχρονισμός"}
              </span>
              <span className="sr-only">Συγχρονισμός ραντεβού & ασθενών</span>
            </button> */}

            {/* Help */}
            {/* <button
              onClick={() => router.push("/help")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-transparent hover:border-[#e5e1d8] hover:bg-[#f6f4ef] text-sm transition"
              title="Βοήθεια"
            >
              <LifeBuoy className="w-4 h-4 text-[#8c7c68]" />
              <span className="hidden sm:inline">Βοήθεια</span>
            </button> */}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-transparent hover:border-red-200 hover:bg-red-50 text-sm text-gray-700 hover:text-red-600 transition"
              title="Αποσύνδεση"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Αποσύνδεση</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
