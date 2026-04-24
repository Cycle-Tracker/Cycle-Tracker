import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import OnboardingChoice from "./components/OnboardingChoice";
import JoinCycle from "./components/JoinCycle";
import SettingsBody from "./components/SettingsBody";
import { useLanguage } from "./i18n";
import { isSupabaseConfigured } from "./lib/supabase";
import {
  createSharedCycle,
  fetchSharedCycle,
  subscribeToCycle,
  updateSharedCycle,
} from "./lib/cycleSync";

const DEFAULT_DURATIONS = PHASE_META.map((item) => item.defaultDays);
const MAX_ENERGY = 5;

// localStorage keys
const LS_START_DATE = "cycle-start-date";
const LS_DURATIONS = "cycle-durations";
const LS_ONBOARDED = "cycle-onboarded";
const LS_SHARED_CODE = "cycle-shared-code";

// ---------------- Initial state helpers ----------------

function getInitialStartDate() {
  try {
    const saved = localStorage.getItem(LS_START_DATE);
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
    const saved = localStorage.getItem(LS_DURATIONS);
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
    if (localStorage.getItem(LS_ONBOARDED) === "true") return true;
    // Backward compat: if they had saved data already, consider them onboarded.
    if (localStorage.getItem(LS_START_DATE)) return true;
  } catch {
    // ignore
  }
  return false;
}

function getInitialSharedCode() {
  try {
    return localStorage.getItem(LS_SHARED_CODE) || null;
  } catch {
    return null;
  }
}

