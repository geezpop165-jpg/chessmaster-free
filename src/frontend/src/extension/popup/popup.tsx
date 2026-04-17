import { type CSSProperties, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

interface TabStatus {
  active: boolean;
  url: string;
}

function Popup() {
  const [status, setStatus] = useState<TabStatus>({ active: false, url: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.runtime.sendMessage(
      { type: "GET_TAB_STATUS" },
      (response: unknown) => {
        if (chrome.runtime.lastError) {
          setLoading(false);
          return;
        }
        setStatus((response as TabStatus) ?? { active: false, url: "" });
        setLoading(false);
      },
    );
  }, []);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logoRow}>
          <span style={styles.logoIcon}>♞</span>
          <span style={styles.logoText}>ChessMaster Free</span>
        </div>
        <span style={styles.version}>v1.0.0</span>
      </div>

      {/* Description */}
      <div style={styles.description}>
        Real-time analysis on chess.com — top 3 moves + evaluation bar powered
        by Stockfish.
      </div>

      {/* Status */}
      <div style={styles.statusRow}>
        {loading ? (
          <span style={styles.statusDot("grey")} />
        ) : (
          <span
            style={styles.statusDot(status.active ? "#22c55e" : "#94a3b8")}
          />
        )}
        <span style={styles.statusText}>
          {loading
            ? "Checking status…"
            : status.active
              ? "Active on chess.com"
              : "Open chess.com to start"}
        </span>
      </div>

      {/* CTA */}
      {!status.active && !loading && (
        <a
          href="https://www.chess.com/play/computer"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.ctaButton}
          onClick={() => window.close()}
          data-ocid="popup.open_chessdotcom_link"
        >
          Open chess.com →
        </a>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <span>Free forever · No account needed</span>
      </div>
    </div>
  );
}

const colors = {
  bg: "#0f1117",
  card: "#1a1d2e",
  border: "#2a2d40",
  primary: "#6366f1",
  text: "#e2e8f0",
  muted: "#64748b",
  white: "#ffffff",
};

const styles = {
  container: {
    width: "320px",
    backgroundColor: colors.bg,
    color: colors.text,
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    padding: "0",
    borderRadius: "0",
    overflow: "hidden",
  } as CSSProperties,

  header: {
    backgroundColor: colors.card,
    borderBottom: `1px solid ${colors.border}`,
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  } as CSSProperties,

  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  } as CSSProperties,

  logoIcon: {
    fontSize: "22px",
    lineHeight: 1,
    color: colors.primary,
  } as CSSProperties,

  logoText: {
    fontSize: "15px",
    fontWeight: 700,
    letterSpacing: "-0.01em",
    color: colors.white,
  } as CSSProperties,

  version: {
    fontSize: "11px",
    color: colors.muted,
    backgroundColor: colors.border,
    padding: "2px 7px",
    borderRadius: "99px",
  } as CSSProperties,

  description: {
    padding: "14px 16px 10px",
    fontSize: "13px",
    color: colors.muted,
    lineHeight: "1.5",
  } as CSSProperties,

  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: colors.card,
    margin: "0 12px",
    borderRadius: "8px",
    border: `1px solid ${colors.border}`,
  } as CSSProperties,

  statusDot: (color: string) =>
    ({
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      backgroundColor: color,
      flexShrink: 0,
      boxShadow:
        color !== "grey" && color !== "#94a3b8" ? `0 0 6px ${color}` : "none",
    }) as CSSProperties,

  statusText: {
    fontSize: "13px",
    fontWeight: 500,
    color: colors.text,
  } as CSSProperties,

  ctaButton: {
    display: "block",
    margin: "12px 12px 0",
    padding: "10px 16px",
    backgroundColor: colors.primary,
    color: colors.white,
    textDecoration: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    textAlign: "center",
    transition: "opacity 0.15s",
  } as CSSProperties,

  footer: {
    padding: "12px 16px",
    fontSize: "11px",
    color: colors.muted,
    textAlign: "center",
    borderTop: `1px solid ${colors.border}`,
    marginTop: "12px",
  } as CSSProperties,
};

const root = document.getElementById("popup-root");
if (root) {
  createRoot(root).render(<Popup />);
}
