// app/admin/layout.js
"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import clsx from "clsx";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/app/lib/supabaseClient";
import { offlineAuth } from "../../lib/offlineAuth";

import AuthGate from "./_components/AuthGate";
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
  Dot,
  Search,
  Plus,
  Bell,
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
  const [showBottomBar, setShowBottomBar] = useState(true);

  const pathname = usePathname();
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(true);
  const panelRef = useRef(null);
  const startX = useRef(0);
  const deltaX = useRef(0);

  useEffect(() => {
    let authSub; // keep a ref to unsubscribe on cleanup
    let alive = true;
    const run = async () => {
      const isOnline =
        typeof navigator === "undefined" ? true : navigator.onLine;

      if (isOnline) {
        // ---- Online: normal Supabase auth flow ----
        const { data } = await supabase.auth.getUser();
        const user = data?.user || null;

        if (!alive) return;
        setMe(user);

        if (user?.id) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("name, email, phone, role")
            .eq("id", user.id)
            .single();
          if (alive) setProfile(prof || null);
        }

        // keep session in sync (if signed out from another tab)
        const sub = supabase.auth.onAuthStateChange((_event, session) => {
          if (!alive) return;
          setMe(session?.user || null);
        });
        authSub = sub?.data?.subscription || sub?.subscription;
      } else {
        // ---- Offline: accept cached offline session ----
        const offlineFlag =
          typeof window !== "undefined"
            ? sessionStorage.getItem("offline_mode")
            : null;
        const cached = await offlineAuth.getUser();

        if (!alive) return;
        if (offlineFlag && cached) {
          setMe({ id: cached.id, email: cached.email });
          setProfile({
            name: cached.name || cached.email,
            email: cached.email,
            phone: cached.phone || null,
            role: cached.role || "admin",
          });
        } else {
          setMe(null);
          setProfile(null);
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
      alive = false;
      authSub?.unsubscribe?.();
    };
  }, [online]);

  useEffect(() => {
    // Show banner whenever we go offline, hide when back online
    setShowOfflineBanner(!online);
  }, [online]);

  useEffect(() => {
    const root = document.documentElement;
    const content = document.getElementById("site-content"); // add this id to your <main>
    if (mobileOpen) {
      root.classList.add("overflow-hidden", "touch-none");
      if (content) content.setAttribute("inert", "");
    } else {
      root.classList.remove("overflow-hidden", "touch-none");
      if (content) content.removeAttribute("inert");
    }
    return () => {
      root.classList.remove("overflow-hidden", "touch-none");
      if (content) content.removeAttribute("inert");
    };
  }, [mobileOpen]);

  // Close menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Hide bottom bar when keyboard is open (VisualViewport heuristic)
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const onResize = () => {
      const vv = window.visualViewport;
      const keyboardLikelyOpen = vv && vv.height < window.innerHeight - 120;
      setShowBottomBar(!keyboardLikelyOpen);
    };
    onResize();
    window.visualViewport.addEventListener("resize", onResize);
    return () =>
      window.visualViewport &&
      window.visualViewport.removeEventListener("resize", onResize);
  }, []);

  // Focus trap + Esc to close when panel opens
  useEffect(() => {
    if (!mobileOpen || !panelRef.current) return;

    const selectors =
      'a,button,input,textarea,select,[tabindex]:not([tabindex="-1"])';
    const nodes = panelRef.current.querySelectorAll(selectors);
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (first && typeof first.focus === "function") first.focus();

    const onKey = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
      if (e.key !== "Tab" || nodes.length === 0) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last && last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first && first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Swipe-to-close handlers
  const onTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    startX.current = e.touches[0].clientX;
    deltaX.current = 0;
  };
  const onTouchMove = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    deltaX.current = e.touches[0].clientX - startX.current;
  };
  const onTouchEnd = () => {
    if (deltaX.current > 60) setMobileOpen(false); // swipe right to close
    startX.current = 0;
    deltaX.current = 0;
  };

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
  const primaryNav = nav.slice(0, 4);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    try {
      offlineAuth.clear?.();
    } catch {}
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
    <AuthGate>
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

        <header className="fixed top-0 inset-x-0 z-50 [--h:56px] md:[--h:64px]">
          {/* Accent line */}
          <div className="hidden sm:block h-[2px] w-full bg-gradient-to-r from-[#d9d3c7] via-[#bfb7a9] to-[#d9d3c7]" />

          {/* Top bar */}
          <div className="bg-white/85 supports-[backdrop-filter]:backdrop-blur-md border-b border-[#e5e1d8] shadow-[0_1px_0_0_#eee]">
            {/* Offline banner (unchanged) */}
            {showOfflineBanner && (
              <div className="bg-amber-50/95 text-amber-900 border-y border-amber-200">
                <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-start sm:items-center gap-2">
                  <WifiOff className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
                  <p className="text-xs sm:text-sm leading-snug">
                    Είστε εκτός σύνδεσης. Ορισμένες λειτουργίες ενδέχεται να μην
                    λειτουργούν. Τα τελευταία αποθηκευμένα δεδομένα είναι
                    διαθέσιμα.
                  </p>
                  <button
                    onClick={() => setShowOfflineBanner(false)}
                    className="ml-auto rounded-md p-1 hover:bg-amber-100 transition"
                    aria-label="Κλείσιμο ειδοποίησης"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            {!online && !showOfflineBanner && (
              <div className="md:hidden px-3 py-1.5 text-[11px] text-amber-900 bg-amber-50 border-t border-amber-200">
                <div className="max-w-6xl mx-auto flex items-center gap-2">
                  <WifiOff className="w-4 h-4" />
                  Εκτός σύνδεσης — ορισμένες λειτουργίες ίσως δεν λειτουργούν.
                </div>
              </div>
            )}

            {/* Skip link */}
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-[#f6f4ef] focus:px-3 focus:py-2"
            >
              Μετάβαση στο περιεχόμενο
            </a>

            {/* App bar row — fixed height on mobile */}
            <div
              className="max-w-6xl mx-auto px-3 sm:px-4 h-[var(--h)] flex items-center justify-between gap-2"
              style={{ paddingTop: "max(env(safe-area-inset-top), 0px)" }}
            >
              {/* Brand (no scale on xs to avoid jitter) */}
              <Link
                href="/admin"
                className="group inline-flex items-center gap-2 rounded-md px-2 py-1 md:hover:bg-[#f6f4ef] transition"
                aria-current={isActive("/admin") ? "page" : undefined}
                title="Πίνακας Διαχείρισης"
              >
                <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-[#8c7c68] transition-transform md:group-hover:-translate-y-0.5" />
                <span className="hidden sm:inline font-semibold text-base sm:text-lg tracking-tight text-[#2f2e2b]">
                  Πίνακας Διαχείρισης
                </span>
              </Link>

              {/* Desktop nav (unchanged) */}
              <nav className="hidden md:flex items-center gap-2">
                {nav.map(({ href, label, Icon }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={clsx(
                        "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition",
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

              {/* Right controls */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Online chip hidden on xs */}
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

                {/* PWA + user only from sm+ */}
                <div className="hidden sm:block">
                  <InstallPWAButton />
                </div>

                <div className="relative hidden sm:block">
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                    aria-expanded={menuOpen}
                    className="inline-flex items-center gap-2 rounded-full border border-[#e5e1d8] bg-white/90 px-3 py-1.5 shadow-sm hover:bg-[#f6f4ef] transition"
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

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#e5e1d8] bg-white/95 backdrop-blur shadow-lg overflow-hidden">
                      <Link
                        href="/admin/settings"
                        disabled={!online}
                        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[#f6f4ef] transition"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 text-[#8c7c68]" />
                        <span className="text-[#3a3a38]">Ρυθμίσεις</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        disabled={!online}
                        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[#f6f4ef] transition"
                      >
                        <LogOut className="w-4 h-4 text-red-600" />
                        <span className="text-[#3a3a38]">Αποσύνδεση</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile hamburger — slightly smaller icon, no heavy border */}
                <button
                  className="md:hidden grid place-items-center w-10 h-10 rounded-lg border border-[#e5e1d8] bg-white/90 hover:bg-[#f6f4ef] transition"
                  aria-label={
                    mobileOpen
                      ? "Κλείσιμο κύριου μενού"
                      : "Άνοιγμα κύριου μενού"
                  }
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-menu"
                  onClick={() => setMobileOpen(!mobileOpen)}
                >
                  {mobileOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* MOBILE: slide-in sheet */}
          <div
            id="mobile-menu"
            className={clsx(
              "md:hidden fixed inset-0 z-[60] transition-opacity",
              mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            {/* Overlay */}
            <div
              className={clsx(
                "absolute inset-0 bg-black/30",
                "transition-opacity motion-safe:duration-200 motion-reduce:duration-0"
              )}
              aria-hidden="true"
              onClick={() => setMobileOpen(false)}
            />
            {/* Panel */}
            <div
              ref={panelRef}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              className={clsx(
                "absolute right-0 top-0 h-full w-[88%] max-w-[420px] bg-white border-l border-[#eeeae2] shadow-2xl",
                "overflow-y-auto overscroll-contain",
                "transition-transform motion-safe:duration-300 motion-reduce:duration-0 ease-out",
                mobileOpen ? "translate-x-0" : "translate-x-full"
              )}
              style={{
                paddingTop: "max(env(safe-area-inset-top), 1rem)",
                paddingBottom: "max(env(safe-area-inset-bottom), 1rem)",
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Κύριο μενού"
            >
              {/* User row */}
              <div className="px-4 pb-3 flex items-center justify-between border-b border-[#eeeae2]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 rounded-full grid place-items-center bg-[#efece5] text-[#2f2e2b] text-xs font-semibold border border-[#e5e1d8]">
                    {initials}
                  </div>
                  <span className="text-sm font-medium text-[#2f2e2b] truncate">
                    {profile?.name || me?.email || "Χρήστης"}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border border-transparent hover:border-red-200 hover:bg-red-50 text-gray-700 hover:text-red-600 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Έξοδος
                </button>
              </div>

              {/* Quick pills (horizontal scroll) */}
              <div className="px-4 py-3 -mx-1 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 px-1">
                  {nav.map(({ href, label }) => {
                    const active = isActive(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setMobileOpen(false)}
                        className={clsx(
                          "px-3 py-2 rounded-full text-xs whitespace-nowrap transition border",
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

              {/* Stacked nav (larger targets) */}
              <div className="px-3 space-y-2">
                {nav.map(({ href, label, Icon }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href + "-stack"}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMobileOpen(false)}
                      className={clsx(
                        "w-full flex items-center justify-between rounded-xl px-3 py-3 text-base transition border",
                        active
                          ? "bg-[#f6f4ef] border-[#e5e1d8] text-[#2f2e2b]"
                          : "bg-white border-[#e5e1d8] text-[#3a3a38] hover:bg-[#f6f4ef]"
                      )}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon className="w-5 h-5 text-[#8c7c68]" />
                        {label}
                      </span>
                      <span className="text-[#8c7c68]" aria-hidden="true">
                        ›
                      </span>
                    </Link>
                  );
                })}

                {/* Utilities */}
                <div className="pt-4 border-t border-[#eeeae2] grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6b675f]">Κατάσταση</span>
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs",
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
                    </span>
                  </div>
                  <InstallPWAButton />
                  <Link
                    href="/admin/settings"
                    onClick={() => setMobileOpen(false)}
                    className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 rounded-lg border border-[#e5e1d8] hover:bg-[#f6f4ef] transition"
                  >
                    <Settings className="w-4 h-4 text-[#8c7c68]" />
                    <span className="text-[#3a3a38]">Ρυθμίσεις</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </header>
        {/* OPTIONAL: Bottom tab bar for faster nav on phones */}
        {/* Bottom tab bar (mobile) */}
        {/* Bottom tab bar (mobile) */}
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-40"
          style={{ "--safe": "env(safe-area-inset-bottom)" }}
        >
          {/* The bar itself: only 48px tall, perfectly center contents */}
          <div className="bg-white/90 supports-[backdrop-filter]:backdrop-blur-md border-t border-[#e5e1d8] rounded-t-2xl shadow-[0_-6px_20px_rgba(0,0,0,0.06)]">
            <ul className="grid grid-cols-4 h-12">
              {primaryNav.map(({ href, label, Icon }) => {
                const active = isActive(href);
                return (
                  <li key={"tab-" + href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={clsx(
                        // Fill the 48px row and center exactly
                        "flex flex-col items-center justify-center h-full gap-0.5 leading-none",
                        active ? "text-[#2f2e2b]" : "text-[#5b5a57]"
                      )}
                    >
                      <Icon
                        className={clsx(
                          "w-5 h-5",
                          active ? "text-[#8c7c68]" : "text-[#9a8f7d]"
                        )}
                      />
                      <span className="truncate max-w-[80px] text-[11px]">
                        {label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Safe-area spacer lives OUTSIDE the bar so centering isn’t affected */}
          <div style={{ height: "var(--safe)" }} />
        </nav>

        <div className="md:hidden h-12" />
        <main
          id="admin-content"
          className="max-w-6xl mx-auto px-4 pb-4 "
          style={{
            paddingTop: `calc(var(--h) + env(safe-area-inset-top))`,
          }}
        >
          {children}
        </main>
      </div>
    </AuthGate>
  );
}
