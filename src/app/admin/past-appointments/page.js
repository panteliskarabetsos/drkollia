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
} from "lucide-react";

// Helpers
const isoDate = (d) => d.toISOString().split("T")[0];
const TODAY = new Date();
const MIN_90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
const MIN_DATE = isoDate(MIN_90);
const MAX_DATE = isoDate(TODAY);

export default function PastAppointmentsPage() {
  const router = useRouter();

  // Filters
  const [dateFrom, setDateFrom] = useState(MIN_DATE);
  const [dateTo, setDateTo] = useState(MAX_DATE);
  const [status, setStatus] = useState("all"); // all | completed | approved | cancelled | pending | scheduled | rejected

  // Data
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 12;

  // UI
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
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
  }, [dateFrom, dateTo, status, page]);

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
      Κατάσταση: r.status,
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
  };

  const handleExportAllXlsx = useCallback(async () => {
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
  }, [dateFrom, dateTo, status]);

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
  }, [dateFrom, dateTo, status]);

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#333] font-sans">
      <section className="max-w-6xl mx-auto px-4 py-26">
        {/* Header */}
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-md hover:bg-gray-200 transition"
              aria-label="Επιστροφή"
              title="Επιστροφή"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#8c7c68]" />
              <h1 className="text-2xl font-semibold">Παλαιά ραντεβού (90ημ)</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-md hover:bg-gray-200 transition"
              aria-label="Ανανέωση"
              title="Ανανέωση"
            >
              <RefreshCcw
                className={`w-5 h-5 text-gray-700 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
            </button>

            <button
              onClick={handleExportPageXlsx}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-[#e5e1d8] bg-white hover:bg-[#f5f3ef] transition"
              aria-label="Εξαγωγή CSV"
              title="Εξαγωγή (τρέχουσα σελίδα)"
            >
              <Download className="w-4 h-4" />
              Εξαγωγή Excel
            </button>
            <button
              onClick={handleExportAllXlsx}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-[#e5e1d8] bg-white hover:bg-[#f5f3ef] transition"
              aria-label="Εξαγωγή CSV (Όλα)"
              title="Εξαγωγή όλων των αποτελεσμάτων"
            >
              <Download className="w-4 h-4" />
              Εξαγωγή Excel (Όλα)
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="bg-white border border-[#e5e1d8] rounded-2xl p-4 shadow-sm mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            {/* Από */}
            <div className="flex flex-col">
              <label
                htmlFor="dateFrom"
                className="text-[11px] font-medium text-[#6b675f] mb-1"
              >
                Από
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c7c68]" />
                <input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  min={MIN_DATE}
                  max={dateTo || MAX_DATE}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#e5e1d8] bg-white"
                />
              </div>
            </div>

            {/* Έως */}
            <div className="flex flex-col">
              <label
                htmlFor="dateTo"
                className="text-[11px] font-medium text-[#6b675f] mb-1"
              >
                Έως
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c7c68]" />
                <input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  min={dateFrom || MIN_DATE}
                  max={MAX_DATE}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#e5e1d8] bg-white"
                />
              </div>
            </div>

            {/* Κατάσταση */}
            <div className="flex flex-col">
              <label className="text-[11px] font-medium text-[#6b675f] mb-1">
                Κατάσταση
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-sm rounded-lg border border-[#e5e1d8] bg-white px-3 py-2"
              >
                <option value="all">Όλες</option>
                <option value="completed">Ολοκληρωμένα</option>
                <option value="approved">Εγκεκριμένα</option>
                <option value="cancelled">Ακυρωμένα</option>
                <option value="pending">Σε εκκρεμότητα</option>
                <option value="scheduled">Προγραμματισμένα</option>
                <option value="rejected">Απορριφθέντα</option>
              </select>
            </div>

            {/* Apply */}
            <div className="flex sm:justify-end">
              <button
                onClick={() => loadData()}
                className="h-10 self-end text-sm rounded-lg border border-[#e5e1d8] px-4 hover:bg-[#f5f3ef]"
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Φόρτωση…
                  </span>
                ) : (
                  "Εφαρμογή"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white border border-[#e5e1d8] rounded-2xl p-0 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#efece5] text-sm text-[#6b675f]">
            Εμφάνιση τελευταίων 90 ημερών • Φίλτρα σε ισχύ
          </div>

          <div className="px-4 py-3 max-h-[65vh] overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Φόρτωση ραντεβού…
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-gray-500">Δεν βρέθηκαν ραντεβού.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase text-[#6b675f]">
                    <th className="py-2">Ημ/νία</th>
                    <th className="py-2">Ώρα</th>
                    <th className="py-2">Ασθενής</th>
                    <th className="py-2">Λόγος</th>
                    <th className="py-2">Διάρκεια</th>
                    <th className="py-2">Κατάσταση</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const d = new Date(r.appointment_time);
                    return (
                      <tr key={r.id} className="border-t border-[#f0ede7]">
                        <td className="py-2 text-[#2f2e2b]">
                          {d.toLocaleDateString("el-GR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                          })}
                        </td>
                        <td className="py-2">
                          {d.toLocaleTimeString("el-GR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-2">{r.patient_name ?? "—"}</td>
                        <td className="py-2 truncate max-w-[280px]">
                          {r.reason || "—"}
                        </td>
                        <td className="py-2">{r.duration_minutes ?? 30}′</td>
                        <td className="py-2">
                          <span
                            className={[
                              "inline-flex items-center px-2 py-0.5 rounded-full border text-xs",
                              r.status === "completed"
                                ? "bg-green-50 border-green-200 text-green-700"
                                : r.status === "approved"
                                ? "bg-blue-50 border-blue-200 text-blue-700"
                                : r.status === "cancelled"
                                ? "bg-rose-50 border-rose-200 text-rose-700"
                                : "bg-gray-50 border-gray-200 text-gray-600",
                            ].join(" ")}
                          >
                            {r.status}
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#efece5]">
            <p className="text-xs text-[#6b675f]">
              Σελίδα {page + 1} από {pages} • {total} εγγραφές
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0 || loading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
                aria-label="Προηγούμενη"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= pages - 1 || loading}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
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
