"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import VisitorCountChart from "../../components/VisitorCountChart";
import { exportExcel } from "../../components/ExportExcel";

import {
  BarChart3,
  CalendarDays,
  Clock,
  Download,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  ArrowLeft,
  Calendar,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

// Utility helpers
const toUTCDateStart = (d) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
const fmtDate = (d) => d.toISOString().split("T")[0];

// Status labels & styling (for upcoming & general display)
const STATUS_LABELS = {
  approved: "Εγκεκριμένο",
  completed: "Ολοκληρωμένο",
  cancelled: "Ακυρωμένο",
  pending: "Σε εκκρεμότητα",
  scheduled: "Προγραμματισμένο",
  rejected: "Απορριφθέν",
};

const STATUS_PILLS = {
  approved: "bg-sky-50 border-sky-200 text-sky-800",
  completed: "bg-emerald-50 border-emerald-200 text-emerald-800",
  cancelled: "bg-rose-50 border-rose-200 text-rose-800",
  pending: "bg-amber-50 border-amber-200 text-amber-800",
  scheduled: "bg-indigo-50 border-indigo-200 text-indigo-800",
  rejected: "bg-slate-50 border-slate-200 text-slate-600",
};

// ---- AppointmentsChart (Approved vs Completed per day) ----
function AppointmentsChart({ data }) {
  return (
    <div className="bg-white/90 border border-emerald-50 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-700" />
          Ραντεβού (Εγκεκριμένα vs Ολοκληρωμένα)
        </h3>
        <span className="text-[11px] text-slate-500">
          Ημερήσια σύγκριση ανά ημέρα
        </span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="approvedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="completedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tickFormatter={(d) =>
                new Date(d).toLocaleDateString("el-GR", {
                  day: "2-digit",
                  month: "2-digit",
                })
              }
              tick={{ fontSize: 11, fill: "#6b7280" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              allowDecimals={false}
            />
            <Tooltip
              labelFormatter={(d) =>
                new Date(d).toLocaleDateString("el-GR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              }
              formatter={(v, name) => [
                v,
                name === "approved" ? "Εγκεκριμένα" : "Ολοκληρωμένα",
              ]}
            />
            <Legend
              formatter={(value) =>
                value === "approved" ? "Εγκεκριμένα" : "Ολοκληρωμένα"
              }
            />
            <Area
              type="monotone"
              dataKey="approved"
              stroke="#0ea5e9"
              fill="url(#approvedFill)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="completed"
              stroke="#10b981"
              fill="url(#completedFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// CSV helper kept (if you later want CSV exports)
function csvEscape(value) {
  if (value == null) return "";
  if (value instanceof Date) {
    return value.toLocaleDateString("el-GR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  if (typeof value === "object") value = JSON.stringify(value);
  const s = String(value);
  return /[",;\n\r]/.test(s) || /^\s|\s$/.test(s)
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Filters – default last 14 days
  const today = new Date();
  const initialStart = useMemo(() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 14);
    return toUTCDateStart(d);
  }, []);
  const [dateFrom, setDateFrom] = useState(fmtDate(initialStart));
  const [dateTo, setDateTo] = useState(fmtDate(toUTCDateStart(today)));

  // Data
  const [kpis, setKpis] = useState({
    total: 0,
    approved: 0,
    completed: 0,
    cancelled: 0,
    pending: 0,
    scheduled: 0,
    rejected: 0,
    patients: 0,
  });
  const [upcoming, setUpcoming] = useState([]);
  const [topReasons, setTopReasons] = useState([]);
  const [appointmentsSeries, setAppointmentsSeries] = useState([]);
  const [busy, setBusy] = useState(false);

  // Derived metrics
  const completionRate = useMemo(() => {
    if (!kpis.total) return 0;
    return Math.round((kpis.completed / kpis.total) * 100);
  }, [kpis.total, kpis.completed]);

  const cancellationRate = useMemo(() => {
    if (!kpis.total) return 0;
    return Math.round((kpis.cancelled / kpis.total) * 100);
  }, [kpis.total, kpis.cancelled]);

  const dateRangeLabel = useMemo(() => {
    if (!dateFrom || !dateTo) return "";
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return "";
    const opts = { day: "2-digit", month: "2-digit", year: "2-digit" };
    return `${from.toLocaleDateString("el-GR", opts)} – ${to.toLocaleDateString(
      "el-GR",
      opts
    )}`;
  }, [dateFrom, dateTo]);

  // Auth & profile
  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      const { data: prof } = await supabase
        .from("profiles")
        .select("name, avatar_url, role")
        .eq("id", session.user.id)
        .single();
      setProfile(prof);
      setLoading(false);
    };
    run();
  }, [router]);

  // Load stats (all main data)
  const loadStats = useCallback(async () => {
    setBusy(true);
    try {
      const startISO = new Date(dateFrom + "T00:00:00.000Z").toISOString();
      const endISO = new Date(dateTo + "T00:00:00.000Z");
      endISO.setUTCDate(endISO.getUTCDate() + 1); // exclusive upper bound
      const endStr = endISO.toISOString();
      const nowISO = new Date().toISOString();

      // Auto-complete past approved appointments
      const { error: autoError } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .lte("appointment_time", nowISO)
        .eq("status", "approved")
        .select("id");
      if (autoError) {
        console.error("Failed to auto-complete appointments:", autoError);
      }

      const [
        totalQ,
        approvedQ,
        completedQ,
        cancelledQ,
        pendingQ,
        scheduledQ,
        rejectedQ,
        patientsQ,
        upcomingQ,
        rangeAppointmentsQ,
      ] = await Promise.all([
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .gte("appointment_time", startISO)
          .lt("appointment_time", endStr),
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .gte("appointment_time", startISO)
          .lt("appointment_time", endStr)
          .eq("status", "approved"),
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .gte("appointment_time", startISO)
          .lt("appointment_time", endStr)
          .eq("status", "completed"),
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .gte("appointment_time", startISO)
          .lt("appointment_time", endStr)
          .eq("status", "cancelled"),
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .gte("appointment_time", startISO)
          .lt("appointment_time", endStr)
          .eq("status", "pending"),
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .gte("appointment_time", startISO)
          .lt("appointment_time", endStr)
          .eq("status", "scheduled"),
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .gte("appointment_time", startISO)
          .lt("appointment_time", endStr)
          .eq("status", "rejected"),
        supabase.from("patients").select("*", { count: "exact", head: true }),
        supabase
          .from("appointments")
          .select(
            "id, reason, appointment_time, status, duration_minutes, patient_id"
          )
          .gte("appointment_time", new Date().toISOString())
          .order("appointment_time", { ascending: true })
          .limit(5),
        supabase
          .from("appointments")
          .select("reason, appointment_time, status")
          .gte("appointment_time", startISO)
          .lt("appointment_time", endStr),
      ]);

      const k = {
        total: totalQ.count || 0,
        approved: approvedQ.count || 0,
        completed: completedQ.count || 0,
        cancelled: cancelledQ.count || 0,
        pending: pendingQ.count || 0,
        scheduled: scheduledQ.count || 0,
        rejected: rejectedQ.count || 0,
        patients: patientsQ.count || 0,
      };
      setKpis(k);
      setUpcoming(upcomingQ.data || []);

      const rangeData = rangeAppointmentsQ.data || [];

      // Top reasons (client-side tally)
      const tally = {};
      for (const r of rangeData) {
        const key = (r.reason || "Άλλο").trim();
        tally[key] = (tally[key] || 0) + 1;
      }
      const sortedReasons = Object.entries(tally)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setTopReasons(sortedReasons);

      // Daily series for chart
      const byDay = {};
      for (const r of rangeData) {
        const d = new Date(r.appointment_time);
        const dayKey = d.toISOString().split("T")[0];
        if (!byDay[dayKey]) {
          byDay[dayKey] = { day: dayKey, approved: 0, completed: 0 };
        }
        if (r.status === "approved") byDay[dayKey].approved += 1;
        if (r.status === "completed") byDay[dayKey].completed += 1;
      }
      const series = Object.values(byDay).sort((a, b) =>
        a.day.localeCompare(b.day)
      );
      setAppointmentsSeries(series);
    } finally {
      setBusy(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (!loading) {
      loadStats();
    }
  }, [loading, loadStats]);

  const maxBar = Math.max(1, kpis.total);

  // Simple loading screen while checking auth
  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Φόρτωση αναφορών…</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-slate-900">
      <section className="max-w-6xl mx-auto px-4 py-8 space-y-5">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-semibold text-emerald-800 shadow-sm">
              {(profile?.name?.[0] || user?.email?.[0] || "U")
                .toString()
                .toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-900">
                {profile?.name || "Χρήστης"}
              </span>
              <span className="text-xs text-slate-500">
                {user?.email ?? "—"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-100 bg-white text-slate-700 shadow-sm hover:bg-emerald-50"
              aria-label="Επιστροφή"
              title="Επιστροφή"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => loadStats()}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-emerald-100 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm hover:bg-emerald-50 disabled:opacity-60"
              aria-label="Ανανέωση"
              title="Ανανέωση"
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCcw className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Ανανέωση</span>
            </button>
          </div>
        </header>

        {/* Page Title */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-900">
                Αναφορές &amp; Στατιστικά
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Επισκόπηση ραντεβού, κατάστασης και επισκεψιμότητας για το
                επιλεγμένο διάστημα.
              </p>
            </div>
          </div>

          {dateRangeLabel && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] text-emerald-800">
              <Calendar className="mr-1 h-3 w-3" />
              Διάστημα:{" "}
              <span className="ml-1 font-semibold">{dateRangeLabel}</span>
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="space-y-3 rounded-2xl border border-emerald-50 bg-white/85 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800">
              Φίλτρα
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            {/* Από */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="dateFrom"
                className="text-[11px] font-medium text-slate-600"
              >
                Από
              </label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700/70" />
                <input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  min={fmtDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))}
                  max={dateTo}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDateFrom(val);
                    if (dateTo && val > dateTo) setDateTo(val);
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 shadow-sm outline-none ring-emerald-100 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Μέγιστο εύρος: 90 ημέρες πίσω.
              </p>
            </div>

            {/* Έως */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="dateTo"
                className="text-[11px] font-medium text-slate-600"
              >
                Έως
              </label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700/70" />
                <input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  max={fmtDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000))}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDateTo(val);
                    if (dateFrom && val < dateFrom) setDateFrom(val);
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 shadow-sm outline-none ring-emerald-100 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2"
                />
              </div>
            </div>

            {/* Quick ranges */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-slate-600">
                Γρήγορα φίλτρα
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    const iso = (x) => x.toISOString().slice(0, 10);
                    setDateFrom(iso(d));
                    setDateTo(iso(d));
                  }}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/70 hover:text-emerald-800"
                >
                  Σήμερα
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(start.getDate() - 6);
                    const iso = (x) => x.toISOString().slice(0, 10);
                    setDateFrom(iso(start));
                    setDateTo(iso(end));
                  }}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/70 hover:text-emerald-800"
                >
                  Τελευταίες 7 ημέρες
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    const start = new Date(d.getFullYear(), d.getMonth(), 1);
                    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                    const iso = (x) => x.toISOString().slice(0, 10);
                    setDateFrom(iso(start));
                    setDateTo(iso(end));
                  }}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/70 hover:text-emerald-800"
                >
                  Τρέχων μήνας
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex sm:items-end justify-start sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  startTransition(() => {
                    loadStats();
                  });
                }}
                className="inline-flex items-center justify-center rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-75"
                disabled={busy || isPending}
              >
                {busy || isPending ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    Εφαρμογή
                  </>
                ) : (
                  "Εφαρμογή"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  const rows = [
                    { metric: "Σύνολο ραντεβού", value: kpis.total },
                    { metric: "Εγκεκριμένα", value: kpis.approved },
                    { metric: "Ολοκληρωμένα", value: kpis.completed },
                    { metric: "Ακυρωμένα", value: kpis.cancelled },
                    { metric: "Σε εκκρεμότητα", value: kpis.pending },
                    { metric: "Προγραμματισμένα", value: kpis.scheduled },
                    { metric: "Απορριφθέντα", value: kpis.rejected },
                    { metric: "Σύνολο ασθενών", value: kpis.patients },
                    {
                      metric: "Ποσοστό ολοκλήρωσης",
                      value: `${completionRate}%`,
                    },
                    {
                      metric: "Ποσοστό ακυρώσεων",
                      value: `${cancellationRate}%`,
                    },
                  ];

                  exportExcel(`stats_${dateFrom}_to_${dateTo}.xlsx`, rows, {
                    headers: { metric: "Μετρική", value: "Τιμή" },
                    sheetName: "Στατιστικά",
                    dateFormat: "dd/mm/yyyy",
                    from: dateFrom,
                    to: dateTo,
                    titlePrefix: "Εύρος ημερομηνιών",
                  });
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-emerald-50"
              >
                <Download className="w-4 h-4" />
                Εξαγωγή Excel
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-emerald-50 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Σύνολο ραντεβού</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {kpis.total}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Όλα τα ραντεβού στο εύρος.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-50 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Εγκεκριμένα</p>
            <p className="mt-1 text-2xl font-semibold text-sky-700">
              {kpis.approved}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Ραντεβού που έχουν εγκριθεί.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-50 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Ολοκληρωμένα</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">
              {kpis.completed}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Ποσοστό ολοκλήρωσης:{" "}
              <span className="font-semibold">{completionRate}%</span>
            </p>
          </div>
          <div className="rounded-xl border border-emerald-50 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Ασθενείς</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {kpis.patients}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Συνολικός αριθμός καταχωρημένων ασθενών.
            </p>
          </div>
        </div>

        {/* Status distribution & chart row */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Status distribution */}
          <div className="bg-white/90 border border-emerald-50 rounded-2xl p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700" /> Κατανομή
              κατάστασης
            </h3>
            <div className="space-y-3">
              {[
                { label: "Εγκεκριμένα", key: "approved" },
                { label: "Ολοκληρωμένα", key: "completed" },
                { label: "Προγραμματισμένα", key: "scheduled" },
                { label: "Σε εκκρεμότητα", key: "pending" },
                { label: "Ακυρωμένα", key: "cancelled" },
                { label: "Απορριφθέντα", key: "rejected" },
              ].map((row) => (
                <div key={row.key} className="flex items-center gap-3">
                  <div className="w-40 text-xs text-slate-600">{row.label}</div>
                  <div className="flex-1 h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full bg-emerald-600"
                      style={{
                        width: `${Math.round((kpis[row.key] / maxBar) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="w-10 text-right text-xs text-slate-700">
                    {kpis[row.key]}
                  </div>
                </div>
              ))}
              <p className="mt-2 text-[11px] text-slate-400">
                Ποσοστό ακυρώσεων:{" "}
                <span className="font-semibold">{cancellationRate}%</span>
              </p>
            </div>
          </div>

          {/* Approved vs Completed per day chart */}
          <AppointmentsChart data={appointmentsSeries} />
        </div>

        {/* Top Reasons */}
        <div className="bg-white/90 border border-emerald-50 rounded-2xl p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <CalendarDays className="w-4 h-4 text-emerald-700" /> Συχνότεροι
            λόγοι επίσκεψης
          </h3>
          {topReasons.length === 0 ? (
            <p className="text-sm text-slate-500">
              Δεν υπάρχουν δεδομένα για το εύρος ημερομηνιών.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {topReasons.map((r) => (
                <li
                  key={r.reason}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span className="text-slate-800">{r.reason}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                    {r.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Visitor chart */}
        <div className="mt-4">
          <div className="bg-white/95 border border-emerald-50 rounded-3xl shadow-md p-6 hover:shadow-lg transition">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-indigo-100 p-2 text-indigo-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h2 className="text-base font-semibold text-slate-900">
                  Επισκεψιμότητα Ιατρείου
                </h2>
              </div>
              <span className="text-xs text-slate-500">
                Βάσει ραντεβού ({dateRangeLabel || "—"})
              </span>
            </div>
            <div className="h-72">
              <VisitorCountChart from={dateFrom} to={dateTo} title="" />
            </div>
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-white/90 border border-emerald-50 rounded-2xl p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Clock className="w-4 h-4 text-emerald-700" /> Επερχόμενα ραντεβού
            (επόμενα 5)
          </h3>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-500">
              Καμία επερχόμενη καταχώρηση.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-4">Ημερομηνία / Ώρα</th>
                    <th className="py-2 pr-4">Κατάσταση</th>
                    <th className="py-2 pr-4">Λόγος</th>
                    <th className="py-2 pr-4">Διάρκεια</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((a) => {
                    const d = new Date(a.appointment_time);
                    const label = STATUS_LABELS[a.status] || a.status;
                    const cls =
                      STATUS_PILLS[a.status] ||
                      "bg-slate-50 border-slate-200 text-slate-600";
                    return (
                      <tr
                        key={a.id}
                        className="border-t border-slate-100 hover:bg-emerald-50/50"
                      >
                        <td className="py-2 pr-4 text-[13px] text-slate-800">
                          {d.toLocaleString("el-GR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-2 pr-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}
                          >
                            {label}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-[13px] text-slate-700">
                          {a.reason || "—"}
                        </td>
                        <td className="py-2 pr-4 text-[13px] text-slate-700">
                          {a.duration_minutes || 30}′
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
