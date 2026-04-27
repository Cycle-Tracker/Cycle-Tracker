import { useEffect, useState } from "react";
import { useLanguage } from "../i18n";
import {
  getBrowserNotificationPermission,
  isBrowserNotificationSupported,
  isOsNotificationsEnabled,
  requestBrowserNotificationPermission,
  setOsNotificationsEnabled,
} from "../utils/browserNotifications";

const LS_DISMISSED_KEY = "cycle-notif-prompt-dismissed";
const RESHOW_AFTER_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function isRecentlyDismissed() {
  try {
    const ts = localStorage.getItem(LS_DISMISSED_KEY);
    if (!ts) return false;
    const n = Number(ts);
    if (!Number.isFinite(n)) return false;
    return Date.now() - n < RESHOW_AFTER_MS;
  } catch {
    return false;
  }
}

/**
 * Slim banner inviting the user to enable OS notifications. Auto-shows on the
 * Home page after onboarding when:
 *   - the browser supports notifications
 *   - permission is still "default" (the user hasn't decided yet)
 *   - the user hasn't dismissed it in the last 14 days
 *   - the user hasn't already enabled them in Settings
 *
 * The actual OS permission popup is only triggered when the user taps the
 * "Activer" button — browsers require a user gesture for the prompt to show.
 *
 * Mirrors the pattern used by InstallPrompt for consistency.
 */
export default function NotifPrompt() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isBrowserNotificationSupported()) return;
    if (isOsNotificationsEnabled()) return;
    if (getBrowserNotificationPermission() !== "default") return;
    if (isRecentlyDismissed()) return;

    // Tiny delay so the home page paints first — same UX trick as InstallPrompt.
    const timer = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(LS_DISMISSED_KEY, String(Date.now()));
    } catch {
      // ignore (private mode etc.)
    }
    setShow(false);
  }

  async function handleEnable() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await requestBrowserNotificationPermission();
      if (result === "granted") {
        setOsNotificationsEnabled(true);
      } else {
        // Denied or dismissed — don't pester again until the cooldown elapses.
        dismiss();
      }
    } finally {
      setBusy(false);
      setShow(false);
    }
  }

  if (!show) return null;

  return (
    <div className="notif-prompt" role="dialog" aria-live="polite">
      <button
        type="button"
        className="notif-prompt-close"
        onClick={dismiss}
        aria-label={t.ui.notifPromptClose ?? t.ui.installPromptClose ?? "Fermer"}
      >
        ×
      </button>
      <div className="notif-prompt-icon" aria-hidden="true">
        🔔
      </div>
      <div className="notif-prompt-body">
        <div className="notif-prompt-title">
          {t.ui.notifPromptTitle ?? "Activer les notifications ?"}
        </div>
        <div className="notif-prompt-help">
          {t.ui.notifPromptHelp ??
            "Reçois un rappel doux avant les règles et pendant la fenêtre fertile."}
        </div>
      </div>
      <button
        type="button"
        className="notif-prompt-btn"
        onClick={handleEnable}
        disabled={busy}
      >
        {busy
          ? t.ui.notifPromptBusy ?? "..."
          : t.ui.notifPromptButton ?? "Activer"}
      </button>
    </div>
  );
}
