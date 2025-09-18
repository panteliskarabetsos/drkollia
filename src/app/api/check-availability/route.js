// app/api/check-availability/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/** ---- Supabase (server) ----
 * Prefer SERVICE ROLE for consistent reads of RLS-protected tables.
 * If you don't want that, switch to the anon key – just replace the key below.
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TZ = "Europe/Athens";

// -------------------- Reason-specific rules --------------------
// Keys are normalized (lowercase, no accents). Customize freely.
const REASON_RULES = {
  // Greek examples
  "πρωτη επισκεψη": {
    durationMinutes: 45,
    startAlignment: 30, // show only :00 / :30
  },
  επαναεξεταση: {
    durationMinutes: 30,
    startAlignment: 30,
  },

  // 15' reasons: align to 15' and (by default) reserve 15'
  "αξιολογηση αποτελεσματων": {
    durationMinutes: 15,
    startAlignment: 15,
    // reserveMinutes: 15, // default equals duration if omitted
  },
  "ιατρικος επισκεπτης": {
    durationMinutes: 15,
    startAlignment: 15,
    // reserveMinutes: 15,
    monthlyCap: 2,
    dailyCap: 1,
    dbMatch: "Ιατρικός Επισκέπτης",
  },

  "initial consultation": {
    durationMinutes: 45,
    startAlignment: 30,
  },
  "follow-up": {
    durationMinutes: 30,
    startAlignment: 30,
  },

  // Fallback for anything else
  default: {
    durationMinutes: 30,
    startAlignment: 30,
  },
};

// --------------------------- Helpers ---------------------------
const pad2 = (n) => String(n).padStart(2, "0");
const timeStr = (h, m) => `${pad2(h)}:${pad2(m)}`;
const normalize = (s = "") =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const minutesFromHHMM = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};
const minutesOf = minutesFromHHMM; // alias

/** Format an ISO timestamp to "HH:mm" in Europe/Athens */
function hhmmAthens(iso) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  }).format(new Date(iso));
}

/** Is the requested date today in Athens? */
function isTodayInAthens(dateISO) {
  const now = new Date();
  const ymdAthens = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now); // "YYYY-MM-DD"
  return ymdAthens === dateISO;
}

/** Return current minutes-of-day in Athens */
function nowMinutesInAthens() {
  const nowHM = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date()); // "HH:MM"
  const [h, m] = nowHM.split(":").map(Number);
  return h * 60 + m;
}

/** Intersect working periods with optional allowed windows (both arrays of {startMin,endMin}) */
function intersectWindows(base, windows) {
  if (!windows || windows.length === 0) return base;
  const out = [];
  for (const b of base) {
    for (const w of windows) {
      const s = Math.max(b.startMin, w.startMin);
      const e = Math.min(b.endMin, w.endMin);
      if (s < e) out.push({ startMin: s, endMin: e });
    }
  }
  return out;
}

/** Build 15' ticks for working periods */
function buildTicks(
  workingPeriods,
  fullDayBookedSet,
  exceptionRanges,
  suppressPast
) {
  const ticks = []; // [{h,m, key:"HH:MM", free:boolean}]
  const nowMin = suppressPast ? nowMinutesInAthens() : -1;

  const inException = (h, m) => {
    if (!exceptionRanges?.length) return false;
    const mm = h * 60 + m;
    return exceptionRanges.some((r) => mm >= r.startMin && mm < r.endMin);
  };

  for (const { startMin, endMin } of workingPeriods) {
    // iterate in 15' steps
    for (let mm = startMin; mm < endMin; mm += 15) {
      const h = Math.floor(mm / 60);
      const m = mm % 60;
      const key = timeStr(h, m);
      const past = suppressPast && mm <= nowMin;
      const unavailable =
        past || fullDayBookedSet.has(key) || inException(h, m);
      ticks.push({ h, m, key, free: !unavailable });
    }
  }
  return ticks;
}

