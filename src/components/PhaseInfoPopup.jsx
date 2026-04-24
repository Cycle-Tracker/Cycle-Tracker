import { useLanguage } from "../i18n";

/**
 * Modal-style popup that explains a phase.
 *
 * Props:
 *  - phase       — the already-localized phase shown in the card the user
 *                  clicked the (i) on. Expects { id, name, emoji, color,
 *                  accent, mood } at minimum.
 *  - description — the localized description text. Pulled from i18n by the
 *                  parent so this component stays presentation-only.
 *  - onClose     — callback fired when the user taps the background, the
 *                  close button, or Escape.
 */
export default function PhaseInfoPopup({ phase, description, onClose }) {
  const { t } = useLanguage();

  if (!phase) return null;

  function handleBackgroundClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="phase-info-overlay" onClick={handleBackgroundClick}>
      <div
        className="phase-info-card"
        style={{
          borderColor: `${phase.color}40`,
          background: `linear-gradient(135deg, ${phase.color}18, rgba(255,255,255,0.96))`,
        }}
      >
        <div className="phase-info-top">
          <span className="phase-info-emoji" aria-hidden>
            {phase.emoji}
          </span>
          <div className="phase-info-head">
            <div className="phase-info-kicker">{t.ui.phaseInfoTitle}</div>
            <h3
              className="phase-info-name"
              style={{ color: phase.accent }}
            >
              {phase.name}
            </h3>
            {phase.mood && (
              <div className="phase-info-mood">{phase.mood}</div>
            )}
          </div>
        </div>

        {description ? (
          <p className="phase-info-desc">{description}</p>
        ) : (
          <p className="phase-info-desc phase-info-desc-empty">—</p>
        )}

        <button
          type="button"
          className="phase-info-close"
          onClick={onClose}
        >
          {t.ui.phaseInfoClose}
        </button>
      </div>
    </div>
  );
}
