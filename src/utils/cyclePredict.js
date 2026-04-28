import { normalizeDate, toIsoDateLocal } from "./cycleUtils";

/**
 * Helpers to predict period dates, ovulation day, and fertile window from
 * a start date + phase durations, and to classify any given calendar day.
 *
 * Conventions:
 *  - durations: [menstrual, follicular, ovulatory, luteal]
 *  - Day 1 = first day of the period.
 *  - Ovulation day estimate = (totalDays - 14). This is the standard luteal-
 *    phase rule (luteal phase ≈ 14 days before next period). It works whether
 *    cycles are short or long.
 *  - Ovulation peak (highest fertility) = 3 days centered on ovulation day:
 *    J-1, J, J+1. Most fertility apps use this window since the egg can be
 *    fertilized for ~24h after release and the day before is the highest-yield
 *    window for conception.
 *  - Fertile window = 5 days before ovulation + the 3-day peak = 7 days total
 *    (sperm can survive up to 5 days in the reproductive tract).
 */

const MS_PER_DAY = 86400000;

export function addDays(dateLike, n) {
  const d = normalizeDate(dateLike);
  d.setDate(d.getDate() + n);
  return d;
}

export function diffDays(a, b) {
  return Math.round((normalizeDate(a) - normalizeDate(b)) / MS_PER_DAY);
}

export function isoOf(date) {
  return toIsoDateLocal(normalizeDate(date));
}

/**
 * Returns an array of cycles around `startDate`, each with predicted markers.
 * past: how many cycles BEFORE the current to include (default 6)
 * future: how many cycles AFTER the current to include (default 6)
 *
 * Each cycle:
 *   {
 *     index,           // 0 = current, -1 = previous, +1 = next, ...
 *     periodStart,     // Date — first day of period for this cycle
 *     periodEnd,       // Date — last day of period
 *     ovulation,       // Date — predicted ovulation day (center of peak)
 *     ovulationStart,  // Date — first day of 3-day ovulation peak (J-1)
 *     ovulationEnd,    // Date — last day of 3-day ovulation peak (J+1)
 *     fertileStart,    // Date — start of fertile window (5 days before ovulation)
 *     fertileEnd,      // Date — end of fertile window (J+1 of ovulation)
 *     totalDays,       // length of this cycle
 *   }
 */
export function buildCycles(startDate, durations, past = 6, future = 6) {
  const totalDays = durations.reduce((s, n) => s + n, 0);
  const periodLen = durations[0];
  const ovulationOffset = Math.max(0, totalDays - 14); // days from period start
  const cycles = [];

  for (let i = -past; i <= future; i++) {
    const periodStart = addDays(startDate, i * totalDays);
    const periodEnd = addDays(periodStart, periodLen - 1);
    const ovulation = addDays(periodStart, ovulationOffset);
    const ovulationStart = addDays(ovulation, -1);
    const ovulationEnd = addDays(ovulation, 1);
    const fertileStart = addDays(ovulation, -5);
    const fertileEnd = ovulationEnd; // include the post-ovulation peak day
    cycles.push({
      index: i,
      periodStart,
      periodEnd,
      ovulation,
      ovulationStart,
      ovulationEnd,
      fertileStart,
      fertileEnd,
      totalDays,
    });
  }
  return cycles;
}

/**
 * Classify a given Date according to the predicted cycles.
 * Returns an object with boolean flags + a "kind" preference field.
 */
export function classifyDay(date, cycles) {
  const t = normalizeDate(date).getTime();
  let isPeriod = false;
  let isOvulation = false;
  let isFertile = false;
  let isPredicted = true; // assume predicted unless past

  // Walk every cycle in the window and OR-combine the flags.
  for (const c of cycles) {
    if (
      t >= normalizeDate(c.periodStart).getTime() &&
      t <= normalizeDate(c.periodEnd).getTime()
    ) {
      isPeriod = true;
    }
    // Ovulation peak — 3-day window (J-1, J, J+1) for visibility
    const ovStart = c.ovulationStart
      ? normalizeDate(c.ovulationStart).getTime()
      : normalizeDate(c.ovulation).getTime();
    const ovEnd = c.ovulationEnd
      ? normalizeDate(c.ovulationEnd).getTime()
      : normalizeDate(c.ovulation).getTime();
    if (t >= ovStart && t <= ovEnd) {
      isOvulation = true;
    }
    if (
      t >= normalizeDate(c.fertileStart).getTime() &&
      t <= normalizeDate(c.fertileEnd).getTime()
    ) {
      isFertile = true;
    }
  }

  // Past = before today
  const today = normalizeDate(new Date()).getTime();
  isPredicted = t > today;

  // Pick the most informative kind to show in the UI when overlaps occur.
  let kind = "none";
  if (isPeriod) kind = "period";
  else if (isOvulation) kind = "ovulation";
  else if (isFertile) kind = "fertile";

  return { kind, isPeriod, isOvulation, isFertile, isPredicted };
}

/**
 * Find the next predicted period START strictly after today.
 * Returns a Date.
 */
export function nextPeriodStart(startDate, durations) {
  const totalDays = durations.reduce((s, n) => s + n, 0);
  const today = normalizeDate(new Date());
  const start = normalizeDate(startDate);
  const elapsed = diffDays(today, start);
  const cyclesElapsed =
    elapsed >= 0 ? Math.floor(elapsed / totalDays) + 1 : 0;
  return addDays(start, cyclesElapsed * totalDays);
}

/**
 * Predicted ovulation date for the cycle containing `today`.
 */
export function currentOvulationDate(startDate, durations) {
  const totalDays = durations.reduce((s, n) => s + n, 0);
  const today = normalizeDate(new Date());
  const start = normalizeDate(startDate);
  const elapsed = diffDays(today, start);
  const cyclesElapsed = elapsed >= 0 ? Math.floor(elapsed / totalDays) : 0;
  const periodStart = addDays(start, cyclesElapsed * totalDays);
  return addDays(periodStart, Math.max(0, totalDays - 14));
}
