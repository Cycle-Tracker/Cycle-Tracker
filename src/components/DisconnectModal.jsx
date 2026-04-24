import { useLanguage } from "../i18n";

/**
 * Custom confirm modal shown when the user wants to disconnect from
 * a shared cycle. Shows the partner's first name if we know it.
 *
 * Props:
 *  - partnerName (string | null)
 *  - onConfirm()
 *  - onCancel()
 */
export default function DisconnectModal({ partnerName, onConfirm, onCancel }) {
  const { t } = useLanguage();
  const message = t.ui.shareDisconnectMsg(partnerName);

  return (
    <div
      className="disconnect-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="disconnect-modal"
        role="dialog"
        aria-labelledby="disconnect-title"
      >
        <div className="disconnect-emoji" aria-hidden>
          💔
        </div>
        <h2 id="disconnect-title" className="disconnect-title">
          {t.ui.shareDisconnectTitle}
        </h2>
        <p className="disconnect-message">{message}</p>
        <p className="disconnect-help">{t.ui.shareDisconnectHelp}</p>

        <div className="disconnect-actions">
          <button
            type="button"
            className="disconnect-cancel-btn"
            onClick={onCancel}
          >
            {t.ui.shareDisconnectCancel}
          </button>
          <button
            type="button"
            className="disconnect-confirm-btn"
            onClick={onConfirm}
          >
            {t.ui.shareDisconnectConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
