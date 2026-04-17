// Standalone types for the content script — no React imports

export interface MoveHint {
  from: string;
  to: string;
  san: string;
  evaluation: number; // centipawns from white's perspective
  rank: 1 | 2 | 3;
}

export interface EngineAnalysis {
  depth: number;
  evaluation: number; // centipawns (positive = white advantage)
  isMate: boolean;
  mateIn: number | null;
  topMoves: MoveHint[];
  isThinking: boolean;
  nps: number;
}
