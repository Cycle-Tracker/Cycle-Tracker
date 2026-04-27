import { useEffect, useState } from "react";
import { useLanguage } from "../i18n";

const LS_DISMISSED_KEY = "cycle-install-dismissed";
const RESHOW_AFTER_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

/**
 * Detect if app is already running standalone (installed PWA, or iOS home screen).
 */
function isStandalone() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) {
    return true;
  }
  // iOS Safari uses navigator.standalone
  if (window.navigator && window.navigator.standalone === true) {
    return true;
  }
  return false;
}

/**
 * Detect iOS (iPhone/iPad) running Safari (where beforeinstallprompt is not supported).
 */
function isIOS() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // iPad on iOS 13+ reports as "MacIntel" with touch; we cover both.
  const iOSDevice =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return iOSDevice;
}

/**
 * Check whether the user dismissed the prompt recently.
 */
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
 * Slim banner inviting the user to install the app on their home screen.
 *
 * - Android Chrome / Edge: listens for `beforeinstallprompt`, lets the user
 *   install in one tap.
 * - iOS Safari: shows step-by-step instructions for the Share → "Sur l'écran
 *   d'accueil" flow.
 * - Already installed (display-mode: standalone): hides itself.
 * - Dismissible: writes a timestamp to localStorage and stays hidden for 14 days.
 */
export default function InstallPrompt() {
  const { t } = useLanguage();

  const [installEvent, setInstallEvent] = useState(null);
  const [show, setShow] = useState(false);
  const [iosMode, setIosMode] = useState(false);

  useEffect(() => {
    // Already installed → never show
    if (isStandalone()) return;
    // Recently dismissed → don't nag
    if (isRecentlyDismissed()) return;

    const ios = isIOS();

    function onBeforeInstall(e) {
      e.preventDefault();
      setInstallEvent(e);
      setIosMode(false);
      setShow(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // For iOS we don't get an event — show after a tiny delay so the page paints first.
    let iosTimer = null;
    if (ios) {
      iosTimer = setTimeout(() => {
        setIosMode(true);
        setShow(true);
      }, 1500);
    }

    // Hide if the app gets installed mid-session
    function onInstalled() {
      setShow(false);
      setInstallEvent(null);
    }
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(LS_DISMISSED_KEY, String(Date.now()));
    } catch {
      /* ignore quota / private mode errors */
    }
    setShow(false);
  }

  async function handleInstall() {
    if (!installEvent) return;
    try {
      installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice && choice.outcome === "accepted") {
        setShow(false);
      } else {
        // user dismissed the native prompt — treat as a soft dismiss
        dismiss();
      }
    } catch {
      dismiss();
    } finally {
      setInstallEvent(null);
    }
  }

  if (!show) return null;

  return (
    <div className="install-prompt" role="dialog" aria-live="polite">
      <button
        type="button"
        className="install-prompt-close"
        onClick={dismiss}
        aria-label={t.ui.installPromptClose}
      >
        ×
      </button>
      <div className="install-prompt-icon" aria-hidden="true">
        💖
      </div>
      <div className="install-prompt-body">
        <div className="install-prompt-title">{t.ui.installPromptTitle}</div>
        {iosMode ? (
          <div className="install-prompt-help">
            {t.ui.installPromptHelpIOS}
          </div>
        ) : (
          <div className="install-prompt-help">
            {t.ui.installPromptHelpAndroid}
          </div>
        )}
      </div>
      {!iosMode && installEvent && (
        <button
          type="button"
          className="install-prompt-btn"
          onClick={handleInstall}
        >
          {t.ui.installPromptButton}
        </button>
      )}
    </div>
  );
}
