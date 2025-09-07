"use client";

import { Inter } from "next/font/google";
import clsx from "clsx";
import "../globals.css";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/app/lib/supabaseClient";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
  LogOut,
  LayoutDashboard,
  CalendarDays,
  Users,
  Clock,
  BarChart3,
  RefreshCcw,
  LifeBuoy,
  History,
  ChevronDown,
  CircleUserRound,
} from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user || null;
      setMe(user);

      if (user?.id) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("name, email, phone, role") // avatar_url not in schema; remove
          .eq("id", user.id)
          .single();
        setProfile(prof || null);
      }
    };
    run();
  }, []);

  const initials = useMemo(() => {
    return (profile?.name || profile?.email || me?.email || "U")
      .split(" ")
      .map((s) => s?.[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [profile?.name, profile?.email, me?.email]);

  const nav = useMemo(
    () => [
      { href: "/admin/appointments", label: "Ραντεβού", Icon: CalendarDays },
      { href: "/admin/patients", label: "Ασθενείς", Icon: Users },
      { href: "/admin/schedule", label: "Πρόγραμμα", Icon: Clock },
    ],
    []
  );

  const isActive = (href) => pathname?.startsWith(href);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      window.dispatchEvent(new CustomEvent("admin:refresh"));
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#e5e1d8]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Brand / Home */}
          <button
            onClick={() => router.push("/admin")}
            className="inline-flex items-center gap-2 hover:opacity-90 transition"
            title="Πίνακας Διαχείρισης"
            aria-label="Πίνακας Διαχείρισης"
          >
            <LayoutDashboard className="w-6 h-6 text-[#8c7c68]" />
            <span className="font-semibold text-lg tracking-tight text-[#2f2e2b]">
              Πίνακας Διαχείρισης
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {nav.map(({ href, label, Icon }) => (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition
                  ${
                    isActive(href)
                      ? "bg-[#f6f4ef] border border-[#e5e1d8] text-[#2f2e2b]"
                      : "border border-transparent text-[#3a3a38] hover:bg-[#f6f4ef] hover:border-[#e5e1d8]"
                  }`}
                title={label}
              >
                <Icon className="w-4 h-4 text-[#8c7c68]" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Right: User menu */}
          <div className="flex items-center gap-2">
            {/* Optional Sync button */}
            {/* <button
              onClick={handleSync}
              disabled={syncing}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#e5e1d8] bg-white text-sm transition disabled:opacity-50 ${
                syncing ? "animate-pulse scale-95" : "hover:bg-[#f6f4ef]"
              }`}
              title="Συγχρονισμός ραντεβού & ασθενών"
            >
              <RefreshCcw className={`w-4 h-4 text-[#8c7c68] ${syncing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">
                {syncing ? "Συγχρονισμός…" : "Συγχρονισμός"}
              </span>
            </button> */}

            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                className="inline-flex items-center gap-2 rounded-full border border-[#e5e1d8] bg-white px-2.5 py-1.5 shadow-sm hover:bg-[#f6f4ef] transition"
                title={profile?.name || me?.email || "Λογαριασμός"}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="avatar"
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full grid place-items-center bg-[#efece5] text-[#2f2e2b] text-xs font-semibold border border-[#e5e1d8]">
                    {initials}
                  </div>
                )}
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-[13px] font-medium text-[#2f2e2b] truncate max-w-[160px]">
                    {profile?.name || me?.email || "Χρήστης"}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-[#8c7c68]" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#e5e1d8] bg-white shadow-lg overflow-hidden">
                  <div className="px-3 py-2 border-b border-[#eeeae2]">
                    <div className="flex items-center gap-2">
                      <CircleUserRound className="w-4 h-4 text-[#8c7c68]" />
                      <span className="text-sm font-medium text-[#2f2e2b]">
                        {profile?.name || "Λογαριασμός"}
                      </span>
                    </div>
                    {me?.email && (
                      <p className="mt-1 text-xs text-[#6b675f] truncate">
                        {me.email}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      router.push("/login");
                    }}
                    className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[#f6f4ef] transition"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span className="text-[#3a3a38]">Αποσύνδεση</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile scrollable pills */}
        <div className="md:hidden border-t border-[#eeeae2]">
          <div className="px-3 py-2 -mx-1 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2">
              {nav.map(({ href, label }) => (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition
                    ${
                      isActive(href)
                        ? "bg-[#f6f4ef] border border-[#e5e1d8] text-[#2f2e2b]"
                        : "bg-white border border-[#e5e1d8] text-[#3a3a38] hover:bg-[#f6f4ef]"
                    }`}
                  title={label}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
