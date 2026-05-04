// Mirrors src/utils/notifications.js — picks the per-cycle notifications
// to send today. Keep behavior identical to the client implementation.

import {
  buildCycles,
  classifyDay,
  currentOvulationDate,
  diffDays,
  nextPeriodStart,
  normalizeDate,
} from "./cycle-logic.ts";

interface I18n {
  ui: {
    partnerFallback: string;
    notifPeriodTodayTitle: string;
    notifPeriodTodayBodyMan: (name: string) => string;
    notifPeriodTodayBodyWoman: string;
    notifOvulationTodayTitle: string;
    notifOvulationTodayBodyMan: (name: string) => string;
    notifOvulationTodayBodyWoman: string;
    notifOvulationTomorrowTitle: string;
    notifOvulationTomorrowBody: string;
    notifFertileTitle: string;
    notifFertileBody: string;
    notifPeriodTomorrowTitle: string;
    notifPeriodInNTitle: (n: number) => string;
    notifPeriodSoonBodyMan: (name: string) => string;
    notifPeriodSoonBodyWoman: string;
    notifCalmTitle: string;
    notifCalmBody: (name: string) => string;
  };
}

interface Args {
  startDate: string;
  durations: number[];
  role: "woman" | "man";
  partnerName: string;
  myName: string;
  t: I18n;
}

interface Notif {
  id: string;
  icon: string;
  title: string;
  body: string;
  severity: "info" | "soft" | "warm";
}

export function computeNotifications({
  startDate,
  durations,
  role,
  partnerName,
  myName,
  t,
}: Args): Notif[] {
  if (!startDate || !durations || durations.length !== 4) return [];

  const today = normalizeDate(new Date());
  const cycles = buildCycles(startDate, durations, 2, 6);
  const todayCls = classifyDay(today, cycles);
  const nextPeriod = nextPeriodStart(startDate, durations);
  const ovulation = currentOvulationDate(startDate, durations);
  const daysUntilPeriod = diffDays(nextPeriod, today);
  const daysUntilOvulation = diffDays(ovulation, today);

  const notifs: Notif[] = [];

  if (todayCls.isPeriod && !todayCls.isPredicted) {
    notifs.push({
      id: "period-today",
      icon: "🩸",
      title: t.ui.notifPeriodTodayTitle,
      body:
        role === "man"
          ? t.ui.notifPeriodTodayBodyMan(partnerName || t.ui.partnerFallback)
          : t.ui.notifPeriodTodayBodyWoman,
      severity: "warm",
    });
  }

  if (daysUntilOvulation === 0 && !todayCls.isPeriod) {
    notifs.push({
      id: "ovulation-today",
      icon: "🌕",
      title: t.ui.notifOvulationTodayTitle,
      body:
        role === "man"
          ? t.ui.notifOvulationTodayBodyMan(partnerName || t.ui.partnerFallback)
          : t.ui.notifOvulationTodayBodyWoman,
      severity: "info",
    });
  }

  if (daysUntilOvulation === 1) {
    notifs.push({
      id: "ovulation-tomorrow",
      icon: "🌕",
      title: t.ui.notifOvulationTomorrowTitle,
      body: t.ui.notifOvulationTomorrowBody,
      severity: "info",
    });
  }

  if (todayCls.isFertile && !todayCls.isOvulation) {
    notifs.push({
      id: "fertile-window",
      icon: "💚",
      title: t.ui.notifFertileTitle,
      body: t.ui.notifFertileBody,
      severity: "info",
    });
  }

  if (daysUntilPeriod >= 1 && daysUntilPeriod <= 3) {
    notifs.push({
      id: `period-in-${daysUntilPeriod}`,
      icon: "🌒",
      title:
        daysUntilPeriod === 1
          ? t.ui.notifPeriodTomorrowTitle
          : t.ui.notifPeriodInNTitle(daysUntilPeriod),
      body:
        role === "man"
          ? t.ui.notifPeriodSoonBodyMan(partnerName || t.ui.partnerFallback)
          : t.ui.notifPeriodSoonBodyWoman,
      severity: daysUntilPeriod === 1 ? "warm" : "soft",
    });
  }

  if (notifs.length === 0) {
    notifs.push({
      id: "calm",
      icon: "✨",
      title: t.ui.notifCalmTitle,
      body: t.ui.notifCalmBody(myName || ""),
      severity: "info",
    });
  }

  return notifs;
}
