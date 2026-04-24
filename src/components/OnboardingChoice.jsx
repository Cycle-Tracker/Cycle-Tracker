import { useLanguage, LOCALE_LIST } from "../i18n";

/**
 * Second onboarding screen (after language + phases are set):
 * lets the user pick between creating a shared cycle, joining one,
 * or using the app solo.
 *
 * Props:
 *  - onCreate(): called when the user wants to create a shared cycle
 *  - onJoin():   called when the user wants to enter a code
 *  - onSolo():   called when the user wants to skip sharing
 *  - supabaseAvailable (bool): if false, we hide the sharing options
 */
export default function OnboardingChoice({
  onCreate,
  onJoin,
  onSolo,
  supabaseAvailable = true,
}) {
  const { t, lang, setLang } = useLanguage();

  return (
    <div className="onboarding-page">
      <div className="onboarding-hero">
        <div className="onboarding-emoji" aria-hidden>
          💞
        </div>
        <h1 className="onboarding-title">{t.ui.choiceTitle}</h1>
        <p className="onboarding-subtitle">{t.ui.choiceSubtitle}</p>
      </div>

      <div className="onboarding-card">
        <div className="settings-lang-grid onboarding-lang-grid">
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

        <div className="choice-list">
          {supabaseAvailable && (
            <button
              type="button"
              className="choice-option choice-primary"
              onClick={onCreate}
            >
              <div className="choice-option-emoji">💌</div>
              <div className="choice-option-body">
                <div className="choice-option-title">
                  {t.ui.choiceCreateTitle}
                </div>
                <div className="choice-option-desc">
                  {t.ui.choiceCreateDesc}
                </div>
              </div>
              <div className="choice-option-arrow">→</div>
            </button>
          )}

          {supabaseAvailable && (
            <button
              type="button"
              className="choice-option"
              onClick={onJoin}
            >
              <div className="choice-option-emoji">🔑</div>
              <div className="choice-option-body">
                <div className="choice-option-title">
                  {t.ui.choiceJoinTitle}
                </div>
                <div className="choice-option-desc">{t.ui.choiceJoinDesc}</div>
              </div>
              <div className="choice-option-arrow">→</div>
            </button>
          )}

          <button
            type="button"
            className="choice-option choice-subtle"
            onClick={onSolo}
          >
            <div className="choice-option-emoji">🌿</div>
            <div className="choice-option-body">
              <div className="choice-option-title">{t.ui.choiceSoloTitle}</div>
              <div className="choice-option-desc">{t.ui.choiceSoloDesc}</div>
            </div>
            <div className="choice-option-arrow">→</div>
          </button>
        </div>
      </div>
    </div>
  );
}
