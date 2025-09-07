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
  X,
  Menu,
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
  const [mobileOpen, setMobileOpen] = useState(false);
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
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Accent line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-[#d9d3c7] via-[#bfb7a9] to-[#d9d3c7]" />

        {/* Bar */}
        <div className="bg-white/90 backdrop-blur-xl border-b border-[#e5e1d8] shadow-[0_1px_0_0_#eee]">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            {/* Brand */}
            <button
              onClick={() => router.push("/admin")}
              className="group inline-flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-[#f6f4ef] hover:scale-[1.02]"
              title="Πίνακας Διαχείρισης"
              aria-label="Πίνακας Διαχείρισης"
            >
              <LayoutDashboard className="w-6 h-6 text-[#8c7c68] transition-transform group-hover:-translate-y-0.5" />
              <span className="font-semibold text-lg tracking-tight text-[#2f2e2b]">
                Πίνακας Διαχείρισης
              </span>
            </button>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-2">
              {nav.map(({ href, label, Icon }) => {
                const active = isActive(href);
                return (
                  <button
                    key={href}
                    onClick={() => router.push(href)}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "relative inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition",
                      active
                        ? "bg-[#f6f4ef] border border-[#e5e1d8] text-[#2f2e2b]"
                        : "border border-transparent text-[#3a3a38] hover:text-[#2f2e2b] hover:bg-[#f6f4ef] hover:border-[#e5e1d8] hover:shadow-sm",
                    ].join(" ")}
                    title={label}
                  >
                    <Icon
                      className={[
                        "w-4 h-4",
                        active ? "text-[#8c7c68]" : "text-[#9a8f7d]",
                      ].join(" ")}
                    />
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right: user + mobile toggle */}
            <div className="flex items-center gap-2">
              {/* User chip */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#e5e1d8] bg-white/90 px-3 py-1.5 shadow-sm hover:bg-[#f6f4ef] hover:shadow-md hover:scale-[1.02] transition"
                  title={profile?.name || me?.email || "Λογαριασμός"}
                >
                  <div className="w-7 h-7 rounded-full grid place-items-center bg-[#efece5] text-[#2f2e2b] text-xs font-semibold border border-[#e5e1d8]">
                    {initials}
                  </div>
                  <span className="text-sm font-medium text-[#2f2e2b] truncate max-w-[160px]">
                    {profile?.name || me?.email || "Χρήστης"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#8c7c68]" />
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#e5e1d8] bg-white/95 backdrop-blur shadow-lg overflow-hidden animate-fadeIn">
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
                      className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[#f6f4ef] hover:pl-4 transition-all"
                    >
                      <LogOut className="w-4 h-4 text-red-600" />
                      <span className="text-[#3a3a38]">Αποσύνδεση</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[#e5e1d8] bg-white/90 shadow-sm hover:bg-[#f6f4ef] transition"
                aria-label="Άνοιγμα μενού"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((o) => !o)}
              >
                {mobileOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile drawer */}
          <div
            className={[
              "md:hidden border-t border-[#eeeae2] bg-white/95 backdrop-blur transition-[max-height,opacity] duration-300 overflow-hidden",
              mobileOpen ? "max-h-[60vh] opacity-100" : "max-h-0 opacity-0",
            ].join(" ")}
          >
            {/* user row on mobile */}
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full grid place-items-center bg-[#efece5] text-[#2f2e2b] text-xs font-semibold border border-[#e5e1d8]">
                  {initials}
                </div>
                <span className="text-sm font-medium text-[#2f2e2b] truncate">
                  {profile?.name || me?.email || "Χρήστης"}
                </span>
              </div>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push("/login");
                }}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-transparent hover:border-red-200 hover:bg-red-50 text-gray-700 hover:text-red-600 transition"
              >
                <LogOut className="w-4 h-4" />
                Έξοδος
              </button>
            </div>

            {/* nav pills */}
            <div className="px-3 py-2 -mx-1 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 px-1">
                {nav.map(({ href, label }) => {
                  const active = isActive(href);
                  return (
                    <button
                      key={href}
                      onClick={() => {
                        setMobileOpen(false);
                        router.push(href);
                      }}
                      className={[
                        "px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition border",
                        active
                          ? "bg-[#f6f4ef] border-[#e5e1d8] text-[#2f2e2b]"
                          : "bg-white border-[#e5e1d8] text-[#3a3a38] hover:bg-[#f6f4ef]",
                      ].join(" ")}
                      title={label}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* stacked nav for accessibility (large tap targets) */}
            <div className="px-3 pb-3 space-y-2">
              {nav.map(({ href, label, Icon }) => {
                const active = isActive(href);
                return (
                  <button
                    key={href + "-stack"}
                    onClick={() => {
                      setMobileOpen(false);
                      router.push(href);
                    }}
                    className={[
                      "w-full flex items-center justify-between rounded-xl px-3 py-3 text-sm transition border",
                      active
                        ? "bg-[#f6f4ef] border-[#e5e1d8] text-[#2f2e2b]"
                        : "bg-white border-[#e5e1d8] text-[#3a3a38] hover:bg-[#f6f4ef]",
                    ].join(" ")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#8c7c68]" />
                      {label}
                    </span>
                    <span className="text-[#8c7c68]">›</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