/** First available (date, time) search within N days */
async function findNextAvailable({ dateISO, effective, days = 30 }) {
  const target = new Date(`${dateISO}T00:00:00Z`);
  for (let i = 1; i <= days; i++) {
    const next = new Date(target);
    next.setUTCDate(target.getUTCDate() + i);

    const y = next.getUTCFullYear();
    const m = pad2(next.getUTCMonth() + 1);
    const d = pad2(next.getUTCDate());
    const probeISO = `${y}-${m}-${d}`;

    const res = await computeAvailability({
      dateISO: probeISO,
      reason: effective.reasonOriginal,
      includeNext: false,
      // carry through the effective settings
      _effectiveOverride: effective,
    });
    if (res.availableSlots?.length) {
      return { dateISO: probeISO, time: res.availableSlots[0] };
    }
  }
  return null;
}

// ---------------------- Core availability ----------------------
async function computeAvailability({
  dateISO,
  duration, // optional incoming (will be overridden by reason rules if present)
  reason = "",
  includeNext,
  _effectiveOverride, // internal use when probing next dates
}) {
  // 0) Accept new appointments?
  const { data: settings, error: settingsErr } = await supabase
    .from("clinic_settings")
    .select("accept_new_appointments")
    .eq("id", 1)
    .single();
  if (settingsErr) throw settingsErr;
  if (!settings?.accept_new_appointments) {
    return {
      availableSlots: [],
      allSlots: [],
      fullDayException: false,
      reasonBlocked: false,
      message: "Προς το παρόν δεν δεχόμαστε νέα ηλεκτρονικά ραντεβού.",
    };
  }

  // 1) Resolve reason rules
  const normReason = normalize(reason);
  const baseRule = REASON_RULES[normReason] || REASON_RULES.default;
  const ruleDur = Number(
    baseRule.durationMinutes ?? duration ?? REASON_RULES.default.durationMinutes
  );
  const effective = _effectiveOverride || {
    reasonOriginal: reason,
    normReason,
    durationMinutes: ruleDur,
    reserveMinutes: Number(
      baseRule.reserveMinutes ?? ruleDur // default reserve == duration
    ),
    startAlignment:
      baseRule.startAlignment != null
        ? Number(baseRule.startAlignment)
        : ruleDur <= 15
        ? 15
        : 30, // default align 15' for 15-min appts, else 30'
    dailyCap: baseRule.dailyCap ?? null,
    monthlyCap: baseRule.monthlyCap ?? null,
    dbMatch: baseRule.dbMatch || reason, // what to compare against in DB
    allowedWindows: Array.isArray(baseRule.allowedWindows)
      ? baseRule.allowedWindows.map((w) => ({
          startMin: minutesFromHHMM(w.start),
          endMin: minutesFromHHMM(w.end),
        }))
      : null,
    bufferBeforeTicks: Number(baseRule.bufferBeforeTicks ?? 0), // 15' units before
    bufferAfterTicks: Number(baseRule.bufferAfterTicks ?? 0), // 15' units after
  };

  // 2) Monthly cap (if configured for this reason)
  if (effective.monthlyCap != null) {
    const [Y, M] = dateISO.split("-").map(Number);
    const monthStart = new Date(Date.UTC(Y, M - 1, 1, 0, 0, 0));
    const nextMonthStart = new Date(Date.UTC(Y, M, 1, 0, 0, 0));

    const { count, error: capErr } = await supabase
      .from("appointments")
      .select("*", { head: true, count: "exact" })
      .eq("reason", effective.dbMatch) // use dbMatch to be precise
      .gte("appointment_time", monthStart.toISOString())
      .lt("appointment_time", nextMonthStart.toISOString());
    if (capErr) throw capErr;

    if ((count || 0) >= Number(effective.monthlyCap)) {
      return {
        availableSlots: [],
        allSlots: [],
        fullDayException: false,
        reasonBlocked: true,
        message: `Έχει συμπληρωθεί το μηνιαίο όριο (${effective.monthlyCap}) για "${reason}".`,
      };
    }
  }

  // 3) Base schedule for weekday
  const weekday = new Date(`${dateISO}T00:00:00Z`).getUTCDay(); // 0=Sunday
  const { data: scheduleData, error: schedErr } = await supabase
    .from("clinic_schedule")
    .select("start_time, end_time")
    .eq("weekday", weekday);
  if (schedErr) throw schedErr;

  if (!scheduleData || scheduleData.length === 0) {
    return {
      availableSlots: [],
      allSlots: [],
      fullDayException: false,
      reasonBlocked: false,
    };
  }

  // Convert schedule periods to minutes-of-day ranges
  let workingPeriods = scheduleData.map((s) => {
    const startMin = minutesFromHHMM(s.start_time);
    const endMin = minutesFromHHMM(s.end_time);
    return { startMin, endMin };
  });

  // Apply reason-specific allowed windows (if any)
  workingPeriods = intersectWindows(workingPeriods, effective.allowedWindows);

  if (workingPeriods.length === 0) {
    return {
      availableSlots: [],
      allSlots: [],
      fullDayException: false,
      reasonBlocked: true,
      message: "Δεν υπάρχουν διαθέσιμες ώρες για αυτό τον τύπο ραντεβού.",
    };
  }

  // 4) Exceptions for that date
  const { data: exceptions, error: excErr } = await supabase
    .from("schedule_exceptions")
    .select("start_time, end_time")
    .eq("exception_date", dateISO);
  if (excErr) throw excErr;

  const fullDayException =
    exceptions?.some((e) => !e.start_time && !e.end_time) || false;
  if (fullDayException) {
    return {
      availableSlots: [],
      allSlots: [],
      fullDayException: true,
      reasonBlocked: false,
    };
  }

  const exceptionRanges = (exceptions || [])
    .filter((e) => e.start_time && e.end_time)
    .map((e) => ({
      startMin: minutesFromHHMM(e.start_time),
      endMin: minutesFromHHMM(e.end_time),
    }));

  // 5) Already booked appointments for that date
  const startOfDay = `${dateISO}T00:00:00.000Z`;
  const endOfDay = `${dateISO}T23:59:59.999Z`;

  const { data: booked, error: bookedErr } = await supabase
    .from("appointments")
    .select("reason, appointment_time, duration_minutes, status")
    .gte("appointment_time", startOfDay)
    .lte("appointment_time", endOfDay)
    .in("status", ["approved", "completed", "scheduled"]);
  if (bookedErr) throw bookedErr;

  // Build set of blocked 15' ticks (HH:MM in Athens)
  const bookedSet = new Set();
  const sameDayReasonCount = { total: 0 };
  (booked || []).forEach(
    ({ appointment_time, duration_minutes, reason: r }) => {
      // count same-day same reason (for dailyCap)
      if (effective.dailyCap != null && r === (effective.dbMatch || reason)) {
        sameDayReasonCount.total += 1;
      }
      const ticks = Math.ceil(Number(duration_minutes || 30) / 15);
      const base = new Date(appointment_time);
      for (let i = 0; i < ticks; i++) {
        const t = new Date(base.getTime() + i * 15 * 60 * 1000);
        bookedSet.add(hhmmAthens(t.toISOString()));
      }
    }
  );

  // Daily cap enforcement
  if (
    effective.dailyCap != null &&
    sameDayReasonCount.total >= effective.dailyCap
  ) {
    return {
      availableSlots: [],
      allSlots: [],
      fullDayException: false,
      reasonBlocked: true,
      message: `Έχει συμπληρωθεί το ημερήσιο όριο (${effective.dailyCap}) για "${reason}".`,
    };
  }

  // 6) Build ticks grid
  const suppressPast = isTodayInAthens(dateISO); // only hide past times for today

  // Convert workingPeriods to 15-minute steps
  const ticks = buildTicks(
    workingPeriods,
    bookedSet,
    exceptionRanges,
    suppressPast
  );

  // 7) Choose valid start times based on reason rules
  const reserveSteps = Math.ceil(Number(effective.reserveMinutes) / 15);
  const bufferBefore = Number(effective.bufferBeforeTicks || 0);
  const bufferAfter = Number(effective.bufferAfterTicks || 0);
  const align = Number(effective.startAlignment || 30);

  const isAligned = (m) => m % align === 0;

  const selectable = [];
  for (let i = 0; i < ticks.length; i++) {
    const t0 = ticks[i];
    if (!t0.free) continue;
    if (!isAligned(t0.m)) continue;

    let ok = true;

    // require buffer BEFORE
    for (let b = 1; b <= bufferBefore; b++) {
      const tb = ticks[i - b];
      if (!tb || !tb.free) {
        ok = false;
        break;
      }
      const prev = ticks[i - b + 1] || t0;
      const delta = prev.h * 60 + prev.m - (tb.h * 60 + tb.m);
      if (delta !== 15) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;

    // require reserveSteps contiguous FREE ticks (the actual hold)
    for (let k = 1; k < reserveSteps; k++) {
      const tk = ticks[i + k];
      if (!tk || !tk.free) {
        ok = false;
        break;
      }
      const prev = ticks[i + k - 1];
      const delta = tk.h * 60 + tk.m - (prev.h * 60 + prev.m);
      if (delta !== 15) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;

    // require buffer AFTER
    for (let a = 1; a <= bufferAfter; a++) {
      const ta = ticks[i + reserveSteps + a - 1];
      const prev = ticks[i + reserveSteps + a - 2];
      if (!ta || !ta.free || !prev) {
        ok = false;
        break;
      }
      const delta = ta.h * 60 + ta.m - (prev.h * 60 + prev.m);
      if (delta !== 15) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;

    selectable.push(t0.key); // "HH:MM"
  }

  // -------- WINDOWED TWO policy for 15' appointments --------
  // Pick up to 2 starts from the earliest 30-minute window only.
  // If that window has just one free start, expose only one.
  let visibleSet;
  let limited;
  if (effective.durationMinutes <= 15) {
    // Group selectable starts by half-hour window start
    const groups = new Map(); // key = "HH:MM" of window start (00 or 30)
    for (const t of selectable) {
      const mins = minutesOf(t);
      const winStartMin = Math.floor(mins / 30) * 30;
      const gKey = timeStr(Math.floor(winStartMin / 60), winStartMin % 60);
      if (!groups.has(gKey)) groups.set(gKey, []);
      groups.get(gKey).push(t);
    }
    // Earliest window
    const keys = Array.from(groups.keys()).sort(
      (a, b) => minutesOf(a) - minutesOf(b)
    );
    if (keys.length > 0) {
      const firstKey = keys[0];
      const firstWindowSlots = groups
        .get(firstKey)
        .sort((a, b) => minutesOf(a) - minutesOf(b))
        .slice(0, 2); // up to 2 from the same window
      limited = firstWindowSlots;
    } else {
      limited = [];
    }
    visibleSet = new Set(limited);
  } else {
    // Non-15' reasons: expose all aligned valid starts (or add your own limit logic)
    limited = selectable;
    visibleSet = new Set(selectable);
  }

  // Timeline for UI; mark as available ONLY those in visibleSet
  const allSlots = ticks.map((t) => ({
    time: t.key,
    available: isAligned(t.m) && visibleSet.has(t.key),
  }));

  const payload = {
    dateISO,
    reason,
    rules: {
      durationMinutes: effective.durationMinutes,
      reserveMinutes: effective.reserveMinutes,
      startAlignment: effective.startAlignment,
      dailyCap: effective.dailyCap,
      monthlyCap: effective.monthlyCap,
      allowedWindows: REASON_RULES[normReason]?.allowedWindows || null,
      windowedTwoFor15min: true,
    },
    availableSlots: limited, // e.g., ["18:00","18:15"] or ["18:00"] or next window's two
    allSlots,
    fullDayException,
    reasonBlocked: false,
  };

  if (includeNext && limited.length === 0) {
    payload.nextAvailable = await findNextAvailable({
      dateISO,
      effective,
    });
  }

  return payload;
}

// ----------------------------- HTTP handler -----------------------------
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      dateISO, // "YYYY-MM-DD" (Athens-local date of interest)
      duration, // number, minutes (optional; reason rules may override)
      reason = "", // string (Greek or English)
      includeNext = true, // boolean
    } = body || {};

    if (!dateISO) {
      return NextResponse.json(
        { error: "Missing required field: dateISO" },
        { status: 400 }
      );
    }

    const result = await computeAvailability({
      dateISO,
      duration,
      reason,
      includeNext,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("check-availability error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
