import { useMemo, useState } from "react";
import { LOCALE_LIST, useLanguage } from "../i18n";
import { PHASE_META } from "../data/phaseMeta";
import { QUESTIONS } from "../data/questionnaire";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  fetchSharedCycle,
  isValidCodeShape,
  normalizeCode,
} from "../lib/cycleSync";

/**
 * Multi-step onboarding orchestrator.
 *
 * Flow:
 *   1. Language
 *   2. Name
 *   3. Role (woman / man)
 *   4. Questionnaire (only if role === "woman")
 *   5. Partner choice (create / join / solo)
 *   6a. Cycle dates            (if "create" or "solo")
 *   6b. Join code              (if "join")
 *
 * On completion, calls one of:
 *   onCompleteSolo({ name, role, questionnaire, startDate, durations })
 *   onCompleteCreate({ name, role, questionnaire, startDate, durations })
 *   onCompleteJoin({ name, role, questionnaire, row })
 *
 * The parent decides what to persist and whether to talk to Supabase.
 */

const DEFAULT_DURATIONS = PHASE_META.map((m) => m.defaultDays);

function getDefaultStartDate() {
  const d = new Date();
  d.setDate(d.getDate() - 3);
  return d.toISOString().split("T")[0];
}

// Steps as constants — keeps it readable.
const S_LANG = "lang";
const S_NAME = "name";
const S_ROLE = "role";
const S_QUEST = "quest";
const S_SHARE = "share";
const S_CYCLE = "cycle";
const S_JOIN = "join";

