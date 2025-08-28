"use client";
import * as XLSX from "xlsx";

export function exportExcel(filename, rows, opts = {}) {
  const {
    headers = null, // array of keys OR { key: "Label" }
    sheetName = "Report",
    dateFormat = "dd/mm/yyyy",
    from, // "YYYY-MM-DD" or Date
    to, // "YYYY-MM-DD" or Date
    titlePrefix = "Εύρος ημερομηνιών",
  } = opts;

  const data = Array.isArray(rows) ? rows : [];
  const fallback = { metric: "", value: "" };

  // Keys + labels
  let keys, labels;
  if (Array.isArray(headers)) {
    keys = headers;
    labels = headers;
  } else if (headers && typeof headers === "object") {
    keys = Object.keys(headers);
    labels = keys.map((k) => headers[k] ?? k);
  } else {
    keys = Object.keys(data[0] || fallback);
    labels = keys;
  }

  // Helpers
  const toDate = (x) => (x instanceof Date ? x : x ? new Date(x) : null);
  const fmtGR = (d) =>
    d
      ? d.toLocaleDateString("el-GR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "";

  const fromD = toDate(from);
  const toD = toDate(to);
  const rangeText =
    fromD || toD
      ? `${titlePrefix}: ${fmtGR(fromD)} → ${fmtGR(toD)}`
      : titlePrefix;

  // Build AoA: title row, spacer, header row, data rows
  const aoa = [
    [rangeText],
    [],
    labels,
    ...data.map((row) =>
      keys.map((k) => {
        const v = row?.[k];
        return v instanceof Date ? v : v; // keep Date objects as-is
      })
    ),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa, { cellDates: true });

  // Merge the title across all columns (A1 : last column in row 1)
  if (keys.length > 1) {
    ws["!merges"] = ws["!merges"] || [];
    ws["!merges"].push({
      s: { r: 0, c: 0 },
      e: { r: 0, c: Math.max(keys.length - 1, 1) },
    });
  }

  // Apply date format to date cells and compute column widths
  const ref = ws["!ref"] || "A1";
  const range = XLSX.utils.decode_range(ref);
  const headerRowIndex = 2; // labels are on row index 2 (0-based)
  const colWidths = keys.map((_, i) => Math.max(String(labels[i]).length, 12));

  for (let R = headerRowIndex + 1; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= Math.max(range.e.c, keys.length - 1); ++C) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[addr];
      if (!cell) continue;
      if (cell.t === "d") cell.z = dateFormat;
      const text = String(cell.v ?? "");
      colWidths[C] = Math.max(colWidths[C] || 12, text.length + 2);
    }
  }
  ws["!cols"] = colWidths.map((wch) => ({ wch: Math.min(wch, 50) }));

  // Freeze header (keep title + spacer visible is optional; we freeze below the header row)
  ws["!freeze"] = { xSplit: 0, ySplit: headerRowIndex + 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(
    wb,
    filename.endsWith(".xlsx") ? filename : filename + ".xlsx"
  );
}
