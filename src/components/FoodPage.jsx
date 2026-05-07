import { useState } from "react";
import { useLanguage } from "../i18n";

/**
 * Standalone "Aliments" page.
 *
 * Two view modes via inner tabs:
 *  - "now" : nutrition advice for the CURRENT phase only
 *  - "all" : eat / avoid for every phase, in cycle order
 *
 * The eat/avoid lists themselves come from `phases[i].food` (set on the
 * phase by CycleTracker.buildPhases). Wording switches based on role
 * (mecs see "ce qui lui ferait du bien à manger", femmes "à privilégier
 * pour toi") so the same data file serves both sides.
 *
 * Props:
 *   phases        — full list of localized phases
 *   currentPhase  — the active one (highlighted in "all")
 *   role          — "woman" | "man" — drives the labels
 */
export default function FoodPage({ phases, currentPhase, role }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState("now");

  const eatTitle =
    role === "man" ? t.ui.manFoodTitle : t.ui.womanFoodTitle;
  const avoidTitle =
    role === "man" ? t.ui.manFoodAvoidTitle : t.ui.womanFoodAvoidTitle;

  return (
    <div className="page-shell food-page">
      <div className="page-header-simple">
        <h1 className="page-title">{t.ui.tabFood}</h1>
      </div>

      <div className="page-body">
        <div className="food-tabs-row" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "now"}
            className={`tab-btn ${tab === "now" ? "active" : ""}`}
            onClick={() => setTab("now")}
          >
            {t.ui.foodTabNow ?? "Maintenant"}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "all"}
            className={`tab-btn ${tab === "all" ? "active" : ""}`}
            onClick={() => setTab("all")}
          >
            {t.ui.foodTabAll ?? "Toutes les phases"}
          </button>
        </div>

        {tab === "now" && currentPhase && (
          <PhaseFoodBlock
            phase={currentPhase}
            eatTitle={eatTitle}
            avoidTitle={avoidTitle}
            t={t}
            highlightCurrent={false}
          />
        )}

        {tab === "all" && (
          <div className="food-all-list">
            {phases.map((phase) => (
              <PhaseFoodBlock
                key={phase.id}
                phase={phase}
                eatTitle={eatTitle}
                avoidTitle={avoidTitle}
                t={t}
                highlightCurrent={phase.id === currentPhase?.id}
                showHeader
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PhaseFoodBlock({
  phase,
  eatTitle,
  avoidTitle,
  t,
  highlightCurrent,
  showHeader,
}) {
  const eat = phase.food?.eat ?? [];
  const avoid = phase.food?.avoid ?? [];
  const isEmpty = eat.length === 0 && avoid.length === 0;

  return (
    <section
      className={`food-phase-block ${highlightCurrent ? "is-current" : ""}`}
      style={
        highlightCurrent
          ? {
              borderColor: `${phase.color}55`,
              background: `linear-gradient(135deg, ${phase.color}10, rgba(255,255,255,0.88))`,
            }
          : undefined
      }
    >
      {showHeader && (
        <header className="food-phase-header">
          <span className="food-phase-emoji" aria-hidden="true">
            {phase.emoji}
          </span>
          <h2
            className="food-phase-name"
            style={{ color: phase.accent }}
          >
            {phase.name}
            {highlightCurrent && (
              <span className="now-badge">{t.ui.nowBadge}</span>
            )}
          </h2>
        </header>
      )}

      {isEmpty ? (
        <p className="food-phase-empty">—</p>
      ) : (
        <>
          {eat.length > 0 && (
            <div className="tips-card food-card">
              <div
                className="tips-title"
                style={{ color: phase.accent }}
              >
                🍽️ {eatTitle}
              </div>
              {eat.map((item, i) => (
                <div key={i} className="tip-item">
                  <span style={{ color: phase.accent, flexShrink: 0 }}>→</span>
                  {item}
                </div>
              ))}
            </div>
          )}

          {avoid.length > 0 && (
            <div className="avoid-card food-avoid-card">
              <div className="avoid-title">🚫 {avoidTitle}</div>
              {avoid.map((item, i) => (
                <div key={i} className="tip-item">
                  <span className="danger-mark">×</span>
                  {item}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
