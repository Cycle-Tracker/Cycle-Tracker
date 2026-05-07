import { Component } from "react";

/**
 * Top-level error boundary.
 *
 * If anything in the React tree throws during render or in a lifecycle hook,
 * we replace the entire UI with a friendly recovery page that walks the user
 * through the most likely fix on iOS PWAs: clear the site data and re-install
 * the home-screen app.
 *
 * This is intentionally self-contained: no i18n, no MUI, no CSS variables —
 * just inline styles. That way it still renders even if the i18n context or
 * the global stylesheet is what crashed.
 */
export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("App crashed:", error, info);
  }

  reload = () => {
    try {
      // Best-effort: unregister all service workers so a stale SW can't keep
      // serving the broken bundle.
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => Promise.all(regs.map((r) => r.unregister())))
          .finally(() => window.location.reload(true));
        return;
      }
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    const message = String(
      this.state.error?.message || this.state.error || "Erreur inconnue"
    );

    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "32px 20px",
          background:
            "linear-gradient(180deg, #fbfbfd 0%, #f2f2f7 100%)",
          color: "#1c1c1e",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            background: "rgba(255, 255, 255, 0.92)",
            border: "1px solid rgba(255, 255, 255, 0.65)",
            borderRadius: 22,
            padding: 24,
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.06)",
            marginTop: 24,
          }}
        >
          <div style={{ fontSize: 44, lineHeight: 1, marginBottom: 8 }}>🌸</div>
          <h1
            style={{
              margin: "0 0 8px",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            L'app n'a pas réussi à se charger
          </h1>
          <p
            style={{
              margin: "0 0 20px",
              fontSize: 15,
              lineHeight: 1.5,
              color: "rgba(60, 60, 67, 0.78)",
            }}
          >
            C'est presque toujours du cache. Essaie d'abord de recharger en
            virant les anciennes données stockées par ton appareil.
          </p>

          <button
            type="button"
            onClick={this.reload}
            style={{
              width: "100%",
              padding: "14px 18px",
              border: "none",
              borderRadius: 14,
              background: "linear-gradient(135deg, #e85a8c 0%, #d94a7a 100%)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(230, 90, 140, 0.28)",
              marginBottom: 18,
            }}
          >
            Recharger l'app
          </button>

          <h2
            style={{
              margin: "16px 0 8px",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              color: "rgba(60, 60, 67, 0.6)",
            }}
          >
            Si le bouton ne suffit pas
          </h2>

          <ol
            style={{
              margin: 0,
              paddingLeft: 20,
              fontSize: 14.5,
              lineHeight: 1.55,
              color: "#1c1c1e",
            }}
          >
            <li style={{ marginBottom: 8 }}>
              Sur iPhone : appuie longtemps sur l'icône Cycle Tracker de
              l'écran d'accueil → <b>Supprimer l'app</b> →{" "}
              <b>Supprimer de l'écran d'accueil</b>.
            </li>
            <li style={{ marginBottom: 8 }}>
              Réglages iPhone → Safari → Avancé →{" "}
              <b>Données de site</b> → cherche{" "}
              <code
                style={{
                  background: "rgba(0,0,0,0.04)",
                  padding: "1px 6px",
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                cycle-tracker-okj8.vercel.app
              </code>{" "}
              → glisse vers la gauche → <b>Supprimer</b>.
            </li>
            <li style={{ marginBottom: 8 }}>
              Force-quitte Safari (sélecteur d'apps → swipe up sur la carte
              Safari).
            </li>
            <li style={{ marginBottom: 8 }}>
              Réouvre Safari →{" "}
              <code
                style={{
                  background: "rgba(0,0,0,0.04)",
                  padding: "1px 6px",
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                cycle-tracker-okj8.vercel.app
              </code>{" "}
              → bouton Partager → <b>Sur l'écran d'accueil</b>.
            </li>
            <li>Ouvre la PWA depuis la nouvelle icône.</li>
          </ol>

          <details
            style={{
              marginTop: 20,
              padding: 12,
              background: "rgba(0,0,0,0.03)",
              borderRadius: 10,
              fontSize: 13,
              color: "rgba(60, 60, 67, 0.72)",
            }}
          >
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              Détails techniques
            </summary>
            <p
              style={{
                margin: "10px 0 0",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
                fontSize: 12,
              }}
            >
              {message}
            </p>
          </details>
        </div>
      </div>
    );
  }
}
