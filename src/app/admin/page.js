"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { offlineAuth } from "../../lib/offlineAuth";
import { refreshPatientsCacheFromServer } from "../../lib/offlinePatients";
import { fetchAppointmentsRange } from "../../lib/offlineAppointments";
// shadcn/ui
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

// icons
import {
  CalendarDays,
  User as UserIcon,
  Clock,
  ShieldCheck,
  ArrowRight,
  Loader2,
  LifeBuoy,
  BarChart3,
  Hourglass,
  CalendarRange,
  Command,
  RefreshCcw,
  WifiOff,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const redirectedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [loadingButton, setLoadingButton] = useState(null);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [nextAppt, setNextAppt] = useState(null);
  const [nextApptErr, setNextApptErr] = useState(null);
  const [dayEdges, setDayEdges] = useState({ first: null, last: null });

  // 🔌 online/offline state
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    (async () => {
      const online = typeof navigator === "undefined" ? true : navigator.onLine;
      const { data } = await supabase.auth.getSession();
      const session = data?.session || null;
      const hasOffline = !!offlineAuth?.hasActiveSession?.(); // requires PIN unlock

      // Not authenticated at all
      if (!session && !hasOffline) {
        if (online && !redirectedRef.current) {
          redirectedRef.current = true;
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
        setLoading(false);
        return;
      }

      // Allowed (session OR active offline session)
      setLoading(false);

      // Remember for offline shell & warm caches when online
      if (online) {
        try {
          localStorage.setItem("lastAdminPath", pathname);
        } catch {}
        try {
          await Promise.all([
            refreshPatientsCacheFromServer(),
            fetchAppointmentsRange({
              startISO: new Date(Date.now() - 7 * 864e5).toISOString(),
              endISO: new Date(Date.now() + 7 * 864e5).toISOString(),
            }),
          ]);
        } catch (e) {
          console.warn("Warm cache failed:", e);
        }
      }
    })();
  }, [isOnline, router, pathname]);

  // ---------- Data loaders ----------
  const loadStats = useCallback(async () => {
    if (!isOnline) {
      setStats(null);
      return;
    }

    const now = new Date();
    const startLocal = new Date(now);
    startLocal.setHours(0, 0, 0, 0);
    const endLocal = new Date(now);
    endLocal.setHours(23, 59, 59, 999);

    const startISO = startLocal.toISOString();
    const endISO = endLocal.toISOString();
    const nowISO = now.toISOString();

    const [
      { count: todayCount },
      { count: completedFlipped },
      { count: approvedPastNow },
      { count: patientsCount },
    ] = await Promise.all([
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("appointment_time", startISO)
        .lte("appointment_time", endISO),
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("appointment_time", startISO)
        .lte("appointment_time", endISO)
        .eq("status", "completed"),
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("appointment_time", startISO)
        .lt("appointment_time", nowISO)
        .eq("status", "approved"),
      supabase.from("patients").select("*", { count: "exact", head: true }),
    ]);

    const completedToday = (completedFlipped || 0) + (approvedPastNow || 0);
    setStats({
      today: todayCount ?? 0,
      completedToday,
      patients: patientsCount ?? 0,
    });
  }, [isOnline]);

  const syncCompleted = useCallback(async () => {
    if (!isOnline) return;
    try {
      await fetch("/api/mark-completed", {
        method: "POST",
        headers: {
          "x-admin-key": process.env.NEXT_PUBLIC_ADMIN_SYNC_KEY || "",
        },
        cache: "no-store",
      });
    } catch (e) {
      console.error("syncCompleted failed", e);
    }
  }, [isOnline]);

  const loadProfile = useCallback(
    async (uid) => {
      if (!isOnline) {
        setProfile(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", uid)
        .single();
      setProfile(data);
    },
    [isOnline]
  );

  const loadNextAppointment = useCallback(async () => {
    if (!isOnline) {
      setNextAppt(null);
      setNextApptErr(null);
      return;
    }

    setNextApptErr(null);
    try {
      const now = new Date();
      const nowISO = now.toISOString();
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      ).toISOString();

      const { data, error } = await supabase
        .from("appointments")
        .select(
          "id, appointment_time, status, duration_minutes, reason, patient_id"
        )
        .gte("appointment_time", nowISO)
        .lte("appointment_time", endOfDay)
        .not("status", "in", "(cancelled,completed)")
        .order("appointment_time", { ascending: true })
        .limit(1);

      if (error) throw error;

      const appt = data?.[0] ?? null;
      if (!appt) {
        setNextAppt(null);
        return;
      }

      if (appt.patient_id) {
        const { data: p } = await supabase
          .from("patients")
          .select("first_name, last_name")
          .eq("id", appt.patient_id)
          .single();
        appt.patient_name = p
          ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()
          : null;
      }
      setNextAppt(appt);
    } catch (e) {
      console.error("loadNextAppointment error", e);
      setNextApptErr("Αδυναμία φόρτωσης επόμενου ραντεβού");
      setNextAppt(null);
    }
  }, [isOnline]);

  const loadDayEdges = useCallback(async () => {
    if (!isOnline) {
      setDayEdges({ first: null, last: null });
      return;
    }

    const startLocal = new Date();
    startLocal.setHours(0, 0, 0, 0);
    const endLocal = new Date();
    endLocal.setHours(23, 59, 59, 999);
    const startISO = startLocal.toISOString();
    const endISO = endLocal.toISOString();

    const [firstRes, lastRes] = await Promise.all([
      supabase
        .from("appointments")
        .select("id, appointment_time, status, reason, patient_id")
        .gte("appointment_time", startISO)
        .lte("appointment_time", endISO)
        .not("status", "eq", "cancelled")
        .order("appointment_time", { ascending: true })
        .limit(1),
      supabase
        .from("appointments")
        .select("id, appointment_time, status, reason, patient_id")
        .gte("appointment_time", startISO)
        .lte("appointment_time", endISO)
        .not("status", "eq", "cancelled")
        .order("appointment_time", { ascending: false })
        .limit(1),
    ]);

    const first = firstRes.data?.[0] ?? null;
    const last = lastRes.data?.[0] ?? null;

    const ids = Array.from(
      new Set([first?.patient_id, last?.patient_id].filter(Boolean))
    );
    let namesById = {};
    if (ids.length) {
      const { data: pts } = await supabase
        .from("patients")
        .select("id, first_name, last_name")
        .in("id", ids);
      for (const p of pts ?? []) {
        namesById[p.id] =
          `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || null;
      }
    }
    if (first) first.patient_name = namesById[first.patient_id] ?? null;
    if (last) last.patient_name = namesById[last.patient_id] ?? null;

    setDayEdges({ first, last });
  }, [isOnline]);

  const handleRefresh = useCallback(async () => {
    if (!isOnline) return;
    try {
      setRefreshing(true);
      await syncCompleted();
      await Promise.all([loadStats(), loadDayEdges(), loadNextAppointment()]);
    } finally {
      setRefreshing(false);
    }
  }, [isOnline, loadStats, loadDayEdges, loadNextAppointment, syncCompleted]);

  // ---------- Effects ----------
  useEffect(() => {
    (async () => {
      const online = typeof navigator === "undefined" ? true : navigator.onLine;
      const { data } = await supabase.auth.getSession();
      const session = data?.session || null;
      const hasOffline = !!offlineAuth?.hasActiveSession?.();

      if (!session && !hasOffline) {
        // Only redirect online; offline just render minimal UI
        if (online && !redirectedRef.current) {
          redirectedRef.current = true;
          router.replace(`/login?redirect=${encodeURIComponent("/admin")}`);
        }
        setLoading(false);
        return;
      }

      setUser(session?.user || { id: "offline-user" });
      setLoading(false);

      // Only hit Supabase when online & we have a real session
      if (online && session?.user?.id) {
        await Promise.all([
          loadStats(),
          loadProfile(session.user.id),
          loadDayEdges(),
          loadNextAppointment(),
        ]);
        syncCompleted();
      }
    })();
  }, [
    router,
    isOnline,
    loadStats,
    loadProfile,
    loadDayEdges,
    loadNextAppointment,
    syncCompleted,
  ]);

  useEffect(() => {
    const isTyping = (el) => {
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      return (
        el.isContentEditable ||
        tag === "input" ||
        tag === "textarea" ||
        tag === "select"
      );
    };
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTyping(document.activeElement)) return;
      const k = e.key?.toLowerCase();
      if (k === "n") {
        e.preventDefault();
        router.push("/admin/appointments/new");
        return;
      }
      if (k === "p") {
        e.preventDefault();
        router.push("/admin/patients/new");
        return;
      }
      if (k === "?" || k === "/" || (k === "/" && e.shiftKey)) {
        e.preventDefault();
        router.push("/admin/help?focus=1");
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const todayStr = useMemo(
    () =>
      new Date().toLocaleDateString("el-GR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      }),
    []
  );

  // ---------- UI helpers ----------
  const navItems = useMemo(
    () => [
      {
        title: "Ραντεβού",
        description: "Διαχείριση προγραμματισμένων ραντεβού.",
        href: "/admin/appointments",
        icon: CalendarDays,
        disabled: false,
      },
      {
        title: "Ασθενείς",
        description: "Προβολή και επεξεργασία αρχείου ασθενών.",
        href: "/admin/patients",
        icon: UserIcon,
        disabled: false,
      },
      {
        title: "Πρόγραμμα",
        description: "Διαχείριση προγράμματος λειτουργίας και εξαιρέσεων.",
        href: "/admin/schedule",
        icon: Clock,
        disabled: !isOnline,
      },
      {
        title: "Πρόσβαση",
        description: "Διαχείριση και δημιουργία λογαριασμών διαχειριστών.",
        href: "/admin/accounts",
        icon: ShieldCheck,
        disabled: !isOnline,
      },
    ],
    [isOnline]
  );

  const progressPct = useMemo(() => {
    if (!stats || stats.today === 0) return 0;
    const pct = Math.round((stats.completedToday / stats.today) * 100);
    return Math.min(100, Math.max(0, pct));
  }, [stats]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f0e8] grid place-items-center">
        <div className="w-full max-w-2xl mx-auto p-6">
          <div className="mb-6">
            <Skeleton className="h-8 w-64" />
            <div className="mt-2 flex items-center gap-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full col-span-1 sm:col-span-2" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <main className="min-h-screen bg-gradient-to-b from-[#f5f0e8] via-white to-white text-stone-800">
        {/* Header / hero */}
        <section className="relative border-b border-stone-100">
          <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_0%,#000_15%,transparent_70%)] bg-[radial-gradient(1200px_500px_at_10%_-10%,#f1efe8_20%,transparent),radial-gradient(1000px_400px_at_90%_-20%,#ece9e0_20%,transparent)]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                  {todayStr}
                </p>
                <h1 className="mt-1 text-3xl sm:text-4xl font-serif font-semibold tracking-tight text-stone-900">
                  Πίνακας Διαχείρισης
                </h1>
                <p className="mt-1 text-sm text-stone-600">
                  Καλώς ήρθατε
                  {profile?.name ? (
                    <>
                      , <span className="font-medium">{profile.name}</span>.
                    </>
                  ) : (
                    "."
                  )}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge
                    variant={isOnline ? "outline" : "destructive"}
                    className="flex items-center gap-1 rounded-full px-3 py-1 text-[11px]"
                  >
                    {isOnline ? (
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Συνδεδεμένο</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <WifiOff className="h-3 w-3" />
                        <span>Εκτός σύνδεσης</span>
                      </span>
                    )}
                  </Badge>

                  {isOnline && stats && (
                    <span className="text-[11px] text-stone-500">
                      Σήμερα{" "}
                      <span className="font-semibold">
                        {stats.today} ραντεβού
                      </span>
                      , ολοκληρωμένα{" "}
                      <span className="font-semibold">
                        {stats.completedToday}
                      </span>
                      .
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="hidden sm:flex items-center gap-2 text-[11px] text-stone-500">
                  <span className="flex items-center gap-1">
                    <Command className="h-3 w-3" />
                    <span>Συντομεύσεις:</span>
                    <Kbd>?</Kbd>
                    <span>/</span>
                    <Kbd>N</Kbd>
                    <span>/</span>
                    <Kbd>P</Kbd>
                  </span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      onClick={handleRefresh}
                      disabled={refreshing || !isOnline}
                      className="gap-2 rounded-full shadow-sm"
                    >
                      {refreshing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCcw className="h-4 w-4" />
                      )}
                      <span className="text-sm">Ανανέωση</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isOnline
                      ? "Συγχρονισμός δεδομένων"
                      : "Μη διαθέσιμο εκτός σύνδεσης"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Mini KPIs row */}
          {isOnline && stats && (
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              <MiniStat
                label="Ραντεβού σήμερα"
                value={stats.today}
                hint="Σύνολο προγραμματισμένων ραντεβού"
              />
              <MiniStat
                label="Ολοκληρωμένα"
                value={stats.completedToday}
                hint="Ραντεβού που έχουν ολοκληρωθεί"
              />
              <MiniStat
                label="Σύνολο ασθενών"
                value={stats.patients}
                hint="Εγγεγραμμένοι στο αρχείο ασθενών"
              />
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.4fr)]">
            {/* Left column: navigation */}
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {navItems.map((item, idx) => {
                  const Icon = item.icon;
                  const disabled = item.disabled;
                  return (
                    <Card
                      key={item.title}
                      role={disabled ? "button" : "link"}
                      tabIndex={0}
                      onClick={() => {
                        if (disabled) return;
                        setLoadingButton(idx);
                        router.push(item.href);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !disabled)
                          router.push(item.href);
                      }}
                      aria-disabled={disabled}
                      className={[
                        "transition hover:shadow-md group relative overflow-hidden",
                        disabled
                          ? "opacity-60 cursor-not-allowed"
                          : "cursor-pointer",
                      ].join(" ")}
                    >
                      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-stone-50 to-stone-100" />
                      <CardHeader className="space-y-1 relative">
                        <div className="flex items-center gap-2">
                          <div className="rounded-xl border bg-white p-2 shadow-sm">
                            <Icon className="h-4 w-4 text-stone-700" />
                          </div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {item.title}
                            {disabled && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-900">
                                <WifiOff className="h-3 w-3" />
                                Offline
                              </span>
                            )}
                          </CardTitle>
                        </div>
                        <CardDescription className="leading-relaxed text-xs text-stone-600">
                          {item.description}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="relative pt-0">
                        <Button
                          disabled={
                            disabled ||
                            (loadingButton !== null && loadingButton !== idx)
                          }
                          variant="outline"
                          className="ml-auto gap-2 rounded-full text-xs"
                        >
                          {loadingButton === idx && !disabled ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />{" "}
                              Φόρτωση...
                            </>
                          ) : (
                            <>
                              Μετάβαση <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Right column: stats + next appointment */}
            <div className="space-y-6">
              {/* Stats card */}
              <Card className="relative overflow-hidden">
                <div className="pointer-events-none absolute -top-20 -left-24 h-64 w-64 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-100 via-transparent to-transparent" />
                <CardHeader className="flex-row items-center justify-between relative">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full border bg-white p-1.5 shadow-sm">
                      <BarChart3 className="h-4 w-4 text-stone-700" />
                    </div>
                    <CardTitle className="text-base">Σύνοψη Ημέρας</CardTitle>
                  </div>

                  {isOnline ? (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="rounded-full text-xs"
                    >
                      <Link href="/admin/reports">Αναφορές</Link>
                    </Button>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full text-xs"
                          disabled
                        >
                          Αναφορές
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Μη διαθέσιμο εκτός σύνδεσης
                      </TooltipContent>
                    </Tooltip>
                  )}
                </CardHeader>

                <CardContent className="relative">
                  {isOnline ? (
                    stats ? (
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between text-xs text-stone-600">
                            <span>Ραντεβού σήμερα</span>
                            <span className="font-semibold text-stone-900 tabular-nums">
                              {stats.today}
                            </span>
                          </div>
                          <Progress value={progressPct} className="mt-2" />
                          <div className="mt-1 text-[11px] text-stone-600">
                            <span className="font-medium">
                              {stats.completedToday}
                            </span>{" "}
                            από{" "}
                            <span className="font-medium">{stats.today}</span>{" "}
                            έχουν ολοκληρωθεί.
                          </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-3">
                          <EdgeCard
                            label="Πρώτο ραντεβού"
                            data={dayEdges.first}
                          />
                          <EdgeCard
                            label="Τελευταίο ραντεβού"
                            data={dayEdges.last}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-xl border p-3">
                          <Skeleton className="h-4 w-28 mb-2" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-2/3 mt-2" />
                        </div>
                        <div className="rounded-xl border p-3">
                          <Skeleton className="h-4 w-28 mb-2" />
                          <Skeleton className="h-10 w-24" />
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-sm text-stone-600">
                      Τα στατιστικά δεν είναι διαθέσιμα εκτός σύνδεσης.
                    </div>
                  )}
                </CardContent>

                <CardFooter className="relative justify-between text-[11px] text-stone-500">
                  <span>
                    Τα δεδομένα ενημερώνονται αυτόματα με την ανανέωση.
                  </span>
                  {isOnline ? (
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-[11px] px-2 h-7"
                    >
                      <Link href="/admin/reports">
                        Προβολή αναφορών <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  ) : null}
                </CardFooter>
              </Card>

              {/* Next appointment */}
              <Card className="relative overflow-hidden">
                <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-100 via-transparent to-transparent" />
                <CardHeader className="flex-row items-center justify-between relative">
                  <div className="flex items-center gap-2">
                    <Hourglass className="h-5 w-5 text-stone-700" />
                    <CardTitle className="text-base">
                      Επόμενο ραντεβού
                    </CardTitle>
                  </div>
                  {nextAppt && (
                    <Badge
                      variant="secondary"
                      className="rounded-full text-xs flex items-center gap-1"
                    >
                      Σήμερα{" "}
                      {new Date(nextAppt.appointment_time).toLocaleTimeString(
                        "el-GR",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="relative">
                  {isOnline ? (
                    nextApptErr ? (
                      <p className="text-sm text-red-600">{nextApptErr}</p>
                    ) : nextAppt ? (
                      <NextAppt appt={nextAppt} />
                    ) : (
                      <div>
                        <p className="text-sm text-stone-600">
                          Δεν υπάρχει προγραμματισμένο επόμενο ραντεβού για
                          σήμερα.
                        </p>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <Skeleton className="h-3" />
                          <Skeleton className="h-3" />
                          <Skeleton className="h-3" />
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-sm text-stone-600">
                      Η προβολή επόμενου ραντεβού δεν είναι διαθέσιμη εκτός
                      σύνδεσης.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Bottom bar: shortcuts */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 flex items-center justify-end">
          <ShortcutsPopover />
        </section>

        {/* Floating help */}
        <div className="fixed bottom-6 right-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                disabled={!isOnline}
                className="rounded-full shadow-lg h-12 w-12"
                onClick={() => router.push("/admin/help")}
                aria-label="Χρειάζεστε βοήθεια;"
              >
                <LifeBuoy size={24} className="shrink-0" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Χρειάζεστε βοήθεια;</TooltipContent>
          </Tooltip>
        </div>
      </main>
    </TooltipProvider>
  );
}

function MiniStat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-stone-100 bg-white/80 px-4 py-3 shadow-sm flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
          {label}
        </p>
        <p className="mt-1 text-xs text-stone-500">{hint}</p>
      </div>
      <div className="text-2xl font-semibold tabular-nums text-stone-900">
        {value}
      </div>
    </div>
  );
}

function NextAppt({ appt }) {
  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-10 w-10">
        <AvatarFallback>
          {(appt.patient_name || "—")
            .split(" ")
            .map((s) => s?.[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="text-sm font-semibold truncate">
          {appt.patient_name ?? "—"}
        </div>
        <div className="text-xs text-stone-600">
          {new Date(appt.appointment_time).toLocaleDateString("el-GR", {
            day: "2-digit",
            month: "2-digit",
          })}{" "}
          • Διάρκεια {appt.duration_minutes ?? 30}′
        </div>
        <Separator className="my-3" />
        <div className="text-sm">
          <span className="text-stone-600">Λόγος:</span>{" "}
          <span className="font-medium">{appt.reason || "—"}</span>
        </div>
        <div className="mt-2">
          <Badge
            variant={
              appt.status === "approved"
                ? "default"
                : appt.status === "pending"
                ? "secondary"
                : "outline"
            }
            className="capitalize text-xs"
          >
            {appt.status}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function EdgeCard({ label, data }) {
  return (
    <div className="rounded-xl border border-stone-100 bg-white/80 p-3">
      <div className="flex items-center gap-2 text-[11px] text-stone-600">
        <CalendarRange className="h-4 w-4" /> {label}
      </div>
      {data ? (
        <div className="mt-1">
          <div className="text-sm font-semibold tabular-nums text-stone-900">
            {new Date(data.appointment_time).toLocaleTimeString("el-GR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <div className="text-xs text-stone-600 truncate">
            {data.patient_name ?? "—"}
          </div>
        </div>
      ) : (
        <div className="mt-1 text-xs text-stone-500 italic">
          Δεν υπάρχουν ραντεβού.
        </div>
      )}
    </div>
  );
}

function Kbd({ children }) {
  return (
    <kbd className="px-2 py-0.5 rounded border bg-white text-[11px] leading-none shadow-sm">
      {children}
    </kbd>
  );
}

function ShortcutsPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 rounded-full text-xs"
          aria-label="Πληκτροσυντομεύσεις"
        >
          <Command className="h-4 w-4" />
          <span className="font-medium">Συντομεύσεις</span>
          <Kbd>?</Kbd>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[320px] text-[12px]">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <span>Άνοιγμα «Νέο Ραντεβού»</span>
            <Kbd>N</Kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Άνοιγμα «Νέος Ασθενής»</span>
            <Kbd>P</Kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Βοήθεια / Εστίαση αναζήτησης</span>
            <div className="flex items-center gap-1">
              <Kbd>?</Kbd>
              <span className="text-stone-400">ή</span>
              <Kbd>/</Kbd>
            </div>
          </div>
        </div>
        <Separator className="my-2" />
        <div className="text-stone-500">
          Δεν ενεργοποιούνται όταν πληκτρολογείτε σε πεδίο.
        </div>
      </PopoverContent>
    </Popover>
  );
}
