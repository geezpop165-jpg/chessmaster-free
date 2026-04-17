import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Bot, ChevronRight, Crown, Users } from "lucide-react";
import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import type { DifficultyLevel, GameMode, PlayerColor } from "../types/chess";

const DIFFICULTIES: { level: DifficultyLevel; elo: string; color: string }[] = [
  { level: "Beginner", elo: "~600", color: "emerald" },
  { level: "Intermediate", elo: "~1000", color: "sky" },
  { level: "Advanced", elo: "~1400", color: "amber" },
  { level: "Expert", elo: "~1800", color: "orange" },
  { level: "Master", elo: "~2200+", color: "rose" },
];

const DIFF_SELECTED: Record<string, string> = {
  emerald: "border-emerald-400 bg-emerald-400/12 text-emerald-300",
  sky: "border-sky-400     bg-sky-400/12     text-sky-300",
  amber: "border-amber-400   bg-amber-400/12   text-amber-300",
  orange: "border-orange-400  bg-orange-400/12  text-orange-300",
  rose: "border-rose-400    bg-rose-400/12    text-rose-300",
};

const BOARD_PIECES = [
  ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
  ["♟", "♟", "♟", "♟", "♟", "♟", "♟", "♟"],
  [" ", " ", " ", " ", " ", " ", " ", " "],
  [" ", " ", " ", " ", " ", " ", " ", " "],
  [" ", " ", " ", " ", " ", " ", " ", " "],
  [" ", " ", " ", " ", " ", " ", " ", " "],
  ["♙", "♙", "♙", "♙", "♙", "♙", "♙", "♙"],
  ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"],
];

