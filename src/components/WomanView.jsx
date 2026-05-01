import { useMemo, useState } from "react";
import { useLanguage } from "../i18n";
import CycleWheel from "./CycleWheel";
import EnergyDots from "./EnergyDots";
import PhaseInfoPopup from "./PhaseInfoPopup";

const MAX_ENERGY = 5;

/**
 * Dashboard the woman sees — full cycle info, anticipation hint,
 * and the regular tips list for context.
 *
 * Props:
 *  - phases (already localized)
 *  - currentPhase
 *  - currentDay
 *  - totalDays
 *  - daysUntilPeriod
 *  - activeTab, setActiveTab
 *  - durations  (for the "all phases" tab)
 *
 * Note: the share badge + partner-name display is rendered by the
 * parent (CycleTracker) in the page header, not inside this component.
 */
export default function WomanView({
  phases,
  currentPhase,
  currentDay,
  totalDays,
  daysUntilPeriod,
  activeTab,
  setActiveTab,
  durations,
}) {
  const { t } = useLanguage();
  const [infoPhase, setInfoPhase] = useState(null);

  const anticipateMessage = useMemo(() => {
    if (!currentPhase) return "";
    switch (currentPhase.id) {
      case "menstrual":
        return t.ui.womanAnticipateMenstrual;
      case "follicular":
        return t.ui.womanAnticipateFollicular;
      case "ovulatory":
        return t.ui.womanAnticipateOvulatory;
      case "luteal":
        return t.ui.womanAnticipateLuteal;
      default:
        return "";
    }
  }, [currentPhase, t]);

  return (
    <>
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
            <button
              type="button"
              className="phase-info-btn"
              aria-label={t.ui.phaseInfoAria}
              onClick={() => setInfoPhase(currentPhase)}
              style={{
                color: currentPhase.accent,
                borderColor: `${currentPhase.color}55`,
              }}
            >
              i
            </button>
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
              {t.ui.womanPeriodInLabel}{" "}
              <span>{t.ui.periodInDays(daysUntilPeriod)}</span>
            </div>
          )}

          {currentPhase.id === "menstrual" && (
            <div className="period-counter">
              <span>{t.ui.womanPeriodTodayLabel}</span>
            </div>
          )}
        </div>
      </div>

      {anticipateMessage && (
        <div
          className="anticipate-card"
          style={{
            borderColor: `${currentPhase.color}30`,
            background: `linear-gradient(135deg, ${currentPhase.color}12, rgba(255,255,255,0.88))`,
          }}
        >
          <div
            className="anticipate-title"
            style={{ color: currentPhase.accent }}
          >
            {t.ui.womanAnticipateTitle}
          </div>
          <div className="anticipate-body">{anticipateMessage}</div>
        </div>
      )}

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
              {t.ui.womanSelfCareTitle}
            </div>
            {currentPhase.selfCare.map((tip, i) => (
              <div key={i} className="tip-item">
                <span style={{ color: currentPhase.accent, flexShrink: 0 }}>
                  →
                </span>
                {tip}
              </div>
            ))}
          </div>

          <div className="avoid-card">
            <div className="avoid-title">{t.ui.womanSelfAvoidTitle}</div>
            {currentPhase.selfAvoid.map((item, i) => (
              <div key={i} className="tip-item">
                <span className="danger-mark">×</span>
                {item}
              </div>
            ))}
          </div>

          {currentPhase.food?.eat?.length > 0 && (
            <div className="tips-card food-card">
              <div
                className="tips-title"
                style={{ color: currentPhase.accent }}
              >
                🍽️ {t.ui.womanFoodTitle}
              </div>
              {currentPhase.food.eat.map((item, i) => (
                <div key={i} className="tip-item">
                  <span style={{ color: currentPhase.accent, flexShrink: 0 }}>
                    →
                  </span>
                  {item}
                </div>
              ))}
            </div>
          )}

          {currentPhase.food?.avoid?.length > 0 && (
            <div className="avoid-card food-avoid-card">
              <div className="avoid-title">
                🚫 {t.ui.womanFoodAvoidTitle}
              </div>
              {currentPhase.food.avoid.map((item, i) => (
                <div key={i} className="tip-item">
                  <span className="danger-mark">×</span>
                  {item}
                </div>
              ))}
            </div>
          )}
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
                {phase.description && (
                  <p className="phase-card-desc">{phase.description}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {infoPhase && (
        <PhaseInfoPopup
          phase={infoPhase}
          description={infoPhase.description}
          onClose={() => setInfoPhase(null)}
        />
      )}
    </>
  );
}
