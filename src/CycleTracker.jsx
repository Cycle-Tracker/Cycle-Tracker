import { useEffect, useMemo, useState } from "react";
import "./CycleTracker.css";
import { PHASE_META } from "./data/phaseMeta";
import {
  buildPhases,
  getDayOfCycle,
  getPhase,
  getTotalDays,
  todayIso,
} from "./utils/cycleUtils";
import EnergyDots from "./components/EnergyDots";
import CycleWheel from "./components/CycleWheel";
import Onboarding from "./components/Onboarding";
import SettingsBody from "./components/SettingsBody";
import { useLanguage } from "./i18n";

const DEFAULT_DURATIONS = PHASE_META.map((item) => item.defaultDays);
const MAX_ENERGY = 5;

function getInitialStartDate() {
  try {
    const saved = localStorage.getItem("cycle-start-date");
    if (saved) return saved;
  } catch {
    // ignore
  }

  const d = new Date();
  d.setDate(d.getDate() - 3);
  return d.toISOString().split("T")[0];
}

function getInitialDurations() {
  try {
    const saved = localStorage.getItem("cycle-durations");
    if (!saved) return DEFAULT_DURATIONS;

    const parsed = JSON.parse(saved);

    if (
      Array.isArray(parsed) &&
      parsed.length === PHASE_META.length &&
      parsed.every((n) => Number.isInteger(n) && n > 0)
    ) {
      return parsed;
    }
  } catch {
    return DEFAULT_DURATIONS;
  }

  return DEFAULT_DURATIONS;
}

function getInitialOnboarded() {
  try {
    if (localStorage.getItem("cycle-onboarded") === "true") return true;
    // Backward compat: existing users who already saved data are considered onboarded
    if (localStorage.getItem("cycle-start-date")) return true;
  } catch {
    // ignore
  }
  return false;
}

