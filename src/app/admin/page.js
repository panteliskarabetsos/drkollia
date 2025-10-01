"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { supabase } from "../lib/supabaseClient";

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
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [loadingButton, setLoadingButton] = useState(null);

  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [nextAppt, setNextAppt] = useState(null);
  const [nextApptErr, setNextApptErr] = useState(null);

  const [dayEdges, setDayEdges] = useState({ first: null, last: null });

  // ---------- Data loaders ----------
  const loadStats = useCallback(async () => {
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
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      // First sync backend-completed, then refresh UI data in parallel
      await syncCompleted();
      await Promise.all([loadStats(), loadDayEdges(), loadNextAppointment()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadStats]);

  const syncCompleted = useCallback(async () => {
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
  }, []);

  const loadProfile = useCallback(async (uid) => {
    const { data } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", uid)
      .single();
    setProfile(data);
  }, []);

  const loadNextAppointment = useCallback(async () => {
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
      if (!appt) return setNextAppt(null);

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
  }, []);

  const loadDayEdges = useCallback(async () => {
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
  }, []);

  // ---------- Effects ----------
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      setLoading(false);
      await Promise.all([
        loadStats(),
        loadProfile(session.user.id),
        loadDayEdges(),
        loadNextAppointment(),
      ]);
      syncCompleted();

      const interval = setInterval(() => {
        loadStats();
      }, 5 * 60 * 1000);
      return () => clearInterval(interval);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

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
  const navItems = [
    {
      title: "Ραντεβού",
      description: "Διαχείριση προγραμματισμένων ραντεβού.",
      href: "/admin/appointments",
      icon: CalendarDays,
    },
    {
      title: "Ασθενείς",
      description: "Προβολή και επεξεργασία αρχείου ασθενών.",
      href: "/admin/patients",
      icon: UserIcon,
    },
    {
      title: "Πρόγραμμα",
      description: "Διαχείριση προγράμματος λειτουργίας και εξαιρέσεων.",
      href: "/admin/schedule",
      icon: Clock,
    },
    {
      title: "Πρόσβαση",
      description: "Διαχείριση και δημιουργία λογαριασμών διαχειριστών.",
      href: "/admin/accounts",
      icon: ShieldCheck,
    },
  ];

  const progressPct = useMemo(() => {
    if (!stats || stats.today === 0) return 0;
    const pct = Math.round((stats.completedToday / stats.today) * 100);
    return Math.min(100, Math.max(0, pct));
  }, [stats]);

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 grid place-items-center">
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
      <main className="min-h-screen bg-gradient-to-b from-stone-50/70 via-white to-white text-stone-800">
        {/* Header / hero */}
        <section className="relative">
          <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_0%,#000_20%,transparent_70%)] bg-[radial-gradient(1200px_500px_at_10%_-10%,#f1efe8_20%,transparent),radial-gradient(1000px_400px_at_90%_-20%,#ece9e0_20%,transparent)]" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-500">
                  {todayStr}
                </p>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                  Πίνακας Διαχείρισης
                </h1>
                <p className="mt-1 text-stone-600">
                  Καλώς ήρθατε{profile?.name ? `, ${profile.name}` : ""}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="gap-2"
                    >
                      {refreshing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCcw className="h-4 w-4" />
                      )}
                      Ανανέωση
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Συγχρονισμός</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
          <Separator />
        </section>

        {/* Content grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Quick nav cards */}
            {navItems.map((item, idx) => (
              <Card
                key={item.title}
                role="link"
                tabIndex={0}
                onClick={() => {
                  setLoadingButton(idx);
                  router.push(item.href);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") router.push(item.href);
                }}
                className="transition hover:shadow-md cursor-pointer group"
              >
                <CardHeader className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg border bg-white p-2 shadow-sm">
                      <item.icon className="h-4 w-4 text-stone-700" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                  <CardDescription className="leading-relaxed">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    disabled={loadingButton !== null && loadingButton !== idx}
                    variant="outline"
                    className="ml-auto gap-2"
                  >
                    {loadingButton === idx ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Φόρτωση...
                      </>
                    ) : (
                      <>
                        Μετάβαση <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}

            {/* Stats card */}
            <Card className="relative overflow-hidden">
              <div className="pointer-events-none absolute -top-20 -left-24 h-64 w-64 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-100 via-transparent to-transparent" />
              <CardHeader className="flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full border bg-white p-1.5 shadow-sm">
                    <BarChart3 className="h-4 w-4 text-stone-700" />
                  </div>
                  <CardTitle>Σύνοψη</CardTitle>
                </div>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                >
                  <Link href="/admin/reports">Αναφορές</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {stats ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm text-stone-600">
                        <span>Ραντεβού σήμερα</span>
                        <span className="font-semibold text-stone-800 tabular-nums">
                          {stats.today}
                        </span>
                      </div>
                      <Progress value={progressPct} className="mt-2" />
                      <div className="mt-1 text-xs text-stone-600">
                        <span className="font-medium">
                          {stats.completedToday}
                        </span>{" "}
                        από <span className="font-medium">{stats.today}</span>{" "}
                        ολοκληρώθηκαν
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border p-3">
                        <div className="flex items-center gap-2 text-[11px] text-stone-600">
                          <CalendarRange className="h-4 w-4" /> Πρώτο
                        </div>
                        {dayEdges.first ? (
                          <div className="mt-1">
                            <div className="text-sm font-semibold tabular-nums">
                              {new Date(
                                dayEdges.first.appointment_time
                              ).toLocaleTimeString("el-GR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            <div className="text-xs text-stone-600 truncate">
                              {dayEdges.first.patient_name ?? "—"}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-stone-500 italic">
                            Δεν υπάρχουν
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border p-3">
                        <div className="flex items-center gap-2 text-[11px] text-stone-600">
                          <CalendarRange className="h-4 w-4" /> Τελευταίο
                        </div>
                        {dayEdges.last ? (
                          <div className="mt-1">
                            <div className="text-sm font-semibold tabular-nums">
                              {new Date(
                                dayEdges.last.appointment_time
                              ).toLocaleTimeString("el-GR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            <div className="text-xs text-stone-600 truncate">
                              {dayEdges.last.patient_name ?? "—"}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-stone-500 italic">
                            Δεν υπάρχουν
                          </div>
                        )}
                      </div>
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
                )}
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/admin/reports">
                    Προβολή Αναφορών <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Next appointment */}
            <Card className="relative overflow-hidden">
              <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-100 via-transparent to-transparent" />
              <CardHeader className="flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hourglass className="h-5 w-5 text-stone-700" />
                  <CardTitle>Επόμενο ραντεβού</CardTitle>
                </div>
                {nextAppt && (
                  <Badge variant="secondary" className="rounded-full text-xs">
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
              <CardContent>
                {nextApptErr ? (
                  <p className="text-sm text-red-600">{nextApptErr}</p>
                ) : nextAppt ? (
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {(nextAppt.patient_name || "—")
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
                        {nextAppt.patient_name ?? "—"}
                      </div>
                      <div className="text-xs text-stone-600">
                        {new Date(nextAppt.appointment_time).toLocaleDateString(
                          "el-GR",
                          {
                            day: "2-digit",
                            month: "2-digit",
                          }
                        )}{" "}
                        • Διάρκεια {nextAppt.duration_minutes ?? 30}′
                      </div>

                      <Separator className="my-3" />

                      <div className="text-sm">
                        <span className="text-stone-600">Λόγος:</span>{" "}
                        <span className="font-medium">
                          {nextAppt.reason || "—"}
                        </span>
                      </div>

                      <div className="mt-2">
                        <Badge
                          variant={
                            nextAppt.status === "approved"
                              ? "default"
                              : nextAppt.status === "pending"
                              ? "secondary"
                              : "outline"
                          }
                          className="capitalize"
                        >
                          {nextAppt.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-stone-600">
                      Δεν υπάρχει επόμενο ραντεβού για σήμερα.
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <Skeleton className="h-3" />
                      <Skeleton className="h-3" />
                      <Skeleton className="h-3" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Bottom bar */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 flex items-center justify-end">
          <ShortcutsPopover />
        </section>

        {/* Floating help */}
        <div className="fixed bottom-6 right-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className="rounded-full shadow-lg h-12 w-12"
                onClick={() => router.push("/admin/help")}
                aria-label="Χρειάζεστε βοήθεια;"
              >
                <LifeBuoy className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Χρειάζεστε βοήθεια;</TooltipContent>
          </Tooltip>
        </div>
      </main>
    </TooltipProvider>
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
          className="gap-2 rounded-full"
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
