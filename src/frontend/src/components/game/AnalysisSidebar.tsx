import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, ChevronUp, Loader2, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
  EngineAnalysis,
  GameMode,
  HistoryEntry,
  MoveHint,
  PlayerColor,
} from "../../types/chess";

interface AnalysisSidebarProps {
  analysis: EngineAnalysis;
  moveHistory: HistoryEntry[];
  turn: "w" | "b";
  gameMode: GameMode;
  playerColor: PlayerColor;
}

const RANK_BORDER = [
  "border-l-2 border-emerald-500 bg-emerald-500/8",
  "border-l-2 border-sky-400 bg-sky-400/8",
  "border-l-2 border-amber-400 bg-amber-400/8",
];
const RANK_SCORE = ["text-emerald-400", "text-sky-400", "text-amber-400"];
const RANK_DOT = ["bg-emerald-500", "bg-sky-400", "bg-amber-400"];
const RANK_LABEL = ["Best", "Alt", "3rd"];

interface MoveHintRowProps {
  move: MoveHint;
  index: number;
}

function MoveHintRow({ move, index }: MoveHintRowProps) {
  const evalAbs = Math.abs(move.evaluation);
  const isMateScore = evalAbs >= 99000;
  const evalStr = isMateScore
    ? `#${evalAbs >= 99999 ? "1" : "M"}`
    : `${move.evaluation >= 0 ? "+" : ""}${(move.evaluation / 100).toFixed(2)}`;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded ${RANK_BORDER[index]}`}
      data-ocid={`analysis.move.${index + 1}`}
    >
      <div className="flex items-center gap-1.5 w-10 shrink-0">
        <div
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${RANK_DOT[index]}`}
        />
        <span className="text-xs text-muted-foreground font-mono">
          {RANK_LABEL[index]}
        </span>
      </div>
      <span className="font-mono font-bold text-sm text-foreground flex-1 truncate">
        {move.san}
      </span>
      <span
        className={`text-xs font-mono font-semibold shrink-0 ${RANK_SCORE[index]}`}
      >
        {evalStr}
      </span>
    </div>
  );
}

