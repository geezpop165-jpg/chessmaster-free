interface EvaluationBarProps {
  evaluation: number; // centipawns, positive = white advantage
  isMate: boolean;
  mateIn: number | null;
  horizontal?: boolean;
}

export function EvaluationBar({
  evaluation,
  isMate,
  mateIn,
  horizontal = false,
}: EvaluationBarProps) {
  // Convert centipawns to bar percentage (0=black wins, 100=white wins)
  const clampedEval = Math.max(-1000, Math.min(1000, evaluation));
  const percentage = 50 + (clampedEval / 1000) * 50;
  const whitePercent = Math.round(percentage);

  const evalAbs = Math.abs(evaluation / 100);
  const evalLabel = isMate ? `M${Math.abs(mateIn ?? 0)}` : evalAbs.toFixed(2);

  const isWhiteAhead = evaluation >= 0;
  const topScore = isMate
    ? isWhiteAhead
      ? ""
      : `M${Math.abs(mateIn ?? 0)}`
    : isWhiteAhead
      ? ""
      : evalAbs.toFixed(1);
  const bottomScore = isMate
    ? isWhiteAhead
      ? `M${Math.abs(mateIn ?? 0)}`
      : ""
    : isWhiteAhead
      ? evalAbs.toFixed(1)
      : "";

  if (horizontal) {
    return (
      <div
        className="w-full h-3 rounded-full overflow-hidden flex border border-border/50 relative"
        data-ocid="game.eval_bar_horizontal"
        title={`Evaluation: ${isWhiteAhead ? "+" : "-"}${evalLabel}`}
      >
        {/* Black portion left */}
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${100 - whitePercent}%`,
            backgroundColor: "var(--chess-eval-black-bar)",
          }}
        />
        {/* White portion right */}
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${whitePercent}%`,
            backgroundColor: "var(--chess-eval-white)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[9px] font-mono font-bold mix-blend-difference text-white"
            style={{ textShadow: "0 0 2px rgba(0,0,0,0.8)" }}
          >
            {isWhiteAhead ? "+" : "-"}
            {evalLabel}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center w-10 bg-card border-r border-border/50 relative select-none"
      data-ocid="game.eval_bar"
      title={`Evaluation: ${isWhiteAhead ? "+" : "-"}${evalLabel}`}
    >
      {/* Top score label (black advantage) */}
      <div className="h-8 flex items-center justify-center w-full z-10">
        {topScore && (
          <span
            className="text-[9px] font-mono font-bold leading-none"
            style={{ color: "var(--chess-eval-white)" }}
          >
            {topScore}
          </span>
        )}
      </div>

      {/* Bar fill area */}
      <div className="flex-1 w-full flex flex-col overflow-hidden rounded-sm">
        {/* Black portion (top) */}
        <div
          className="w-full transition-all duration-500 ease-out"
          style={{
            height: `${100 - whitePercent}%`,
            backgroundColor: "var(--chess-eval-black)",
            minHeight: "2px",
          }}
        />
        {/* Divider line at 50% */}
        <div className="w-full h-px bg-border/50 shrink-0" />
        {/* White portion (bottom) */}
        <div
          className="w-full transition-all duration-500 ease-out"
          style={{
            height: `${whitePercent}%`,
            backgroundColor: "var(--chess-eval-white)",
            minHeight: "2px",
          }}
        />
      </div>

      {/* Bottom score label (white advantage) */}
      <div className="h-8 flex items-center justify-center w-full z-10">
        {bottomScore && (
          <span
            className="text-[9px] font-mono font-bold leading-none"
            style={{
              color: "var(--chess-eval-black)",
              filter: "drop-shadow(0 0 1px rgba(255,255,255,0.4))",
            }}
          >
            {bottomScore}
          </span>
        )}
      </div>
    </div>
  );
}
