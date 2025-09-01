"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import {
  CalendarDays,
  User,
  Clock,
  ShieldCheck,
  ArrowRight,
  Loader2,
  LifeBuoy,
  LogOut,
  BarChart3,
  Hourglass,
  Users,
  CalendarRange,
  Sunrise,
  Sunset,
  RefreshCcw,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [loadingButton, setLoadingButton] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [nextAppt, setNextAppt] = useState(null);
  const [nextApptErr, setNextApptErr] = useState(null);
  const [dayEdges, setDayEdges] = useState({ start: null, last: null });
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadStats = useCallback(async () => {
    // Use local day window (clinic local time)
    const now = new Date();
    const startLocal = new Date(now);
    startLocal.setHours(0, 0, 0, 0);
    const endLocal = new Date(now);
    endLocal.setHours(23, 59, 59, 999);

    const startISO = startLocal.toISOString(); // DB is UTC (timestamptz), ISO is fine
    const endISO = endLocal.toISOString();
    const nowISO = now.toISOString();

    const [
      // all of today (any status)
      { count: todayCount },
      // already flipped to completed within today window
      { count: completedFlipped },
      // approved for today but already in the past (not flipped yet)
      { count: approvedPastNow },
      // total patients
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

    // Combine both buckets to show real-world “completed today”
    const completedToday = (completedFlipped || 0) + (approvedPastNow || 0);

    setStats({
      today: todayCount ?? 0,
      completedToday,
      patients: patientsCount ?? 0,
    });
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setStats(null);

      await loadStats();
    } finally {
      setRefreshing(false);
    }
  };

  const syncCompleted = useCallback(async () => {
    try {
      setSyncing(true);
      await fetch("/api/mark-completed", {
        method: "POST",
        headers: {
          // Only include if you set ADMIN_SYNC_KEY on the server
          "x-admin-key": process.env.NEXT_PUBLIC_ADMIN_SYNC_KEY || "",
        },
        cache: "no-store",
      });
    } catch (e) {
      console.error("syncCompleted failed", e);
    } finally {
      setSyncing(false);
    }
  }, []);
  useEffect(() => {
    // Run once when /admin loads
    syncCompleted();
  }, [syncCompleted]);

  useEffect(() => {
    // πρώτο load
    handleRefresh();

    // interval κάθε 5 λεπτά
    const interval = setInterval(() => {
      handleRefresh();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval); // καθάρισμα
  }, []);
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        setLoading(false);
        await loadStats(); // αρχικό φόρτωμα στατιστικών
      }
    };
    checkSession();
  }, [router, loadStats]);

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();
      setProfile(data);
    };

    if (user) loadProfile();
  }, [user]);

  useEffect(() => {
    const loadNextAppointment = async () => {
      setNextApptErr(null);
      try {
        const now = new Date();
        const nowISO = now.toISOString();

        // Υπολογισμός τέλους ημέρας (23:59:59.999)
        const endOfDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        ).toISOString();

        // 1) Πάρε το πρώτο επερχόμενο ΣΗΜΕΡΑ (0X00 έως 23:59)
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

        // 2) Φέρε όνομα ασθενή
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
    };

    loadNextAppointment();
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  useEffect(() => {
    const loadDayEdges = async () => {
      // Τοπικά μεσάνυχτα -> ακριβή UTC instants
      const startLocal = new Date();
      startLocal.setHours(0, 0, 0, 0);
      const endLocal = new Date();
      endLocal.setHours(23, 59, 59, 999);
      const startISO = startLocal.toISOString();
      const endISO = endLocal.toISOString();

      // Earliest & latest για σήμερα (μη ακυρωμένα)
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

      // Φέρε ονόματα ασθενών (1 κλήση για όσα χρειάζεται)
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
    };

    loadDayEdges();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fafafa] text-[#333]">
        <p className="text-sm text-gray-500">Έλεγχος σύνδεσης...</p>
      </main>
    );
  }

  const items = [
    {
      title: "Ραντεβού",
      description: "Διαχείριση προγραμματισμένων ραντεβού.",
      href: "/admin/appointments",
      icon: <CalendarDays className="w-5 h-5 text-[#3a3a38]" />,
    },
    {
      title: "Ασθενείς",
      description: "Προβολή και επεξεργασία αρχείου ασθενών.",
      href: "/admin/patients",
      icon: <User className="w-5 h-5 text-[#3a3a38]" />,
    },
    {
      title: "Πρόγραμμα",
      description: "Διαχείριση προγράμματος λειτουργίας και εξαιρέσεων.",
      href: "/admin/schedule",
      icon: <Clock className="w-5 h-5 text-[#3a3a38]" />,
    },
    {
      title: "Πρόσβαση",
      description: "Διαχείριση και δημιουργία λογαριασμών διαχειριστών.",
      href: "/admin/accounts",
      icon: <ShieldCheck className="w-5 h-5 text-[#3a3a38]" />,
    },
  ];

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#333] font-sans relative">
      <section className="py-22 px-4 max-w-6xl mx-auto">
        <header className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-start">
          <div className="flex items-center gap-3">
            {/* User Circle Avatar */}
            <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold text-gray-700">
              {profile?.name?.[0]?.toUpperCase() ??
                user?.email?.[0]?.toUpperCase() ??
                "U"}
            </div>

            {/* Name + Email */}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-800">
                {profile?.name ?? "Χρήστης"}
              </span>
              <span className="text-xs text-gray-500">{user?.email}</span>
            </div>
            {/* Refresh button */}
            <button
              onClick={async () => {
                try {
                  setRefreshing(true);
                  setStats(null); // προαιρετικά για skeleton state
                  await loadStats(); // περιμένουμε να φορτώσει
                } finally {
                  setRefreshing(false);
                }
              }}
              className="p-2 rounded-md hover:bg-gray-200 transition"
              aria-label="Ανανέωση"
            >
              <RefreshCcw
                className={`w-5 h-5 text-gray-600 hover:text-gray-900 ${
                  refreshing ? "animate-spin " : ""
                }`}
              />
            </button>
            {/* Logout Icon Button */}
            {/* <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
              className="ml-4 p-2 rounded-md hover:bg-gray-200 transition"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-600 hover:text-gray-900" />
            </button> */}
          </div>
        </header>

        <h1 className="text-3xl font-medium text-center mb-12 tracking-tight">
          Πίνακας Διαχείρισης
        </h1>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="group border border-gray-200 bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition duration-200 hover:scale-[1.01] flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-3">
                {item.icon}
                <h2 className="text-lg font-semibold">{item.title}</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6">{item.description}</p>
              <button
                onClick={() => {
                  setLoadingButton(idx);
                  router.push(item.href);
                }}
                className="inline-flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-[#3a3a38] hover:text-white transition font-medium shadow-sm disabled:opacity-60"
                disabled={loadingButton !== null}
              >
                {loadingButton === idx ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Φόρτωση...
                  </>
                ) : (
                  <>
                    Μετάβαση
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ))}

          {/* --- Extra Card with Stats --- */}

          {/* --- Extra Card with Stats (enhanced) --- */}
          <div className="relative overflow-hidden border border-[#e5e1d8] bg-white/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col backdrop-blur group">
            {/* soft background accent */}
            <div className="pointer-events-none absolute -top-20 -left-24 w-64 h-64 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#f4f1ea] via-transparent to-transparent opacity-80" />
            <div className="pointer-events-none absolute -bottom-20 -right-24 w-64 h-64 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#efece5] via-transparent to-transparent opacity-70" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center justify-center rounded-full border border-[#e5e1d8] bg-white/80 p-1 shadow-sm">
                  <BarChart3
                    className="w-4 h-4 text-[#8c7c68]"
                    aria-hidden="true"
                  />
                </div>
                <h2 className="text-lg font-semibold text-[#2f2e2b] tracking-tight">
                  Σύνοψη
                </h2>
              </div>

              {/* subtle link to reports */}
              <button
                onClick={() => router.push("/admin/reports")}
                className="text-xs rounded-full px-3 py-1 border border-[#e5e1d8] text-[#6b675f] bg-white/80 hover:bg-[#8c7c68] hover:text-white transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c7c68]/40"
                aria-label="Μετάβαση στις αναφορές"
                title="Μετάβαση στις αναφορές"
              >
                Αναφορές
              </button>
            </div>

            {/* Content */}
            {stats ? (
              <>
                {/* KPI row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Today */}
                  <div className="rounded-2xl border border-[#e5e1d8] bg-white/95 px-3 py-3 shadow-sm transition-transform duration-300 group-hover:translate-y-[-1px]">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarDays
                        className="w-4 h-4 text-[#8c7c68]"
                        aria-hidden="true"
                      />
                      <span className="text-xs font-medium text-[#6b675f]">
                        Ραντεβού σήμερα
                      </span>
                    </div>
                    <p className="text-3xl font-semibold text-[#2f2e2b] leading-tight tabular-nums">
                      {stats.today}
                    </p>

                    {/* Real progress: completedToday / today */}
                    <div
                      className="mt-2 h-2 w-full bg-[#f3f1ec] rounded-full overflow-hidden"
                      aria-hidden="true"
                    >
                      <div
                        className="h-2 bg-[#8c7c68] transition-all"
                        style={{
                          width: `${
                            stats.today > 0
                              ? Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    Math.round(
                                      (stats.completedToday / stats.today) * 100
                                    )
                                  )
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-[#6b675f]">
                      <span className="font-medium">
                        {stats.completedToday}
                      </span>{" "}
                      από <span className="font-medium">{stats.today}</span>{" "}
                      ολοκληρώθηκαν
                    </p>
                  </div>

                  {/* First & Last Today */}
                  <div className="rounded-xl border border-[#e5e1d8] bg-white/95 p-3 shadow-sm flex flex-col justify-between transition-transform duration-300 group-hover:translate-y-[-1px]">
                    <div>
                      {/* Header */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <CalendarRange
                          className="w-4 h-4 text-[#8c7c68]"
                          aria-hidden="true"
                        />
                        <span className="text-[11px] font-semibold tracking-wide text-[#5c5345] uppercase">
                          Πρώτο & Τελευταίο
                        </span>
                      </div>

                      {/* Times */}
                      {dayEdges.first || dayEdges.last ? (
                        <div className="space-y-1.5">
                          {dayEdges.first && (
                            <div className="flex items-center justify-between text-[12px]">
                              <span className="text-[#7a7468]">Πρ.</span>
                              <span className="font-semibold tabular-nums text-[#2f2e2b]">
                                {new Date(
                                  dayEdges.first.appointment_time
                                ).toLocaleTimeString("el-GR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          )}
                          {dayEdges.last && (
                            <div className="flex items-center justify-between text-[12px]">
                              <span className="text-[#7a7468]">Τελ.</span>
                              <span className="font-semibold tabular-nums text-[#2f2e2b]">
                                {new Date(
                                  dayEdges.last.appointment_time
                                ).toLocaleTimeString("el-GR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-gray-400 italic">
                          Δεν υπάρχουν
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* fine divider */}
                <div className="my-4 h-px bg-gradient-to-r from-transparent via-[#e5e1d8] to-transparent" />

                {/* micro-footnotes (optional) */}
                {/* <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#6b675f]">
      <span className="inline-flex items-center gap-1">
        <span className="inline-block h-2 w-2 rounded-full bg-[#8c7c68]" />
        σήμερα
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="inline-block h-2 w-2 rounded-full bg-green-600" />
        ολοκληρωμένα
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="inline-block h-2 w-2 rounded-full bg-[#3a3a38]" />
        σύνολο ασθενών
      </span>
    </div> */}
              </>
            ) : (
              // Loading state
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-[#e5e1d8] bg-white/90 px-3 py-3 shadow-sm"
                  >
                    <div className="h-4 w-18 bg-[#f2efe9] rounded mb-3 animate-pulse" />
                    <div className="h-4 w-20 bg-[#f2efe9] rounded mb-2 animate-pulse" />
                    <div className="h-2 w-full bg-[#f2efe9] rounded animate-pulse" />
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => router.push("/admin/reports")}
              className="mt-2 inline-flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-md border border-[#e5e1d8] text-[#2f2e2b] bg-white/80 hover:bg-[#3a3a38] hover:text-white transition font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c7c68]/40"
              aria-label="Προβολή Αναφορών"
              title="Προβολή Αναφορών"
            >
              Προβολή Αναφορών
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* --- Next Appointment Card--- */}
          <div className="group relative overflow-hidden border border-[#e5e1d8] bg-white/90 rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between backdrop-blur">
            {/* Soft gradient accent */}
            <div className="pointer-events-none absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#efece5] via-transparent to-transparent opacity-70" />

            {/* Ribbon */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 mb-3">
                <Hourglass className="w-5 h-5 text-[#8c7c68] animate-pulse" />
                <h2 className="text-lg font-semibold text-[#2f2e2b]">
                  Επόμενο ραντεβού
                </h2>
              </div>

              {/* Time chip (today) */}
              {nextAppt && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-[#f6f4ef] text-[#6b675f] border border-[#e5e1d8] shadow-sm">
                  {new Date(nextAppt.appointment_time).toLocaleTimeString(
                    "el-GR",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </span>
              )}
            </div>

            {/* Content */}
            {nextApptErr ? (
              <p className="text-sm text-red-600 mb-4">{nextApptErr}</p>
            ) : nextAppt ? (
              <div className="mb-4 space-y-3">
                {/* Patient row */}
                <div className="flex items-center gap-3">
                  {/* Avatar / initials */}
                  <div className="flex-shrink-0 grid place-items-center w-9 h-9 rounded-full bg-[#efece5] text-[#2f2e2b] font-semibold shadow-sm border border-[#e5e1d8]">
                    {(nextAppt.patient_name || "—")
                      .split(" ")
                      .map((s) => s?.[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#2f2e2b] leading-tight truncate">
                      {nextAppt.patient_name ?? "—"}
                    </p>
                    <p className="text-xs text-[#6b675f]">
                      {new Date(nextAppt.appointment_time).toLocaleDateString(
                        "el-GR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                        }
                      )}
                      {" • "}
                      Διάρκεια {nextAppt.duration_minutes ?? 30}′
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-[#e5e1d8] to-transparent" />

                {/* Reason + Status */}
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-[#3b3a36]">
                    <span className="font-medium text-[#6b675f]">Λόγος:</span>{" "}
                    <span className="truncate align-middle">
                      {nextAppt.reason || "—"}
                    </span>
                  </p>

                  <span
                    className={[
                      "w-fit inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-sm",
                      nextAppt.status === "approved"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : nextAppt.status === "pending"
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "bg-gray-50 border-gray-200 text-gray-600",
                    ].join(" ")}
                  >
                    {nextAppt.status}
                  </span>
                </div>
                <div className="h-8 " />
              </div>
            ) : (
              <div className="mb-4 space-y-2">
                <p className="text-sm text-gray-500">
                  Δεν υπάρχει επόμενο ραντεβού για σήμερα.
                </p>
                {/* Skeleton for empty state to keep height stable */}
                <div className="h-3 w-2/3 bg-[#f2efe9] rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-[#f2efe9] rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-[#f2efe9] rounded animate-pulse" />
                <div className="h-8 " />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Floating Help Button with Hover Text */}
      <div className="fixed bottom-6 right-6 flex items-center space-x-2 group">
        {/* Hover text */}
        <span className="opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 bg-white text-gray-700 text-sm px-3 py-1 rounded-lg shadow-md">
          Χρειάζεστε βοήθεια?
        </span>

        {/* Icon button */}
        <button
          onClick={() => router.push("/help")}
          aria-label="Need help?"
          className="p-3 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          <LifeBuoy className="w-8 h-8" />
        </button>
      </div>
    </main>
  );
}
