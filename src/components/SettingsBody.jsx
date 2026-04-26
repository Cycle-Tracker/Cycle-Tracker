import { useState } from "react";
import { PHASE_META } from "../data/phaseMeta";
import { LOCALE_LIST, useLanguage } from "../i18n";
import { isSupabaseConfigured } from "../lib/supabase";

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
}) {
  const { t, lang, setLang } = useLanguage();
  const [copied, setCopied] = useState(false);

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
                    background: `linear-gradient(to right, ${meta.color} 0%, ${meta.color} ${fillPercent}%, rgba(0,0,0,0.08) ${fillPercent}%, rgba(0,0,0,0.08) 100%)`,
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
    </>
  );
}
