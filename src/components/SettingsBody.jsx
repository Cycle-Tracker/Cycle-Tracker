import { useState } from "react";
import { PHASE_META } from "../data/phaseMeta";
import { LOCALE_LIST, useLanguage } from "../i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  clearOsNotificationDedup,
  getBrowserNotificationPermission,
  isBrowserNotificationSupported,
  isOsNotificationsEnabled,
  requestBrowserNotificationPermission,
  setOsNotificationsEnabled,
  showOsNotification,
} from "../utils/browserNotifications";

const DEFAULT_DURATIONS = PHASE_META.map((item) => item.defaultDays);

/**
 * Shared settings panel.
 *
 * Base props:
 *  - startDate, setStartDate, durations, updateDuration
 *  - resetDurations      (optional — hidden if showReset = false)
 *  - logPeriodToday      (optional — hidden if showLogPeriod = false)
 *  - totalDays
 *  - showTotal           (default true)
 *  - showReset           (default true)
 *  - showLogPeriod       (default true)
 *
 * Identity props (optional):
 *  - role                "woman" | "man"
 *  - myName, setMyName   (allow editing own first name)
 *  - onEditQuestionnaire (optional; if provided + role is woman, shows
 *                         "Edit my answers" button)
 *
 * Sharing props (optional):
 *  - sharedCode
 *  - onEnableSharing      (if set, shows "enable sharing" button)
 *  - onJoinSharing        (if set, shows "join existing code" button)
 *  - onDisconnectSharing  (if set + sharedCode, shows disconnect button)
 *  - showShare            (must be true to render the sharing section)
 */
