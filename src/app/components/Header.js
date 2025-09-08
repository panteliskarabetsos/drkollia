"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import {
  Menu,
  X,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { Noto_Serif } from "next/font/google";

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function Header() {
  const [user, setUser] = useState(null);
  const [profileName, setProfileName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const pathname = usePathname();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // Close menus on ESC
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  // Scroll-aware styling
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fetch user + profile
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .single();
        if (!error && data?.name) setProfileName(data.name);
      }
      setLoading(false);
    };
    fetchUserAndProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfileName(null);
    setDropdownOpen(false);
    setMenuOpen(false);
    window.location.reload();
  };

  const nav = [
    { href: "/about", label: "Σχετικά" },
    { href: "/iatreio", label: "Ιατρείο" },
    { href: "/contact", label: "Επικοινωνία" },
  ];

  const isActive = (href) => pathname === href;

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-[#fdfaf6]/90 backdrop-blur-xl shadow-[0_1px_0_0_#e8e4de_inset,0_8px_20px_-12px_rgba(0,0,0,0.15)]"
          : "bg-[#fdfaf6]/70 backdrop-blur-md shadow-sm",
      ].join(" ")}
      role="banner"
    >
      {/* hairline gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e8e4de] to-transparent" />

      <div className="max-w-6xl mx-auto px-6">
        <div className="h-16 md:h-18 flex items-center justify-between">
          {/* Branding */}
          <Link
            href="/"
            className={`flex flex-col leading-tight ${notoSerif.className}`}
          >
            <span className="text-lg md:text-xl font-semibold text-[#2e2d2a] tracking-[0.01em] hover:text-[#8c7c68] transition-colors">
              Γεωργία Κόλλια
            </span>
            <span className="hidden sm:block text-[12px] md:text-[13px] text-[#6f6d68] tracking-wide">
              Ενδοκρινολογία · Διαβήτης · Μεταβολισμός
            </span>
          </Link>

          {/* Right cluster */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6 text-[15px] font-medium text-[#5a5955]">
              {nav.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "relative group transition-colors",
                    isActive(href) ? "text-[#8c7c68]" : "hover:text-[#8c7c68]",
                  ].join(" ")}
                >
                  <span className="pb-1">{label}</span>
                  <span
                    className={[
                      "absolute left-0 -bottom-0.5 h-[2px] bg-[#8c7c68] transition-all duration-300 ease-out",
                      isActive(href) ? "w-full" : "w-0 group-hover:w-full",
                    ].join(" ")}
                  />
                </Link>
              ))}
              <Link
                href="/appointments"
                className="px-4 py-2 rounded-full text-white bg-[#8c7c68] hover:bg-[#746856] shadow-sm transition-colors"
              >
                Κλείστε Ραντεβού
              </Link>
            </nav>

            {/* Desktop user chip */}
            {!loading && user && (
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className={[
                  "hidden md:inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium shadow-sm transition-colors",
                  "border-[#e2dbcf] bg-[#f5efe6] hover:bg-[#e9e2d6] text-[#3b3a36]",
                ].join(" ")}
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
              >
                <UserIcon className="w-4 h-4" />
                <span className="max-w-[180px] truncate">
                  {profileName ?? user.email}
                </span>
              </button>
            )}

            {/* Mobile toggles */}
            <div className="flex md:hidden items-center gap-3">
              {!loading && user && (
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  aria-label="Άνοιγμα μενού χρήστη"
                  className="rounded-full p-1.5 hover:bg-[#efe9df] active:scale-[0.98] transition"
                >
                  <UserIcon className="w-5 h-5 text-[#3b3a36]" />
                </button>
              )}
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-controls="mobile-nav"
                aria-label="Εναλλαγή μενού"
                className="rounded-full p-1.5 hover:bg-[#efe9df] active:scale-[0.98] transition"
              >
                {menuOpen ? (
                  <X className="w-6 h-6 text-[#3b3a36]" />
                ) : (
                  <Menu className="w-6 h-6 text-[#3b3a36]" />
                )}
              </button>
            </div>

            {/* Dropdown */}
            {dropdownOpen && (
              <div
                ref={dropdownRef}
                role="menu"
                aria-label="Μενού χρήστη"
                className="absolute right-6 top-[calc(100%+8px)] w-56 overflow-hidden rounded-xl border border-[#e8e2d6] bg-white shadow-lg"
              >
                <div className="px-3 py-2 text-[12px] text-[#7a7468] border-b border-[#eee9e0]">
                  Συνδεθήκατε ως{" "}
                  <span className="font-medium text-[#3b3a36]">
                    {profileName ?? user?.email}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    window.location.href = "/admin";
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[#2f2e2b] hover:bg-[#f7f3ec]"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Πίνακας Διαχείρισης
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[#7a2c2c] hover:bg-[#fbf1f1]"
                >
                  <LogOut className="w-4 h-4" />
                  Αποσύνδεση
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav
        id="mobile-nav"
        className={[
          "md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out",
          menuOpen ? "max-h-[340px] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <div className="bg-white border-t border-[#e8e4de]">
          <div className="flex flex-col px-6 py-4 gap-2 text-[15px] font-medium text-[#5a5955]">
            {nav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={[
                  "rounded-md px-2 py-2 transition-colors",
                  isActive(href)
                    ? "text-[#8c7c68] bg-[#f7f3ec]"
                    : "hover:text-[#8c7c68] hover:bg-[#faf6ef]",
                ].join(" ")}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/appointments"
              onClick={() => setMenuOpen(false)}
              className="mt-2 text-center px-5 py-2 rounded-full bg-[#8c7c68] text-white shadow-sm hover:bg-[#746856] transition-colors"
            >
              Κλείστε Ραντεβού
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
