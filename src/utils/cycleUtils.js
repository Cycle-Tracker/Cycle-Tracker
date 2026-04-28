/**
 * Normalize any date-like input to a local-midnight Date.
 *
 * IMPORTANT: ISO date strings like "2026-04-10" are parsed by the JS engine as
 * UTC midnight, which becomes the *previous* day in any UTC-negative timezone
 * (e.g. America/New_York). To avoid that off-by-one shift, we explicitly parse
 * pure YYYY-MM-DD strings as local dates.
 */
export function normalizeDate(dateLike) {
  if (typeof dateLike === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateLike);
    if (m) {
      // Local date — month is 0-indexed
      return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
    }
  }
  const d = new Date(dateLike);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns a YYYY-MM-DD string built from the LOCAL components of `date`.
 * Avoid using `toISOString()` for this — it converts to UTC first, which can
 * shift the day by ±1 depending on the user's timezone.
 */
export function toIsoDateLocal(date) {
  const d = date instanceof Date ? date : normalizeDate(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayIso() {
  return toIsoDateLocal(new Date());
}

export function getTotalDays(durations) {
  return durations.reduce((sum, value) => sum + value, 0);
}

export function buildPhases(meta, durations) {
  let day = 1;

  return meta.map((item, index) => {
    const start = day;
    const end = day + durations[index] - 1;
    day = end + 1;

    return {
      ...item,
      days: [start, end],
    };
  });
}

export function getDayOfCycle(startDate, totalDays) {
  const start = normalizeDate(startDate);

  if (Number.isNaN(start.getTime()) || totalDays <= 0) {
    return 1;
  }

  const now = normalizeDate(new Date());
  const diff = Math.floor((now - start) / 86400000);

  return (((diff % totalDays) + totalDays) % totalDays) + 1;
}

export function getPhase(day, phases) {
  return (
    phases.find((phase) => day >= phase.days[0] && day <= phase.days[1]) ??
    phases[0]
  );
}
