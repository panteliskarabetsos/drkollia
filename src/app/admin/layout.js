// app/admin/layout.js
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import clsx from "clsx";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/app/lib/supabaseClient";
import { offlineAuth } from "@/lib/offlineAuth";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import {
  CalendarDays,
  Users,
  Clock,
  Plus,
  Lock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import "../globals.css";
import { syncPatients } from "../../lib/offlinePatients";
import { syncAppointments } from "../../lib/offlineAppointments";
import AdminHeader from "./_components/AdminHeader";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

/** ---------------- Offline PIN Gate (inline, no extra file) ---------------- */
function OfflinePinGate({ onUnlocked, onLogout }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const remaining = offlineAuth.getLockRemainingSeconds?.() ?? 0;
  const disabled = busy || remaining > 0;

  // countdown refresh
  useEffect(() => {
    const t = setInterval(() => setNote((x) => x), 500);
    return () => clearInterval(t);
  }, []);

  const unlock = async () => {
    setBusy(true);
    setNote("");
    try {
      const res = await offlineAuth.verifyPinDetailed(pin);

      if (res.ok) {
        setPin("");
        onUnlocked?.();
        router.refresh();
        return;
      }

      if (res.reason === "cooldown" || res.reason === "locked_out") {
        setNote(
          `Πολλές προσπάθειες. Δοκίμασε ξανά σε ${res.remainingSeconds}s.`
        );
        return;
      }

      if (res.reason === "wrong_pin") {
        setNote(`Λάθος PIN. Απομένουν ${res.attemptsLeft} προσπάθειες.`);
        return;
      }

      setNote(
        "Δεν υπάρχει offline PIN στη συσκευή. Πήγαινε Ρυθμίσεις → Offline/PIN."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-6 bg-[#fdfaf6] text-[#3b3a36]">
      <Card className="w-full max-w-md rounded-2xl shadow-sm bg-white/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" /> Offline πρόσβαση
          </CardTitle>
          <CardDescription>
            Βάλτε PIN για πρόσβαση στο admin όταν δεν υπάρχει σύνδεση.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {remaining > 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Cooldown</AlertTitle>
              <AlertDescription>
                Προσπάθησε ξανά σε <b>{remaining}s</b>.
              </AlertDescription>
            </Alert>
          ) : null}

          {note ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Μήνυμα</AlertTitle>
              <AlertDescription>{note}</AlertDescription>
            </Alert>
          ) : null}

          <Input
            value={pin}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, "").slice(0, 12))
            }
            placeholder="PIN"
            inputMode="numeric"
            type="password"
            disabled={disabled}
            className="tracking-widest text-center"
          />

          <Button
            className="w-full rounded-xl"
            onClick={unlock}
            disabled={disabled || pin.length < 6}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Ξεκλείδωμα
          </Button>

          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={onLogout}
            disabled={busy}
          >
            Έξοδος
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);

  const [offlineUnlocked, setOfflineUnlocked] = useState(() => {
    try {
      return (
        offlineAuth.hasActiveSession?.() && !(offlineAuth.isLocked?.() ?? true)
      );
    } catch {
      return false;
    }
  });

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

  // banner follows connection status
  useEffect(() => setShowOfflineBanner(!online), [online]);

  // Core auth/offline routing logic
  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        setReady(false);

        if (online) {
          const { data } = await supabase.auth.getSession();
          const session = data?.session;

          if (!alive) return;

          if (!session?.user) {
            setMe(null);
            setProfile(null);
            setOfflineUnlocked(false);
            router.replace("/login?redirect=/admin");
            setReady(true);
            return;
          }

          const user = session.user;
          setMe(user);

          // ✅ save cached user for offline enable/unlock
          try {
            await offlineAuth.saveUser({
              id: user.id,
              email: user.email,
              name:
                user.user_metadata?.full_name ?? user.user_metadata?.name ?? "",
              role: "admin",
            });
          } catch {}

          // load profile (optional)
          try {
            const { data: prof } = await supabase
              .from("profiles")
              .select("name, email, phone, role")
              .eq("id", user.id)
              .single();
            if (alive) setProfile(prof || null);
          } catch {
            if (alive) setProfile(null);
          }

          setReady(true);
          return;
        }

        // OFFLINE
        const provisioned = offlineAuth.isEnabled?.();
        if (!provisioned) {
          setMe(null);
          setProfile(null);
          setOfflineUnlocked(false);
          router.replace("/login?redirect=/admin");
          setReady(true);
          return;
        }

        const cached = await offlineAuth.getUser();
        if (!alive) return;

        // show cached identity in header (even offline)
        if (cached) {
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

        // unlocked?
        const unlockedNow =
          !!offlineAuth.hasActiveSession?.() &&
          !(offlineAuth.isLocked?.() ?? true);
        setOfflineUnlocked(unlockedNow);

        setReady(true);
      } catch {
        if (!alive) return;
        setReady(true);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [online, router]);

  // Start auto-lock timer when offline & unlocked
  useEffect(() => {
    if (online) return;
    if (!offlineUnlocked) return;

    const stop = offlineAuth.startAutoLockTimer?.(() => {
      setOfflineUnlocked(false);
    });

    return () => stop?.();
  }, [online, offlineUnlocked]);

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

    if (online) syncAll();
    window.addEventListener("online", syncAll);
    return () => window.removeEventListener("online", syncAll);
  }, [router, online]);

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
          if (url && url.includes("/admin/sw.js")) reg.unregister();
        });
      })
      .catch((err) => console.debug("SW cleanup error", err));
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

  // ---------- render ----------
  if (!ready) return null;

  // OFFLINE + provisioned + locked => show PIN gate full-screen (no admin UI)
  if (!online && offlineAuth.isEnabled?.() && !offlineUnlocked) {
    return (
      <OfflinePinGate
        onUnlocked={() => setOfflineUnlocked(true)}
        onLogout={() => {
          try {
            offlineAuth.lock?.();
          } catch {}
          router.replace("/login?redirect=/admin");
        }}
      />
    );
  }

  return (
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

      <main
        id="admin-content"
        className="w-full pt-20 md:pb-8"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 6rem)" }}
      >
        {children}
      </main>

      {/* Bottom tab bar – mobile only */}
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-[#e5e1d8] bg-white/90 supports-[backdrop-filter]:backdrop-blur-md shadow-[0_-4px_12px_rgba(15,23,42,0.08)]"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.35rem)" }}
      >
        <div className="relative mx-auto max-w-6xl px-4 pt-2 pb-1.5">
          <div className="pointer-events-none absolute inset-x-0 -top-6 flex justify-center">
            <Link
              href="/admin/appointments/new"
              className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#e5e1d8] bg-[#fdfaf6] text-[#2f2e2b] shadow-lg shadow-emerald-600/20 hover:scale-105 hover:bg-white transition"
              aria-label="Νέο ραντεβού"
            >
              <Plus className="h-6 w-6 text-emerald-600" />
            </Link>
          </div>

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
  );
}
