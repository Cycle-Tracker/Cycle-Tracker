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
import AuthScreen from "./components/AuthScreen";
import InstallPrompt from "./components/InstallPrompt";
import NotifPrompt from "./components/NotifPrompt";
import BottomNav from "./components/BottomNav";
import CalendarPage from "./components/CalendarPage";
import JournalPage from "./components/JournalPage";
import HistoryPage from "./components/HistoryPage";
import { computeNotifications } from "./utils/notifications";
import { fireNewNotifications } from "./utils/browserNotifications";
import { useLanguage } from "./i18n";
import { isSupabaseConfigured } from "./lib/supabase";
import {
  createSharedCycle,
  fetchSharedCycle,
  subscribeToCycle,
  updateSharedCycle,
} from "./lib/cycleSync";
import {
  deleteMyAccount,
  findCycleForUser,
  getSession,
  linkCycleToUser,
  onAuthStateChange,
  signOut,
} from "./lib/auth";

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
const LS_AUTH_SKIPPED = "cycle-auth-skipped";
const LS_JOURNAL_ENTRIES = "cycle-journal-entries";
const LS_PERIODS_LOG = "cycle-periods-log";

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

function getInitialJournalEntries() {
  try {
    const saved = localStorage.getItem(LS_JOURNAL_ENTRIES);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    return [];
  }
  return [];
}

