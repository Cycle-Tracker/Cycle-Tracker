import { useMemo, useState } from "react";
import { useLanguage } from "../i18n";
import { todayIso, normalizeDate } from "../utils/cycleUtils";

const MOOD_OPTIONS = [
  { id: "happy", emoji: "😊" },
  { id: "calm", emoji: "🌷" },
  { id: "tired", emoji: "😴" },
  { id: "sad", emoji: "🥺" },
  { id: "stressed", emoji: "😣" },
  { id: "love", emoji: "💖" },
];

/**
 * Shared journal page. Both partners can read all entries; each can only
 * edit/delete their own.
 *
 * Props:
 *  - entries: array of entries
 *      { id, author, role, date, mood, energy, note, created_at }
 *  - role: current user's role
 *  - myName: current user's name
 *  - partnerName: partner's name
 *  - onAdd(entry) — push a new entry
 *  - onUpdate(id, patch)
 *  - onDelete(id)
 */
export default function JournalPage({
  entries = [],
  role,
  myName,
  partnerName,
  onAdd,
  onUpdate,
  onDelete,
}) {
  const { t, lang } = useLanguage();
  const [editing, setEditing] = useState(null); // entry being edited or "new"
  const [draft, setDraft] = useState(emptyDraft());

  function emptyDraft() {
    return {
      date: todayIso(),
      mood: "calm",
      energy: 3,
      note: "",
    };
  }

  function startNew() {
    setDraft(emptyDraft());
    setEditing("new");
  }

  function startEdit(entry) {
    setDraft({
      date: entry.date,
      mood: entry.mood || "calm",
      energy: entry.energy ?? 3,
      note: entry.note || "",
    });
    setEditing(entry.id);
  }

  function cancel() {
    setEditing(null);
  }

  function save() {
    if (editing === "new") {
      onAdd({
        ...draft,
        author: myName || "",
        role,
      });
    } else {
      onUpdate(editing, draft);
    }
    setEditing(null);
  }

  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [entries]);

  return (
    <div className="page-shell journal-page">
      <div className="page-header-simple">
        <h1 className="page-title">{t.ui.tabJournal}</h1>
      </div>

      <div className="page-body">
        {!editing && (
          <>
            <p className="page-help">{t.ui.journalPageHelp}</p>
            <button
              type="button"
              className="journal-add-btn"
              onClick={startNew}
            >
              ＋ {t.ui.journalAdd}
            </button>

            {sorted.length === 0 ? (
              <div className="coming-soon-card" style={{ marginTop: 18 }}>
                <div className="coming-soon-icon" aria-hidden="true">
                  📔
                </div>
                <div className="coming-soon-title">
                  {t.ui.journalEmptyTitle}
                </div>
                <p className="coming-soon-body">{t.ui.journalEmptyBody}</p>
              </div>
            ) : (
              <ul className="journal-list">
                {sorted.map((entry) => (
                  <JournalItem
                    key={entry.id}
                    entry={entry}
                    isMine={entry.role === role}
                    myName={myName}
                    partnerName={partnerName}
                    lang={lang}
                    t={t}
                    onEdit={() => startEdit(entry)}
                    onDelete={() => {
                      if (window.confirm(t.ui.journalDeleteConfirm)) {
                        onDelete(entry.id);
                      }
                    }}
                  />
                ))}
              </ul>
            )}
          </>
        )}

        {editing && (
          <JournalEditor
            draft={draft}
            setDraft={setDraft}
            onSave={save}
            onCancel={cancel}
            t={t}
            isNew={editing === "new"}
          />
        )}
      </div>
    </div>
  );
}

