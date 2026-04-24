export function normalizeDate(dateLike) {
  const d = new Date(dateLike);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function todayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
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
