import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./CycleTracker.css";
import { PHASE_META } from "./data/phaseMeta";
import { tagsFromAnswers } from "./data/questionnaire";
import {
  buildPhases,
  getDayOfCycle,
  getPhase,
  getTotalDays,
  todayIso,
} from "./utils/cycleUtils";
import { personalizePhaseTips } from "./utils/tipFilter";
import StepOnboarding from "./components/StepOnboarding";
import SettingsBody from "./components/SettingsBody";
import WomanView from "./components/WomanView";
import ManView from "./components/ManView";
import DisconnectModal from "./components/DisconnectModal";
import JoinCycle from "./components/JoinCycle";
import QuestionnaireEditor from "./components/QuestionnaireEditor";
import { useLanguage } from "./i18n";
import { isSupabaseConfigured } from "./lib/supabase";
import {
  createSharedCycle,
  fetchSharedCycle,
  subscribeToCycle,
  updateSharedCycle,
} from "./lib/cycleSync";

const DEFAULT_DURATIONS = PHASE_META.map((item) => item.defaultDays);

// localStorage keys (per-device state)
const LS_START_DATE = "cycle-start-date";
const LS_DURATIONS = "cycle-durations";
const LS_ONBOARDED = "cycle-onboarded";
const LS_SHARED_CODE = "cycle-shared-code";
const LS_ROLE = "cycle-role";
const LS_MY_NAME = "cycle-my-name";
const LS_PARTNER_NAME = "cycle-partner-name";
const LS_QUESTIONNAIRE = "cycle-questionnaire";

// ---------------- Initial state helpers ----------------

function readLS(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}

function getInitialStartDate() {
  const saved = readLS(LS_START_DATE);
  if (saved) return saved;
  const d = new Date();
  d.setDate(d.getDate() - 3);
  return d.toISOString().split("T")[0];
}

function getInitialDurations() {
  try {
    const saved = localStorage.getItem(LS_DURATIONS);
    if (!saved) return DEFAULT_DURATIONS;
    const parsed = JSON.parse(saved);
    if (
      Array.isArray(parsed) &&
      parsed.length === PHASE_META.length &&
      parsed.every((n) => Number.isInteger(n) && n > 0)
    ) {
      return parsed;
    }
  } catch {
    return DEFAULT_DURATIONS;
  }
  return DEFAULT_DURATIONS;
}

function getInitialOnboarded() {
  try {
    if (localStorage.getItem(LS_ONBOARDED) === "true") return true;
    // Backward compat: if they had saved data already, consider them onboarded.
    if (localStorage.getItem(LS_START_DATE)) return true;
  } catch {
    // ignore
  }
  return false;
}

function getInitialQuestionnaire() {
  try {
    const saved = localStorage.getItem(LS_QUESTIONNAIRE);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    return {};
  }
  return {};
}

function getInitialRole() {
  const saved = readLS(LS_ROLE);
  if (saved === "woman" || saved === "man") return saved;
  // Legacy users coming in without a role: default to woman (the "full" view).
  return "woman";
}