export default function SettingsBody({
  startDate,
  setStartDate,
  durations,
  updateDuration,
  resetDurations,
  logPeriodToday,
  totalDays,
  showTotal = true,
  showReset = true,
  showLogPeriod = true,
  // Identity
  role = null,
  myName = "",
  setMyName = null,
  onEditQuestionnaire = null,
  // Sharing
  sharedCode = null,
  onEnableSharing = null,
  onJoinSharing = null,
  onDisconnectSharing = null,
  showShare = false,
  // Account / auth
  session = null,
  onSignOut = null,
  onSignIn = null,
  onDeleteAccount = null,
  // Redo onboarding (re-run the launch flow: lang, name, role, etc.)
  onRedoOnboarding = null,
}) {
  const { t, lang, setLang } = useLanguage();
  const [copied, setCopied] = useState(false);

  // Browser-notification state. We track permission + the user toggle so the
  // UI can show: not-supported / blocked / off / on. Re-read on mount in case
  // permission changed in another tab.
  const notifsSupported = isBrowserNotificationSupported();
  const [notifsPermission, setNotifsPermission] = useState(() =>
    notifsSupported ? getBrowserNotificationPermission() : "unsupported"
  );
  const [notifsEnabled, setNotifsEnabledState] = useState(() =>
    notifsSupported ? isOsNotificationsEnabled() : false
  );
  const [notifTestStatus, setNotifTestStatus] = useState(""); // "", "ok", "blocked"

  async function handleToggleNotifs() {
    if (!notifsSupported) return;
    if (notifsEnabled) {
      // Turn off (we can't revoke browser permission, just our own toggle).
      setOsNotificationsEnabled(false);
      setNotifsEnabledState(false);
      return;
    }
    // Turn on — ensure permission first.
    const result = await requestBrowserNotificationPermission();
    setNotifsPermission(result);
    if (result === "granted") {
      setOsNotificationsEnabled(true);
      setNotifsEnabledState(true);
    }
  }

  function handleTestNotif() {
    // Reset dedup so the test always fires even if the same id was shown today.
    clearOsNotificationDedup();
    const ok = showOsNotification({
      id: `test-${Date.now()}`,
      title: t.ui.notifTestTitle ?? "Test notification",
      body: t.ui.notifTestBody ?? "Si tu vois ceci, les notifs sont bien actives.",
    });
    setNotifTestStatus(ok ? "ok" : "blocked");
    setTimeout(() => setNotifTestStatus(""), 3000);
  }

  async function handleCopy() {
    if (!sharedCode) return;
    try {
      await navigator.clipboard.writeText(sharedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  // Share via the OS share sheet if available (gives the user SMS, WhatsApp,
  // Mail, etc. on mobile). Fall back to opening the SMS app directly with the
  // body prefilled. `sms:?&body=` works on both iOS and Android.
  async function handleShareSMS() {
    if (!sharedCode) return;
    const body =
      typeof t.ui.shareSMSBody === "function"
        ? t.ui.shareSMSBody(sharedCode)
        : `${sharedCode}`;
    try {
      if (navigator.share) {
        await navigator.share({ text: body });
        return;
      }
    } catch {
      // user cancelled or share failed — fall through to sms: link
    }
    window.location.href = `sms:?&body=${encodeURIComponent(body)}`;
  }

  return (
    <>
      <div className="settings-row settings-lang-row">
        <label className="section-label">{t.ui.languageLabel}</label>
        <div className="settings-lang-grid">
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
      </div>

      {setMyName && (
        <div className="settings-row">
          <label className="section-label">
            {t.ui.myNameLabel}{" "}
            <span className="settings-hint">{t.ui.yourNameHint}</span>
          </label>
          <input
            type="text"
            className="settings-name-input"
            value={myName || ""}
            onChange={(e) => setMyName(e.target.value)}
            maxLength={40}
            placeholder={t.ui.stepNamePlaceholder}
          />
        </div>
      )}

      {showShare && (
        <div className="settings-row share-row">
          <label className="section-label">{t.ui.shareSectionLabel}</label>

          {!isSupabaseConfigured && (
            <div className="share-offline">{t.ui.shareOfflineLabel}</div>
          )}

          {isSupabaseConfigured && sharedCode && (
            <>
              <div className="share-active">
                <span className="share-active-dot" aria-hidden>
                  ●
                </span>
                {t.ui.shareActiveLabel}
              </div>
              <div className="share-code-row">
                <div className="share-code">{sharedCode}</div>
                <button
                  type="button"
                  className="share-copy-btn"
                  onClick={handleCopy}
                >
                  {copied ? t.ui.shareCopiedLabel : t.ui.shareCopyButton}
                </button>
              </div>
              <button
                type="button"
                className="share-sms-btn"
                onClick={handleShareSMS}
              >
                💬 {t.ui.shareSMSButton ?? "Envoyer par SMS"}
              </button>
              <p className="share-help">{t.ui.shareHelp}</p>
              {onDisconnectSharing && (
                <button
                  type="button"
                  className="share-disconnect-btn"
                  onClick={onDisconnectSharing}
                >
                  {t.ui.shareDisconnectButton}
                </button>
              )}
            </>
          )}

          {isSupabaseConfigured && !sharedCode && (
            <>
              {onEnableSharing && (
                <>
                  <p className="share-help">{t.ui.shareEnableHelp}</p>
                  <button
                    type="button"
                    className="share-enable-btn"
                    onClick={onEnableSharing}
                  >
                    💞 {t.ui.shareEnableButton}
                  </button>
                </>
              )}
              {onJoinSharing && (
                <>
                  <p className="share-help">{t.ui.shareJoinHelp}</p>
                  <button
                    type="button"
                    className="share-join-btn"
                    onClick={onJoinSharing}
                  >
                    🔑 {t.ui.shareJoinButton}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {showTotal && (
        <div className="settings-total">
          {t.ui.totalCycleLabel}{" "}
          <span>
            {totalDays} {t.ui.daysUnit}
          </span>
        </div>
      )}

      {/* Cycle editing controls — woman-only. The man receives the
          values via shared-cycle sync but can't edit them. */}
      {role === "woman" && (
        <>
          <div className="settings-row">
            <label className="section-label">{t.ui.startDateLabel}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            {showLogPeriod && logPeriodToday && (
              <button
                type="button"
                className="log-period-btn"
                onClick={logPeriodToday}
              >
                🔴 {t.ui.logPeriodButton}
              </button>
            )}
          </div>

          {PHASE_META.map((meta, i) => {
            const localized = t.phases[meta.id] ?? {};
            const fillPercent =
              ((durations[i] - meta.minDays) /
                (meta.maxDays - meta.minDays)) *
              100;
            // Aligns the gradient stop with the thumb's center (22px thumb).
            const fillStop = `calc(${fillPercent}% + ${(
              11 -
              0.22 * fillPercent
            ).toFixed(2)}px)`;

            return (
              <div key={meta.id} className="settings-row">
                <div className="settings-row-top">
                  <div className="settings-phase-name">
                    <span>{meta.emoji}</span>
                    <span style={{ color: meta.accent }}>
                      {localized.name ?? meta.id}
                    </span>
                  </div>
                  <div className="settings-days">
                    <span style={{ color: meta.accent, fontWeight: 700 }}>
                      {durations[i]}
                    </span>
                    <span className="muted"> {t.ui.dayShort}</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={meta.minDays}
                  max={meta.maxDays}
                  value={durations[i]}
                  onChange={(e) =>
                    updateDuration(i, parseInt(e.target.value, 10))
                  }
                  style={{
                    background: `linear-gradient(to right, ${meta.color} 0%, ${meta.color} ${fillStop}, rgba(0,0,0,0.08) ${fillStop}, rgba(0,0,0,0.08) 100%)`,
                  }}
                />

                <div className="range-hints">
                  <span>
                    {meta.minDays}
                    {t.ui.minSuffix}
                  </span>
                  <span>
                    {meta.maxDays}
                    {t.ui.maxSuffix}
                  </span>
                </div>
              </div>
            );
          })}

          {showReset && resetDurations && (
            <button className="reset-btn" onClick={resetDurations}>
              {t.ui.resetButton} (
              {DEFAULT_DURATIONS.reduce((a, b) => a + b, 0)} {t.ui.daysUnit})
            </button>
          )}
        </>
      )}

      {role === "woman" && onEditQuestionnaire && (
        <div className="settings-row quest-edit-row">
          <label className="section-label">{t.ui.questEditTitle}</label>
          <p className="settings-hint quest-edit-subtitle">
            {t.ui.questEditSubtitle}
          </p>
          <button
            type="button"
            className="quest-edit-btn"
            onClick={onEditQuestionnaire}
          >
            💭 {t.ui.questReEditOpen ?? t.ui.questEditButton}
          </button>
        </div>
      )}

      {/* Redo the full onboarding flow — useful when the user wants to
          change their role (cycle owner vs partner), name, dates, or
          re-enter a different sharing code. */}
      {onRedoOnboarding && (
        <div className="settings-row redo-onboarding-row">
          <label className="section-label">
            {t.ui.redoOnboardingSectionLabel ?? "Reprendre le démarrage"}
          </label>
          <p className="settings-hint">
            {t.ui.redoOnboardingHelp ??
              "Pour changer ton rôle, ton prénom ou tes réponses."}
          </p>
          <button
            type="button"
            className="redo-onboarding-btn"
            onClick={onRedoOnboarding}
          >
            {t.ui.redoOnboardingButton ?? "🔄 Refaire le démarrage"}
          </button>
        </div>
      )}

      {/* OS notifications toggle. Available on all platforms — graceful
          when the browser doesn't support the Notification API or the
          user has blocked permission at the OS/browser level. */}
      <div className="settings-row notifs-row">
        <label className="section-label">
          {t.ui.notifsSettingsLabel ?? "Notifications"}
        </label>
        {!notifsSupported && (
          <p className="settings-hint">
            {t.ui.notifsUnsupported ??
              "Ton navigateur ne supporte pas les notifications."}
          </p>
        )}
        {notifsSupported && (
          <>
            <p className="settings-hint">
              {t.ui.notifsSettingsHelp ??
                "Reçois une notification quand les règles approchent ou pendant la fenêtre fertile."}
            </p>
            {notifsPermission === "denied" ? (
              <p className="settings-hint notifs-blocked">
                {t.ui.notifsBlocked ??
                  "Les notifications sont bloquées dans les réglages de ton navigateur."}
              </p>
            ) : (
              <button
                type="button"
                className={`notifs-toggle-btn ${notifsEnabled ? "on" : "off"}`}
                onClick={handleToggleNotifs}
                aria-pressed={notifsEnabled}
              >
                {notifsEnabled
                  ? `🔔 ${t.ui.notifsToggleOn ?? "Activées"}`
                  : `🔕 ${t.ui.notifsToggleOff ?? "Activer"}`}
              </button>
            )}
            {notifsEnabled && notifsPermission === "granted" && (
              <button
                type="button"
                className="notifs-test-btn"
                onClick={handleTestNotif}
              >
                {t.ui.notifsTest ?? "Tester"}
              </button>
            )}
            {notifTestStatus === "ok" && (
              <p className="settings-hint notifs-test-ok">
                {t.ui.notifsTestSent ?? "Notification envoyée ✓"}
              </p>
            )}
            {notifTestStatus === "blocked" && (
              <p className="settings-hint notifs-test-fail">
                {t.ui.notifsTestFail ??
                  "Impossible d'envoyer la notification."}
              </p>
            )}
          </>
        )}
      </div>

      {/* Account section — only when Supabase auth is plausibly available
          (we use the presence of either onSignOut or onSignIn as the signal:
          CycleTracker only passes these in when isSupabaseConfigured is true). */}
      {(onSignOut || onSignIn) && (
        <div className="settings-row account-row">
          <label className="section-label">
            {t.ui.accountSectionLabel ?? "Mon compte"}
          </label>
          {session?.user?.email ? (
            <>
              <div className="account-email-row">
                <span className="account-email-label">
                  {t.ui.accountEmailLabel ?? "Connecté en tant que"}
                </span>
                <span className="account-email-value">
                  {session.user.email}
                </span>
              </div>
              {onSignOut && (
                <button
                  type="button"
                  className="account-signout-btn"
                  onClick={onSignOut}
                >
                  {t.ui.accountSignOutButton ?? "Se déconnecter"}
                </button>
              )}
              {onDeleteAccount && (
                <button
                  type="button"
                  className="account-delete-btn"
                  onClick={onDeleteAccount}
                >
                  {t.ui.accountDeleteButton ?? "Supprimer mon compte"}
                </button>
              )}
            </>
          ) : (
            <>
              <p className="settings-hint">
                {t.ui.accountSignedOutLabel ??
                  "Connecte-toi pour retrouver ton cycle sur tous tes appareils."}
              </p>
              {onSignIn && (
                <button
                  type="button"
                  className="account-signin-btn"
                  onClick={onSignIn}
                >
                  {t.ui.accountSignInButton ?? "Se connecter / créer un compte"}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
