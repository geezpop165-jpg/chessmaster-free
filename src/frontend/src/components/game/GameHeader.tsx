import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Crown, Flag, FlipVertical2, Loader2, Plus } from "lucide-react";
import type { DifficultyLevel, GameMode } from "../../types/chess";

const DIFFICULTIES: DifficultyLevel[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
  "Master",
];

interface GameHeaderProps {
  gameMode: GameMode;
  difficulty: DifficultyLevel;
  turn: "w" | "b";
  isThinking: boolean;
  onFlipBoard: () => void;
  onNewGame: () => void;
  onResign: () => void;
  onDifficultyChange: (level: DifficultyLevel) => void;
  onModeChange: (mode: GameMode) => void;
}

export function GameHeader({
  gameMode,
  difficulty,
  turn,
  isThinking,
  onFlipBoard,
  onNewGame,
  onResign,
  onDifficultyChange,
  onModeChange,
}: GameHeaderProps) {
  const turnLabel = turn === "w" ? "White" : "Black";
  const turnColor = turn === "w" ? "#f0d9b5" : "#1e1e1e";
  const turnBorder = turn === "w" ? "2px solid #b58863" : "2px solid #b58863";

  return (
    <header
      className="bg-card border-b border-border/60 px-3 py-2 flex items-center gap-2 flex-wrap shadow-sm"
      data-ocid="game.header"
    >
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-2 mr-2 transition-smooth hover:opacity-80 shrink-0"
        data-ocid="game.home_link"
      >
        <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
          <Crown className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-base text-foreground tracking-tight hidden sm:block">
          Tactical Advantage
        </span>
      </Link>

      {/* Mode Toggle */}
      <div
        className="flex rounded-lg border border-border overflow-hidden shrink-0"
        data-ocid="game.mode_toggle"
      >
        <button
          type="button"
          data-ocid="game.mode_vs_bot"
          onClick={() => onModeChange("vs-bot")}
          className={`px-3 py-1.5 text-sm font-semibold transition-smooth ${
            gameMode === "vs-bot"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          Vs Bot
        </button>
        <button
          type="button"
          data-ocid="game.mode_pass_play"
          onClick={() => onModeChange("pass-and-play")}
          className={`px-3 py-1.5 text-sm font-semibold transition-smooth ${
            gameMode === "pass-and-play"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          Pass &amp; Play
        </button>
      </div>

      {/* Difficulty Selector */}
      {gameMode === "vs-bot" && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground hidden md:inline">
            Difficulty:
          </span>
          <select
            data-ocid="game.difficulty_select"
            value={difficulty}
            onChange={(e) =>
              onDifficultyChange(e.target.value as DifficultyLevel)
            }
            className="bg-muted border border-border rounded-md px-2 py-1.5 text-sm font-semibold text-foreground transition-smooth focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Turn Indicator */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50 ml-1 shrink-0"
        data-ocid="game.turn_indicator"
      >
        <div
          className="w-4 h-4 rounded-full shrink-0"
          style={{
            backgroundColor: turnColor,
            border: turnBorder,
            boxShadow:
              turn === "w"
                ? "0 0 6px rgba(240,217,181,0.5)"
                : "0 0 6px rgba(0,0,0,0.6)",
          }}
        />
        {isThinking ? (
          <div className="flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin text-primary" />
            <span className="text-xs font-semibold text-primary font-mono hidden sm:inline">
              Thinking…
            </span>
          </div>
        ) : (
          <span className="text-xs font-semibold text-foreground hidden sm:inline">
            {turnLabel}&apos;s turn
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          data-ocid="game.new_game_button"
          onClick={onNewGame}
          className="gap-1.5 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Game</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          data-ocid="game.flip_board_button"
          onClick={onFlipBoard}
          className="gap-1.5 text-xs"
        >
          <FlipVertical2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Flip</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          data-ocid="game.resign_button"
          onClick={onResign}
          className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Flag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Resign</span>
        </Button>
      </div>
    </header>
  );
}
