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
const minutesOf = minutesFromHHMM;

function hhmmAthens(iso) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  }).format(new Date(iso));
}
function isTodayInAthens(dateISO) {
  const now = new Date();
  const ymdAthens = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return ymdAthens === dateISO;
}
function nowMinutesInAthens() {
  const nowHM = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  const [h, m] = nowHM.split(":").map(Number);
  return h * 60 + m;
}
function intersectWindows(base, windows) {
  if (!windows?.length) return base;
  const out = [];
  for (const b of base)
    for (const w of windows) {
      const s = Math.max(b.startMin, w.startMin);
      const e = Math.min(b.endMin, w.endMin);
      if (s < e) out.push({ startMin: s, endMin: e });
    }
  return out;
}
/** Minutes-of-day in Athens from either "HH:MM" or ISO datetime */
function minutesOfDayAthensFromAny(s) {
  if (!s) return null;
  // If it looks like an ISO (has 'T'), format it to HH:MM in Athens first
  if (s.includes("T")) {
    const hm = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: TZ,
    }).format(new Date(s)); // "HH:MM" in Athens
    const [h, m] = hm.split(":").map(Number);
    return h * 60 + m;
  }
  // Otherwise assume "HH:MM"
  const [h, m] = String(s).split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}
// Pick up to `count` 15' starts from the earliest 30' window **within one period**
function pickWindowHoldInPeriod(ticks, period, count = 2) {
  const startMin = period.startMin;
  const endMin = period.endMin;

  // all free 15' aligned starts inside this period
  const starts = ticks
    .filter((t) => t.free)
    .filter((t) => {
      const mm = t.h * 60 + t.m;
      return mm >= startMin && mm < endMin;
    })
    .map((t) => t.key);

  // group by half-hour window (e.g., 10:00 group → [10:00, 10:15])
  const byWindow = new Map();
  const mmOf = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };
  const toHM = (mm) =>
    `${String(Math.floor(mm / 60)).padStart(2, "0")}:${String(mm % 60).padStart(
      2,
      "0"
    )}`;

  for (const s of starts) {
    const mm = mmOf(s);
    const winStart = Math.floor(mm / 30) * 30;
    const key = toHM(winStart);
    if (!byWindow.has(key)) byWindow.set(key, []);
    byWindow.get(key).push(s);
  }

  // earliest window in this period
  const windows = [...byWindow.keys()].sort((a, b) => mmOf(a) - mmOf(b));
  if (!windows.length) return new Set();

  const firstWin = windows[0];
  const inWin = byWindow.get(firstWin).sort((a, b) => mmOf(a) - mmOf(b));
  return new Set(inWin.slice(0, count)); // e.g., :00 & :15 (or :30 & :45)
}

function buildTicks(
  workingPeriods,
  fullDayBookedSet,
  exceptionRanges,
  suppressPast
) {
  const ticks = [];
  const nowMin = suppressPast ? nowMinutesInAthens() : -1;
  const inException = (h, m) => {
    if (!exceptionRanges?.length) return false;
    const mm = h * 60 + m;
    return exceptionRanges.some((r) => mm >= r.startMin && mm < r.endMin);
  };
  for (const { startMin, endMin } of workingPeriods) {
    for (let mm = startMin; mm < endMin; mm += 15) {
      const h = Math.floor(mm / 60),
        m = mm % 60;
      const key = timeStr(h, m);
      const past = suppressPast && mm <= nowMin;
      const unavailable =
        past || fullDayBookedSet.has(key) || inException(h, m);
      ticks.push({ h, m, key, free: !unavailable });
    }
  }
  return ticks;
}