export default function StepOnboarding({
  onCompleteSolo,
  onCompleteCreate,
  onCompleteJoin,
  busy = false,
  serverError = "",
  onClearError,
}) {
  const { t, lang, setLang } = useLanguage();

  // Form state
  const [name, setName] = useState("");
  const [role, setRole] = useState(null); // "woman" | "man"
  const [answers, setAnswers] = useState({}); // { questionId: value }
  const [questIndex, setQuestIndex] = useState(0);

  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [durations, setDurations] = useState(DEFAULT_DURATIONS);

  const [code, setCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);

  // Step sequence depends on role.
  // - woman: lang → name → role → quest → share → (cycle | join)
  // - man:   lang → name → role → share → (cycle | join)
  // - partner choice (share) is either CYCLE or JOIN as next.
  const [step, setStep] = useState(S_LANG);
  const [shareIntent, setShareIntent] = useState(null); // "create" | "join" | "solo"

  // Derived: which question are we on (if any)
  const currentQuestion = QUESTIONS[questIndex] ?? null;

  // Progress indicator (not super precise, just a feel-good count)
  const { stepIndex, stepTotal } = useMemo(() => {
    const order = buildStepOrder(role);
    const idx = order.indexOf(step);
    return { stepIndex: idx + 1, stepTotal: order.length };
  }, [role, step]);

  function buildStepOrder(r) {
    // We don't know the final step (cycle vs join) until shareIntent is picked,
    // but for the counter it's fine to treat either as the same slot.
    if (r === "woman") {
      return [S_LANG, S_NAME, S_ROLE, S_QUEST, S_SHARE, S_CYCLE];
    }
    return [S_LANG, S_NAME, S_ROLE, S_SHARE, S_CYCLE];
  }

  // ------- Navigation -------

  function goNextFromLang() {
    setStep(S_NAME);
  }

  function goNextFromName() {
    setStep(S_ROLE);
  }

  function pickRole(r) {
    setRole(r);
    // If woman, go to questionnaire. If man, skip to share.
    setStep(r === "woman" ? S_QUEST : S_SHARE);
  }

  function pickOption(questionId, value) {
    const next = { ...answers, [questionId]: value };
    setAnswers(next);
    // Auto-advance to next question (or leave questionnaire if this was the last)
    if (questIndex + 1 < QUESTIONS.length) {
      setQuestIndex(questIndex + 1);
    } else {
      setStep(S_SHARE);
    }
  }

  function skipQuestionnaire() {
    setStep(S_SHARE);
  }

  function goBack() {
    if (onClearError) onClearError();
    setJoinError("");

    if (step === S_JOIN) {
      setStep(S_SHARE);
      return;
    }
    if (step === S_CYCLE) {
      setStep(S_SHARE);
      return;
    }
    if (step === S_SHARE) {
      if (role === "woman") {
        setStep(S_QUEST);
      } else {
        setStep(S_ROLE);
      }
      return;
    }
    if (step === S_QUEST) {
      if (questIndex > 0) {
        setQuestIndex(questIndex - 1);
      } else {
        setStep(S_ROLE);
      }
      return;
    }
    if (step === S_ROLE) {
      setStep(S_NAME);
      return;
    }
    if (step === S_NAME) {
      setStep(S_LANG);
      return;
    }
  }

  function pickShareIntent(intent) {
    setShareIntent(intent);
    if (intent === "join") {
      setStep(S_JOIN);
    } else {
      setStep(S_CYCLE);
    }
  }

  function updateDuration(index, value) {
    const next = [...durations];
    next[index] = value;
    setDurations(next);
  }

  async function submitJoin(e) {
    e.preventDefault();
    const normalized = normalizeCode(code);
    if (!isValidCodeShape(normalized)) {
      setJoinError(t.ui.joinErrorInvalid);
      return;
    }
    setJoinError("");
    setJoining(true);
    try {
      const row = await fetchSharedCycle(normalized);
      if (!row) {
        setJoinError(t.ui.joinErrorNotFound);
        setJoining(false);
        return;
      }
      onCompleteJoin({
        name: name.trim(),
        role,
        questionnaire: answers,
        row,
      });
    } catch (err) {
      console.error("Join failed:", err);
      setJoinError(t.ui.joinErrorNetwork);
      setJoining(false);
    }
  }

  function submitFinal() {
    const payload = {
      name: name.trim(),
      role,
      questionnaire: answers,
      startDate,
      durations,
    };
    if (shareIntent === "create") {
      onCompleteCreate(payload);
    } else {
      onCompleteSolo(payload);
    }
  }

  // ------- Render helpers -------

  function renderHeader(title, subtitle, emoji) {
    return (
      <div className="onboarding-hero step-hero">
        <div className="onboarding-emoji" aria-hidden>
          {emoji}
        </div>
        <h1 className="onboarding-title">{title}</h1>
        {subtitle && <p className="onboarding-subtitle">{subtitle}</p>}
        {stepTotal > 0 && (
          <div className="step-progress">
            {t.ui.stepProgress(stepIndex, stepTotal)}
          </div>
        )}
      </div>
    );
  }

  function renderBackButton() {
    return (
      <button type="button" className="step-back-btn" onClick={goBack}>
        {t.ui.stepPrev}
      </button>
    );
  }

  // ------- Step: language -------

  if (step === S_LANG) {
    return (
      <div className="onboarding-page step-page">
        {renderHeader(t.ui.stepLangTitle, t.ui.stepLangSubtitle, "🌸")}

        <div className="onboarding-card">
          <div className="settings-lang-grid onboarding-lang-grid">
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

          <button
            type="button"
            className="onboarding-start-btn step-next-btn"
            onClick={goNextFromLang}
          >
            {t.ui.stepNext}
          </button>
        </div>
      </div>
    );
  }

  // ------- Step: name -------

  if (step === S_NAME) {
    return (
      <div className="onboarding-page step-page">
        {renderHeader(t.ui.stepNameTitle, t.ui.stepNameSubtitle, "✨")}

        <div className="onboarding-card">
          <input
            type="text"
            className="step-name-input"
            placeholder={t.ui.stepNamePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={40}
          />

          <button
            type="button"
            className="onboarding-start-btn step-next-btn"
            onClick={goNextFromName}
          >
            {t.ui.stepNext}
          </button>

          {renderBackButton()}
        </div>
      </div>
    );
  }

  // ------- Step: role -------

  if (step === S_ROLE) {
    return (
      <div className="onboarding-page step-page">
        {renderHeader(t.ui.stepRoleTitle, t.ui.stepRoleSubtitle, "🫶")}

        <div className="onboarding-card">
          <div className="choice-list">
            <button
              type="button"
              className="choice-option choice-primary"
              onClick={() => pickRole("woman")}
            >
              <div className="choice-option-emoji">🌸</div>
              <div className="choice-option-body">
                <div className="choice-option-title">{t.ui.roleWoman}</div>
                <div className="choice-option-desc">{t.ui.roleWomanDesc}</div>
              </div>
              <div className="choice-option-arrow">→</div>
            </button>

            <button
              type="button"
              className="choice-option"
              onClick={() => pickRole("man")}
            >
              <div className="choice-option-emoji">💙</div>
              <div className="choice-option-body">
                <div className="choice-option-title">{t.ui.roleMan}</div>
                <div className="choice-option-desc">{t.ui.roleManDesc}</div>
              </div>
              <div className="choice-option-arrow">→</div>
            </button>
          </div>

          {renderBackButton()}
        </div>
      </div>
    );
  }

  // ------- Step: questionnaire (woman only) -------

  if (step === S_QUEST && currentQuestion) {
    const qText = t.questionnaire.questions[currentQuestion.i18nKey];
    return (
      <div className="onboarding-page step-page">
        {renderHeader(t.ui.stepQuestTitle, t.ui.stepQuestSubtitle, "💭")}

        <div className="onboarding-card">
          <div className="quest-counter">
            {t.questionnaire.questionCounter(
              questIndex + 1,
              QUESTIONS.length
            )}
          </div>
          <h3 className="quest-question">{qText}</h3>

          <div className="quest-options">
            {currentQuestion.options.map((opt) => {
              const selected =
                answers[currentQuestion.id] === opt.value;
              const label = t.questionnaire.options[opt.i18nKey];
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`quest-option-btn ${
                    selected ? "selected" : ""
                  }`}
                  onClick={() => pickOption(currentQuestion.id, opt.value)}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="step-skip-btn"
            onClick={skipQuestionnaire}
          >
            {t.ui.stepSkip}
          </button>

          {renderBackButton()}
        </div>
      </div>
    );
  }

  // ------- Step: share -------

  if (step === S_SHARE) {
    const supaOk = isSupabaseConfigured;
    return (
      <div className="onboarding-page step-page">
        {renderHeader(t.ui.stepShareTitle, t.ui.stepShareSubtitle, "💞")}

        <div className="onboarding-card">
          <div className="choice-list">
            {supaOk && (
              <button
                type="button"
                className="choice-option choice-primary"
                onClick={() => pickShareIntent("create")}
              >
                <div className="choice-option-emoji">💌</div>
                <div className="choice-option-body">
                  <div className="choice-option-title">
                    {t.ui.choiceCreateTitle}
                  </div>
                  <div className="choice-option-desc">
                    {t.ui.choiceCreateDesc}
                  </div>
                </div>
                <div className="choice-option-arrow">→</div>
              </button>
            )}

            {supaOk && (
              <button
                type="button"
                className="choice-option"
                onClick={() => pickShareIntent("join")}
              >
                <div className="choice-option-emoji">🔑</div>
                <div className="choice-option-body">
                  <div className="choice-option-title">
                    {t.ui.choiceJoinTitle}
                  </div>
                  <div className="choice-option-desc">
                    {t.ui.choiceJoinDesc}
                  </div>
                </div>
                <div className="choice-option-arrow">→</div>
              </button>
            )}

            <button
              type="button"
              className="choice-option choice-subtle"
              onClick={() => pickShareIntent("solo")}
            >
              <div className="choice-option-emoji">🌿</div>
              <div className="choice-option-body">
                <div className="choice-option-title">
                  {t.ui.choiceSoloTitle}
                </div>
                <div className="choice-option-desc">
                  {t.ui.choiceSoloDesc}
                </div>
              </div>
              <div className="choice-option-arrow">→</div>
            </button>
          </div>

          {renderBackButton()}
        </div>
      </div>
    );
  }

  // ------- Step: cycle dates + durations -------

  if (step === S_CYCLE) {
    const totalDays = durations.reduce((a, b) => a + b, 0);
    const cycleTitle =
      role === "man"
        ? t.ui.stepCycleTitleMan ?? t.ui.stepCycleTitle
        : t.ui.stepCycleTitle;
    const cycleSubtitle =
      role === "man"
        ? t.ui.stepCycleSubtitleMan ?? t.ui.stepCycleSubtitle
        : t.ui.stepCycleSubtitle;
    return (
      <div className="onboarding-page step-page">
        {renderHeader(cycleTitle, cycleSubtitle, "📅")}

        <div className="onboarding-card step-cycle-card">
          <div className="settings-row">
            <label className="section-label">{t.ui.startDateLabel}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="settings-total">
            {t.ui.totalCycleLabel}{" "}
            <span>
              {totalDays} {t.ui.daysUnit}
            </span>
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
              </div>
            );
          })}

          <button
            type="button"
            className="onboarding-start-btn step-next-btn"
            onClick={submitFinal}
            disabled={busy}
          >
            {busy ? t.ui.createLoading : t.ui.stepFinish}
          </button>

          {serverError && <div className="join-error">{serverError}</div>}

          {renderBackButton()}
        </div>
      </div>
    );
  }

  // ------- Step: join code -------

  if (step === S_JOIN) {
    return (
      <div className="onboarding-page step-page">
        {renderHeader(t.ui.stepJoinTitle, t.ui.stepJoinSubtitle, "🔑")}

        <form className="onboarding-card join-form" onSubmit={submitJoin}>
          <input
            type="text"
            className="join-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t.ui.joinPlaceholder}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            disabled={joining}
            autoFocus
          />

          {joinError && <div className="join-error">{joinError}</div>}

          <button
            type="submit"
            className="onboarding-start-btn step-next-btn"
            disabled={joining}
          >
            {joining ? t.ui.joinLoading : t.ui.joinButton}
          </button>

          {renderBackButton()}
        </form>
      </div>
    );
  }

  // Safety net — shouldn't happen.
  return null;
}