function getInitialPeriodsLog() {
  try {
    const saved = localStorage.getItem(LS_PERIODS_LOG);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed.filter((iso) => typeof iso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(iso));
    }
  } catch {
    return [];
  }
  return [];
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

  // Shared journal + period history (synced via Supabase row when configured)
  const [journalEntries, setJournalEntries] = useState(getInitialJournalEntries);
  const [periodsLog, setPeriodsLog] = useState(getInitialPeriodsLog);

  // UI state
  const [activeTab, setActiveTab] = useState("now");
  // Bottom navigation: "home" | "calendar" | "journal" | "history" | "settings"
  const [mainTab, setMainTab] = useState("home");
  const [showNotifs, setShowNotifs] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(getInitialOnboarded);

  // Auth state
  // - `authReady` becomes true once we've checked the existing session at boot
  // - `session` is the Supabase session (null when logged out)
  // - `authSkipped` is true if the user picked "continue without account"
  //   (persisted across reloads so we don't re-prompt them every time)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [session, setSession] = useState(null);
  const [authSkipped, setAuthSkipped] = useState(
    () => readLS(LS_AUTH_SKIPPED) === "true"
  );

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

  useEffect(() => {
    try {
      localStorage.setItem(LS_JOURNAL_ENTRIES, JSON.stringify(journalEntries));
    } catch {
      // ignore
    }
  }, [journalEntries]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_PERIODS_LOG, JSON.stringify(periodsLog));
    } catch {
      // ignore
    }
  }, [periodsLog]);

  // Persist authSkipped so the user isn't re-prompted on every reload.
  useEffect(() => {
    try {
      if (authSkipped) localStorage.setItem(LS_AUTH_SKIPPED, "true");
      else localStorage.removeItem(LS_AUTH_SKIPPED);
    } catch {
      // ignore
    }
  }, [authSkipped]);

  // ------------- Auth bootstrap & session sync -------------
  // On mount, look up the existing session (returns null if none) and subscribe
  // to auth state changes so signIn/signOut are reactive.
  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    let cancelled = false;
    (async () => {
      const initial = await getSession();
      if (cancelled) return;
      setSession(initial);
      setAuthReady(true);
    })();

    const unsub = onAuthStateChange((next) => {
      setSession(next);
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  // When the user logs in, sync local state to the account:
  //  - If the account has a linked cycle (owner_id or partner_id matches us),
  //    restore from that row (cross-device recovery).
  //  - Else, if local sharedCode points to an *unclaimed* cycle, keep it —
  //    the link-cycle effect below will adopt it. This is the "I used the app
  //    unauth'd, then signed up to save my progress" case.
  //  - Else, the local state is stale (residual from a previous device-level
  //    session, possibly with a wrong role). Reset everything so the user
  //    goes back through onboarding to pick role + create/join cleanly.
  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    (async () => {
      const row = await findCycleForUser(session.user.id);
      if (cancelled) return;

      if (row) {
        // Account has a linked cycle — make local state match it.
        ignoreNextRemoteUpdate.current = true;
        applyRemoteRow(row);
        setSharedCode(row.code);
        if (row.owner_id === session.user.id) setRole("woman");
        else if (row.partner_id === session.user.id) setRole("man");
        if (!isOnboarded) markOnboarded();
        return;
      }

      // No linked cycle. Try to keep local state if (and only if) it points
      // to an unclaimed cycle that the user is about to legitimately adopt.
      if (sharedCode) {
        try {
          const localRow = await fetchSharedCycle(sharedCode);
          if (cancelled) return;
          if (localRow) {
            const slotForRole =
              role === "woman" ? "owner_id" : "partner_id";
            const slotFree = !localRow[slotForRole];
            if (slotFree) {
              // Adoptable — let the link-cycle-to-user effect do the write.
              return;
            }
          }
        } catch (err) {
          console.warn("auto-restore cycle check failed:", err);
        }
      }

      // Stale local state — reset so the user gets a clean onboarding flow.
      try {
        localStorage.removeItem(LS_ONBOARDED);
        localStorage.removeItem(LS_ROLE);
        localStorage.removeItem(LS_MY_NAME);
        localStorage.removeItem(LS_PARTNER_NAME);
        localStorage.removeItem(LS_SHARED_CODE);
        localStorage.removeItem(LS_JOURNAL_ENTRIES);
        localStorage.removeItem(LS_PERIODS_LOG);
      } catch {
        // ignore
      }
      setIsOnboarded(false);
      setRole("woman");
      setMyName("");
      setPartnerName("");
      setSharedCode(null);
      setJournalEntries([]);
      setPeriodsLog([]);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // When the user has a cycle locally + a session, ensure the cycle is linked
  // to their account (idempotent — covers the "logged in after creating" case).
  useEffect(() => {
    if (!session?.user?.id || !sharedCode || !role) return;
    linkCycleToUser({
      code: sharedCode,
      userId: session.user.id,
      role,
    });
  }, [session?.user?.id, sharedCode, role]);

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

      // Journal entries (shared between partners). Only override local state
      // if the server actually provides an array — otherwise keep what we have.
      if (Array.isArray(row.journal_entries)) {
        setJournalEntries(row.journal_entries);
      }

      // Period history log (shared between partners).
      if (Array.isArray(row.periods_log)) {
        setPeriodsLog(
          row.periods_log.filter(
            (iso) => typeof iso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(iso)
          )
        );
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

      // Both partners can edit the journal and history (each can only edit
      // their own entries; merging is done in the client).
      patch.journal_entries = journalEntries;
      patch.periods_log = periodsLog;

      ignoreNextRemoteUpdate.current = true;
      updateSharedCycle(sharedCode, patch).catch((err) => {
        // If the columns don't exist yet (Thomas hasn't run the migration),
        // strip them and retry once silently. The app keeps working locally.
        if (
          err?.message?.includes("journal_entries") ||
          err?.message?.includes("periods_log") ||
          err?.code === "PGRST204"
        ) {
          delete patch.journal_entries;
          delete patch.periods_log;
          updateSharedCycle(sharedCode, patch).catch((err2) => {
            console.error("Push to Supabase failed:", err2);
          });
          return;
        }
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
    journalEntries,
    periodsLog,
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
    if (confirmed) {
      const iso = todayIso();
      setStartDate(iso);
      pushToPeriodsLog(iso);
    }
  }

  // Set the start of the current cycle to a specific date (used by the
  // calendar tap-to-mark flow). Same effect as logPeriodToday but with a
  // chosen date.
  function logPeriodAtDate(iso) {
    if (!iso) return;
    setStartDate(iso);
    pushToPeriodsLog(iso);
  }

  function pushToPeriodsLog(iso) {
    if (!iso) return;
    setPeriodsLog((prev) => {
      const set = new Set(prev || []);
      set.add(iso);
      return Array.from(set).sort();
    });
  }

  // ----- Journal handlers -----

  function makeJournalId() {
    return `j_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  function addJournalEntry(entry) {
    setJournalEntries((prev) => [
      ...prev,
      {
        id: makeJournalId(),
        created_at: new Date().toISOString(),
        ...entry,
      },
    ]);
  }

  function updateJournalEntry(id, patch) {
    setJournalEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  }

  function deleteJournalEntry(id) {
    setJournalEntries((prev) => prev.filter((e) => e.id !== id));
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
      // If the user is logged in, auto-link the new cycle to their account
      if (session?.user?.id) {
        linkCycleToUser({ code, userId: session.user.id, role: pickedRole });
      }
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

    // If the user is logged in, link the cycle to their account too
    if (session?.user?.id) {
      linkCycleToUser({
        code: row.code,
        userId: session.user.id,
        role: pickedRole,
      });
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

    // If the user is logged in, link the cycle to their account too
    if (session?.user?.id) {
      linkCycleToUser({ code: row.code, userId: session.user.id, role });
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
      if (session?.user?.id) {
        linkCycleToUser({ code, userId: session.user.id, role });
      }
    } catch (err) {
      console.error(err);
      const detail = err?.message || String(err);
      window.alert(`${t.ui.createError}\n\n${detail}`);
    } finally {
      setSyncBusy(false);
    }
  }

  // ---- Redo onboarding ----
  // Re-run the launch flow (lang, name, role, questionnaire, partner choice).
  // We DON'T wipe the cycle code or partner data here — the user might just
  // want to fix one answer. Whatever they pick at the end of onboarding will
  // overwrite the relevant pieces (role, name, share code) via the existing
  // onCompleteCreate/onCompleteJoin/onCompleteSolo handlers.
  function handleRedoOnboarding() {
    const message =
      t.ui.redoOnboardingConfirm ??
      "Reprendre le démarrage depuis le début ? Tes informations actuelles seront remplacées.";
    if (!window.confirm(message)) return;
    setMainTab("home");
    try {
      localStorage.removeItem(LS_ONBOARDED);
    } catch {
      // ignore
    }
    setIsOnboarded(false);
  }

  // ---- Auth actions ----

  function handleAuthed(newSession) {
    setSession(newSession);
    setAuthSkipped(false); // they're no longer "skipping"
  }

  function handleAuthSkip() {
    setAuthSkipped(true);
  }

  async function handleSignOut() {
    try {
      await signOut();
    } catch (err) {
      console.error("signOut failed:", err);
    }
    setSession(null);
    // Don't clear local cycle — they may want to keep using it without
    // an account. They can reconnect or disconnect explicitly.
  }

  // Delete the user's account on the server (calls the `delete_user` RPC),
  // then wipe local state and sign out so they land back at the AuthScreen.
  // This requires the SQL function from lib/auth.js to be installed in
  // Supabase — without it the RPC call will fail and we surface the error
  // to the user instead of leaving them in a half-deleted state.
  async function handleDeleteAccount() {
    const confirm1 =
      t.ui.accountDeleteConfirm1 ??
      "Supprimer définitivement ton compte ? Ton cycle restera accessible à ton/ta partenaire, mais ton accès sera supprimé.";
    if (!window.confirm(confirm1)) return;
    const confirm2 =
      t.ui.accountDeleteConfirm2 ??
      "Vraiment ? Cette action est irréversible.";
    if (!window.confirm(confirm2)) return;

    try {
      await deleteMyAccount();
    } catch (err) {
      console.error("deleteMyAccount failed:", err);
      const detail = err?.message || String(err);
      window.alert(
        `${t.ui.accountDeleteError ?? "La suppression a échoué."}\n\n${detail}`
      );
      return;
    }

    // Server-side delete succeeded — make sure the local session is gone too,
    // then wipe local state so the next user (or this user signing up again)
    // starts from scratch.
    try {
      await signOut();
    } catch {
      // ignore — the auth row is gone anyway
    }
    try {
      localStorage.removeItem(LS_ONBOARDED);
      localStorage.removeItem(LS_ROLE);
      localStorage.removeItem(LS_MY_NAME);
      localStorage.removeItem(LS_PARTNER_NAME);
      localStorage.removeItem(LS_SHARED_CODE);
      localStorage.removeItem(LS_AUTH_SKIPPED);
      localStorage.removeItem(LS_JOURNAL_ENTRIES);
      localStorage.removeItem(LS_PERIODS_LOG);
    } catch {
      // ignore
    }
    setSession(null);
    setSharedCode(null);
    setMyName("");
    setPartnerName("");
    setRole("woman");
    setIsOnboarded(false);
    setAuthSkipped(false);
    setJournalEntries([]);
    setPeriodsLog([]);
  }

  // ---- Questionnaire edit ----

  function handleQuestionnaireSave(newAnswers) {
    setQuestionnaire(newAnswers || {});
    setShowQuestEditor(false);
  }

  // ------------- Live notifications -------------
  // Computed BEFORE the early-return render gates so all hooks below
  // (incl. the OS-notifications useEffect) are unconditional.
  const notifications = useMemo(
    () =>
      computeNotifications({
        startDate,
        durations,
        role,
        partnerName,
        myName,
        t,
      }),
    [startDate, durations, role, partnerName, myName, t]
  );
  const activeNotifCount = notifications.filter((n) => n.id !== "calm").length;

  // Fire OS-level notifications whenever the derived array changes.
  // No-op unless the user has toggled the feature on AND granted permission.
  // fireNewNotifications dedupes per-id-per-day internally.
  useEffect(() => {
    if (!isOnboarded) return;
    fireNewNotifications(notifications);
  }, [notifications, isOnboarded]);

  // ------------- Render: auth gate -------------
  // If Supabase is configured, we want users to log in (or explicitly skip)
  // before they see the rest of the app. This:
  //  - lets us link cycles to accounts so a user can recover their cycle on
  //    another device just by logging in
  //  - is non-blocking: users can pick "continue without account" and that
  //    choice is remembered across reloads.
  //
  // While we're checking the existing session, render nothing to avoid a
  // flash of the auth screen for already-logged-in users.
  if (isSupabaseConfigured && !authReady) {
    return <div className="tracker-page" aria-hidden />;
  }
  if (isSupabaseConfigured && !session && !authSkipped) {
    return (
      <AuthScreen onAuthed={handleAuthed} onSkip={handleAuthSkip} />
    );
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

  // ----- Tab content blocks -----

  const homePage = (
    <>
      <InstallPrompt />
      <NotifPrompt />
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
            type="button"
            className="bell-btn"
            onClick={() => setShowNotifs(true)}
            aria-label={t.ui.notifsAria}
            title={t.ui.notifsTitle}
          >
            <span style={{ fontSize: "18px", lineHeight: 1 }}>🔔</span>
            {activeNotifCount > 0 && (
              <span className="bell-badge" aria-hidden="true">
                {activeNotifCount}
              </span>
            )}
          </button>
        </div>
      </div>

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
    </>
  );

  const settingsPage = (
    <div className="page-shell settings-page">
      <div className="page-header-simple">
        <h1 className="page-title">{t.ui.settingsTitle}</h1>
      </div>

      <div className="page-body">
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
          session={session}
          onSignOut={isSupabaseConfigured ? handleSignOut : null}
          onSignIn={
            isSupabaseConfigured && !session
              ? () => setAuthSkipped(false)
              : null
          }
          onDeleteAccount={
            isSupabaseConfigured && session ? handleDeleteAccount : null
          }
          onRedoOnboarding={handleRedoOnboarding}
        />

        {syncBusy && (
          <div className="sync-inline-msg">{t.ui.createLoading}</div>
        )}
      </div>
    </div>
  );

  let currentPage;
  if (mainTab === "calendar") {
    currentPage = (
      <CalendarPage
        startDate={startDate}
        durations={durations}
        role={role}
        onLogPeriodStart={logPeriodAtDate}
      />
    );
  } else if (mainTab === "journal") {
    currentPage = (
      <JournalPage
        entries={journalEntries}
        role={role}
        myName={myName}
        partnerName={partnerName}
        onAdd={addJournalEntry}
        onUpdate={updateJournalEntry}
        onDelete={deleteJournalEntry}
      />
    );
  } else if (mainTab === "history") {
    currentPage = (
      <HistoryPage
        periodsLog={periodsLog}
        currentStartDate={startDate}
        durations={durations}
      />
    );
  } else if (mainTab === "settings") {
    currentPage = settingsPage;
  } else {
    currentPage = homePage;
  }

  return (
    <div className={`${appClass} has-bottom-nav`}>
      {currentPage}

      <BottomNav active={mainTab} onSelect={setMainTab} />

      {showNotifs && (
        <div
          className="notifs-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowNotifs(false)}
        >
          <div className="notifs-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="notifs-header">
              <h2 className="notifs-title">{t.ui.notifsTitle}</h2>
              <button
                type="button"
                className="notifs-close"
                onClick={() => setShowNotifs(false)}
                aria-label={t.ui.notifsClose}
              >
                ×
              </button>
            </div>
            <div className="notifs-body">
              {notifications.length === 0 ? (
                <div className="notifs-empty">
                  <div className="notifs-empty-icon" aria-hidden="true">
                    🔕
                  </div>
                  <p>{t.ui.notifsEmpty}</p>
                </div>
              ) : (
                <ul className="notifs-list">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className={`notif-item severity-${n.severity}`}
                    >
                      <span className="notif-icon" aria-hidden="true">
                        {n.icon}
                      </span>
                      <div className="notif-text">
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-body">{n.body}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

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
