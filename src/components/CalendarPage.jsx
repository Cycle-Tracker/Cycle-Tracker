import { useMemo, useState } from "react";
import { useLanguage } from "../i18n";
import {
  addDays,
  buildCycles,
  classifyDay,
  isoOf,
} from "../utils/cyclePredict";
import { normalizeDate, todayIso } from "../utils/cycleUtils";

/**
 * Calendar tab — month view with markers for period (past + predicted),
 * ovulation, and fertile window. Tap a day to mark it as a period start.
 *
 * Props:
 *  - startDate (ISO string)
 *  - durations (array of 4 ints)
 *  - role ("woman" | "man")
 *  - onLogPeriodStart(iso) — called when user picks a new period-start date
 */
export default function CalendarPage({
  startDate,
  durations,
  role,
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
      </div>
    </div>
  );
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