function ChessBoardBg() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] opacity-[0.035]">
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
          {BOARD_PIECES.flat().map((piece, i) => {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const isDark = (row + col) % 2 === 1;
            return (
              <div
                key={`cell-${row}-${col}`}
                className={`flex items-center justify-center text-[42px] leading-none ${isDark ? "bg-foreground/20" : ""}`}
              >
                {piece.trim()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { initGame } = useGameStore();
  const [mode, setMode] = useState<GameMode>("vs-bot");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("Intermediate");
  const [playerColor, setPlayerColor] = useState<PlayerColor>("white");

  const handleStart = () => {
    initGame(mode, difficulty, mode === "vs-bot" ? playerColor : "white");
    navigate({ to: "/game" });
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden">
      <ChessBoardBg />

      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, oklch(0.7 0.18 146 / 0.07) 0%, transparent 65%)",
        }}
        aria-hidden="true"
      />

      {/* Header bar */}
      <header className="relative z-10 w-full border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center text-base leading-none">
            ♛
          </div>
          <span className="font-display font-bold text-sm tracking-wide text-foreground">
            ChessMaster Free
          </span>
          <span className="hidden sm:block text-border/80 text-xs">|</span>
          <span className="hidden sm:block text-xs text-muted-foreground">
            Free chess analysis & play
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg space-y-6">
          {/* Hero text */}
          <div className="text-center space-y-2 mb-8">
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
              Play Chess.
              <br />
              <span className="text-primary">No Limits.</span>
            </h1>
            <p className="text-muted-foreground text-base mt-3">
              Powered by Stockfish · Top 3 move suggestions · 100% free
            </p>
          </div>

          {/* Mode cards */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3 text-center">
              Choose your mode
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                data-ocid="home.mode_vs_bot"
                onClick={() => setMode("vs-bot")}
                className={[
                  "relative group flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-smooth cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  mode === "vs-bot"
                    ? "border-primary bg-primary/10 shadow-[0_0_24px_oklch(0.7_0.18_146/0.18)]"
                    : "border-border bg-card hover:border-primary/35 hover:bg-card",
                ].join(" ")}
              >
                {mode === "vs-bot" && (
                  <Crown className="absolute top-3 right-3 w-3.5 h-3.5 text-primary" />
                )}
                <div
                  className={[
                    "w-11 h-11 rounded-xl flex items-center justify-center transition-smooth",
                    mode === "vs-bot"
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground group-hover:text-foreground",
                  ].join(" ")}
                >
                  <Bot className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <div
                    className={[
                      "font-display font-bold text-sm",
                      mode === "vs-bot"
                        ? "text-foreground"
                        : "text-foreground/75",
                    ].join(" ")}
                  >
                    Vs Bot
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    Play against the
                    <br />
                    Stockfish engine
                  </div>
                </div>
              </button>

              <button
                type="button"
                data-ocid="home.mode_pass_and_play"
                onClick={() => setMode("pass-and-play")}
                className={[
                  "relative group flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-smooth cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  mode === "pass-and-play"
                    ? "border-primary bg-primary/10 shadow-[0_0_24px_oklch(0.7_0.18_146/0.18)]"
                    : "border-border bg-card hover:border-primary/35 hover:bg-card",
                ].join(" ")}
              >
                {mode === "pass-and-play" && (
                  <Crown className="absolute top-3 right-3 w-3.5 h-3.5 text-primary" />
                )}
                <div
                  className={[
                    "w-11 h-11 rounded-xl flex items-center justify-center transition-smooth",
                    mode === "pass-and-play"
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground group-hover:text-foreground",
                  ].join(" ")}
                >
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <div
                    className={[
                      "font-display font-bold text-sm",
                      mode === "pass-and-play"
                        ? "text-foreground"
                        : "text-foreground/75",
                    ].join(" ")}
                  >
                    Pass &amp; Play
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    Two players take turns
                    <br />
                    on the same device
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Difficulty — only for vs-bot */}
          {mode === "vs-bot" && (
            <div data-ocid="difficulty.section">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3 text-center">
                Difficulty
              </p>
              <div
                className="flex gap-2 flex-wrap justify-center"
                data-ocid="difficulty.buttons"
              >
                {DIFFICULTIES.map(({ level, elo, color }) => {
                  const isSelected = difficulty === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      data-ocid={`home.difficulty_${level.toLowerCase()}`}
                      onClick={() => setDifficulty(level)}
                      className={[
                        "flex flex-col items-center px-3.5 py-2 rounded-lg border transition-smooth cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-[78px]",
                        isSelected
                          ? DIFF_SELECTED[color]
                          : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                      ].join(" ")}
                    >
                      <span className="font-display font-semibold text-xs">
                        {level}
                      </span>
                      <span className="font-mono text-[10px] opacity-70 mt-0.5">
                        {elo}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Play As — vs-bot only */}
          {mode === "vs-bot" && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3 text-center">
                Play As
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  data-ocid="home.color_white"
                  onClick={() => setPlayerColor("white")}
                  className={[
                    "flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition-smooth cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    playerColor === "white"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30",
                  ].join(" ")}
                >
                  <span className="text-xl leading-none">♔</span>
                  <span className="font-display font-semibold text-sm">
                    White
                  </span>
                </button>
                <button
                  type="button"
                  data-ocid="home.color_black"
                  onClick={() => setPlayerColor("black")}
                  className={[
                    "flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition-smooth cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    playerColor === "black"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30",
                  ].join(" ")}
                >
                  <span className="text-xl leading-none">♚</span>
                  <span className="font-display font-semibold text-sm">
                    Black
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* CTA */}
          <Button
            data-ocid="home.start_button"
            onClick={handleStart}
            size="lg"
            className="w-full h-13 text-base font-display font-bold rounded-xl shadow-[0_4px_20px_oklch(0.7_0.18_146/0.3)] hover:shadow-[0_6px_28px_oklch(0.7_0.18_146/0.45)] transition-smooth group"
            style={{ height: "3.25rem" }}
          >
            Start Game
            <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-0.5 transition-smooth" />
          </Button>

          <p className="text-center text-xs text-muted-foreground/50">
            No account required · Engine runs entirely in your browser
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-3 border-t border-border/40 bg-card/50">
        <p className="text-center text-xs text-muted-foreground/50">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
