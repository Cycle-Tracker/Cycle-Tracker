import { useLanguage } from "../i18n";

/**
 * Simple placeholder page used for tabs that aren't built yet.
 *
 * Props:
 *  - title: page title (string)
 *  - help: optional help/intro paragraph (string)
 *  - icon: emoji shown in the empty state (string)
 */
export default function PlaceholderPage({ title, help, icon = "✨" }) {
  const { t } = useLanguage();

  return (
    <div className="page-shell">
      <div className="page-header-simple">
        <h1 className="page-title">{title}</h1>
      </div>

      <div className="page-body">
        {help && <p className="page-help">{help}</p>}

        <div className="coming-soon-card">
          <div className="coming-soon-icon" aria-hidden="true">
            {icon}
          </div>
          <div className="coming-soon-title">{t.ui.comingSoonTitle}</div>
          <p className="coming-soon-body">{t.ui.comingSoonBody}</p>
        </div>
      </div>
    </div>
  );
}