export default function CycleTracker() {
  const { t, lang } = useLanguage();

  // Cycle data (can come from local or sync)
  const [startDate, setStartDate] = useState(getInitialStartDate);
  const [durations, setDurations] = useState(getInitialDurations);

  // Identity / personalization (per-device mostly, some synced)
  const [role, setRole] = useState(getInitialRole);
  const [myName, setMyName] = useState(() => readLS(LS_MY_NAME, "") || "");
  const [partnerName, setPartnerName] = useState(
    () => readLS(LS_PARTNER_NAME, "") || ""
  );
  const [questionnaire, setQuestionnaire] = useState(getInitialQuestionnaire);

  // UI state
  const [activeTab, setActiveTab] = useState("now");
  const [showSettings, setShowSettings] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(getInitialOnboarded);

  // Sharing state
  const [sharedCode, setSharedCode] = useState(
    () => readLS(LS_SHARED_CODE) || null
  );
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showJoinOverlay, setShowJoinOverlay] = useState(false);
  const [showQuestEditor, setShowQuestEditor] = useState(false);

  // Ref we use to ignore our own writes when the realtime subscription
  // echoes them back to us.
  const ignoreNextRemoteUpdate = useRef(false);

  // ------------- Persist locally -------------

  useEffect(() => {
    try {
      localStorage.setItem(LS_START_DATE, startDate);
    } catch {
      // ignore
    }
  }, [startDate]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_DURATIONS, JSON.stringify(durations));
    } catch {
      // ignore
    }
  }, [durations]);

  useEffect(() => {
    try {
      if (sharedCode) localStorage.setItem(LS_SHARED_CODE, sharedCode);
      else localStorage.removeItem(LS_SHARED_CODE);
    } catch {
      // ignore
    }
  }, [sharedCode]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_ROLE, role);
    } catch {
      // ignore
    }
  }, [role]);

  useEffect(() => {
    try {
      if (myName) localStorage.setItem(LS_MY_NAME, myName);
      else localStorage.removeItem(LS_MY_NAME);
    } catch {
      // ignore
    }
  }, [myName]);

  useEffect(() => {
    try {
      if (partnerName) localStorage.setItem(LS_PARTNER_NAME, partnerName);
      else localStorage.removeItem(LS_PARTNER_NAME);
    } catch {
      // ignore
    }
  }, [partnerName]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_QUESTIONNAIRE, JSON.stringify(questionnaire));
    } catch {
      // ignore
    }
  }, [questionnaire]);

  // ------------- Apply a remote row -------------
  // A row represents the shared cycle for both partners. Names and
  // questionnaire are on the row because they describe the woman (the
  // cycle owner), so both sides need them for personalization.

  const applyRemoteRow = useCallback(
    (row) => {
      if (!row) return;
      if (row.start_date) setStartDate(row.start_date);
      if (Array.isArray(row.durations)) setDurations(row.durations);
      // NOTE: language is intentionally NOT applied from the remote row.
      // It must stay per-browser (localStorage) so each partner can pick
      // their own language independently.

      // Name mapping depends on which side of the couple we are on.
      if (role === "woman") {
        if (typeof row.woman_name === "string" && row.woman_name) {
          setMyName(row.woman_name);
        }
        if (typeof row.man_name === "string" && row.man_name) {
          setPartnerName(row.man_name);
        }
      } else {
        if (typeof row.man_name === "string" && row.man_name) {
          setMyName(row.man_name);
        }
        if (typeof row.woman_name === "string" && row.woman_name) {
          setPartnerName(row.woman_name);
        }
      }

      if (row.questionnaire && typeof row.questionnaire === "object") {
        setQuestionnaire(row.questionnaire);
      }
    },
    [role]
  );

  // ------------- Realtime subscription -------------

  useEffect(() => {
    if (!sharedCode || !isSupabaseConfigured) return undefined;

    let cancelled = false;
    fetchSharedCycle(sharedCode)
      .then((row) => {
        if (cancelled || !row) return;
        ignoreNextRemoteUpdate.current = true;
        applyRemoteRow(row);
      })
      .catch((err) => {
        console.error("Fetch shared cycle failed:", err);
      });

    const unsubscribe = subscribeToCycle(sharedCode, (row) => {
      if (ignoreNextRemoteUpdate.current) {
        ignoreNextRemoteUpdate.current = false;
        return;
      }
      applyRemoteRow(row);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [sharedCode, applyRemoteRow]);

  // ------------- Push local changes to Supabase (debounced) -------------

  const pushTimer = useRef(null);
  useEffect(() => {
    if (!sharedCode || !isSupabaseConfigured || !isOnboarded) return;

    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      const patch = {
        start_date: startDate,
        durations,
      };
      // Only the woman's side is allowed to overwrite woman_name +
      // questionnaire — otherwise the man could accidentally wipe them.
      if (role === "woman") {
        patch.woman_name = myName || null;
        patch.questionnaire = questionnaire || {};
      } else {
        patch.man_name = myName || null;
      }

      ignoreNextRemoteUpdate.current = true;
      updateSharedCycle(sharedCode, patch).catch((err) => {
        console.error("Push to Supabase failed:", err);
      });
    }, 400);

    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [
    sharedCode,
    startDate,
    durations,
    isOnboarded,
    role,
    myName,
    questionnaire,
  ]);

  // ------------- Derived state -------------

  const totalDays = useMemo(() => getTotalDays(durations), [durations]);

  // User's personalization tags — computed once per questionnaire change.
  const userTags = useMemo(
    () => tagsFromAnswers(questionnaire),
    [questionnaire]
  );

  const phases = useMemo(() => {
    const base = buildPhases(PHASE_META, durations);
    return base.map((phase) => {
      const localized = t.phases[phase.id] ?? {};
      const { tips, avoid } = personalizePhaseTips(localized, userTags);
      return {
        ...phase,
        name: localized.name ?? phase.id,
        tips,
        avoid,
        mood: localized.mood ?? "",
        description: localized.description ?? "",
        selfCare: Array.isArray(localized.selfCare) ? localized.selfCare : [],
        selfAvoid: Array.isArray(localized.selfAvoid)
          ? localized.selfAvoid
          : [],
      };
    });
  }, [durations, t, userTags]);

  const currentDay = useMemo(
    () => getDayOfCycle(startDate, totalDays),
    [startDate, totalDays]
  );
  const currentPhase = useMemo(
    () => getPhase(currentDay, phases),
    [currentDay, phases]
  );
  const daysUntilPeriod = totalDays - currentDay;

  const shareBadgeText = useMemo(() => {
    if (!sharedCode) return null;
    if (partnerName) return `💞 ${partnerName}`;
    return `💞 ${sharedCode}`;
  }, [sharedCode, partnerName]);

  // ------------- Actions -------------

  function updateDuration(index, value) {
    const next = [...durations];
    next[index] = value;
    setDurations(next);
  }

  function resetDurations() {
    setDurations(DEFAULT_DURATIONS);
  }

  function logPeriodToday() {
    const confirmed = window.confirm(t.ui.logPeriodConfirm);
    if (confirmed) setStartDate(todayIso());
  }

  function markOnboarded() {
    try {
      localStorage.setItem(LS_ONBOARDED, "true");
    } catch {
      // ignore
    }
    setIsOnboarded(true);
  }

  // ---- Onboarding callbacks ----

  async function handleOnboardingCreate({
    name,
    role: pickedRole,
    questionnaire: answers,
    startDate: pickedStart,
    durations: pickedDurations,
  }) {
    setSyncError("");
    setSyncBusy(true);
    try {
      setMyName(name);
      setRole(pickedRole);
      setQuestionnaire(answers || {});
      setStartDate(pickedStart);
      setDurations(pickedDurations);

      const createPayload = {
        startDate: pickedStart,
        durations: pickedDurations,
        language: lang,
        questionnaire: answers || {},
      };
      if (pickedRole === "woman") createPayload.womanName = name;
      else createPayload.manName = name;

      const { code } = await createSharedCycle(createPayload);
      setSharedCode(code);
      markOnboarded();
    } catch (err) {
      console.error(err);
      const detail = err?.message || String(err);
      setSyncError(`${t.ui.createError} (${detail})`);
    } finally {
      setSyncBusy(false);
    }
  }

  function handleOnboardingSolo({
    name,
    role: pickedRole,
    questionnaire: answers,
    startDate: pickedStart,
    durations: pickedDurations,
  }) {
    setMyName(name);
    setRole(pickedRole);
    setQuestionnaire(answers || {});
    setStartDate(pickedStart);
    setDurations(pickedDurations);
    markOnboarded();
  }

  async function handleOnboardingJoin({
    name,
    role: pickedRole,
    questionnaire: answers,
    row,
  }) {
    // We're joining an existing cycle — pull what the other side already
    // set. Then push our own name + role so they see us on their side too.
    setMyName(name);
    setRole(pickedRole);
    // Don't overwrite synced questionnaire with an empty one.
    if (answers && Object.keys(answers).length > 0) {
      setQuestionnaire(answers);
    }
    ignoreNextRemoteUpdate.current = true;
    applyRemoteRow(row);
    setSharedCode(row.code);
    markOnboarded();

    // Push our name to the row so the other side sees us.
    const patch = {};
    if (pickedRole === "woman") patch.woman_name = name;
    else patch.man_name = name;
    if (Object.keys(patch).length) {
      try {
        ignoreNextRemoteUpdate.current = true;
        await updateSharedCycle(row.code, patch);
      } catch (err) {
        console.error("Update post-join failed:", err);
      }
    }
  }

  // ---- Settings actions ----

  function requestDisconnect() {
    setShowDisconnectModal(true);
  }

  function confirmDisconnect() {
    setShowDisconnectModal(false);
    setSharedCode(null);
    setPartnerName("");
  }

  async function handleJoinFromSettings(row) {
    setShowJoinOverlay(false);
    ignoreNextRemoteUpdate.current = true;
    applyRemoteRow(row);
    setSharedCode(row.code);

    // Push our name to the row so the other side sees us.
    const patch = {};
    if (role === "woman" && myName) patch.woman_name = myName;
    else if (role === "man" && myName) patch.man_name = myName;
    if (Object.keys(patch).length) {
      try {
        ignoreNextRemoteUpdate.current = true;
        await updateSharedCycle(row.code, patch);
      } catch (err) {
        console.error("Update post-join failed:", err);
      }
    }
  }

  async function handleEnableSharingFromSettings() {
    setSyncBusy(true);
    try {
      const payload = {
        startDate,
        durations,
        language: lang,
        questionnaire: questionnaire || {},
      };
      if (role === "woman") payload.womanName = myName || undefined;
      else payload.manName = myName || undefined;

      const { code } = await createSharedCycle(payload);
      setSharedCode(code);
    } catch (err) {
      console.error(err);
      const detail = err?.message || String(err);
      window.alert(`${t.ui.createError}\n\n${detail}`);
    } finally {
      setSyncBusy(false);
    }
  }

  // ---- Questionnaire edit ----

  function handleQuestionnaireSave(newAnswers) {
    setQuestionnaire(newAnswers || {});
    setShowQuestEditor(false);
  }

  // ------------- Render: onboarding -------------

  if (!isOnboarded) {
    return (
      <>
        <StepOnboarding
          onCompleteCreate={handleOnboardingCreate}
          onCompleteSolo={handleOnboardingSolo}
          onCompleteJoin={handleOnboardingJoin}
          busy={syncBusy}
          serverError={syncError}
          onClearError={() => setSyncError("")}
        />
        {syncBusy && (
          <div className="sync-busy-overlay">
            <div className="sync-busy-box">{t.ui.createLoading}</div>
          </div>
        )}
      </>
    );
  }

  // ------------- Render: main dashboard -------------

  const appClass = `tracker-page role-${role}`;

  return (
    <div className={appClass}>
      <div className="tracker-header">
        <div className="tracker-spacer" />

        <div className="tracker-title-wrap">
          <h1 className="tracker-title">{t.ui.appTitle}</h1>
          <p className="tracker-subtitle">{t.ui.appSubtitle}</p>
          {shareBadgeText && (
            <div className="tracker-share-badge" title={sharedCode}>
              {shareBadgeText}
            </div>
          )}
        </div>

        <div className="tracker-header-actions">
          <button
            className={`gear-btn ${showSettings ? "open" : ""}`}
            onClick={() => setShowSettings((prev) => !prev)}
            aria-label={t.ui.settingsOpenAria}
            title={t.ui.settingsTitle}
          >
            <span style={{ fontSize: "18px", lineHeight: 1 }}>⚙</span>
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <div className="settings-top-label">
            {t.ui.settingsSectionLabel}
          </div>

          <SettingsBody
            startDate={startDate}
            setStartDate={setStartDate}
            durations={durations}
            updateDuration={updateDuration}
            resetDurations={resetDurations}
            logPeriodToday={logPeriodToday}
            totalDays={totalDays}
            showShare
            showLogPeriod={role === "woman"}
            sharedCode={sharedCode}
            onEnableSharing={
              isSupabaseConfigured && !sharedCode
                ? handleEnableSharingFromSettings
                : null
            }
            onJoinSharing={
              isSupabaseConfigured && !sharedCode
                ? () => setShowJoinOverlay(true)
                : null
            }
            onDisconnectSharing={sharedCode ? requestDisconnect : null}
            role={role}
            myName={myName}
            setMyName={setMyName}
            onEditQuestionnaire={
              role === "woman" ? () => setShowQuestEditor(true) : null
            }
          />

          {syncBusy && (
            <div className="sync-inline-msg">{t.ui.createLoading}</div>
          )}
        </div>
      )}

      {role === "man" ? (
        <ManView
          phases={phases}
          currentPhase={currentPhase}
          currentDay={currentDay}
          totalDays={totalDays}
          daysUntilPeriod={daysUntilPeriod}
          durations={durations}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          name={myName}
          partnerName={partnerName}
        />
      ) : (
        <WomanView
          phases={phases}
          currentPhase={currentPhase}
          currentDay={currentDay}
          totalDays={totalDays}
          daysUntilPeriod={daysUntilPeriod}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          durations={durations}
        />
      )}

      <div className="footer-note">
        <p>
          {t.ui.footerLine1}
          <br />
          {t.ui.footerLine2}
        </p>
      </div>

      {showDisconnectModal && (
        <DisconnectModal
          partnerName={partnerName}
          onCancel={() => setShowDisconnectModal(false)}
          onConfirm={confirmDisconnect}
        />
      )}

      {showJoinOverlay && (
        <div className="fullscreen-overlay">
          <JoinCycle
            onJoined={handleJoinFromSettings}
            onBack={() => setShowJoinOverlay(false)}
          />
        </div>
      )}

      {showQuestEditor && (
        <QuestionnaireEditor
          initialAnswers={questionnaire}
          onSave={handleQuestionnaireSave}
          onClose={() => setShowQuestEditor(false)}
        />
      )}
    </div>
  );
}