function JournalItem({
  entry,
  isMine,
  myName,
  partnerName,
  lang,
  t,
  onEdit,
  onDelete,
}) {
  const dateLabel = formatDate(entry.date, lang);
  const mood = MOOD_OPTIONS.find((m) => m.id === entry.mood);
  const authorName = isMine
    ? myName || t.ui.journalAuthorMe
    : entry.author || partnerName || t.ui.partnerFallback;

  return (
    <li className={`journal-item ${isMine ? "mine" : "partner"}`}>
      <div className="journal-item-head">
        <span className="journal-item-emoji" aria-hidden="true">
          {mood?.emoji || "🌷"}
        </span>
        <div className="journal-item-meta">
          <div className="journal-item-author">{authorName}</div>
          <div className="journal-item-date">{dateLabel}</div>
        </div>
        <div className="journal-item-energy" title={t.ui.energyLabel}>
          {"●".repeat(Math.max(0, Math.min(5, entry.energy ?? 0)))}
          <span className="journal-item-energy-rest">
            {"○".repeat(Math.max(0, 5 - (entry.energy ?? 0)))}
          </span>
        </div>
      </div>

      {entry.note && <p className="journal-item-note">{entry.note}</p>}

      {isMine && (
        <div className="journal-item-actions">
          <button type="button" className="journal-edit-btn" onClick={onEdit}>
            {t.ui.journalEdit}
          </button>
          <button
            type="button"
            className="journal-delete-btn"
            onClick={onDelete}
          >
            {t.ui.journalDelete}
          </button>
        </div>
      )}
    </li>
  );
}

function JournalEditor({ draft, setDraft, onSave, onCancel, t, isNew }) {
  return (
    <div className="journal-editor">
      <h2 className="journal-editor-title">
        {isNew ? t.ui.journalAddTitle : t.ui.journalEditTitle}
      </h2>

      <label className="journal-field">
        <span className="journal-field-label">{t.ui.journalDateLabel}</span>
        <input
          type="date"
          className="journal-input"
          value={draft.date}
          onChange={(e) => setDraft({ ...draft, date: e.target.value })}
        />
      </label>

      <div className="journal-field">
        <span className="journal-field-label">{t.ui.journalMoodLabel}</span>
        <div className="journal-mood-row">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`journal-mood-btn ${
                draft.mood === m.id ? "selected" : ""
              }`}
              onClick={() => setDraft({ ...draft, mood: m.id })}
              aria-label={t.ui[`journalMood_${m.id}`]}
              title={t.ui[`journalMood_${m.id}`]}
            >
              {m.emoji}
            </button>
          ))}
        </div>
      </div>

      <label className="journal-field journal-field-energy">
        <div className="journal-energy-head">
          <span className="journal-field-label">
            {t.ui.journalEnergyLabel}
          </span>
          <span className="journal-range-val">{draft.energy}/5</span>
        </div>
        {(() => {
          const fp = (draft.energy / 5) * 100;
          // Same trick as the duration sliders: align gradient stop with thumb center.
          const fillStop = `calc(${fp}% + ${(11 - 0.22 * fp).toFixed(2)}px)`;
          return (
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              className="journal-range"
              value={draft.energy}
              onChange={(e) =>
                setDraft({ ...draft, energy: Number(e.target.value) })
              }
              style={{
                background: `linear-gradient(to right, #e85a8c 0%, #e85a8c ${fillStop}, rgba(60,60,67,0.12) ${fillStop}, rgba(60,60,67,0.12) 100%)`,
              }}
            />
          );
        })()}
      </label>

      <label className="journal-field">
        <span className="journal-field-label">{t.ui.journalNoteLabel}</span>
        <textarea
          className="journal-textarea"
          rows={4}
          value={draft.note}
          maxLength={500}
          onChange={(e) => setDraft({ ...draft, note: e.target.value })}
          placeholder={t.ui.journalNotePlaceholder}
        />
      </label>

      <div className="journal-editor-actions">
        <button
          type="button"
          className="journal-cancel-btn"
          onClick={onCancel}
        >
          {t.ui.questReEditCancel || "Annuler"}
        </button>
        <button type="button" className="journal-save-btn" onClick={onSave}>
          {t.ui.questReEditSave}
        </button>
      </div>
    </div>
  );
}

function formatDate(iso, lang) {
  const d = normalizeDate(iso);
  return new Intl.DateTimeFormat(lang, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}
