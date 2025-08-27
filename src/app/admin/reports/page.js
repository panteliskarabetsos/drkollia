"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import {
  BarChart3,
  CalendarDays,
  Clock,
  Download,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

// Utility helpers
const toUTCDateStart = (d) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
const fmtDate = (d) => d.toISOString().split("T")[0];

function csvEscape(value) {
  if (value == null) return "";
  const s = String(value);
  if (/[\",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function exportCSV(filename, rows) {
  const header = Object.keys(rows[0] || { index: 0 }).join(",");
  const body = rows
    .map((r) =>
      Object.keys(rows[0] || { index: 0 })
        .map((k) => csvEscape(r[k]))
        .join(",")
    )
    .join("\n");
  const csv = header + "\n" + body;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Filters
  const today = new Date();
  const initialStart = useMemo(() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 14); // default last 14 days
    return toUTCDateStart(d);
  }, []);
  const [dateFrom, setDateFrom] = useState(fmtDate(initialStart));
  const [dateTo, setDateTo] = useState(fmtDate(toUTCDateStart(today))); // inclusive end handled below

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
  const [busy, setBusy] = useState(false);

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

  const loadStats = async () => {
    setBusy(true);
    try {
      const startISO = new Date(dateFrom + "T00:00:00.000Z").toISOString();
      const endISO = new Date(dateTo + "T00:00:00.000Z");
      endISO.setUTCDate(endISO.getUTCDate() + 1); // move to next day start for exclusive upper bound
      const endStr = endISO.toISOString();

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
        reasonsQ,
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
          .select("reason")
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

      // Top reasons (client-side tally)
      const tally = {};
      for (const r of reasonsQ.data || []) {
        const key = (r.reason || "Άλλο").trim();
        tally[key] = (tally[key] || 0) + 1;
      }
      const sortedReasons = Object.entries(tally)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setTopReasons(sortedReasons);
    } finally {
      setBusy(false);
    }
  };
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
    if (!loading) loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const maxBar = Math.max(1, kpis.total);

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#333] font-sans">
      <section className="max-w-6xl mx-auto px-4 py-26">
        {/* Header */}
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold text-gray-700">
              {(profile?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-800">
                {profile?.name || "Χρήστης"}
              </span>
              <span className="text-xs text-gray-500">{user?.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Back button */}
            <button
              onClick={() => router.back()}
              className="p-2 rounded-md hover:bg-gray-200 transition"
              aria-label="Επιστροφή"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => startTransition(loadStats)}
              className="p-2 rounded-md hover:bg-gray-200 transition"
              aria-label="Ανανέωση"
            >
              {busy ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCcw className="w-5 h-5" />
              )}
            </button>
          </div>
        </header>

        {/* Title */}
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5" />
          <h1 className="text-2xl font-semibold">Αναφορές & Στατιστικά</h1>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Από</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Έως</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startTransition(loadStats)}
                className="px-4 py-2 text-sm rounded-md border hover:bg-gray-900 hover:text-white transition"
              >
                Εφαρμογή
              </button>
              <button
                onClick={() => {
                  const rows = [
                    { metric: "Σύνολο", value: kpis.total },
                    { metric: "Εγκεκριμένα", value: kpis.approved },
                    { metric: "Ολοκληρωμένα", value: kpis.completed },
                    { metric: "Ακυρωμένα", value: kpis.cancelled },
                    { metric: "Σε εκκρεμότητα", value: kpis.pending },
                    { metric: "Προγραμματισμένα", value: kpis.scheduled },
                    { metric: "Απορριφθέντα", value: kpis.rejected },
                    { metric: "Σύνολο Ασθενών", value: kpis.patients },
                  ];
                  exportCSV(`stats_${dateFrom}_to_${dateTo}.csv`, rows);
                }}
                className="px-4 py-2 text-sm rounded-md border hover:bg-gray-100 transition inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Εξαγωγή CSV
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">Σύνολο ραντεβού</p>
            <p className="text-2xl font-semibold">{kpis.total}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">Εγκεκριμένα</p>
            <p className="text-2xl font-semibold">{kpis.approved}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">Ολοκληρωμένα</p>
            <p className="text-2xl font-semibold">{kpis.completed}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">Ακυρωμένα</p>
            <p className="text-2xl font-semibold">{kpis.cancelled}</p>
          </div>
        </div>

        {/* Status distribution (simple bars) */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Κατανομή κατάστασης
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
                <div className="w-40 text-xs text-gray-600">{row.label}</div>
                <div className="flex-1 h-3 bg-gray-100 rounded">
                  <div
                    className="h-3 bg-gray-800 rounded"
                    style={{
                      width: `${Math.round((kpis[row.key] / maxBar) * 100)}%`,
                    }}
                  />
                </div>
                <div className="w-10 text-right text-xs text-gray-700">
                  {kpis[row.key]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Reasons */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Συχνότεροι λόγοι επίσκεψης
          </h3>
          {topReasons.length === 0 ? (
            <p className="text-sm text-gray-500">
              Δεν υπάρχουν δεδομένα για το εύρος ημερομηνιών.
            </p>
          ) : (
            <ul className="divide-y">
              {topReasons.map((r) => (
                <li
                  key={r.reason}
                  className="py-2 flex items-center justify-between text-sm"
                >
                  <span className="text-gray-700">{r.reason}</span>
                  <span className="font-semibold">{r.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Upcoming */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Επερχόμενα ραντεβού (επόμενα 5)
          </h3>
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-500">
              Καμία επερχόμενη καταχώρηση.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="py-2 pr-4">Ημερομηνία/Ώρα</th>
                    <th className="py-2 pr-4">Κατάσταση</th>
                    <th className="py-2 pr-4">Λόγος</th>
                    <th className="py-2 pr-4">Διάρκεια</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((a) => (
                    <tr key={a.id} className="border-t">
                      <td className="py-2 pr-4">
                        {new Date(a.appointment_time).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border">
                          {a.status}
                        </span>
                      </td>
                      <td className="py-2 pr-4">{a.reason || "—"}</td>
                      <td className="py-2 pr-4">{a.duration_minutes || 30}′</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
