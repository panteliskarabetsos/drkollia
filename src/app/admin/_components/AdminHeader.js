// app/admin/_components/AdminHeader.js
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  Wifi,
  WifiOff,
  X,
  Menu,
  ChevronDown,
  CircleUserRound,
  Settings,
  LogOut,
  Download,
  HelpCircle,
} from "lucide-react";

/* Μικρό κουμπί για εγκατάσταση PWA */
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
    await promptEvt.prompt();
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
      className="hidden sm:inline-flex items-center gap-2 rounded-full border border-[#e5e1d8] bg-white/90 px-3 py-1.5 text-sm shadow-sm hover:bg-[#f6f4ef] hover:shadow-md transition"
      title="Εγκατάσταση εφαρμογής"
    >
      <Download className="w-4 h-4 text-[#8c7c68]" />
      Εγκατάσταση
    </button>
  );
}

export default function AdminHeader({
  online,
  showOfflineBanner,
  setShowOfflineBanner,
  nav,
  initials,
  profile,
  me,
  isActive,
  onLogout,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Κλείσιμο dropdown / mobile menu σε αλλαγή route
  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // Κλείσιμο με Escape
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

  const renderNavItem = ({ href, label, Icon, requiresOnline }) => {
    const active = isActive(href);
    const disabled = requiresOnline && !online;

    const baseClasses =
      "relative inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm transition";
    const enabledStyles = active
      ? "bg-[#f6f1e7] border border-[#e2d7c7] text-[#262522] shadow-sm"
      : "border border-transparent text-[#3a3a38] hover:text-[#1f1e1c] hover:bg-[#f6f4ef] hover:border-[#e5e1d8] hover:shadow-sm";
    const disabledStyles =
      "cursor-not-allowed border border-dashed border-[#e3ded4] bg-[#faf7f1] text-[#b3ab9f]";

    const content = (
      <>
        <Icon
          className={clsx(
            "w-4 h-4",
            disabled
              ? "text-[#c1b8aa]"
              : active
              ? "text-[#8c7c68]"
              : "text-[#9a8f7d]"
          )}
        />
        <span>{label}</span>
      </>
    );

    if (disabled) {
      return (
        <div
          key={href}
          className={clsx(baseClasses, disabledStyles)}
          aria-disabled="true"
          title="Διαθέσιμο μόνο όταν είστε online"
        >
          {content}
        </div>
      );
    }

    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={clsx(baseClasses, enabledStyles)}
      >
        {content}
      </Link>
    );
  };

  const renderMobileNavItem = (
    { href, label, Icon, requiresOnline },
    stacked
  ) => {
    const active = isActive(href);
    const disabled = requiresOnline && !online;

    if (stacked) {
      // μεγάλα tiles
      if (disabled) {
        return (
          <div
            key={href + "-stack-disabled"}
            className="w-full flex items-center justify-between rounded-xl px-3 py-3 text-base border border-dashed border-[#e5e1d8] bg-[#faf7f1] text-[#b3ab9f] cursor-not-allowed"
            aria-disabled="true"
            title="Διαθέσιμο μόνο όταν είστε online"
          >
            <span className="inline-flex items-center gap-2">
              <Icon className="w-5 h-5 text-[#c1b8aa]" />
              {label}
            </span>
            <span className="text-[#c1b8aa]" aria-hidden="true">
              ⦿
            </span>
          </div>
        );
      }

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
    }

    // quick pills
    if (disabled) {
      return (
        <div
          key={href + "-pill-disabled"}
          className="px-3 py-2 rounded-full text-xs whitespace-nowrap bg-[#faf7f1] border border-dashed border-[#e5e1d8] text-[#b3ab9f] cursor-not-allowed"
          aria-disabled="true"
          title="Διαθέσιμο μόνο όταν είστε online"
        >
          {label}
        </div>
      );
    }

    const activeStyles = "bg-[#f6f4ef] border-[#e5e1d8] text-[#2f2e2b]";
    const idleStyles =
      "bg-white border-[#e5e1d8] text-[#3a3a38] hover:bg-[#f6f4ef]";

    return (
      <Link
        key={href + "-pill"}
        href={href}
        aria-current={active ? "page" : undefined}
        onClick={() => setMobileOpen(false)}
        className={clsx(
          "px-3 py-2 rounded-full text-xs whitespace-nowrap transition border",
          active ? activeStyles : idleStyles
        )}
        title={label}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      {/* Subtle gradient bar */}
      <div className="hidden sm:block h-[2px] w-full bg-gradient-to-r from-[#e0d8cb] via-[#ccbfae] to-[#e0d8cb]" />

      <div className="bg-white/80 supports-[backdrop-filter]:backdrop-blur-md border-b border-[#e5e1d8] shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
        {/* Offline banner */}
        {showOfflineBanner && (
          <div className="bg-amber-50/95 text-amber-900 border-y border-amber-200">
            <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-start sm:items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
              <p className="text-xs sm:text-sm leading-snug">
                Είστε εκτός σύνδεσης. Μερικές λειτουργίες είναι προσωρινά
                απενεργοποιημένες.
              </p>
              <button
                type="button"
                onClick={() => setShowOfflineBanner(false)}
                className="ml-auto rounded-md p-1 hover:bg-amber-100 transition"
                aria-label="Κλείσιμο ειδοποίησης"
              >
                <X className="w-4 h-4" />
              </button>
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

        {/* Κύρια μπάρα header */}
        <div
          className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2"
          style={{ paddingTop: "max(env(safe-area-inset-top), 0.5rem)" }}
        >
          {/* Brand */}
          <Link
            href="/admin"
            className="group inline-flex items-center gap-2 rounded-2xl px-2 py-1.5 bg-white/60 shadow-sm border border-[#eee6da] hover:bg-[#f6f1e7] hover:shadow-md hover:-translate-y-0.5 transition"
            title="Πίνακας Διαχείρισης"
            aria-label="Πίνακας Διαχείρισης"
            aria-current={isActive("/admin") ? "page" : undefined}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#f0e6d6] to-[#dac9b4]">
              <LayoutDashboard className="w-4 h-4 text-[#5c4c38]" />
            </div>
            <span className="hidden sm:inline font-semibold text-lg tracking-tight text-[#262522]">
              Πίνακας Διαχείρισης
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            {nav.map(renderNavItem)}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Online/offline indicator */}
            <div
              className={clsx(
                "hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs shadow-sm",
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

            {/* PWA */}
            <div className="hidden sm:block">
              <InstallPWAButton />
            </div>

            {/* User chip (desktop) */}
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

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-[#e5e1d8] bg-white/95 backdrop-blur shadow-xl overflow-hidden animate-fadeIn">
                  <div className="px-3 py-2 border-b border-[#eeeae2] bg-[#faf7f1]">
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
                    type="button"
                    disabled={!online}
                    className={clsx(
                      "w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-all",
                      online
                        ? "hover:bg-[#f6f4ef] hover:pl-4"
                        : "cursor-not-allowed text-[#b3ab9f] bg-[#faf7f1]"
                    )}
                    onClick={() => {
                      if (!online) return;
                      window.location.href = "/admin/settings";
                    }}
                  >
                    <Settings
                      className={clsx(
                        "w-4 h-4",
                        online ? "text-[#8c7c68]" : "text-[#c1b8aa]"
                      )}
                    />
                    <span className="text-[#3a3a38]">Ρυθμίσεις</span>
                  </button>
                  <button
                    onClick={onLogout}
                    disabled={!online}
                    className={clsx(
                      "w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-all",
                      online
                        ? "hover:bg-[#f6f4ef] hover:pl-4"
                        : "cursor-not-allowed text-[#b3ab9f] bg-[#faf7f1]"
                    )}
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span className="text-[#3a3a38]">Αποσύνδεση</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#e5e1d8] bg-white/90 shadow-sm hover:bg-[#f6f4ef] transition motion-safe:duration-200"
              aria-label={mobileOpen ? "Κλείσιμο μενού" : "Άνοιγμα μενού"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
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
          className="absolute inset-0 bg-black/30"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
        {/* Panel */}
        <div
          className={clsx(
            "absolute right-0 top-0 h-full w-[88%] max-w-[420px] bg-white border-l border-[#eeeae2] shadow-2xl",
            "transition-transform duration-300 ease-out",
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
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border border-transparent hover:border-red-200 hover:bg-red-50 text-gray-700 hover:text-red-600 transition"
            >
              <LogOut className="w-4 h-4" />
              Έξοδος
            </button>
          </div>

          {/* Quick pills */}
          <div className="px-4 py-3 -mx-1 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 px-1">
              {nav.map((item) => renderMobileNavItem(item, false))}
            </div>
          </div>

          {/* Stacked nav */}
          <div className="px-3 space-y-2">
            {nav.map((item) => renderMobileNavItem(item, true))}

            {/* Status + settings */}
            {/* Status + settings */}
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

              {/* Help – always enabled */}
              <Link
                href="/admin/help"
                onClick={() => setMobileOpen(false)}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 rounded-lg border border-[#e5e1d8] hover:bg-[#f6f4ef] transition"
              >
                <HelpCircle className="w-4 h-4 text-[#8c7c68]" />
                <span className="text-[#3a3a38]">Βοήθεια</span>
              </Link>

              {/* Settings (disabled offline) */}
              <button
                type="button"
                disabled={!online}
                onClick={() => {
                  if (!online) return;
                  window.location.href = "/admin/settings";
                }}
                className={clsx(
                  "w-full text-left px-3 py-2 text-sm flex items-center gap-2 rounded-lg border transition",
                  online
                    ? "border-[#e5e1d8] hover:bg-[#f6f4ef]"
                    : "border-dashed border-[#e5e1d8] bg-[#faf7f1] text-[#b3ab9f] cursor-not-allowed"
                )}
              >
                <Settings
                  className={clsx(
                    "w-4 h-4",
                    online ? "text-[#8c7c68]" : "text-[#c1b8aa]"
                  )}
                />
                <span className="text-[#3a3a38]">Ρυθμίσεις</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
