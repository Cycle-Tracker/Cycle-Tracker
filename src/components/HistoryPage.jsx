import { Component, useMemo, useState } from "react";
import { useLanguage } from "../i18n";
import { normalizeDate, todayIso } from "../utils/cycleUtils";
import { addDays, diffDays, isoOf } from "../utils/cyclePredict";
import JournalPage from "./JournalPage";

/**
 * Local error boundary so a render error inside the History page falls back
 * to a readable message instead of a blank white screen.
 */
class HistoryErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("HistoryPage crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="page-shell history-page">
          <div className="page-header-simple">
            <h1 className="page-title">Historique</h1>
          </div>
          <div className="page-body">
            <div className="coming-soon-card" style={{ marginTop: 16 }}>
              <div className="coming-soon-icon" aria-hidden="true">⚠️</div>
              <div className="coming-soon-title">
                Impossible d'afficher l'historique
              </div>
              <p className="coming-soon-body">
                {String(this.state.error?.message || this.state.error)}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * History tab — shows the list of past period starts, computes basic stats,
 * and predicts the next 3 period starts.
 *
 * Props:
 *  - periodsLog: array of ISO date strings (period starts), oldest first
 *  - currentStartDate: most recent period start (string)
 *  - durations: cycle durations
 */
export default function HistoryPage(props) {
  return (
    <HistoryErrorBoundary>
      <HistoryPageInner {...props} />
    </HistoryErrorBoundary>
  );
}

function HistoryPageInner({
  periodsLog = [],
  currentStartDate,
  durations,
  // Journal props (passed through when the inner Journal tab is shown)
  journalEntries,
  journalRole,
  journalMyName,
  journalPartnerName,
  onJournalAdd,
  onJournalUpdate,
  onJournalDelete,
}) {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState("cycles");

  // Combine the logged history with the currently active start (if not already in log).
  const allStarts = useMemo(() => {
    const set = new Set(periodsLog);
    if (currentStartDate) set.add(currentStartDate);
    return Array.from(set).sort(); // ascending
  }, [periodsLog, currentStartDate]);

  // Compute lengths between consecutive starts
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
      // Always fall back to a sane default so the predict loop terminates.
      return fromDurations > 0 ? fromDurations : 28;
    }
    const sum = cycleLengths.reduce((s, c) => s + c.length, 0);
    const avg = Math.round(sum / cycleLengths.length);
    return avg > 0 ? avg : 28;
  }, [cycleLengths, durations]);

  const periodLength = durations?.[0] ?? 5;

  // Predict next 3 period starts based on the latest known start + avgCycleLength.
  const nextThree = useMemo(() => {
    if (!currentStartDate) return [];
    const step = avgCycleLength > 0 ? avgCycleLength : 28;
    const today = normalizeDate(new Date());
    const start = normalizeDate(currentStartDate);

    const result = [];
    let d = start;
    // Hard cap iterations so a bad date/duration never causes an infinite loop.
    for (let i = 0; i < 60 && result.length < 3; i++) {
      d = addDays(d, step);
      if (d.getTime() > today.getTime()) result.push(isoOf(d));
    }
    return result;
  }, [currentStartDate, avgCycleLength]);

  const maxLen = Math.max(
    avgCycleLength,
    ...cycleLengths.map((c) => c.length),
    35
  );

  return (
    <div className="page-shell history-page">
      <div className="page-header-simple">
        <h1 className="page-title">{t.ui.tabHistory}</h1>
      </div>

      <div className="page-body">
        <div className="history-tabs-row" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "cycles"}
            className={`tab-btn ${tab === "cycles" ? "active" : ""}`}
            onClick={() => setTab("cycles")}
          >
            {t.ui.historyTabCycles ?? t.ui.tabHistory}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "journal"}
            className={`tab-btn ${tab === "journal" ? "active" : ""}`}
            onClick={() => setTab("journal")}
          >
            {t.ui.tabJournal}
          </button>
        </div>

        {tab === "journal" && (
          <JournalPage
            entries={journalEntries}
            role={journalRole}
            myName={journalMyName}
            partnerName={journalPartnerName}
            onAdd={onJournalAdd}
            onUpdate={onJournalUpdate}
            onDelete={onJournalDelete}
            embedded
          />
        )}

        {tab === "cycles" && (
          <>
            <p className="page-help">{t.ui.historyPageHelp}</p>

            {/* Stats grid */}
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

        {/* Past cycles list */}
        <h2 className="history-section-title">{t.ui.historyPastCycles}</h2>

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
                        width: `${Math.min(100, (c.length / maxLen) * 100)}%`,
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

        {/* Predictions */}
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
                      {formatLong(iso, lang)}
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
          </>
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

function formatLong(iso, lang) {
  return new Intl.DateTimeFormat(lang, {
    weekday: "short",
    day: "numeric",
    month: "long",
  }).format(normalizeDate(iso));
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

// Silence unused-import if todayIso isn't directly used (kept for future):
// eslint-disable-next-line no-unused-vars
const _keep = todayIso;
