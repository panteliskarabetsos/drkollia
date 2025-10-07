// app/admin/layout.js
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import clsx from "clsx";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/app/lib/supabaseClient";
import { offlineAuth } from "../../lib/offlineAuth";

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
  RefreshCcw,
  WifiOff,
  Wifi,
  Download,
  Settings,
} from "lucide-react";
import "../globals.css";
import { syncPatients } from "../../lib/offlinePatients";
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

/* Small button that appears only when the app can be installed (PWA) */
function InstallPWAButton() {
  const [promptEvt, setPromptEvt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setPromptEvt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const install = useCallback(async () => {
    if (!promptEvt) return;
    setVisible(false);
    const choice = await promptEvt.prompt();

    setPromptEvt(null);
  }, [promptEvt]);

  useEffect(() => {
    const onChange = () => {
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setVisible(false);
      }
    };
    window.addEventListener("appinstalled", onChange);
    onChange();
    return () => window.removeEventListener("appinstalled", onChange);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={install}
      className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-[#e5e1d8] bg-white/90 px-3 py-1.5 text-sm shadow-sm hover:bg-[#f6f4ef] hover:shadow-md transition"
      title="Εγκατάσταση εφαρμογής"
    >
      <Download className="w-4 h-4 text-[#8c7c68]" />
      Εγκατάσταση
    </button>
  );
}

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(true);

  // Auth bootstrap + profile load
  useEffect(() => {
    let authSub; // keep a ref to unsubscribe on cleanup

    const run = async () => {
      const isOnline =
        typeof navigator === "undefined" ? true : navigator.onLine;

      if (isOnline) {
        // ---- Online: normal Supabase auth flow ----
        const { data } = await supabase.auth.getUser();
        const user = data?.user || null;

        if (!user) {
          router.replace("/login");
          return;
        }

        setMe(user);

        if (user?.id) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("name, email, phone, role")
            .eq("id", user.id)
            .single();
          setProfile(prof || null);
        }

        // keep session in sync (if signed out from another tab)
        const sub = supabase.auth.onAuthStateChange((_event, session) => {
          if (!session) {
            try {
              sessionStorage.removeItem("offline_mode");
            } catch {}
            router.replace("/login");
          }
        });
        authSub = sub?.data?.subscription || sub?.subscription;
      } else {
        // ---- Offline: accept cached offline session ----
        const offlineFlag =
          typeof window !== "undefined"
            ? sessionStorage.getItem("offline_mode")
            : null;
        const cached = await offlineAuth.getUser();

        if (!offlineFlag || !cached) {
          router.replace("/login");
          return;
        }

        // Minimal shapes used by the UI
        setMe({ id: cached.id, email: cached.email });
        setProfile({
          name: cached.name || cached.email,
          email: cached.email,
          phone: cached.phone || null,
          role: cached.role || "admin",
        });
        // NOTE: no Supabase listener while offline
      }
    };

    run();

    return () => {
      authSub?.unsubscribe?.();
    };
  }, [router]);

  useEffect(() => {
    const onOnline = async () => {
      try {
        await syncPatients();
      } catch {}
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);
  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // Close dropdown on Escape
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Network status banner
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    router.prefetch("/admin");
    router.prefetch("/admin/appointments");
    router.prefetch("/admin/patients");
    router.prefetch("/admin/schedule");
  }, [router]);

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
    router.replace("/login");
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
        " font-sans bg-[#fdfaf6] text-[#3b3a36] antialiased selection:bg-[#fcefc0] min-h-screen"
      )}
    >
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] rounded-md bg-white px-3 py-2 text-sm shadow"
      >
        Μετάβαση στο περιεχόμενο
      </a>

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
            <Link
              href="/admin"
              className="group inline-flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-[#f6f4ef] hover:scale-[1.02]"
              title="Πίνακας Διαχείρισης"
              aria-label="Πίνακας Διαχείρισης"
              aria-current={isActive("/admin") ? "page" : undefined}
            >
              <LayoutDashboard className="w-6 h-6 text-[#8c7c68] transition-transform group-hover:-translate-y-0.5" />
              <span className="font-semibold text-lg tracking-tight text-[#2f2e2b]">
                Πίνακας Διαχείρισης
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-2">
              {nav.map(({ href, label, Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "relative inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition",
                      active
                        ? "bg-[#f6f4ef] border border-[#e5e1d8] text-[#2f2e2b]"
                        : "border border-transparent text-[#3a3a38] hover:text-[#2f2e2b] hover:bg-[#f6f4ef] hover:border-[#e5e1d8] hover:shadow-sm"
                    )}
                  >
                    <Icon
                      className={clsx(
                        "w-4 h-4",
                        active ? "text-[#8c7c68]" : "text-[#9a8f7d]"
                      )}
                    />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right: install, sync, user, mobile toggle */}
            <div className="flex items-center gap-2">
              {/* online/offline indicator */}
              <div
                className={clsx(
                  "hidden sm:flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs",
                  online
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                )}
                title={online ? "Συνδεδεμένο" : "Εκτός σύνδεσης"}
              >
                {online ? (
                  <Wifi className="w-3.5 h-3.5" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5" />
                )}
                {online ? "Online" : "Offline"}
              </div>

              {/* Install PWA */}
              <InstallPWAButton />

              {/* User chip */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                  aria-expanded={menuOpen}
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
                    <Link
                      href="/admin/settings"
                      disabled={!online}
                      className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[#f6f4ef] hover:pl-4 transition-all"
                      onClick={() => setMenuOpen(false)} // close menu on navigate
                    >
                      <Settings className="w-4 h-4 text-[#8c7c68]" />
                      <span className="text-[#3a3a38]">Ρυθμίσεις</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      disabled={!online}
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

          {/* Offline banner */}
          {!online && (
            <div className="bg-amber-50 border-t border-b border-amber-200">
              <div className="max-w-6xl mx-auto px-4 py-2 text-xs text-amber-900 flex items-center gap-2">
                <WifiOff className="w-4 h-4" />
                Είστε εκτός σύνδεσης. Ορισμένες λειτουργίες ενδέχεται να μην
                λειτουργούν. Τα τελευταία αποθηκευμένα δεδομένα είναι διαθέσιμα.
              </div>
            </div>
          )}

          {/* Mobile drawer */}
          <div
            className={clsx(
              "md:hidden border-t border-[#eeeae2] bg-white/95 backdrop-blur transition-[max-height,opacity] duration-300 overflow-hidden",
              mobileOpen ? "max-h-[60vh] opacity-100" : "max-h-0 opacity-0"
            )}
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
                onClick={handleLogout}
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
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={clsx(
                        "px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition border",
                        active
                          ? "bg-[#f6f4ef] border-[#e5e1d8] text-[#2f2e2b]"
                          : "bg-white border-[#e5e1d8] text-[#3a3a38] hover:bg-[#f6f4ef]"
                      )}
                      title={label}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="px-3 pb-3 space-y-2">
              {nav.map(({ href, label, Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href + "-stack"}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "w-full flex items-center justify-between rounded-xl px-3 py-3 text-sm transition border",
                      active
                        ? "bg-[#f6f4ef] border-[#e5e1d8] text-[#2f2e2b]"
                        : "bg-white border-[#e5e1d8] text-[#3a3a38] hover:bg-[#f6f4ef]"
                    )}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#8c7c68]" />
                      {label}
                    </span>
                    <span className="text-[#8c7c68]">›</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <main id="admin-content" className="max-w-6xl mx-auto px-4 pt-9 pb-6">
        {children}
      </main>
    </div>
  );
}
