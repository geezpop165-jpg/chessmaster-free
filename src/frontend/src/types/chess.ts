export type GameMode = "vs-bot" | "pass-and-play";

export type GameStatus =
  | "idle"
  | "playing"
  | "checkmate"
  | "stalemate"
  | "resigned"
  | "draw";

export type DifficultyLevel =
  | "Beginner"
  | "Intermediate"
  | "Advanced"
  | "Expert"
  | "Master";

export type PlayerColor = "white" | "black";

export interface MoveHint {
  from: string;
  to: string;
  san: string;
  evaluation: number; // centipawns from white's perspective
  rank: 1 | 2 | 3;
}

export interface EngineAnalysis {
  depth: number;
  evaluation: number; // centipawns
  isMate: boolean;
  mateIn: number | null;
  topMoves: MoveHint[];
  isThinking: boolean;
  nps: number;
}

export const DIFFICULTY_DEPTH: Record<DifficultyLevel, number> = {
  Beginner: 1,
  Intermediate: 5,
  Advanced: 10,
  Expert: 15,
  Master: 20,
};

export const DIFFICULTY_SKILL: Record<DifficultyLevel, number> = {
  Beginner: 0,
  Intermediate: 5,
  Advanced: 10,
  Expert: 15,
  Master: 20,
};

export interface HistoryEntry {
  fen: string;
  san: string;
  color: "w" | "b";
  moveNumber: number;
}
