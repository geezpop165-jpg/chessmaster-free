import { Button } from "@/components/ui/button";
import { Home, RotateCcw, Trophy } from "lucide-react";
import type { GameMode, GameStatus, PlayerColor } from "../../types/chess";

interface GameOverlayProps {
  status: GameStatus;
  turn: "w" | "b";
  gameMode: GameMode;
  playerColor: PlayerColor;
  onNewGame: () => void;
  onHome: () => void;
}

function getResultMessage(
  status: GameStatus,
  turn: "w" | "b",
  gameMode: GameMode,
  playerColor: PlayerColor,
): { title: string; subtitle: string; icon: string; accent: string } {
  if (status === "resigned") {
    if (gameMode === "vs-bot") {
      return {
        title: "You Resigned",
        subtitle: "The engine wins this time. Keep practicing!",
        icon: "🏳️",
        accent: "text-muted-foreground",
      };
    }
    return {
      title: "Game Resigned",
      subtitle: `${turn === "w" ? "Black" : "White"} wins by resignation.`,
      icon: "🏳️",
      accent: "text-muted-foreground",
    };
  }

  if (status === "stalemate" || status === "draw") {
    return {
      title: "It's a Draw!",
      subtitle: "The game ended in stalemate. A hard-fought battle.",
      icon: "🤝",
      accent: "text-sky-400",
    };
  }

  if (status === "checkmate") {
    const winner = turn === "w" ? "Black" : "White";
    if (gameMode === "vs-bot") {
      const playerWon =
        (playerColor === "white" && turn === "b") ||
        (playerColor === "black" && turn === "w");
      if (playerWon) {
        return {
          title: "Brilliant!",
          subtitle: "You defeated the engine. Excellent play!",
          icon: "👑",
          accent: "text-emerald-400",
        };
      }
      return {
        title: "Engine Wins",
        subtitle: "Checkmate. Study the position and try again!",
        icon: "🤖",
        accent: "text-destructive",
      };
    }
    return {
      title: `${winner} Wins!`,
      subtitle: "Checkmate! A decisive victory.",
      icon: "♟️",
      accent: "text-primary",
    };
  }

  return {
    title: "Game Over",
    subtitle: "",
    icon: "♟️",
    accent: "text-foreground",
  };
}

export function GameOverlay({
  status,
  turn,
  gameMode,
  playerColor,
  onNewGame,
  onHome,
}: GameOverlayProps) {
  const { title, subtitle, icon, accent } = getResultMessage(
    status,
    turn,
    gameMode,
    playerColor,
  );

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-40 backdrop-blur-sm"
      data-ocid="game.over_overlay"
    >
      <div
        className="bg-card border border-border/80 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center space-y-5"
        data-ocid="game.over_dialog"
      >
        {/* Icon */}
        <div className="text-6xl leading-none">{icon}</div>

        {/* Trophy accent line */}
        <div className="flex items-center justify-center gap-2">
          <Trophy className={`w-4 h-4 ${accent}`} />
          <div className={`h-px w-12 ${accent.replace("text-", "bg-")}/30`} />
        </div>

        {/* Result text */}
        <div className="space-y-2">
          <h2 className={`font-display text-2xl font-bold ${accent}`}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Status badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border/50">
          <span className="text-xs text-muted-foreground font-mono capitalize">
            {status === "checkmate"
              ? "Checkmate"
              : status === "stalemate"
                ? "Stalemate"
                : status === "resigned"
                  ? "Resignation"
                  : "Draw"}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            data-ocid="game.new_game_overlay_button"
            onClick={onNewGame}
            className="flex-1 gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </Button>
          <Button
            variant="outline"
            data-ocid="game.home_overlay_button"
            onClick={onHome}
            className="flex-1 gap-2"
          >
            <Home className="w-4 h-4" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
