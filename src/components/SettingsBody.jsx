import { PHASE_META } from "../data/phaseMeta";
import { LOCALE_LIST, useLanguage } from "../i18n";

const DEFAULT_DURATIONS = PHASE_META.map((item) => item.defaultDays);

/**
 * Shared controls used by both the Settings panel and the Onboarding screen.
 *
 * Props:
 *  - startDate, setStartDate, durations, updateDuration
 *  - resetDurations (optional — hidden if showReset = false)
 *  - logPeriodToday (optional — hidden if showLogPeriod = false)
 *  - totalDays
 *  - showTotal (default true)
 *  - showReset (default true)
 *  - showLogPeriod (default true)
 */
export default function SettingsBody({
  startDate,
  setStartDate,
  durations,
  updateDuration,
  resetDurations,
  logPeriodToday,
  totalDays,
  showTotal = true,
  showReset = true,
  showLogPeriod = true,
}) {
  const { t, lang, setLang } = useLanguage();

  return (
    <>
      <div className="settings-row settings-lang-row">
        <label className="section-label">{t.ui.languageLabel}</label>
        <div className="settings-lang-grid">
          {LOCALE_LIST.map((locale) => {
            const active = locale.code === lang;
            return (
              <button
                key={locale.code}
                type="button"
                className={`settings-lang-btn ${active ? "active" : ""}`}
                onClick={() => setLang(locale.code)}
                aria-pressed={active}
              >
                <span className="settings-lang-flag">{locale.flag}</span>
                <span className="settings-lang-label">{locale.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {showTotal && (
        <div className="settings-total">
          {t.ui.totalCycleLabel}{" "}
          <span>
            {totalDays} {t.ui.daysUnit}
          </span>
        </div>
      )}

      <div className="settings-row">
        <label className="section-label">{t.ui.startDateLabel}</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        {showLogPeriod && logPeriodToday && (
          <button
            type="button"
            className="log-period-btn"
            onClick={logPeriodToday}
          >
            🔴 {t.ui.logPeriodButton}
          </button>
        )}
      </div>

      {PHASE_META.map((meta, i) => {
        const localized = t.phases[meta.id] ?? {};
        const fillPercent =
          ((durations[i] - meta.minDays) / (meta.maxDays - meta.minDays)) *
          100;

        return (
          <div key={meta.id} className="settings-row">
            <div className="settings-row-top">
              <div className="settings-phase-name">
                <span>{meta.emoji}</span>
                <span style={{ color: meta.accent }}>
                  {localized.name ?? meta.id}
                </span>
              </div>

              <div className="settings-days">
                <span style={{ color: meta.accent, fontWeight: 700 }}>
                  {durations[i]}
                </span>
                <span className="muted"> {t.ui.dayShort}</span>
              </div>
            </div>

            <input
              type="range"
              min={meta.minDays}
              max={meta.maxDays}
              value={durations[i]}
              onChange={(e) => updateDuration(i, parseInt(e.target.value, 10))}
              style={{
                background: `linear-gradient(to right, ${meta.color} 0%, ${meta.color} ${fillPercent}%, rgba(0,0,0,0.08) ${fillPercent}%, rgba(0,0,0,0.08) 100%)`,
              }}
            />

            <div className="range-hints">
              <span>
                {meta.minDays}
                {t.ui.minSuffix}
              </span>
              <span>
                {meta.maxDays}
                {t.ui.maxSuffix}
              </span>
            </div>
          </div>
        );
      })}

      {showReset && resetDurations && (
        <button className="reset-btn" onClick={resetDurations}>
          {t.ui.resetButton} (
          {DEFAULT_DURATIONS.reduce((a, b) => a + b, 0)} {t.ui.daysUnit})
        </button>
      )}
    </>
  );
}
