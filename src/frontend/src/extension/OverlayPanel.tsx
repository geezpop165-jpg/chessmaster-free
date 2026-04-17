import { useState } from "react";
import type { EngineAnalysis } from "./types";

interface OverlayPanelProps {
  analysis: EngineAnalysis | null;
  isActive: boolean;
}

const RANK_COLORS = ["#4ade80", "#60a5fa", "#fbbf24"] as const;
const RANK_LABELS = ["1st", "2nd", "3rd"] as const;

function EvalBar({ evaluation }: { evaluation: number }) {
  // Clamp to ±800cp for display, map to 0–100% white portion
  const clamped = Math.max(-800, Math.min(800, evaluation));
  const whitePct = Math.round(((clamped + 800) / 1600) * 100);
  const isWhiteAhead = evaluation >= 0;
  const displayEval =
    Math.abs(evaluation) >= 99999
      ? "M"
      : Math.abs(evaluation) > 100
        ? `${(Math.abs(evaluation) / 100).toFixed(1)}`
        : `${(Math.abs(evaluation) / 100).toFixed(2)}`;

  return (
    <div style={{ margin: "8px 0" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "10px",
          color: "#9ca3af",
          marginBottom: "4px",
        }}
      >
        <span style={{ color: "#f0d9b5" }}>White</span>
        <span style={{ color: "#f0d9b5", fontWeight: 600 }}>
          {isWhiteAhead ? "+" : "-"}
          {displayEval}
        </span>
        <span style={{ color: "#9ca3af" }}>Black</span>
      </div>
      <div
        style={{
          height: "10px",
          borderRadius: "5px",
          background: "#1e1e1e",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${whitePct}%`,
            background: "linear-gradient(90deg, #f0d9b5, #e8c89a)",
            borderRadius: "5px 0 0 5px",
            transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  );
}

function MoveRow({
  san,
  evaluation,
  rank,
  isMate,
}: {
  san: string;
  evaluation: number;
  rank: number;
  isMate?: boolean;
}) {
  const color = RANK_COLORS[rank - 1] ?? RANK_COLORS[0];
  const label = RANK_LABELS[rank - 1] ?? "—";
  // Stockfish encodes mate-in-N as ±(99000 + N) or simply ±99999 for forced mate.
  // Any |eval| >= 9000cp (90 pawns) is a practical mate line.
  const absCp = Math.abs(evaluation);
  const isMateByValue = absCp >= 9000;
  const mateCount = isMateByValue
    ? absCp >= 99000
      ? Math.max(1, 99999 - absCp) // mate-in-N encoded as 99999-N
      : Math.round(absCp / 100) - 90 // rough count from high eval
    : 0;
  const evalDisplay =
    isMate || isMateByValue
      ? `#${mateCount > 0 ? mateCount : "?"}`
      : evaluation > 0
        ? `+${(evaluation / 100).toFixed(2)}`
        : `${(evaluation / 100).toFixed(2)}`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "5px 8px",
        borderRadius: "6px",
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${color}22`,
        marginBottom: "4px",
      }}
    >
      <span
        style={{
          fontSize: "9px",
          fontWeight: 700,
          color,
          minWidth: "22px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          flex: 1,
          fontSize: "13px",
          fontWeight: 600,
          color: "#f1f5f9",
          fontFamily: "monospace",
          letterSpacing: "0.03em",
        }}
      >
        {san}
      </span>
      <span
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: evaluation >= 0 ? "#86efac" : "#fca5a5",
          fontFamily: "monospace",
        }}
      >
        {evalDisplay}
      </span>
    </div>
  );
}

function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: "10px",
        height: "10px",
        border: "2px solid rgba(74,222,128,0.3)",
        borderTopColor: "#4ade80",
        borderRadius: "50%",
        animation: "cm-spin 0.7s linear infinite",
        marginRight: "5px",
      }}
    />
  );
}

export default function OverlayPanel({
  analysis,
  isActive,
}: OverlayPanelProps) {
  const [minimized, setMinimized] = useState(false);

  const headerStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 10px",
    borderBottom: minimized ? "none" : "1px solid rgba(255,255,255,0.08)",
    cursor: "pointer",
  };

  return (
    <>
      <style>{`
        @keyframes cm-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes cm-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div
        data-ocid="overlay.panel"
        style={{
          width: "200px",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          border: "1px solid rgba(74,222,128,0.2)",
          borderRadius: "10px",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
          fontFamily:
            "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: "12px",
          color: "#f1f5f9",
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        {/* Header */}
        <button
          type="button"
          data-ocid="overlay.minimize_button"
          style={{
            ...headerStyles,
            width: "100%",
            background: "none",
            border: "none",
            textAlign: "left",
            color: "inherit",
          }}
          onClick={() => setMinimized((m) => !m)}
          aria-label={
            minimized
              ? "Expand ChessMaster panel"
              : "Minimize ChessMaster panel"
          }
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: isActive ? "#4ade80" : "#6b7280",
                boxShadow: isActive ? "0 0 6px #4ade80" : "none",
                animation:
                  isActive && analysis?.isThinking
                    ? "cm-pulse 1s ease-in-out infinite"
                    : "none",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: "12px",
                background: "linear-gradient(90deg, #4ade80, #60a5fa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "0.02em",
              }}
            >
              ChessMaster
            </span>
          </div>
          <span style={{ color: "#9ca3af", fontSize: "14px", lineHeight: 1 }}>
            {minimized ? "▲" : "▼"}
          </span>
        </button>

        {/* Body */}
        {!minimized && (
          <div style={{ padding: "8px 10px" }}>
            {/* Eval bar */}
            <EvalBar evaluation={analysis?.evaluation ?? 0} />

            {/* Top moves */}
            <div style={{ margin: "8px 0 4px" }}>
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#6b7280",
                  marginBottom: "6px",
                }}
              >
                Top Moves
              </div>

              {analysis && analysis.topMoves.length > 0 ? (
                analysis.topMoves.map((mv) => (
                  <MoveRow
                    key={`${mv.from}-${mv.to}-${mv.rank}`}
                    san={mv.san}
                    evaluation={mv.evaluation}
                    rank={mv.rank}
                    isMate={analysis.isMate}
                  />
                ))
              ) : (
                <div
                  data-ocid="overlay.empty_state"
                  style={{
                    textAlign: "center",
                    color: "#6b7280",
                    fontSize: "11px",
                    padding: "10px 0",
                  }}
                >
                  {isActive ? "Waiting for position…" : "Not on a chess game"}
                </div>
              )}
            </div>

            {/* Footer status */}
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
                paddingTop: "6px",
                marginTop: "4px",
                display: "flex",
                alignItems: "center",
                fontSize: "10px",
                color: "#6b7280",
                gap: "4px",
              }}
            >
              {analysis?.isThinking ? (
                <>
                  <Spinner />
                  <span style={{ color: "#4ade80" }}>Analyzing…</span>
                  {analysis.nps > 0 && (
                    <span style={{ marginLeft: "auto" }}>
                      {(analysis.nps / 1000).toFixed(0)}k nps
                    </span>
                  )}
                </>
              ) : analysis && analysis.depth > 0 ? (
                <>
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#4ade80",
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  <span>Depth {analysis.depth}</span>
                  {analysis.nps > 0 && (
                    <span style={{ marginLeft: "auto" }}>
                      {(analysis.nps / 1000).toFixed(0)}k nps
                    </span>
                  )}
                </>
              ) : (
                <span>Ready</span>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
