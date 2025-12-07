import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { addDays, format as fmt } from "date-fns";

// 15-min grid
const SLOT_STEP = 15;
const ATHENS_TZ = "Europe/Athens";

const athensFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: ATHENS_TZ,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function minutesInAthens(date) {
  const parts = athensFormatter.formatToParts(date);
  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hh * 60 + mm;
}

function parseHHMM(str) {
  if (!str) return null;
  const [h, m] = str.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function toHHMM(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function buildWorkingRanges(dateISO, scheduleRows) {
  // scheduleRows: [{ start_time, end_time }]
  // returns [{ startMin, endMin }]
  const ranges = [];

  for (const row of scheduleRows || []) {
    const startStr = String(row.start_time || "").slice(0, 5);
    const endStr = String(row.end_time || "").slice(0, 5);

    const s = parseHHMM(startStr);
    const e = parseHHMM(endStr);

    if (s == null || e == null || e <= s) continue;
    ranges.push({ startMin: s, endMin: e });
  }

  return ranges;
}

function buildSlotsFromRanges(ranges) {
  const slots = [];
  for (const r of ranges) {
    for (let t = r.startMin; t < r.endMin; t += SLOT_STEP) {
      slots.push(t);
    }
  }
  // unique + sort
  return [...new Set(slots)].sort((a, b) => a - b);
}

function isWithinRange(min, start, end) {
  return min >= start && min < end;
}

function overlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

async function getVisitorCountForMonth(dateObj) {
  const start = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
  const end = new Date(
    dateObj.getFullYear(),
    dateObj.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  const { count, error } = await supabaseAdmin
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("reason", "Ιατρικός Επισκέπτης")
    .gte("appointment_time", start.toISOString())
    .lte("appointment_time", end.toISOString());

  if (error) return 0;
  return count || 0;
}

async function computeAvailabilityForDate(dateISO, duration) {
  const dateObj = new Date(`${dateISO}T00:00:00.000Z`);
  const weekday = dateObj.getUTCDay(); // ok for weekday mapping in practice

  // 1) Schedule
  const { data: scheduleRows } = await supabaseAdmin
    .from("clinic_schedule")
    .select("start_time, end_time")
    .eq("weekday", weekday);

  const workingRanges = buildWorkingRanges(dateISO, scheduleRows);
  const baseSlots = buildSlotsFromRanges(workingRanges);

  if (!baseSlots.length) {
    return {
      allSlots: [],
      availableSlots: [],
      fullDayException: false,
    };
  }

  // 2) Exceptions
  const { data: exceptions } = await supabaseAdmin
    .from("schedule_exceptions")
    .select("start_time, end_time")
    .eq("exception_date", dateISO);

  const fullDayException = (exceptions || []).some(
    (e) => !e.start_time && !e.end_time
  );

  if (fullDayException) {
    return {
      allSlots: baseSlots.map((m) => ({ time: toHHMM(m), available: false })),
      availableSlots: [],
      fullDayException: true,
    };
  }

  const exceptionRanges = (exceptions || [])
    .filter((e) => e.start_time && e.end_time)
    .map((e) => ({
      startMin: minutesInAthens(new Date(e.start_time)),
      endMin: minutesInAthens(new Date(e.end_time)),
    }))
    .filter((r) => r.endMin > r.startMin);

  // 3) Appointments for day
  const startOfDay = new Date(dateObj);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(dateObj);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const { data: appts } = await supabaseAdmin
    .from("appointments")
    .select("appointment_time, duration_minutes, status")
    .gte("appointment_time", startOfDay.toISOString())
    .lte("appointment_time", endOfDay.toISOString());

  const busyRanges = (appts || [])
    .filter((a) => !["cancelled", "rejected"].includes(a.status))
    .map((a) => {
      const start = minutesInAthens(new Date(a.appointment_time));
      const dur = Number(a.duration_minutes || 30);
      return { startMin: start, endMin: start + dur };
    });

  // 4) Evaluate availability for each slot
  const allSlots = [];
  const availableSlots = [];

  for (const startMin of baseSlots) {
    const endMin = startMin + duration;

    // must fit inside at least one working range
    const fitsWorking = workingRanges.some(
      (r) => startMin >= r.startMin && endMin <= r.endMin
    );

    if (!fitsWorking) {
      allSlots.push({ time: toHHMM(startMin), available: false });
      continue;
    }

    const blockedByException = exceptionRanges.some((er) =>
      overlap(startMin, endMin, er.startMin, er.endMin)
    );

    const blockedByAppt = busyRanges.some((br) =>
      overlap(startMin, endMin, br.startMin, br.endMin)
    );

    const ok = !blockedByException && !blockedByAppt;

    allSlots.push({ time: toHHMM(startMin), available: ok });
    if (ok) availableSlots.push(toHHMM(startMin));
  }

  return { allSlots, availableSlots, fullDayException: false };
}

async function findNextAvailable(dateISO, duration, daysAhead = 30) {
  const startDate = new Date(`${dateISO}T00:00:00.000Z`);

  for (let i = 1; i <= daysAhead; i++) {
    const d = addDays(startDate, i);
    const nextISO = fmt(d, "yyyy-MM-dd");

    const { allSlots, availableSlots, fullDayException } =
      await computeAvailabilityForDate(nextISO, duration);

    if (!fullDayException && allSlots.length && availableSlots.length) {
      return { dateISO: nextISO };
    }
  }

  return null;
}

export async function POST(req) {
  try {
    const { dateISO, duration, reason, includeNext } = await req.json();

    if (!dateISO || !duration) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
      });
    }

    const durationNum = Number(duration);
    if (!Number.isFinite(durationNum) || durationNum <= 0) {
      return new Response(JSON.stringify({ error: "Invalid duration" }), {
        status: 400,
      });
    }

    const dateObj = new Date(`${dateISO}T00:00:00.000Z`);
    if (Number.isNaN(dateObj.getTime())) {
      return new Response(JSON.stringify({ error: "Invalid date" }), {
        status: 400,
      });
    }

    const { allSlots, availableSlots, fullDayException } =
      await computeAvailabilityForDate(dateISO, durationNum);

    // visitor count info (optional enhancement for UI)
    let visitorCount = 0;
    let visitorMonthFull = false;

    if (reason === "Ιατρικός Επισκέπτης") {
      visitorCount = await getVisitorCountForMonth(dateObj);
      visitorMonthFull = visitorCount >= 2;
    }

    const nextAvailable = includeNext
      ? await findNextAvailable(dateISO, durationNum)
      : null;

    return new Response(
      JSON.stringify({
        allSlots,
        availableSlots,
        fullDayException,
        nextAvailable,
        visitorCount,
        visitorMonthFull,
      }),
      { status: 200 }
    );
  } catch (e) {
    console.error("check-availability error:", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}