function SidebarContent({
  analysis,
  moveHistory,
  turn,
  gameMode,
  playerColor,
}: AnalysisSidebarProps) {
  const historyEndRef = useRef<HTMLDivElement>(null);

  const isPlayerTurn =
    gameMode === "pass-and-play" ||
    (playerColor === "white" && turn === "w") ||
    (playerColor === "black" && turn === "b");

  // Auto-scroll move history to latest
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  // Group moves into pairs for display
  const movePairs: {
    white?: HistoryEntry;
    black?: HistoryEntry;
    num: number;
  }[] = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    movePairs.push({
      num: moveHistory[i].moveNumber,
      white: moveHistory[i],
      black: moveHistory[i + 1],
    });
  }

  const evalAbs = Math.abs(analysis.evaluation / 100);
  const evalDisplay = analysis.isMate
    ? `M${Math.abs(analysis.mateIn ?? 0)}`
    : `${analysis.evaluation >= 0 ? "+" : ""}${evalAbs.toFixed(2)}`;

  return (
    <>
      {/* Engine Analysis Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="font-display font-semibold text-sm">
            Engine Analysis
          </span>
        </div>
        <div className="flex items-center gap-2">
          {analysis.isThinking ? (
            <div
              className="flex items-center gap-1.5"
              data-ocid="analysis.loading_state"
            >
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground font-mono">
                Thinking
              </span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5"
              data-ocid="analysis.ready_state"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground font-mono">
                Ready
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Engine Stats Row */}
      <div className="px-4 py-2 border-b border-border/30 flex items-center justify-between">
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>
            Depth:{" "}
            <span className="text-foreground font-mono font-semibold">
              {analysis.depth || "—"}
            </span>
          </span>
          {analysis.nps > 0 && (
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="font-mono">
                {Math.round(analysis.nps / 1000)}k
              </span>
            </span>
          )}
        </div>
        {analysis.depth > 0 && (
          <div
            className={`text-sm font-mono font-bold ${
              analysis.evaluation >= 0
                ? "text-foreground"
                : "text-muted-foreground"
            }`}
            data-ocid="analysis.eval_score"
          >
            {evalDisplay}
          </div>
        )}
      </div>

      {/* Top Move Suggestions */}
      <div className="px-3 py-3 border-b border-border/30 space-y-1.5">
        <p className="text-[10px] text-muted-foreground px-1 mb-2 uppercase tracking-widest font-semibold">
          {isPlayerTurn ? "Top Suggestions" : "Bot Analyzing"}
        </p>
        {analysis.isThinking && analysis.topMoves.length === 0 ? (
          <div
            className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground"
            data-ocid="analysis.empty_state"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Calculating moves…</span>
          </div>
        ) : analysis.topMoves.length > 0 ? (
          analysis.topMoves.map((mv, i) => (
            <MoveHintRow key={`${mv.from}${mv.to}-${i}`} move={mv} index={i} />
          ))
        ) : (
          <div
            className="px-1 py-3 text-center text-xs text-muted-foreground"
            data-ocid="analysis.empty_state"
          >
            Start a game to see suggestions
          </div>
        )}
      </div>

      {/* Move History */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 py-2 border-b border-border/30 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
            Move History
          </p>
          {moveHistory.length > 0 && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {Math.ceil(moveHistory.length / 2)} moves
            </span>
          )}
        </div>
        <ScrollArea className="flex-1">
          <div className="px-2 py-2" data-ocid="game.move_history">
            {movePairs.length === 0 ? (
              <p
                className="text-xs text-muted-foreground text-center py-6"
                data-ocid="history.empty_state"
              >
                No moves yet
              </p>
            ) : (
              movePairs.map(({ num, white, black }) => (
                <div
                  key={num}
                  className="flex items-center gap-1 py-0.5 text-sm font-mono hover:bg-muted/30 rounded transition-smooth"
                  data-ocid={`history.move.${num}`}
                >
                  <span className="text-muted-foreground w-7 text-[11px] shrink-0 text-right pr-1">
                    {num}.
                  </span>
                  <span className="flex-1 text-foreground px-1 py-0.5 rounded font-semibold text-xs">
                    {white?.san ?? ""}
                  </span>
                  <span className="flex-1 text-muted-foreground px-1 py-0.5 rounded text-xs">
                    {black?.san ?? ""}
                  </span>
                </div>
              ))
            )}
            <div ref={historyEndRef} />
          </div>
        </ScrollArea>
      </div>
    </>
  );
}

export function AnalysisSidebar(props: AnalysisSidebarProps) {
  const { analysis } = props;
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex w-64 xl:w-72 bg-card border-l border-border/50 flex-col"
        data-ocid="game.analysis_sidebar"
      >
        <SidebarContent {...props} />
      </aside>

      {/* Mobile: floating toggle button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <button
          type="button"
          data-ocid="analysis.open_modal_button"
          onClick={() => setMobileOpen((o) => !o)}
          className="flex items-center gap-2 bg-card border border-border/60 shadow-lg rounded-full px-4 py-2.5 text-sm font-semibold text-foreground transition-smooth hover:bg-muted active:scale-95"
        >
          {analysis.isThinking ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <Brain className="w-4 h-4 text-primary" />
          )}
          <span>Analysis</span>
          {analysis.topMoves.length > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {analysis.topMoves.length}
            </span>
          )}
          <ChevronUp
            className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          data-ocid="analysis.dialog"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Engine Analysis"
        />
      )}

      {/* Mobile drawer panel */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border/50 flex flex-col transition-transform duration-300 ease-out ${
          mobileOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "70vh" }}
        data-ocid="game.analysis_sidebar_mobile"
      >
        {/* Drag handle + close */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full mx-auto" />
        </div>
        <div className="flex-1 flex flex-col min-h-0 overflow-auto">
          <SidebarContent {...props} />
        </div>
        <div className="px-4 pb-4 pt-2 border-t border-border/30">
          <button
            type="button"
            data-ocid="analysis.close_button"
            onClick={() => setMobileOpen(false)}
            className="w-full py-2 rounded-lg bg-muted text-muted-foreground text-sm font-semibold hover:bg-muted/70 transition-smooth"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
