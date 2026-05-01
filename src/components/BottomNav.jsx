import { useLanguage } from "../i18n";

/**
 * Sticky bottom navigation bar with 5 tabs.
 *
 * Props:
 *  - active: "journal" | "calendar" | "home" | "history" | "settings"
 *  - onSelect(tabId)
 */
export default function BottomNav({ active, onSelect }) {
  const { t } = useLanguage();

  const tabs = [
    { id: "journal", label: t.ui.tabJournal, icon: "📔" },
    { id: "calendar", label: t.ui.tabCalendar, icon: "📅" },
    { id: "home", label: t.ui.tabHome, icon: "🏠" },
    { id: "history", label: t.ui.tabHistory, icon: "📊" },
    { id: "settings", label: t.ui.tabSettings, icon: "⚙️" },
  ];

  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`bottom-nav-tab ${isActive ? "active" : ""}`}
            onClick={() => onSelect(tab.id)}
            aria-current={isActive ? "page" : undefined}
            aria-label={tab.label}
          >
            <span className="bottom-nav-icon" aria-hidden="true">
              {tab.icon}
            </span>
            <span className="bottom-nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
