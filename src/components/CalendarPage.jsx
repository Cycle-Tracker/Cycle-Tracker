import { useMemo, useState } from "react";
import { useLanguage } from "../i18n";
import {
  addDays,
  buildCycles,
  classifyDay,
  diffDays,
  isoOf,
} from "../utils/cyclePredict";
import { normalizeDate, todayIso } from "../utils/cycleUtils";

/**
 * Calendar tab — month view with markers for period (past + predicted),
 * ovulation, and fertile window. Tap a day to mark it as a period start.
 *
 * Now also hosts the cycle stats (count / avg cycle / avg period) at the
 * top, and a collapsible "Voir plus" section underneath with the full
 * past-cycles list + predictions (previously on a separate History page).
 *
 * Props:
 *  - startDate (ISO string)
 *  - durations (array of 4 ints)
 *  - role ("woman" | "man")
 *  - periodsLog (array of ISO date strings — past period starts)
 *  - onLogPeriodStart(iso) — called when user picks a new period-start date
 */
export default function CalendarPage({
  startDate,
  durations,
  role,
  periodsLog = [],
  onLogPeriodStart,
}) {
  const { t, lang } = useLanguage();

  // Anchor month state — start at "today's month".
  const [anchor, setAnchor] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(1);
    return d;
  });

  const [selectedIso, setSelectedIso] = useState(null);

  const cycles = useMemo(
    () => buildCycles(startDate, durations, 24, 12),
    [startDate, durations]
  );

  // Days of the month to render (ISO 8601: Monday-first weeks)
  const days = useMemo(() => buildMonthGrid(anchor), [anchor]);

  // Localized day-of-week labels (Mon..Sun)
  const dowLabels = useMemo(() => buildDowLabels(lang), [lang]);

  // ---- Cycle stats (replaces what used to be on the History page) ----

  // Combine the logged history with the currently active start (if not already in log).
  const allStarts = useMemo(() => {
    const set = new Set(periodsLog);
    if (startDate) set.add(startDate);
    return Array.from(set).sort(); // ascending
  }, [periodsLog, startDate]);

  // Compute lengths between consecutive starts.
  const cycleLengths = useMemo(() => {
    const out = [];
    for (let i = 1; i < allStarts.length; i++) {
      const days = diffDays(allStarts[i], allStarts[i - 1]);
      if (days > 0) out.push({ start: allStarts[i - 1], length: days });
    }
    return out;
  }, [allStarts]);

  const avgCycleLength = useMemo(() => {
    if (cycleLengths.length === 0) {
      const fromDurations =
        Array.isArray(durations) && durations.length > 0
          ? durations.reduce((s, n) => s + (Number(n) || 0), 0)
          : 0;
      return fromDurations > 0 ? fromDurations : 28;
    }
    const sum = cycleLengths.reduce((s, c) => s + c.length, 0);
    const avg = Math.round(sum / cycleLengths.length);
    return avg > 0 ? avg : 28;
  }, [cycleLengths, durations]);

  const periodLength = durations?.[0] ?? 5;

  // Predict next 3 period starts based on the latest known start + avgCycleLength.
  const nextThree = useMemo(() => {
    if (!startDate) return [];
    const step = avgCycleLength > 0 ? avgCycleLength : 28;
    const today = normalizeDate(new Date());
    const start = normalizeDate(startDate);
    const result = [];
    let d = start;
    for (let i = 0; i < 60 && result.length < 3; i++) {
      d = addDays(d, step);
      if (d.getTime() > today.getTime()) result.push(isoOf(d));
    }
    return result;
  }, [startDate, avgCycleLength]);

  const maxLen = Math.max(
    avgCycleLength,
    ...cycleLengths.map((c) => c.length),
    35
  );

  const [showHistoryDetails, setShowHistoryDetails] = useState(false);

  function prevMonth() {
    setAnchor((a) => {
      const d = new Date(a);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  }

  function nextMonth() {
    setAnchor((a) => {
      const d = new Date(a);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  }

  function goToToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(1);
    setAnchor(d);
    setSelectedIso(todayIso());
  }

  const monthLabel = formatMonth(anchor, lang);
  const todayIsoVal = todayIso();

  return (
    <div className="page-shell calendar-page">
      <div className="page-header-simple">
        <h1 className="page-title">{t.ui.tabCalendar}</h1>
      </div>

      <div className="page-body">
        {/* Stats grid (cycles count + avg cycle + avg period) */}
        <div className="stats-grid">
          <StatCard
            value={String(allStarts.length)}
            label={t.ui.historyTotalCycles}
            icon="🌙"
          />
          <StatCard
            value={`${avgCycleLength} ${t.ui.daysUnit}`}
            label={t.ui.historyAvgLength}
            icon="📏"
          />
          <StatCard
            value={`${periodLength} ${t.ui.daysUnit}`}
            label={t.ui.historyAvgPeriod}
            icon="🩸"
          />
        </div>

        <div className="calendar-toolbar">
          <button
            type="button"
            className="cal-nav-btn"
            onClick={prevMonth}
            aria-label={t.ui.calendarPrevAria}
          >
            ‹
          </button>
          <button
            type="button"
            className="cal-month-label"
            onClick={goToToday}
            title={t.ui.calendarToday}
          >
            {monthLabel}
          </button>
          <button
            type="button"
            className="cal-nav-btn"
            onClick={nextMonth}
            aria-label={t.ui.calendarNextAria}
          >
            ›
          </button>
        </div>

        <div className="calendar-grid" role="grid">
          {dowLabels.map((label) => (
            <div key={label} className="cal-dow">
              {label}
            </div>
          ))}

          {days.map((d) => {
            const iso = isoOf(d.date);
            const cls = classifyDay(d.date, cycles);
            const isToday = iso === todayIsoVal;
            const isSelected = iso === selectedIso;

            return (
              <button
                key={iso}
                type="button"
                className={[
                  "cal-day",
                  d.isCurrentMonth ? "in-month" : "out-month",
                  isToday ? "today" : "",
                  isSelected ? "selected" : "",
                  cls.kind !== "none" ? `kind-${cls.kind}` : "",
                  cls.isPredicted ? "predicted" : "past",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setSelectedIso(iso)}
                aria-pressed={isSelected}
                aria-label={`${d.date.getDate()} ${monthLabel}${
                  cls.kind !== "none" ? " — " + t.ui[`calendarKind_${cls.kind}`] : ""
                }`}
              >
                <span className="cal-day-num">{d.date.getDate()}</span>
                {cls.kind !== "none" && (
                  <span className={`cal-dot dot-${cls.kind}`} aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="calendar-legend">
          <div className="cal-legend-row">
            <span className="cal-dot dot-period" />
            <span>{t.ui.calendarKind_period}</span>
          </div>
          <div className="cal-legend-row">
            <span className="cal-dot dot-fertile" />
            <span>{t.ui.calendarKind_fertile}</span>
          </div>
          <div className="cal-legend-row">
            <span className="cal-dot dot-ovulation" />
            <span>{t.ui.calendarKind_ovulation}</span>
          </div>
        </div>

        {/* Selected day detail */}
        {selectedIso && (
          <SelectedDayDetail
            iso={selectedIso}
            cycles={cycles}
            role={role}
            onLogPeriodStart={onLogPeriodStart}
            onClose={() => setSelectedIso(null)}
          />
        )}

        {/* Collapsible: detailed history (past cycles + predictions) */}
        <button
          type="button"
          className="history-toggle-btn"
          onClick={() => setShowHistoryDetails((v) => !v)}
          aria-expanded={showHistoryDetails}
        >
          {showHistoryDetails
            ? (t.ui.calendarHideDetails ?? "Masquer le détail")
            : (t.ui.calendarShowDetails ?? "Voir le détail")}
          <span className="history-toggle-chevron" aria-hidden="true">
            {showHistoryDetails ? "▴" : "▾"}
          </span>
        </button>

        {showHistoryDetails && (
          <div className="history-details">
            <h2 className="history-section-title">
              {t.ui.historyPastCycles}
            </h2>

            {cycleLengths.length === 0 ? (
              <div className="coming-soon-card" style={{ marginTop: 4 }}>
                <div className="coming-soon-icon" aria-hidden="true">
                  📊
                </div>
                <div className="coming-soon-title">
                  {t.ui.historyNoDataTitle}
                </div>
                <p className="coming-soon-body">{t.ui.historyNoDataBody}</p>
              </div>
            ) : (
              <ul className="history-list">
                {cycleLengths
                  .slice()
                  .reverse()
                  .map((c) => (
                    <li key={c.start} className="history-row">
                      <div className="history-row-date">
                        {formatRange(c.start, c.length, lang)}
                      </div>
                      <div className="history-row-bar">
                        <span
                          className="history-row-fill"
                          style={{
                            width: `${Math.min(
                              100,
                              (c.length / maxLen) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="history-row-num">
                        {c.length}
                        {t.ui.dayShort}
                      </div>
                    </li>
                  ))}
              </ul>
            )}

            {nextThree.length > 0 && (
              <>
                <h2 className="history-section-title">
                  {t.ui.historyPredictions}
                </h2>
                <ul className="history-predict-list">
                  {nextThree.map((iso, idx) => (
                    <li key={iso} className="history-predict-row">
                      <div className="history-predict-num">{idx + 1}</div>
                      <div className="history-predict-info">
                        <div className="history-predict-date">
                          {formatLongDate(normalizeDate(iso), lang)}
                        </div>
                        <div className="history-predict-when">
                          {relativeIn(iso, t)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ value, label, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" aria-hidden="true">
        {icon}
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

function formatRange(startIso, length, lang) {
  const start = normalizeDate(startIso);
  const end = addDays(start, length - 1);
  const fmt = new Intl.DateTimeFormat(lang, {
    day: "numeric",
    month: "short",
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

function relativeIn(iso, t) {
  const today = normalizeDate(new Date());
  const target = normalizeDate(iso);
  const days = diffDays(target, today);
  if (days <= 0) return "";
  return t.ui.periodInDays
    ? `${t.ui.periodInPrefix} ${t.ui.periodInDays(days)}`
    : `${days} ${t.ui.daysUnit}`;
}

function SelectedDayDetail({ iso, cycles, role, onLogPeriodStart, onClose }) {
  const { t, lang } = useLanguage();
  const date = normalizeDate(iso);
  const cls = classifyDay(date, cycles);
  const today = normalizeDate(new Date());
  const isFuture = date.getTime() > today.getTime();
  const dateLabel = formatLongDate(date, lang);

  let phaseLine = null;
  if (cls.kind === "period")
    phaseLine = cls.isPredicted
      ? t.ui.calendarPredictedPeriod
      : t.ui.calendarPastPeriod;
  else if (cls.kind === "ovulation") phaseLine = t.ui.calendarOvulationDay;
  else if (cls.kind === "fertile") phaseLine = t.ui.calendarFertileDay;

  return (
    <div className="cal-day-detail">
      <button
        type="button"
        className="cal-day-detail-close"
        onClick={onClose}
        aria-label={t.ui.notifsClose}
      >
        ×
      </button>
      <div className="cal-day-detail-date">{dateLabel}</div>
      {phaseLine && <div className="cal-day-detail-phase">{phaseLine}</div>}

      {role === "woman" && !isFuture && (
        <button
          type="button"
          className="cal-day-action"
          onClick={() => {
            const ok = window.confirm(t.ui.calendarMarkConfirm);
            if (ok) onLogPeriodStart(iso);
          }}
        >
          🩸 {t.ui.calendarMarkPeriodStart}
        </button>
      )}
    </div>
  );
}

/* ---------- helpers ---------- */

function buildMonthGrid(anchor) {
  // anchor is the 1st of the current month
  const firstOfMonth = normalizeDate(anchor);
  // Monday = 0, Sunday = 6
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = addDays(firstOfMonth, -firstWeekday);

  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = addDays(gridStart, i);
    days.push({
      date: d,
      isCurrentMonth: d.getMonth() === firstOfMonth.getMonth(),
    });
  }
  return days;
}

function buildDowLabels(lang) {
  // Use the runtime Intl API so labels are localized properly.
  const formatter = new Intl.DateTimeFormat(lang, { weekday: "short" });
  // Pick a known Monday (2024-01-01 was a Monday).
  const monday = new Date(2024, 0, 1);
  const labels = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    labels.push(formatter.format(d).replace(".", ""));
  }
  return labels;
}

function formatMonth(date, lang) {
  return new Intl.DateTimeFormat(lang, {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatLongDate(date, lang) {
  return new Intl.DateTimeFormat(lang, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
