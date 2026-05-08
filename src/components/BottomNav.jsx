import { useLanguage } from "../i18n";

/**
 * Sticky bottom navigation bar with 5 tabs.
 *
 * Order (left → right): journal | calendar | home | food | settings.
 * The History page no longer exists as a top-level tab — its essential
 * stats are now displayed at the top of the Calendar page, and the
 * detailed cycle list / predictions are in a collapsible block below
 * the calendar.
 *
 * Props:
 *  - active: "journal" | "calendar" | "home" | "food" | "settings"
 *  - onSelect(tabId)
 */
export default function BottomNav({ active, onSelect }) {
  const { t } = useLanguage();

  const tabs = [
    { id: "journal", label: t.ui.tabJournal, icon: "📔" },
    { id: "calendar", label: t.ui.tabCalendar, icon: "📅" },
    { id: "home", label: t.ui.tabHome, icon: "🏠" },
    { id: "food", label: t.ui.tabFood, icon: "🍽️" },
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
