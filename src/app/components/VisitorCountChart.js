// components/VisitorCountChart.js
"use client";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

function fillMissingDays(from, to, rows) {
  const map = new Map(
    rows.map((r) => [new Date(r.day).toISOString().slice(0, 10), r.visitors])
  );
  const start = new Date(from + "T00:00:00.000Z");
  const end = new Date(to + "T00:00:00.000Z");
  const out = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    out.push({ day: d.toISOString(), visitors: map.get(key) ?? 0 });
  }
  return out;
}

export default function VisitorCountChart({
  from,
  to,
  title = "Επισκέψεις Ανά Ημέρα",
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/visitors?from=${from}&to=${to}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed");
        const filled = fillMissingDays(from, to, json.rows || []);
        if (alive) setData(filled);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [from, to]);

  return (
    <div className="bg-white border border-[#e5e1d8] rounded-2xl p-5 shadow-sm">
      <h3 className="text-base font-semibold text-[#2f2e2b] mb-3">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="visitorsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
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
              tick={{ fontSize: 11, fill: "#6b675f" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b675f" }}
              allowDecimals={false}
            />
            <Tooltip
              labelFormatter={(d) => new Date(d).toLocaleDateString("el-GR")}
              formatter={(v) => [v, "Επισκέψεις"]}
            />
            <Area
              type="monotone"
              dataKey="visitors"
              stroke="#4f46e5"
              fill="url(#visitorsFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {loading && <p className="text-xs text-[#6b675f] mt-2">Φόρτωση…</p>}
    </div>
  );
}
