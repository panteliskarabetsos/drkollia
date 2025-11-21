"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import {
  History,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  ArrowLeft,
  Loader2,
  Download,
  Search,
} from "lucide-react";

// Helpers
const isoDate = (d) => d.toISOString().split("T")[0];
const TODAY = new Date();
const MIN_90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
const MIN_DATE = isoDate(MIN_90);
const MAX_DATE = isoDate(TODAY);
const DAY_MS = 24 * 60 * 60 * 1000;

const QUICK_RANGES = [
  { label: "7 ημέρες", days: 7 },
  { label: "30 ημέρες", days: 30 },
  { label: "90 ημέρες", days: 90 },
];

const STATUS_LABELS = {
  completed: "Ολοκληρωμένο",
  approved: "Εγκεκριμένο",
  cancelled: "Ακυρωμένο",
  pending: "Σε εκκρεμότητα",
  scheduled: "Προγραμματισμένο",
  rejected: "Απορριφθέν",
};

const STATUS_BADGE_STYLES = {
  completed: "bg-emerald-50 border-emerald-200 text-emerald-800",
  approved: "bg-sky-50 border-sky-200 text-sky-800",
  cancelled: "bg-rose-50 border-rose-200 text-rose-800",
  pending: "bg-amber-50 border-amber-200 text-amber-800",
  scheduled: "bg-indigo-50 border-indigo-200 text-indigo-800",
  rejected: "bg-slate-50 border-slate-200 text-slate-600",
};

const getQuickRangeFrom = (days) => {
  if (days === 90) {
    return MIN_DATE;
  }
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const fromDate = new Date(now.getTime() - (days - 1) * DAY_MS);
  const fromStr = isoDate(fromDate);
  return fromStr < MIN_DATE ? MIN_DATE : fromStr;
};

