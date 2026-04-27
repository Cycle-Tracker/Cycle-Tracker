import { useState } from "react";
import { useLanguage, LOCALE_LIST } from "../i18n";
import { signIn, signUp } from "../lib/auth";

/**
 * Login + signup screen, shown before the regular onboarding flow.
 * Includes a language picker (since the user may land here in their
 * browser-detected language but want to switch).
 *
 * Props:
 *  - onAuthed(session)  — called after a successful login/signup
 *  - onSkip()           — called when the user picks "continue without account"
 */
export default function AuthScreen({ onAuthed, onSkip }) {
  const { t, lang, setLang } = useLanguage();

  const [mode, setMode] = useState("signIn"); // "signIn" | "signUp"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Translate Supabase errors into something friendly.
  function friendlyError(err) {
    const msg = (err?.message || "").toLowerCase();
    if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
      return t.ui.authErrorInvalidCredentials;
    }
    if (msg.includes("already registered") || msg.includes("already exists")) {
      return t.ui.authErrorEmailExists;
    }
    if (msg.includes("password") && msg.includes("6")) {
      return t.ui.authErrorWeakPassword;
    }
    if (msg.includes("invalid email") || msg.includes("not a valid email")) {
      return t.ui.authErrorInvalidEmail;
    }
    if (msg.includes("network") || msg.includes("fetch")) {
      return t.ui.authErrorNetwork;
    }
    return err?.message || t.ui.authErrorGeneric;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t.ui.authErrorInvalidEmail);
      return;
    }
    if (mode === "signUp" && password.length < 6) {
      setError(t.ui.authErrorWeakPassword);
      return;
    }

    setLoading(true);
    try {
      const fn = mode === "signIn" ? signIn : signUp;
      const { session } = await fn({ email: trimmedEmail, password });
      // For signUp without email confirmation, session is returned directly.
      // For signIn, session is also returned.
      if (session) {
        onAuthed(session);
      } else {
        // Edge case: sign-up succeeded but no session (would happen if
        // "Confirm email" is enabled). Treat as a soft success and let the
        // user log in.
        setMode("signIn");
        setError("");
      }
    } catch (err) {
      console.error("Auth failed:", err);
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  const submitLabel =
    mode === "signIn" ? t.ui.authSignInButton : t.ui.authSignUpButton;

  return (
    <div className="onboarding-page auth-page">
      <div className="onboarding-hero">
        <div className="onboarding-emoji" aria-hidden>
          💫
        </div>
        <h1 className="onboarding-title">{t.ui.authTitle}</h1>
        <p className="onboarding-subtitle">{t.ui.authSubtitle}</p>
      </div>

      <div className="onboarding-card auth-card">
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${mode === "signIn" ? "active" : ""}`}
            onClick={() => {
              setMode("signIn");
              setError("");
            }}
          >
            {t.ui.authTabSignIn}
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === "signUp" ? "active" : ""}`}
            onClick={() => {
              setMode("signUp");
              setError("");
            }}
          >
            {t.ui.authTabSignUp}
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="section-label">{t.ui.authEmailLabel}</label>
          <input
            type="email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.ui.authEmailPlaceholder}
            autoComplete="email"
            spellCheck={false}
            disabled={loading}
            required
          />

          <label className="section-label">{t.ui.authPasswordLabel}</label>
          <input
            type="password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.ui.authPasswordPlaceholder}
            autoComplete={
              mode === "signIn" ? "current-password" : "new-password"
            }
            disabled={loading}
            required
            minLength={6}
          />

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="onboarding-start-btn"
            disabled={loading}
          >
            {loading ? t.ui.authLoading : submitLabel}
          </button>
        </form>

        <button
          type="button"
          className="auth-skip-btn"
          onClick={onSkip}
          disabled={loading}
        >
          {t.ui.authSkipButton}
        </button>
      </div>

      {/* Language picker (small, bottom of the screen) */}
      <div className="auth-lang-row">
        {LOCALE_LIST.map((locale) => {
          const active = locale.code === lang;
          return (
            <button
              key={locale.code}
              type="button"
              className={`auth-lang-btn ${active ? "active" : ""}`}
              onClick={() => setLang(locale.code)}
              aria-pressed={active}
            >
              <span aria-hidden>{locale.flag}</span>
              <span>{locale.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
