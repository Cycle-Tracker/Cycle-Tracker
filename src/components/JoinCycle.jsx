import { useState } from "react";
import { useLanguage } from "../i18n";
import {
  fetchSharedCycle,
  isValidCodeShape,
  normalizeCode,
} from "../lib/cycleSync";

/**
 * Screen where the user types a code to join an existing shared cycle.
 * On success, calls onJoined(row) with the row from Supabase.
 */
export default function JoinCycle({ onJoined, onBack }) {
  const { t } = useLanguage();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin(e) {
    e.preventDefault();
    const normalized = normalizeCode(code);

    if (!isValidCodeShape(normalized)) {
      setError(t.ui.joinErrorInvalid);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const row = await fetchSharedCycle(normalized);
      if (!row) {
        setError(t.ui.joinErrorNotFound);
        setLoading(false);
        return;
      }
      onJoined(row);
    } catch (err) {
      console.error("Join failed:", err);
      setError(t.ui.joinErrorNetwork);
      setLoading(false);
    }
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-hero">
        <div className="onboarding-emoji" aria-hidden>
          🔑
        </div>
        <h1 className="onboarding-title">{t.ui.joinTitle}</h1>
        <p className="onboarding-subtitle">{t.ui.joinSubtitle}</p>
      </div>

      <form className="onboarding-card join-form" onSubmit={handleJoin}>
        <input
          type="text"
          className="join-input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t.ui.joinPlaceholder}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          disabled={loading}
        />

        {error && <div className="join-error">{error}</div>}

        <button
          type="submit"
          className="onboarding-start-btn"
          disabled={loading}
        >
          {loading ? t.ui.joinLoading : t.ui.joinButton}
        </button>

        <button
          type="button"
          className="join-back-btn"
          onClick={onBack}
          disabled={loading}
        >
          {t.ui.joinBack}
        </button>
      </form>
    </div>
  );
}