export default function CycleTracker() {
  const { t, lang, setLang } = useLanguage();

  const [startDate, setStartDate] = useState(getInitialStartDate);
  const [durations, setDurations] = useState(getInitialDurations);
  const [activeTab, setActiveTab] = useState("now");
  const [showSettings, setShowSettings] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(getInitialOnboarded);

  // Sharing state
  const [sharedCode, setSharedCode] = useState(getInitialSharedCode);
  const [showChoiceScreen, setShowChoiceScreen] = useState(false);
  const [showJoinScreen, setShowJoinScreen] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncError, setSyncError] = useState("");

  // Ref we use to ignore our own writes when the realtime subscription
  // echoes them back to us.
  const ignoreNextRemoteUpdate = useRef(false);

  // ------------- Persist locally (always) -------------

  useEffect(() => {
    try {
      localStorage.setItem(LS_START_DATE, startDate);
    } catch {
      // ignore
    }
  }, [startDate]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_DURATIONS, JSON.stringify(durations));
    } catch {
      // ignore
    }
  }, [durations]);

  useEffect(() => {
    try {
      if (sharedCode) {
        localStorage.setItem(LS_SHARED_CODE, sharedCode);
      } else {
        localStorage.removeItem(LS_SHARED_CODE);
      }
    } catch {
      // ignore
    }
  }, [sharedCode]);

  // ------------- Apply a remote row -------------

  const applyRemoteRow = useCallback(
    (row) => {
      if (!row) return;
      if (row.start_date) setStartDate(row.start_date);
      if (Array.isArray(row.durations)) setDurations(row.durations);
      if (row.language && row.language !== lang) setLang(row.language);
    },
    [lang, setLang]
  );

  // ------------- Realtime subscription -------------

  useEffect(() => {
    if (!sharedCode || !isSupabaseConfigured) return undefined;

    // Pull latest state when we mount / code changes
    let cancelled = false;
    fetchSharedCycle(sharedCode)
      .then((row) => {
        if (cancelled || !row) return;
        ignoreNextRemoteUpdate.current = true;
        applyRemoteRow(row);
      })
      .catch((err) => {
        console.error("Fetch shared cycle failed:", err);
      });

    const unsubscribe = subscribeToCycle(sharedCode, (row) => {
      if (ignoreNextRemoteUpdate.current) {
        ignoreNextRemoteUpdate.current = false;
        return;
      }
      applyRemoteRow(row);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [sharedCode, applyRemoteRow]);

  // ------------- Push local changes to Supabase -------------

  // When shared, debounce writes so rapid slider changes don't spam the API.
  const pushTimer = useRef(null);
  useEffect(() => {
    if (!sharedCode || !isSupabaseConfigured || !isOnboarded) return;

    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      ignoreNextRemoteUpdate.current = true;
      updateSharedCycle(sharedCode, {
        start_date: startDate,
        durations,
        language: lang,
      }).catch((err) => {
        console.error("Push to Supabase failed:", err);
      });
    }, 400);

    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [sharedCode, startDate, durations, lang, isOnboarded]);

  // ------------- Derived state -------------

  const totalDays = useMemo(() => getTotalDays(durations), [durations]);

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

  // ------------- Actions -------------

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

  function finishBasicOnboarding() {
    // Go to the sharing-choice screen instead of straight to dashboard
    setShowChoiceScreen(true);
  }

  function markOnboarded() {
    try {
      localStorage.setItem(LS_ONBOARDED, "true");
    } catch {
      // ignore
    }
    setIsOnboarded(true);
    setShowChoiceScreen(false);
    setShowJoinScreen(false);
  }

  async function handleCreateShared() {
    setSyncError("");
    setSyncBusy(true);
    try {
      const { code } = await createSharedCycle({
        startDate,
        durations,
        language: lang,
      });
      setSharedCode(code);
      markOnboarded();
    } catch (err) {
      console.error(err);
      setSyncError(t.ui.createError);
    } finally {
      setSyncBusy(false);
    }
  }

  function handleJoinSuccess(row) {
    ignoreNextRemoteUpdate.current = true;
    applyRemoteRow(row);
    setSharedCode(row.code);
    markOnboarded();
  }

  function handleDisconnectShared() {
    const confirmed = window.confirm(t.ui.shareDisconnectConfirm);
    if (!confirmed) return;
    setSharedCode(null);
  }

  async function handleEnableSharingFromSettings() {
    setSyncBusy(true);
    try {
      const { code } = await createSharedCycle({
        startDate,
        durations,
        language: lang,
      });
      setSharedCode(code);
    } catch (err) {
      console.error(err);
      window.alert(t.ui.createError);
    } finally {
      setSyncBusy(false);
    }
  }

  // ------------- Render: onboarding flows -------------

  if (!isOnboarded && !showChoiceScreen && !showJoinScreen) {
    return (
      <Onboarding
        startDate={startDate}
        setStartDate={setStartDate}
        durations={durations}
        updateDuration={updateDuration}
        totalDays={totalDays}
        onComplete={finishBasicOnboarding}
      />
    );
  }

  if (!isOnboarded && showChoiceScreen && !showJoinScreen) {
    return (
      <>
        <OnboardingChoice
          supabaseAvailable={isSupabaseConfigured}
          onCreate={handleCreateShared}
          onJoin={() => {
            setShowJoinScreen(true);
          }}
          onSolo={markOnboarded}
        />
        {syncBusy && (
          <div className="sync-busy-overlay">
            <div className="sync-busy-box">{t.ui.createLoading}</div>
          </div>
        )}
        {syncError && (
          <div
            className="sync-busy-overlay"
            onClick={() => setSyncError("")}
          >
            <div className="sync-busy-box error">{syncError}</div>
          </div>
        )}
      </>
    );
  }

  if (!isOnboarded && showJoinScreen) {
    return (
      <JoinCycle
        onJoined={handleJoinSuccess}
        onBack={() => setShowJoinScreen(false)}
      />
    );
  }

  // ------------- Render: main dashboard -------------

  return (
    <div className="tracker-page">
      <div className="tracker-header">
        <div className="tracker-spacer" />

        <div className="tracker-title-wrap">
          <h1 className="tracker-title">{t.ui.appTitle}</h1>
          <p className="tracker-subtitle">{t.ui.appSubtitle}</p>
          {sharedCode && (
            <div className="tracker-share-badge" title={sharedCode}>
              💞 {sharedCode}
            </div>
          )}
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
            showShare
            sharedCode={sharedCode}
            onEnableSharing={
              isSupabaseConfigured ? handleEnableSharingFromSettings : null
            }
            onDisconnectSharing={sharedCode ? handleDisconnectShared : null}
          />

          {syncBusy && (
            <div className="sync-inline-msg">{t.ui.createLoading}</div>
          )}
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