export default function PastAppointmentsPage() {
  const router = useRouter();

  // Filters
  const [dateFrom, setDateFrom] = useState(MIN_DATE);
  const [dateTo, setDateTo] = useState(MAX_DATE);
  const [status, setStatus] = useState("all"); // all | completed | approved | cancelled | pending | scheduled | rejected
  const [patientQuery, setPatientQuery] = useState("");

  // Data
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 12;

  // UI
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isExportingPage, setIsExportingPage] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);

  // Clamp Από ≤ Έως and inside [-90d .. today]
  useEffect(() => {
    if (dateFrom < MIN_DATE) setDateFrom(MIN_DATE);
    if (dateTo > MAX_DATE) setDateTo(MAX_DATE);
    if (dateFrom > dateTo) setDateTo(dateFrom);
  }, [dateFrom, dateTo]);

  const pages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const rangeLabel = useMemo(() => {
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

  const isQuickRangeActive = useCallback(
    (days) => dateFrom === getQuickRangeFrom(days) && dateTo === MAX_DATE,
    [dateFrom, dateTo]
  );

  const handleQuickRange = (days) => {
    setDateFrom(getQuickRangeFrom(days));
    setDateTo(MAX_DATE);
  };

  const handleResetFilters = () => {
    setDateFrom(MIN_DATE);
    setDateTo(MAX_DATE);
    setStatus("all");
    setPatientQuery("");
  };

  // Find patient IDs that match the search term
  const getFilteredPatientIds = useCallback(async () => {
    const term = patientQuery.trim();
    if (!term) return null;

    const { data: pts, error } = await supabase
      .from("patients")
      .select("id")
      .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`);

    if (error) throw error;
    if (!pts || !pts.length) return [];
    return pts.map((p) => p.id);
  }, [patientQuery]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const filteredIds = await getFilteredPatientIds();
      if (filteredIds && filteredIds.length === 0) {
        // no patient matches -> no appointments
        setRows([]);
        setTotal(0);
        return;
      }

      // Build UTC boundaries inclusive (start 00:00, end 23:59:59)
      const startISO = new Date(dateFrom + "T00:00:00.000Z").toISOString();
      const endISO = new Date(dateTo + "T23:59:59.999Z").toISOString();

      // COUNT
      let countQ = supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("appointment_time", startISO)
        .lte("appointment_time", endISO);

      if (status !== "all") countQ = countQ.eq("status", status);
      if (filteredIds && filteredIds.length) {
        countQ = countQ.in("patient_id", filteredIds);
      }

      const { count: totalCount, error: countErr } = await countQ;
      if (countErr) throw countErr;

      // DATA PAGE
      let dataQ = supabase
        .from("appointments")
        .select(
          "id, appointment_time, status, duration_minutes, reason, patient_id"
        )
        .gte("appointment_time", startISO)
        .lte("appointment_time", endISO)
        .order("appointment_time", { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize - 1);

      if (status !== "all") dataQ = dataQ.eq("status", status);
      if (filteredIds && filteredIds.length) {
        dataQ = dataQ.in("patient_id", filteredIds);
      }

      const { data, error } = await dataQ;
      if (error) throw error;

      // Patient names (1 query)
      const ids = Array.from(
        new Set(data.map((r) => r.patient_id).filter(Boolean))
      );
      let nameById = {};
      if (ids.length) {
        const { data: pts } = await supabase
          .from("patients")
          .select("id, first_name, last_name")
          .in("id", ids);
        for (const p of pts ?? []) {
          const n = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
          nameById[p.id] = n || null;
        }
      }

      setRows(
        (data || []).map((r) => ({
          ...r,
          patient_name: r.patient_id ? nameById[r.patient_id] ?? "—" : "—",
        }))
      );
      setTotal(totalCount || 0);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, status, page, pageSize, getFilteredPatientIds]);

  const formatRowForXlsx = (r) => {
    const d = new Date(r.appointment_time);
    const dateStr = d.toLocaleDateString("el-GR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
    const timeStr = d.toLocaleTimeString("el-GR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      "Ημ/νία": dateStr,
      Ώρα: timeStr,
      Ασθενής: r.patient_name ?? "—",
      Λόγος: r.reason || "—",
      Διάρκεια: `${r.duration_minutes ?? 30}′`,
      Κατάσταση: STATUS_LABELS[r.status] || r.status,
    };
  };

  useEffect(() => {
    const onRefresh = () => loadData();
    window.addEventListener("admin:refresh", onRefresh);
    return () => window.removeEventListener("admin:refresh", onRefresh);
  }, [loadData]);

  // Auto-fit columns by content length
  const autoCols = (jsonRows) => {
    const headers = Object.keys(jsonRows[0] || {});
    return headers.map((h) => {
      const maxLen = Math.max(
        h.length,
        ...jsonRows.map((r) => String(r[h] ?? "").length)
      );
      // a rough char->px scale for Excel cols
      return { wch: Math.min(60, Math.max(8, Math.ceil(maxLen * 1.1))) };
    });
  };

  const handleExportPageXlsx = async () => {
    if (!rows.length) return;

    setIsExportingPage(true);
    try {
      const XLSX = await import("xlsx"); // dynamic import

      // sort current page ascending by datetime
      const sorted = [...rows].sort(
        (a, b) => new Date(a.appointment_time) - new Date(b.appointment_time)
      );

      // build rows with an empty separator when the date changes
      const jsonRows = [];
      let prevDateKey = null;

      for (const r of sorted) {
        const d = new Date(r.appointment_time);
        const dateKey = d.toLocaleDateString("el-GR");

        if (prevDateKey && prevDateKey !== dateKey) {
          jsonRows.push({
            "Ημ/νία": "",
            Ώρα: "",
            Ασθενής: "",
            Λόγος: "",
            Διάρκεια: "",
            Κατάσταση: "",
          });
        }
        jsonRows.push(formatRowForXlsx(r));
        prevDateKey = dateKey;
      }

      const ws = XLSX.utils.json_to_sheet(jsonRows);
      ws["!cols"] = autoCols(jsonRows);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Past 90d (Page)");

      const fname = `past_appointments_${dateFrom}_to_${dateTo}_${status}.xlsx`;
      XLSX.writeFile(wb, fname);
    } finally {
      setIsExportingPage(false);
    }
  };

  const handleExportAllXlsx = useCallback(async () => {
    if (!total) return;

    setIsExportingAll(true);
    try {
      const filteredIds = await getFilteredPatientIds();
      if (filteredIds && filteredIds.length === 0) {
        setIsExportingAll(false);
        return;
      }

      const XLSX = await import("xlsx");

      const startISO = new Date(dateFrom + "T00:00:00.000Z").toISOString();
      const endISO = new Date(dateTo + "T23:59:59.999Z").toISOString();

      // 1) total count
      let countQ = supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("appointment_time", startISO)
        .lte("appointment_time", endISO);
      if (status !== "all") countQ = countQ.eq("status", status);
      if (filteredIds && filteredIds.length) {
        countQ = countQ.in("patient_id", filteredIds);
      }
      const { count: totalCount = 0 } = await countQ;

      // 2) fetch in chunks (ASC so dates group nicely)
      const chunk = 1000;
      let all = [];
      for (let from = 0; from < totalCount; from += chunk) {
        let q = supabase
          .from("appointments")
          .select(
            "id, appointment_time, status, duration_minutes, reason, patient_id"
          )
          .gte("appointment_time", startISO)
          .lte("appointment_time", endISO)
          .order("appointment_time", { ascending: true }) // <-- ASC
          .range(from, Math.min(from + chunk - 1, totalCount - 1));
        if (status !== "all") q = q.eq("status", status);
        if (filteredIds && filteredIds.length) {
          q = q.in("patient_id", filteredIds);
        }
        const { data } = await q;
        all = all.concat(data || []);
      }

      // 3) hydrate patient names once
      const ids = Array.from(
        new Set(all.map((r) => r.patient_id).filter(Boolean))
      );
      let nameById = {};
      if (ids.length) {
        const { data: pts } = await supabase
          .from("patients")
          .select("id, first_name, last_name")
          .in("id", ids);
        for (const p of pts ?? []) {
          const n = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
          nameById[p.id] = n || null;
        }
      }
      const enriched = all.map((r) => ({
        ...r,
        patient_name: r.patient_id ? nameById[r.patient_id] ?? "—" : "—",
      }));

      // 4) build workbook with blank row on day change
      const sorted = enriched.sort(
        (a, b) => new Date(a.appointment_time) - new Date(b.appointment_time)
      );

      const jsonRows = [];
      let prevDateKey = null;

      for (const r of sorted) {
        const d = new Date(r.appointment_time);
        const dateKey = d.toLocaleDateString("el-GR"); // groups by day

        if (prevDateKey && prevDateKey !== dateKey) {
          // empty separator row
          jsonRows.push({
            "Ημ/νία": "",
            Ώρα: "",
            Ασθενής: "",
            Λόγος: "",
            Διάρκεια: "",
            Κατάσταση: "",
          });
        }
        jsonRows.push(formatRowForXlsx(r));
        prevDateKey = dateKey;
      }

      const ws = XLSX.utils.json_to_sheet(jsonRows);
      ws["!cols"] = autoCols(jsonRows);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Past 90d (All)");

      const fname = `past_appointments_ALL_${dateFrom}_to_${dateTo}_${status}.xlsx`;
      XLSX.writeFile(wb, fname);
    } finally {
      setIsExportingAll(false);
    }
  }, [dateFrom, dateTo, status, total, getFilteredPatientIds]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setPage(0);
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [dateFrom, dateTo, status, patientQuery]);

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-slate-900">
      <section className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-100 bg-white text-slate-700 shadow-sm hover:bg-emerald-50"
              aria-label="Επιστροφή"
              title="Επιστροφή"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold tracking-tight text-slate-900">
                    Ιστορικό ραντεβού (τελευταίες 90 ημέρες)
                  </h1>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Αναζήτηση, φιλτράρισμα και εξαγωγή πρόσφατων ραντεβού του
                    ιατρείου.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-emerald-100 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm hover:bg-emerald-50 disabled:opacity-60"
              aria-label="Ανανέωση δεδομένων"
              title="Ανανέωση"
              disabled={loading}
            >
              <RefreshCcw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Ανανέωση</span>
            </button>

            <button
              type="button"
              onClick={handleExportPageXlsx}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-emerald-100 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm hover:bg-emerald-50 disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="Εξαγωγή (τρέχουσα σελίδα)"
              title="Εξαγωγή Excel (τρέχουσα σελίδα)"
              disabled={loading || !rows.length || isExportingPage}
            >
              {isExportingPage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Εξαγωγή σελίδας</span>
            </button>

            <button
              type="button"
              onClick={handleExportAllXlsx}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-600 px-3 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed"
              aria-label="Εξαγωγή (όλα)"
              title="Εξαγωγή Excel (όλα τα αποτελέσματα)"
              disabled={loading || !total || isExportingAll}
            >
              {isExportingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Εξαγωγή (όλα)</span>
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="space-y-3 rounded-2xl border border-emerald-50 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800">
                Φίλτρα
              </span>
              {rangeLabel && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-800">
                  <Calendar className="mr-1 h-3 w-3" />
                  {rangeLabel}
                </span>
              )}
              {status !== "all" && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                  Κατάσταση:{" "}
                  <span className="ml-1 font-medium">
                    {STATUS_LABELS[status] || "Όλες"}
                  </span>
                </span>
              )}
              {patientQuery.trim() && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                  Ασθενής:{" "}
                  <span className="ml-1 font-medium">
                    {patientQuery.trim()}
                  </span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!(
                dateFrom === MIN_DATE &&
                dateTo === MAX_DATE &&
                status === "all" &&
                !patientQuery.trim()
              ) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
                >
                  Επαναφορά φίλτρων
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                  min={MIN_DATE}
                  max={dateTo || MAX_DATE}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 shadow-sm outline-none ring-emerald-100 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Μέγιστο διάστημα: 90 ημέρες πίσω.
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
                  min={dateFrom || MIN_DATE}
                  max={MAX_DATE}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 shadow-sm outline-none ring-emerald-100 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2"
                />
              </div>
            </div>

            {/* Κατάσταση + Αναζήτηση ασθενή */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="status"
                  className="text-[11px] font-medium text-slate-600"
                >
                  Κατάσταση ραντεβού
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-emerald-100 focus:border-emerald-500 focus:ring-2"
                >
                  <option value="all">Όλες οι καταστάσεις</option>
                  <option value="completed">Ολοκληρωμένα</option>
                  <option value="approved">Εγκεκριμένα</option>
                  <option value="cancelled">Ακυρωμένα</option>
                  <option value="pending">Σε εκκρεμότητα</option>
                  <option value="scheduled">Προγραμματισμένα</option>
                  <option value="rejected">Απορριφθέντα</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="patientSearch"
                  className="text-[11px] font-medium text-slate-600"
                >
                  Αναζήτηση ασθενή
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="patientSearch"
                    type="text"
                    value={patientQuery}
                    onChange={(e) => setPatientQuery(e.target.value)}
                    placeholder="Όνομα ή επώνυμο..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 shadow-sm outline-none ring-emerald-100 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Φιλτράρει τα ραντεβού με βάση το όνομα / επώνυμο.
                </p>
              </div>
            </div>

            {/* Quick ranges + manual refresh */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-slate-600">
                Γρήγορα φίλτρα
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_RANGES.map((item) => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => handleQuickRange(item.days)}
                    className={[
                      "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                      isQuickRangeActive(item.days)
                        ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-400 hover:bg-emerald-50/60 hover:text-emerald-800",
                    ].join(" ")}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => loadData()}
                disabled={loading}
                className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-emerald-50 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    Επαναφόρτωση
                  </>
                ) : (
                  "Εφαρμογή φίλτρων"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="overflow-hidden rounded-2xl border border-emerald-50 bg-white/90 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                <History className="mr-1 h-3 w-3" />
                Προβολή{" "}
                <span className="ml-1 font-semibold text-slate-900">
                  {total}
                </span>{" "}
                ραντεβού
              </span>
              {rangeLabel && (
                <span className="hidden sm:inline text-[11px] text-slate-500">
                  Διάστημα: {rangeLabel}
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-600">
              Σελίδα{" "}
              <span className="font-semibold text-slate-900">{page + 1}</span>{" "}
              από <span className="font-semibold text-slate-900">{pages}</span>
            </p>
          </div>

          <div className="max-h-[65vh] overflow-auto px-4 py-2">
            {loading && !rows.length ? (
              <div className="flex min-h-[180px] items-center justify-center text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Φόρτωση ραντεβού…
              </div>
            ) : !rows.length ? (
              <div className="flex min-h-[140px] flex-col items-center justify-center gap-1 text-center text-sm text-slate-500">
                <p>Δεν βρέθηκαν ραντεβού για τα επιλεγμένα φίλτρα.</p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-1 text-xs font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
                >
                  Επαναφορά στα προεπιλεγμένα
                </button>
              </div>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                  <tr className="text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-2 text-left">Ημ/νία</th>
                    <th className="py-2 pr-2 text-left">Ώρα</th>
                    <th className="py-2 pr-2 text-left">Ασθενής</th>
                    <th className="py-2 pr-2 text-left">Λόγος</th>
                    <th className="py-2 pr-2 text-left">Διάρκεια</th>
                    <th className="py-2 text-left">Κατάσταση</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const d = new Date(r.appointment_time);
                    const statusLabel = STATUS_LABELS[r.status] || r.status;
                    const badgeClass =
                      STATUS_BADGE_STYLES[r.status] ||
                      "bg-slate-50 border-slate-200 text-slate-600";

                    return (
                      <tr
                        key={r.id}
                        className="border-t border-slate-100 hover:bg-emerald-50/50"
                      >
                        <td className="py-2 pr-2 text-[13px] text-slate-900">
                          {d.toLocaleDateString("el-GR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                          })}
                        </td>
                        <td className="py-2 pr-2 text-[13px] text-slate-700">
                          {d.toLocaleTimeString("el-GR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-2 pr-2 text-[13px] text-slate-900">
                          {r.patient_name ?? "—"}
                        </td>
                        <td className="max-w-[280px] py-2 pr-2 text-[13px] text-slate-700">
                          <span
                            className="block truncate"
                            title={r.reason || "—"}
                          >
                            {r.reason || "—"}
                          </span>
                        </td>
                        <td className="py-2 pr-2 text-[13px] text-slate-700">
                          {r.duration_minutes ?? 30}′
                        </td>
                        <td className="py-2">
                          <span
                            className={[
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                              badgeClass,
                            ].join(" ")}
                          >
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer / Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3">
            <p className="text-[11px] text-slate-600">
              Εμφάνιση{" "}
              <span className="font-semibold text-slate-900">
                {rows.length}
              </span>{" "}
              από <span className="font-semibold text-slate-900">{total}</span>{" "}
              ραντεβού
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0 || loading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Προηγούμενη"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= pages - 1 || loading}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Επόμενη"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