export default function CycleTracker() {
  const { t } = useLanguage();
  const [startDate, setStartDate] = useState(getInitialStartDate);
  const [activeTab, setActiveTab] = useState("now");
  const [showSettings, setShowSettings] = useState(false);
  const [durations, setDurations] = useState(getInitialDurations);
  const [isOnboarded, setIsOnboarded] = useState(getInitialOnboarded);

  useEffect(() => {
    try {
      localStorage.setItem("cycle-start-date", startDate);
    } catch {
      // ignore
    }
  }, [startDate]);

  useEffect(() => {
    try {
      localStorage.setItem("cycle-durations", JSON.stringify(durations));
    } catch {
      // ignore
    }
  }, [durations]);

  const totalDays = useMemo(() => getTotalDays(durations), [durations]);

  // Build language-aware phases by merging visual meta (phaseMeta) with
  // localized strings (t.phases[id]).
  const phases = useMemo(() => {
    const base = buildPhases(PHASE_META, durations);
    return base.map((phase) => {
      const localized = t.phases[phase.id] ?? {};
      return {
        ...phase,
        name: localized.name ?? phase.id,
        tips: localized.tips ?? [],
        avoid: localized.avoid ?? [],
        mood: localized.mood ?? "",
      };
    });
  }, [durations, t]);

  const currentDay = useMemo(
    () => getDayOfCycle(startDate, totalDays),
    [startDate, totalDays]
  );
  const currentPhase = useMemo(
    () => getPhase(currentDay, phases),
    [currentDay, phases]
  );
  const daysUntilPeriod = totalDays - currentDay;

  function updateDuration(index, value) {
    const next = [...durations];
    next[index] = value;
    setDurations(next);
  }

  function resetDurations() {
    setDurations(DEFAULT_DURATIONS);
  }

  function logPeriodToday() {
    const confirmed = window.confirm(t.ui.logPeriodConfirm);
    if (confirmed) {
      setStartDate(todayIso());
    }
  }

  function completeOnboarding() {
    try {
      localStorage.setItem("cycle-onboarded", "true");
    } catch {
      // ignore
    }
    setIsOnboarded(true);
  }

  if (!isOnboarded) {
    return (
      <Onboarding
        startDate={startDate}
        setStartDate={setStartDate}
        durations={durations}
        updateDuration={updateDuration}
        totalDays={totalDays}
        onComplete={completeOnboarding}
      />
    );
  }

  return (
    <div className="tracker-page">
      <div className="tracker-header">
        <div className="tracker-spacer" />

        <div className="tracker-title-wrap">
          <h1 className="tracker-title">{t.ui.appTitle}</h1>
          <p className="tracker-subtitle">{t.ui.appSubtitle}</p>
        </div>

        <div className="tracker-header-actions">
          <button
            className={`gear-btn ${showSettings ? "open" : ""}`}
            onClick={() => setShowSettings((prev) => !prev)}
            aria-label={t.ui.settingsOpenAria}
            title={t.ui.settingsTitle}
          >
            <span style={{ fontSize: "18px", lineHeight: 1 }}>⚙</span>
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <div className="settings-top-label">{t.ui.settingsSectionLabel}</div>

          <SettingsBody
            startDate={startDate}
            setStartDate={setStartDate}
            durations={durations}
            updateDuration={updateDuration}
            resetDurations={resetDurations}
            logPeriodToday={logPeriodToday}
            totalDays={totalDays}
          />
        </div>
      )}

      <div className="current-phase-card">
        <div className="wheel-wrap">
          <CycleWheel
            currentDay={currentDay}
            phases={phases}
            totalDays={totalDays}
            dayLabel={t.ui.dayShort.toUpperCase()}
          />
        </div>

        <div className="current-phase-content">
          <div className="section-label">{t.ui.currentPhaseLabel}</div>

          <div className="current-phase-emoji">{currentPhase.emoji}</div>

          <h2
            className="current-phase-title"
            style={{ color: currentPhase.accent }}
          >
            {currentPhase.name}
          </h2>

          <div className="current-phase-mood">{currentPhase.mood}</div>

          <div className="section-label energy-label">{t.ui.energyLabel}</div>

          <EnergyDots
            level={currentPhase.energy}
            max={MAX_ENERGY}
            activeColor={currentPhase.accent}
            inactiveColor="rgba(60,60,67,0.16)"
          />

          {daysUntilPeriod > 0 && currentPhase.id !== "menstrual" && (
            <div className="period-counter">
              {t.ui.periodInPrefix}{" "}
              <span>{t.ui.periodInDays(daysUntilPeriod)}</span>
            </div>
          )}

          {currentPhase.id === "menstrual" && (
            <div className="period-counter">
              <span>{t.ui.periodTodayLabel}</span>
            </div>
          )}
        </div>
      </div>

      <div className="tabs-row">
        {[
          { key: "now", label: t.ui.tabTips },
          { key: "all", label: t.ui.tabAll },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "now" && (
        <div>
          <div className="tips-card">
            <div
              className="tips-title"
              style={{ color: currentPhase.accent }}
            >
              {t.ui.canDoTitle}
            </div>

            {currentPhase.tips.map((tip, i) => (
              <div key={i} className="tip-item">
                <span style={{ color: currentPhase.accent, flexShrink: 0 }}>
                  →
                </span>
                {tip}
              </div>
            ))}
          </div>

          <div className="avoid-card">
            <div className="avoid-title">{t.ui.avoidTitle}</div>

            {currentPhase.avoid.map((item, i) => (
              <div key={i} className="tip-item">
                <span className="danger-mark">×</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "all" && (
        <div>
          {phases.map((phase, i) => {
            const isActive = phase.id === currentPhase.id;

            return (
              <div
                key={phase.id}
                className="phase-card"
                style={{
                  borderColor: isActive
                    ? `${phase.color}40`
                    : "rgba(255,255,255,0.65)",
                  background: isActive
                    ? `linear-gradient(135deg, ${phase.color}10, rgba(255,255,255,0.88))`
                    : undefined,
                }}
              >
                <div className="phase-card-top">
                  <span
                    className="phase-emoji"
                    style={{
                      boxShadow: isActive
                        ? `0 0 0 2px ${phase.color}25 inset`
                        : "inset 0 1px 0 rgba(255,255,255,0.7)",
                    }}
                  >
                    {phase.emoji}
                  </span>

                  <div className="phase-card-main">
                    <div
                      className="phase-card-name"
                      style={{ color: isActive ? phase.accent : undefined }}
                    >
                      {phase.name}
                      {isActive && (
                        <span className="now-badge">{t.ui.nowBadge}</span>
                      )}
                    </div>

                    <div className="phase-card-days">
                      {t.ui.dayShort.toUpperCase()}
                      {phase.days[0]}–{t.ui.dayShort.toUpperCase()}
                      {phase.days[1]} · {durations[i]} {t.ui.daysUnit}
                    </div>
                  </div>

                  <div className="phase-card-dots">
                    <EnergyDots
                      level={phase.energy}
                      max={MAX_ENERGY}
                      activeColor={isActive ? phase.accent : "#a1a1aa"}
                      inactiveColor="rgba(60,60,67,0.16)"
                    />
                  </div>
                </div>

                <div className="phase-card-mood">{phase.mood}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="footer-note">
        <p>
          {t.ui.footerLine1}
          <br />
          {t.ui.footerLine2}
        </p>
      </div>
    </div>
  );
}