// NEW: choose “held” 15' starts (prefer :00 / :30)
function pickDailyHold(selectableStarts, count = 2, preferAnchors = true) {
  const anchors = preferAnchors
    ? selectableStarts.filter((t) => minutesOf(t) % 30 === 0)
    : [];
  const picks = anchors.slice(0, count);
  if (picks.length < count) {
    for (const t of selectableStarts) {
      if (!picks.includes(t)) {
        picks.push(t);
        if (picks.length === count) break;
      }
    }
  }
  return new Set(picks);
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
  duration,
  reason = "",
  includeNext,
  _effectiveOverride,
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

  // 1) Resolve rules
  const normReason = normalize(reason);
  const baseRule = REASON_RULES[normReason] || REASON_RULES.default;
  const ruleDur = Number(
    baseRule.durationMinutes ?? duration ?? REASON_RULES.default.durationMinutes
  );
  const effective = _effectiveOverride || {
    reasonOriginal: reason,
    normReason,
    durationMinutes: ruleDur,
    reserveMinutes: Number(baseRule.reserveMinutes ?? ruleDur),
    startAlignment:
      baseRule.startAlignment != null
        ? Number(baseRule.startAlignment)
        : ruleDur <= 15
        ? 15
        : 30,
    dailyCap: baseRule.dailyCap ?? null,
    monthlyCap: baseRule.monthlyCap ?? null,
    dbMatch: baseRule.dbMatch || reason,
    allowedWindows: Array.isArray(baseRule.allowedWindows)
      ? baseRule.allowedWindows.map((w) => ({
          startMin: minutesFromHHMM(w.start),
          endMin: minutesFromHHMM(w.end),
        }))
      : null,
    bufferBeforeTicks: Number(baseRule.bufferBeforeTicks ?? 0),
    bufferAfterTicks: Number(baseRule.bufferAfterTicks ?? 0),

    // Carry the hold settings (even if current reason isn't evaluation)
    evalDailyHoldCount:
      REASON_RULES["αξιολογηση αποτελεσματων"]?.dailyHoldCount ?? 0,
    evalDailyHoldAnchors:
      !!REASON_RULES["αξιολογηση αποτελεσματων"]?.dailyHoldAnchors,
  };

  // 2) Monthly cap
  if (effective.monthlyCap != null) {
    const [Y, M] = dateISO.split("-").map(Number);
    const monthStart = new Date(Date.UTC(Y, M - 1, 1, 0, 0, 0));
    const nextMonthStart = new Date(Date.UTC(Y, M, 1, 0, 0, 0));
    const { count, error: capErr } = await supabase
      .from("appointments")
      .select("*", { head: true, count: "exact" })
      .eq("reason", effective.dbMatch)
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

  // 3) Base schedule
  const weekday = new Date(`${dateISO}T00:00:00Z`).getUTCDay(); // 0=Sunday
  const { data: scheduleData, error: schedErr } = await supabase
    .from("clinic_schedule")
    .select("start_time, end_time")
    .eq("weekday", weekday);
  if (schedErr) throw schedErr;

  if (!scheduleData?.length) {
    return {
      availableSlots: [],
      allSlots: [],
      fullDayException: false,
      reasonBlocked: false,
    };
  }

  let workingPeriods = scheduleData.map((s) => {
    const startMin = minutesFromHHMM(s.start_time);
    const endMin = minutesFromHHMM(s.end_time);
    return { startMin, endMin };
  });

  workingPeriods = intersectWindows(workingPeriods, effective.allowedWindows);
  if (!workingPeriods.length) {
    return {
      availableSlots: [],
      allSlots: [],
      fullDayException: false,
      reasonBlocked: true,
      message: "Δεν υπάρχουν διαθέσιμες ώρες για αυτό τον τύπο ραντεβού.",
    };
  }

  // 4) Exceptions
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
      startMin: minutesOfDayAthensFromAny(e.start_time),
      endMin: minutesOfDayAthensFromAny(e.end_time),
    }))
    // guard against bad data (nulls or reversed)
    .filter(
      (r) =>
        Number.isFinite(r.startMin) &&
        Number.isFinite(r.endMin) &&
        r.endMin > r.startMin
    );

  // 5) Booked
  const startOfDay = `${dateISO}T00:00:00.000Z`;
  const endOfDay = `${dateISO}T23:59:59.999Z`;

  const { data: booked, error: bookedErr } = await supabase
    .from("appointments")
    .select("reason, appointment_time, duration_minutes, status")
    .gte("appointment_time", startOfDay)
    .lte("appointment_time", endOfDay)
    .in("status", ["approved", "completed", "scheduled"]);
  if (bookedErr) throw bookedErr;

  const bookedSet = new Set();
  const sameDayReasonCount = { total: 0 };
  (booked || []).forEach(
    ({ appointment_time, duration_minutes, reason: r }) => {
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

  // 6) Ticks grid
  const suppressPast = isTodayInAthens(dateISO);
  const ticks = buildTicks(
    workingPeriods,
    bookedSet,
    exceptionRanges,
    suppressPast
  );

  // 7) Valid starts for THIS reason
  const reserveSteps = Math.ceil(Number(effective.reserveMinutes) / 15);
  const bufferBefore = Number(effective.bufferBeforeTicks || 0);
  const bufferAfter = Number(effective.bufferAfterTicks || 0);
  const align = Number(effective.startAlignment || 30);
  const isAligned = (m) => m % align === 0;

  const selectable = [];
  for (let i = 0; i < ticks.length; i++) {
    const t0 = ticks[i];
    if (!t0.free || !isAligned(t0.m)) continue;

    let ok = true;
    // buffer BEFORE
    for (let b = 1; b <= bufferBefore; b++) {
      const tb = ticks[i - b];
      if (!tb || !tb.free) {
        ok = false;
        break;
      }
      const prev = ticks[i - b + 1] || t0;
      if (prev.h * 60 + prev.m - (tb.h * 60 + tb.m) !== 15) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    // reserve block
    for (let k = 1; k < reserveSteps; k++) {
      const tk = ticks[i + k];
      if (!tk || !tk.free) {
        ok = false;
        break;
      }
      const prev = ticks[i + k - 1];
      if (tk.h * 60 + tk.m - (prev.h * 60 + prev.m) !== 15) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    // buffer AFTER
    for (let a = 1; a <= bufferAfter; a++) {
      const ta = ticks[i + reserveSteps + a - 1];
      const prev = ticks[i + reserveSteps + a - 2];
      if (!ta || !ta.free || !prev) {
        ok = false;
        break;
      }
      if (ta.h * 60 + ta.m - (prev.h * 60 + prev.m) !== 15) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;

    selectable.push(t0.key);
  }

  // ---------- EXCLUSIVE DAILY HOLD FOR Αξιολόγηση Αποτελεσμάτων ----------
  // Build the reserved set from today's FREE 15-min-aligned starts (independent of the current reason).
  let reservedSet = new Set();
  const holdCount = Number(
    REASON_RULES["αξιολογηση αποτελεσματων"]?.dailyHoldCount || 0
  );
  const holdAnchors =
    !!REASON_RULES["αξιολογηση αποτελεσματων"]?.dailyHoldAnchors;

  if (holdCount > 0) {
    // Collect all free 15-min aligned starts from the day's ticks (ignores current reason constraints)
    const free15Aligned = ticks
      .filter((t) => t.free && t.m % 15 === 0)
      .map((t) => t.key)
      .sort((a, b) => minutesOf(a) - minutesOf(b));

    reservedSet = pickDailyHold(free15Aligned, holdCount, holdAnchors);
  }

  const isEvaluation = normReason === "αξιολογηση αποτελεσματων";

  // If NOT evaluation, mask out any reserved holds from the selectable list
  let filteredSelectable = selectable;
  if (!isEvaluation && holdCount > 0) {
    filteredSelectable = selectable.filter((t) => !reservedSet.has(t));
  }

  // Build the visible set:
  // - Evaluation: show remaining held slots (1–2). If none left, fallback to your windowed-two logic.
  // - Others: windowed-two from filteredSelectable (unchanged UX).
  let limited = filteredSelectable;

  if (effective.durationMinutes <= 15) {
    if (isEvaluation && holdCount > 0) {
      const stillFreeHeld = [...reservedSet]
        .filter((t) => selectable.includes(t)) // ensure still free for this reason’s constraints
        .sort((a, b) => minutesOf(a) - minutesOf(b));
      if (stillFreeHeld.length > 0) {
        limited = stillFreeHeld.slice(0, 2); // show up to the 2 held ones
      } else {
        // fallback: earliest windowed two from filteredSelectable
        const groups = new Map();
        for (const t of filteredSelectable) {
          const mins = minutesOf(t);
          const winStart = Math.floor(mins / 30) * 30;
          const key = timeStr(Math.floor(winStart / 60), winStart % 60);
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(t);
        }
        const keys = [...groups.keys()].sort(
          (a, b) => minutesOf(a) - minutesOf(b)
        );
        limited = keys.length
          ? groups
              .get(keys[0])
              .sort((a, b) => minutesOf(a) - minutesOf(b))
              .slice(0, 2)
          : [];
      }
    } else {
      // Non-evaluation 15′ reasons: earliest windowed two from filteredSelectable
      const groups = new Map();
      for (const t of filteredSelectable) {
        const mins = minutesOf(t);
        const winStart = Math.floor(mins / 30) * 30;
        const key = timeStr(Math.floor(winStart / 60), winStart % 60);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(t);
      }
      const keys = [...groups.keys()].sort(
        (a, b) => minutesOf(a) - minutesOf(b)
      );
      limited = keys.length
        ? groups
            .get(keys[0])
            .sort((a, b) => minutesOf(a) - minutesOf(b))
            .slice(0, 2)
        : [];
    }
  }

  const visibleSet = new Set(limited);
  const allSlots = ticks
    .filter((t) => t.m % align === 0 && visibleSet.has(t.key))
    .map((t) => ({
      time: t.key,
      available: true,
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
      evalDailyHoldCount: holdCount,
      evalDailyHoldAnchors: holdAnchors,
    },
    availableSlots: limited, // evaluation sees held ones; others don't see held ones
    allSlots,
    fullDayException,
    reasonBlocked: false,
  };

  if (includeNext && limited.length === 0) {
    payload.nextAvailable = await findNextAvailable({ dateISO, effective });
  }

  return payload;
}

// ----------------------------- HTTP handler -----------------------------
export async function POST(req) {
  try {
    const body = await req.json();
    const { dateISO, duration, reason = "", includeNext = true } = body || {};

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
