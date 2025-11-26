// app/admin/layout.js
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import clsx from "clsx";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/app/lib/supabaseClient";
import { offlineAuth } from "../../lib/offlineAuth";

import AuthGate from "./_components/AuthGate";
import { CalendarDays, Users, Clock, Plus } from "lucide-react";
import "../globals.css";
import { syncPatients } from "../../lib/offlinePatients";
import { syncAppointments } from "../../lib/offlineAppointments";
import AdminHeader from "./_components/AdminHeader";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let authSub;
    let alive = true;

    const run = async () => {
      const isOnline =
        typeof navigator === "undefined" ? true : navigator.onLine;

      if (isOnline) {
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

        const sub = supabase.auth.onAuthStateChange((_event, session) => {
          if (!alive) return;
          setMe(session?.user || null);
        });
        authSub = sub?.data?.subscription || sub?.subscription;
      } else {
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
      }
    };

    run();

    return () => {
      alive = false;
      authSub?.unsubscribe?.();
    };
  }, [online]);

  // offline banner follows connection status
  useEffect(() => {
    setShowOfflineBanner(!online);
  }, [online]);

  // sync offline data (patients + appointments) when online
  useEffect(() => {
    const syncAll = async () => {
      try {
        if (typeof navigator === "undefined" || !navigator.onLine) return;

        await Promise.all([
          syncPatients().catch((err) =>
            console.error("Sync patients failed:", err)
          ),
          syncAppointments().catch((err) =>
            console.error("Sync appointments failed:", err)
          ),
        ]);

        window.dispatchEvent(new CustomEvent("admin:refresh"));
        router.refresh();
      } catch (err) {
        console.error("Sync error:", err);
      }
    };

    syncAll();
    window.addEventListener("online", syncAll);
    return () => window.removeEventListener("online", syncAll);
  }, [router]);

  // network status
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
      {
        href: "/admin/appointments",
        label: "Ραντεβού",
        Icon: CalendarDays,
        requiresOnline: false,
      },
      {
        href: "/admin/patients",
        label: "Ασθενείς",
        Icon: Users,
        requiresOnline: false,
      },
      {
        href: "/admin/schedule",
        label: "Πρόγραμμα",
        Icon: Clock,

        requiresOnline: true,
      },
    ],
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((reg) => {
          const url =
            reg.active?.scriptURL ||
            reg.installing?.scriptURL ||
            reg.waiting?.scriptURL;

          if (url && url.includes("/admin/sw.js")) {
            reg.unregister();
          }
        });
      })
      .catch((err) => {
        console.debug("SW cleanup error", err);
      });
  }, []);

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
          "font-sans bg-[#fdfaf6] text-[#3b3a36] antialiased selection:bg-[#fcefc0] min-h-screen w-screen overflow-x-hidden"
        )}
      >
        <a
          href="#admin-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] rounded-md bg-white px-3 py-2 text-sm shadow"
        >
          Μετάβαση στο περιεχόμενο
        </a>

        <Toaster position="top-right" richColors expand offset={80} />

        {/* Header component */}
        <AdminHeader
          online={online}
          showOfflineBanner={showOfflineBanner}
          setShowOfflineBanner={setShowOfflineBanner}
          nav={nav}
          initials={initials}
          profile={profile}
          me={me}
          isActive={isActive}
          onLogout={handleLogout}
        />

        {/* MAIN CONTENT – leave space for header + bottom nav */}
        <main
          id="admin-content"
          className="w-full pt-20 md:pb-8"
          style={{
            paddingBottom: "max(env(safe-area-inset-bottom), 6rem)",
          }}
        >
          {children}
        </main>

        {/* Bottom tab bar – mobile only */}
        <nav
          className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-[#e5e1d8] bg-white/90 supports-[backdrop-filter]:backdrop-blur-md shadow-[0_-4px_12px_rgba(15,23,42,0.08)]"
          style={{
            paddingBottom: "max(env(safe-area-inset-bottom), 0.35rem)",
          }}
        >
          <div className="relative mx-auto max-w-6xl px-4 pt-2 pb-1.5">
            {/* Floating action button: νέο ραντεβού */}
            <div className="pointer-events-none absolute inset-x-0 -top-6 flex justify-center">
              <Link
                href="/admin/appointments/new"
                className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#e5e1d8] bg-[#fdfaf6] text-[#2f2e2b] shadow-lg shadow-emerald-600/20 hover:scale-105 hover:bg-white transition"
                aria-label="Νέο ραντεβού"
              >
                <Plus className="h-6 w-6 text-emerald-600" />
              </Link>
            </div>

            {/* Tabs */}
            <ul className="grid grid-cols-3 gap-1 pt-4">
              {primaryNav.map(({ href, label, Icon }) => {
                const active = isActive(href);
                return (
                  <li key={"tab-" + href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={clsx(
                        "flex flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] transition",
                        active ? "text-[#2f2e2b]" : "text-[#7b776e]"
                      )}
                    >
                      <span
                        className={clsx(
                          "mb-0.5 flex h-8 w-8 items-center justify-center rounded-full border text-[0px] transition",
                          active
                            ? "border-[#d0c4b3] bg-[#f6f1e7]"
                            : "border-transparent bg-transparent"
                        )}
                      >
                        <Icon
                          className={clsx(
                            "h-4 w-4",
                            active ? "text-[#8c7c68]" : "text-[#9a8f7d]"
                          )}
                        />
                      </span>
                      <span className="truncate max-w-[80px] leading-tight">
                        {label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </div>
    </AuthGate>
  );
}
