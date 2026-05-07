import { useLanguage } from "../i18n";

/**
 * Sticky bottom navigation bar with 5 tabs.
 *
 * Order (left → right): history | calendar | home | food | settings.
 * Journal is no longer a top-level tab — it's an inner tab of the
 * history page.
 *
 * Props:
 *  - active: "history" | "calendar" | "home" | "food" | "settings"
 *  - onSelect(tabId)
 */
export default function BottomNav({ active, onSelect }) {
  const { t } = useLanguage();

  const tabs = [
    { id: "history", label: t.ui.tabHistory, icon: "📊" },
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
