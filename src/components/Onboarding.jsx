import { useLanguage } from "../i18n";
import SettingsBody from "./SettingsBody";

export default function Onboarding({
  startDate,
  setStartDate,
  durations,
  updateDuration,
  totalDays,
  onComplete,
}) {
  const { t } = useLanguage();

  return (
    <div className="onboarding-page">
      <div className="onboarding-hero">
        <div className="onboarding-emoji" aria-hidden>
          🌸
        </div>
        <h1 className="onboarding-title">{t.ui.welcomeTitle}</h1>
        <p className="onboarding-subtitle">{t.ui.welcomeSubtitle}</p>
      </div>

      <div className="onboarding-card">
        <SettingsBody
          startDate={startDate}
          setStartDate={setStartDate}
          durations={durations}
          updateDuration={updateDuration}
          totalDays={totalDays}
          showTotal={false}
          showReset={false}
          showLogPeriod={false}
        />

        <p className="onboarding-help">{t.ui.welcomePhasesHelp}</p>

        <button
          type="button"
          className="onboarding-start-btn"
          onClick={onComplete}
        >
          {t.ui.welcomeStartButton} →
        </button>
      </div>
    </div>
  );
}
