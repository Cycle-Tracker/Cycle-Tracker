import { normalizeDate } from "./cycleUtils";
import {
  buildCycles,
  classifyDay,
  diffDays,
  nextPeriodStart,
  currentOvulationDate,
} from "./cyclePredict";

/**
 * Compute a list of "soft" notifications based on the current cycle state.
 * These are derived from data — no backend, no push — so they update live as
 * the cycle progresses.
 *
 * Each notification:
 *   { id, icon, title, body, severity }
 *
 * severity: "info" | "soft" | "warm"
 *
 * We tailor the wording to the role (woman vs man) using i18n callbacks.
 */
export function computeNotifications({
  startDate,
  durations,
  role,
  partnerName,
  myName,
  t,
}) {
  if (!startDate || !durations || durations.length !== 4) return [];

  const today = normalizeDate(new Date());
  const cycles = buildCycles(startDate, durations, 2, 6);
  const todayCls = classifyDay(today, cycles);
  const nextPeriod = nextPeriodStart(startDate, durations);
  const ovulation = currentOvulationDate(startDate, durations);
  const daysUntilPeriod = diffDays(nextPeriod, today);
  const daysUntilOvulation = diffDays(ovulation, today);

  const notifs = [];

  // Period today / very recent
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

  // Ovulation today
  if (
    daysUntilOvulation === 0 &&
    !todayCls.isPeriod
  ) {
    notifs.push({
      id: "ovulation-today",
      icon: "🌕",
      title: t.ui.notifOvulationTodayTitle,
      body:
        role === "man"
          ? t.ui.notifOvulationTodayBodyMan(
              partnerName || t.ui.partnerFallback
            )
          : t.ui.notifOvulationTodayBodyWoman,
      severity: "info",
    });
  }

  // Ovulation tomorrow
  if (daysUntilOvulation === 1) {
    notifs.push({
      id: "ovulation-tomorrow",
      icon: "🌕",
      title: t.ui.notifOvulationTomorrowTitle,
      body: t.ui.notifOvulationTomorrowBody,
      severity: "info",
    });
  }

  // Fertile window starts today
  if (todayCls.isFertile && !todayCls.isOvulation) {
    notifs.push({
      id: "fertile-window",
      icon: "💚",
      title: t.ui.notifFertileTitle,
      body: t.ui.notifFertileBody,
      severity: "info",
    });
  }

  // Period in 1, 2, or 3 days
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

  // Friendly placeholder when nothing notable
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
