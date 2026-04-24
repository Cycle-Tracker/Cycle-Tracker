import { useState } from "react";
import { QUESTIONS } from "../data/questionnaire";
import { useLanguage } from "../i18n";

/**
 * Full-screen overlay that lets the woman re-answer (or clear) her
 * questionnaire after onboarding. We keep the edits local to the
 * overlay until she taps "Save" — only then do we hand the new
 * answers to the parent, which persists + syncs them.
 *
 * Props:
 *  - initialAnswers — current questionnaire object (may be empty)
 *  - onSave(answers) — called with the edited answers
 *  - onClose        — dismiss without saving
 */
export default function QuestionnaireEditor({
  initialAnswers = {},
  onSave,
  onClose,
}) {
  const { t } = useLanguage();
  const [answers, setAnswers] = useState(initialAnswers || {});

  function pick(questionId, value) {
    setAnswers((prev) => {
      // Tap the selected option again to unselect it.
      if (prev[questionId] === value) {
        const next = { ...prev };
        delete next[questionId];
        return next;
      }
      return { ...prev, [questionId]: value };
    });
  }

  function handleSave() {
    onSave(answers);
  }

  function handleReset() {
    setAnswers({});
  }

  return (
    <div className="quest-editor-overlay">
      <div className="quest-editor-page">
        <div className="quest-editor-hero">
          <div className="onboarding-emoji" aria-hidden>
            💭
          </div>
          <h1 className="onboarding-title">{t.ui.questEditTitle}</h1>
          <p className="onboarding-subtitle">{t.ui.questEditSubtitle}</p>
        </div>

        <div className="quest-editor-list">
          {QUESTIONS.map((q) => {
            const qText = t.questionnaire.questions[q.i18nKey];
            const currentValue = answers[q.id];
            return (
              <div key={q.id} className="quest-editor-block">
                <h3 className="quest-question">{qText}</h3>
                <div className="quest-options">
                  {q.options.map((opt) => {
                    const selected = currentValue === opt.value;
                    const label = t.questionnaire.options[opt.i18nKey];
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        className={`quest-option-btn ${
                          selected ? "selected" : ""
                        }`}
                        onClick={() => pick(q.id, opt.value)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="quest-editor-actions">
          <button
            type="button"
            className="onboarding-start-btn step-next-btn"
            onClick={handleSave}
          >
            {t.ui.questReEditSave ?? t.ui.stepFinish}
          </button>
          <button
            type="button"
            className="quest-editor-reset-btn"
            onClick={handleReset}
          >
            {t.ui.questReEditReset ?? t.ui.resetButton}
          </button>
          <button
            type="button"
            className="step-back-btn"
            onClick={onClose}
          >
            {t.ui.stepPrev}
          </button>
        </div>
      </div>
    </div>
  );
}
