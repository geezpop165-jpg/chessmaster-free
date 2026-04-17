import { Chess } from "chess.js";
import { create } from "zustand";
import type {
  DifficultyLevel,
  EngineAnalysis,
  GameMode,
  GameStatus,
  HistoryEntry,
  PlayerColor,
} from "../types/chess";

interface GameState {
  fen: string;
  turn: "w" | "b";
  gameMode: GameMode;
  difficulty: DifficultyLevel;
  playerColor: PlayerColor;
  moveHistory: HistoryEntry[];
  analysis: EngineAnalysis;
  gameStatus: GameStatus;
  boardFlipped: boolean;
  selectedSquare: string | null;
  lastMove: { from: string; to: string } | null;

  // Actions
  initGame: (
    mode: GameMode,
    difficulty: DifficultyLevel,
    playerColor?: PlayerColor,
  ) => void;
  makeMove: (from: string, to: string, promotion?: string) => boolean;
  resignGame: () => void;
  flipBoard: () => void;
  setDifficulty: (level: DifficultyLevel) => void;
  setGameMode: (mode: GameMode) => void;
  setAnalysis: (analysis: Partial<EngineAnalysis>) => void;
  setSelectedSquare: (sq: string | null) => void;
  getLegalMoves: (square: string) => string[];
}

const DEFAULT_ANALYSIS: EngineAnalysis = {
  depth: 0,
  evaluation: 0,
  isMate: false,
  mateIn: null,
  topMoves: [],
  isThinking: false,
  nps: 0,
};

export const useGameStore = create<GameState>((set, get) => ({
  fen: new Chess().fen(),
  turn: "w",
  gameMode: "vs-bot",
  difficulty: "Intermediate",
  playerColor: "white",
  moveHistory: [],
  analysis: DEFAULT_ANALYSIS,
  gameStatus: "idle",
  boardFlipped: false,
  selectedSquare: null,
  lastMove: null,

  initGame: (mode, difficulty, playerColor = "white") => {
    const chess = new Chess();
    set({
      fen: chess.fen(),
      turn: "w",
      gameMode: mode,
      difficulty,
      playerColor,
      moveHistory: [],
      analysis: { ...DEFAULT_ANALYSIS },
      gameStatus: "playing",
      boardFlipped: playerColor === "black",
      selectedSquare: null,
      lastMove: null,
    });
  },

  makeMove: (from, to, promotion = "q") => {
    const chess = new Chess(get().fen);
    try {
      const move = chess.move({ from, to, promotion });
      if (!move) return false;

      const history = get().moveHistory;
      const moveNum = Math.floor(history.length / 2) + 1;

      let newStatus: GameStatus = "playing";
      if (chess.isCheckmate()) newStatus = "checkmate";
      else if (chess.isStalemate() || chess.isDraw()) newStatus = "stalemate";

      set({
        fen: chess.fen(),
        turn: chess.turn(),
        moveHistory: [
          ...history,
          {
            fen: chess.fen(),
            san: move.san,
            color: move.color,
            moveNumber: moveNum,
          },
        ],
        gameStatus: newStatus,
        selectedSquare: null,
        lastMove: { from, to },
      });
      return true;
    } catch {
      return false;
    }
  },

  resignGame: () => set({ gameStatus: "resigned" }),
  flipBoard: () => set((s) => ({ boardFlipped: !s.boardFlipped })),
  setDifficulty: (level) => set({ difficulty: level }),
  setGameMode: (mode) => set({ gameMode: mode }),
  setAnalysis: (analysis) =>
    set((s) => ({ analysis: { ...s.analysis, ...analysis } })),
  setSelectedSquare: (sq) => set({ selectedSquare: sq }),

  getLegalMoves: (square) => {
    const chess = new Chess(get().fen);
    try {
      // chess.js moves() with verbose:true returns Move objects with .to
      const moves = chess.moves({
        square:
          square as `${"a" | "b" | "c" | "d" | "e" | "f" | "g" | "h"}${"1" | "2" | "3" | "4" | "5" | "6" | "7" | "8"}`,
        verbose: true,
      });
      return moves.map((m) => m.to);
    } catch {
      return [];
    }
  },
}));
