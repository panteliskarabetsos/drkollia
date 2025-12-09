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
  // Ήδη δεν έχουμε duplicates, οπότε απλό sort
  return slots.sort((a, b) => a - b);
}

function isWithinRange(min, start, end) {
  return min >= start && min < end;
}

function overlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

/* ---------------------- ΝΕΟΣ ΑΛΓΟΡΙΘΜΟΣ SLOTS ---------------------- */

// slot.free = αν το 15λεπτο είναι πραγματικά ελεύθερο (χωρίς ραντεβού / εξαίρεση)
function isFreeSlot(slot) {
  return !!slot.free;
}

// 30': επιτρέπουμε μόνο αρχές από 2 ΣΥΝΕΧΟΜΕΝΑ free 15λεπτα
function compute30Slots(slots) {
  const resultTimes = [];

  for (let i = 0; i < slots.length - 1; i++) {
    const s1 = slots[i];
    const s2 = slots[i + 1];
    if (!s1 || !s2) continue;
    if (!isFreeSlot(s1) || !isFreeSlot(s2)) continue;

    // πρέπει να είναι συνεχόμενα 15λεπτα
    if (s2.startMin !== s1.startMin + SLOT_STEP) continue;

    // θέλουμε 30' μόνο σε λεπτά :00 ή :30
    if (s1.startMin % 30 !== 0) continue;

    resultTimes.push(s1.time); // αρχή 30λεπτου
  }

  return resultTimes;
}
// 15': προσπαθούμε πρώτα να γεμίσουμε «σπασμένες» περιοχές
// που ΔΕΝ μειώνουν πόσα 30' χωράνε συνολικά.
// Αν δεν υπάρχουν τέτοιες, διαλέγουμε τα 15' που
// προκαλούν τη ΜΙΚΡΟΤΕΡΗ δυνατή ζημιά στη χωρητικότητα των 30'.
function computeSmart15Slots(slots) {
  const freeSlots = slots.filter((s) => isFreeSlot(s));
  if (!freeSlots.length) return [];

  const safeZeroLoss = []; // 15' που δεν μειώνουν τον max αριθμό 30'
  const safeZeroLossNice = []; // τα παραπάνω αλλά μόνο σε :15 / :45
  let bestLossSlots = []; // 15' με την ελάχιστη «ζημιά» (loss)
  let bestLossNiceSlots = []; // ίδια, αλλά μόνο :15 / :45
  let globalMinLoss = Infinity;

  let runStart = 0;
  const runCount = freeSlots.length;

  // Χωρίζουμε τα free 15' σε συνεχόμενα runs (με βήμα 15')
  for (let i = 0; i <= runCount; i++) {
    const current = i < runCount ? freeSlots[i] : null;
    const prev = i > 0 ? freeSlots[i - 1] : null;

    const isBreak =
      i === runCount || !prev || current.startMin !== prev.startMin + SLOT_STEP;

    if (isBreak) {
      const runEnd = i - 1;

      if (runEnd >= runStart) {
        const length = runEnd - runStart + 1;

        // Τα startMin για αυτό το run
        const startMins = [];
        for (let j = 0; j < length; j++) {
          startMins.push(freeSlots[runStart + j].startMin);
        }

        // Μέγιστος αριθμός 30' που χωράνε σε αυτό το run,
        // με τον περιορισμό ότι τα 30' ξεκινάνε σε λεπτά :00 ή :30
        function max30(mask) {
          let count = 0;
          let j = 0;

          while (j < length - 1) {
            if (
              mask[j] &&
              mask[j + 1] &&
              startMins[j] % 30 === 0 // αρχή 30'
            ) {
              count++;
              mask[j] = false;
              mask[j + 1] = false;
              j += 2;
              continue;
            }
            j++;
          }

          return count;
        }

        const baseCap = max30(new Array(length).fill(true));

        // Δοκιμάζουμε: αν κλείσουμε αυτό το 15', πόσα 30' μένουν;
        for (let localIdx = 0; localIdx < length; localIdx++) {
          const mask = new Array(length).fill(true);
          mask[localIdx] = false; // βάζουμε 15' ραντεβού εδώ

          const newCap = max30(mask);
          const loss = baseCap - newCap; // πόσα 30' χάσαμε;
          const slot = freeSlots[runStart + localIdx];

          if (loss === 0) {
            // ΤΕΛΕΙΑ slots: γεμίζουν κενά χωρίς να μειώνουν χωρητικότητα 30'
            safeZeroLoss.push(slot);
            if (slot.startMin % 30 === 15) {
              safeZeroLossNice.push(slot); // προτιμάμε :15 / :45
            }
          } else if (loss > 0) {
            // Slots που μειώνουν λίγο τη χωρητικότητα 30'
            if (loss < globalMinLoss) {
              globalMinLoss = loss;
              bestLossSlots = [];
              bestLossNiceSlots = [];
            }
            if (loss === globalMinLoss) {
              bestLossSlots.push(slot);
              if (slot.startMin % 30 === 15) {
                bestLossNiceSlots.push(slot);
              }
            }
          }
        }
      }

      runStart = i;
    }
  }

  function pickTimes(arr) {
    return Array.from(new Set(arr.map((s) => s.time)));
  }

  // 1) Ιδανικό: 15' σε :15 / :45 που ΔΕΝ κόβουν κανένα 30'
  if (safeZeroLossNice.length) {
    return pickTimes(safeZeroLossNice);
  }

  // 2) Ακόμα ιδανικό: οποιαδήποτε 15' που δεν κόβουν 30'
  if (safeZeroLoss.length) {
    return pickTimes(safeZeroLoss);
  }

  // 3) Δεν υπάρχουν καθόλου zero-loss σημεία.
  //    Αν ΔΕΝ χωράνε πουθενά 30' έτσι κι αλλιώς, τότε
  //    όλα τα free 15' είναι ουσιαστικά «κρακεράκια» και είναι ΟΚ.
  const has30Capacity = compute30Slots(slots).length > 0;
  if (!has30Capacity) {
    return freeSlots.map((s) => s.time);
  }

  // 4) Ακόμα χωράνε 30': δίνουμε ΜΟΝΟ τα 15' με την ελάχιστη ζημιά,
  //    προτιμώντας ξανά :15 / :45.
  if (bestLossNiceSlots.length) {
    return pickTimes(bestLossNiceSlots);
  }
  if (bestLossSlots.length) {
    return pickTimes(bestLossSlots);
  }

  // 5) Πάρα πολύ σπάνιο fallback: αν για κάποιο λόγο δεν βρεθεί τίποτα,
  //    άφησε όλα τα free 15' (ίδιο με το παλιό behavior).
  return freeSlots.map((s) => s.time);
}

