import { useLanguage } from "../i18n";
import EnergyDots from "./EnergyDots";

const MAX_ENERGY = 5;

/**
 * Simplified dashboard the partner (man) sees: current phase,
 * what to do / what to avoid, mood hint. No wheel, no sliders.
 *
 * Tips are already personalized (filtered by questionnaire tags)
 * by the parent component.
 *
 * Props:
 *  - currentPhase  — already-localized phase ({ name, emoji, accent, color,
 *                    energy, tips, avoid, mood })
 *  - name          — the man's own first name (used for greeting)
 *  - partnerName   — the woman's first name (used in "X is in phase Y")
 */
export default function ManView({ currentPhase, name, partnerName }) {
  const { t } = useLanguage();

  const partnerLabel = partnerName || t.ui.manPartnerMissingName;
  const hello = t.ui.manHelloLabel(name || null);
  const inPhase = t.ui.manCurrentlyLabel(partnerLabel);

  return (
    <div className="man-view">
      <div className="man-hello">{hello}</div>

      <div
        className="man-phase-card"
        style={{
          borderColor: `${currentPhase.color}40`,
          background: `linear-gradient(135deg, ${currentPhase.color}14, rgba(255,255,255,0.92))`,
        }}
      >
        <div className="man-phase-top">
          <span className="man-phase-emoji" aria-hidden>
            {currentPhase.emoji}
          </span>
          <div className="man-phase-lines">
            <div className="man-phase-in">{inPhase}</div>
            <h2
              className="man-phase-name"
              style={{ color: currentPhase.accent }}
            >
              {currentPhase.name}
            </h2>
          </div>
        </div>

        <div className="man-phase-mood-row">
          <span className="man-phase-mood-label">{t.ui.manMoodLabel}</span>
          <span className="man-phase-mood-value">{currentPhase.mood}</span>
        </div>

        <div className="man-phase-energy">
          <span className="man-phase-mood-label">{t.ui.energyLabel}</span>
          <EnergyDots
            level={currentPhase.energy}
            max={MAX_ENERGY}
            activeColor={currentPhase.accent}
            inactiveColor="rgba(60,60,67,0.16)"
          />
        </div>
      </div>

      <div className="tips-card man-tips-card">
        <div
          className="tips-title"
          style={{ color: currentPhase.accent }}
        >
          {t.ui.manWhatToDoTitle}
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

      <div className="avoid-card man-avoid-card">
        <div className="avoid-title">{t.ui.manWhatToAvoidTitle}</div>
        {currentPhase.avoid.map((item, i) => (
          <div key={i} className="tip-item">
            <span className="danger-mark">×</span>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
