// Cycle date math — Deno-friendly subset of src/utils/cycleUtils.js +
// src/utils/cyclePredict.js.
//
// Keep this in sync with the client-side files (or extract a shared package
// later). Today the duplication is small enough that copying is cheaper.

const MS_PER_DAY = 86400000;

export function normalizeDate(dateLike: string | Date): Date {
  if (typeof dateLike === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateLike);
    if (m) {
      return new Date(
        Number(m[1]),
        Number(m[2]) - 1,
        Number(m[3]),
        0,
        0,
        0,
        0
      );
    }
  }
  const d = new Date(dateLike as any);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(dateLike: string | Date, n: number): Date {
  const d = normalizeDate(dateLike);
  d.setDate(d.getDate() + n);
  return d;
}

export function diffDays(a: string | Date, b: string | Date): number {
  return Math.round(
    (normalizeDate(a).getTime() - normalizeDate(b).getTime()) / MS_PER_DAY
  );
}

interface Cycle {
  index: number;
  periodStart: Date;
  periodEnd: Date;
  ovulation: Date;
  ovulationStart: Date;
  ovulationEnd: Date;
  fertileStart: Date;
  fertileEnd: Date;
  cycleEnd: Date;
}

export function buildCycles(
  startDate: string | Date,
  durations: number[],
  past = 2,
  future = 6
): Cycle[] {
  const [periodLen, follicularLen, ovulationLen, lutealLen] = durations;
  const totalLen = periodLen + follicularLen + ovulationLen + lutealLen;
  const anchor = normalizeDate(startDate);

  const out: Cycle[] = [];
  for (let i = -past; i <= future; i++) {
    const periodStart = addDays(anchor, i * totalLen);
    const periodEnd = addDays(periodStart, periodLen - 1);
    const ovulationCenter = addDays(periodStart, periodLen + follicularLen);
    const ovulationStart = addDays(ovulationCenter, -Math.floor(ovulationLen / 2));
    const ovulationEnd = addDays(ovulationStart, ovulationLen - 1);
    const fertileStart = addDays(ovulationStart, -5);
    const fertileEnd = ovulationEnd;
    const cycleEnd = addDays(periodStart, totalLen - 1);
    out.push({
      index: i,
      periodStart,
      periodEnd,
      ovulation: ovulationCenter,
      ovulationStart,
      ovulationEnd,
      fertileStart,
      fertileEnd,
      cycleEnd,
    });
  }
  return out;
}

interface DayClass {
  isPeriod: boolean;
  isOvulation: boolean;
  isFertile: boolean;
  isPredicted: boolean;
}

export function classifyDay(date: Date, cycles: Cycle[]): DayClass {
  const t = normalizeDate(date).getTime();
  for (const c of cycles) {
    const pStart = c.periodStart.getTime();
    const pEnd = c.periodEnd.getTime();
    const ovStart = c.ovulationStart.getTime();
    const ovEnd = c.ovulationEnd.getTime();
    const fStart = c.fertileStart.getTime();
    const fEnd = c.fertileEnd.getTime();

    const isPredicted = c.index !== 0;
    if (t >= pStart && t <= pEnd) {
      return { isPeriod: true, isOvulation: false, isFertile: false, isPredicted };
    }
    if (t >= ovStart && t <= ovEnd) {
      return { isPeriod: false, isOvulation: true, isFertile: true, isPredicted };
    }
    if (t >= fStart && t <= fEnd) {
      return { isPeriod: false, isOvulation: false, isFertile: true, isPredicted };
    }
  }
  return { isPeriod: false, isOvulation: false, isFertile: false, isPredicted: false };
}

export function nextPeriodStart(
  startDate: string | Date,
  durations: number[]
): Date {
  const total = durations.reduce((s, n) => s + n, 0);
  const today = normalizeDate(new Date());
  let d = normalizeDate(startDate);
  while (d.getTime() <= today.getTime()) {
    d = addDays(d, total);
  }
  return d;
}

export function currentOvulationDate(
  startDate: string | Date,
  durations: number[]
): Date {
  const [periodLen, follicularLen] = durations;
  const total = durations.reduce((s, n) => s + n, 0);
  const today = normalizeDate(new Date());
  // Find the cycle anchor whose ovulation hasn't passed yet.
  let anchor = normalizeDate(startDate);
  let ov = addDays(anchor, periodLen + follicularLen);
  while (ov.getTime() < today.getTime()) {
    anchor = addDays(anchor, total);
    ov = addDays(anchor, periodLen + follicularLen);
  }
  return ov;
}