// Γενική συνάρτηση: από grid 15λεπτων → { time, available } για συγκεκριμένο duration
function markAvailableSlots(gridSlots, durationMinutes) {
  let allowedTimes = [];

  if (durationMinutes <= 15) {
    // 15' ραντεβού (Αξιολόγηση, Ιατρικός Επισκέπτης κ.λπ.)
    allowedTimes = computeSmart15Slots(gridSlots);

    // fallback: αν δεν βρέθηκε κανένα «καλό» slot, επέτρεψε όλα τα free 15'
    if (allowedTimes.length === 0) {
      allowedTimes = gridSlots.filter((s) => isFreeSlot(s)).map((s) => s.time);
    }
  } else {
    // 30' ραντεβού (Εξέταση)
    allowedTimes = compute30Slots(gridSlots);
  }

  const allowedSet = new Set(allowedTimes);

  return gridSlots.map((slot) => ({
    time: slot.time,
    available: allowedSet.has(slot.time),
  }));
}

/* ------------------------------------------------------------------ */

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

async function computeAvailabilityForDate(dateISO, durationMinutes) {
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

  // 4) Grid 15λεπτων ανεξάρτητο από duration
  //    free = αν το 15λεπτο είναι μέσα στο ωράριο ΚΑΙ όχι σε εξαίρεση / άλλο ραντεβού
  const gridSlots = baseSlots.map((startMin) => {
    const endMin = startMin + SLOT_STEP;

    // Πρέπει να είναι μέσα σε κάποιο working range
    const fitsWorking = workingRanges.some(
      (r) => startMin >= r.startMin && endMin <= r.endMin
    );

    if (!fitsWorking) {
      return {
        startMin,
        time: toHHMM(startMin),
        free: false,
      };
    }

    const blockedByException = exceptionRanges.some((er) =>
      overlap(startMin, endMin, er.startMin, er.endMin)
    );

    const blockedByAppt = busyRanges.some((br) =>
      overlap(startMin, endMin, br.startMin, br.endMin)
    );

    const free = !blockedByException && !blockedByAppt;

    return {
      startMin,
      time: toHHMM(startMin),
      free,
    };
  });

  // 5) Εφαρμογή "έξυπνου" αλγορίθμου ανά duration (15' / 30')
  const markedSlots = markAvailableSlots(gridSlots, durationMinutes);

  const allSlots = markedSlots;
  const availableSlots = markedSlots
    .filter((s) => s.available)
    .map((s) => s.time);

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
