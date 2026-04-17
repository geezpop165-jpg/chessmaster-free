import { Chess } from "chess.js";
import { useCallback, useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { DIFFICULTY_DEPTH, DIFFICULTY_SKILL } from "../types/chess";

const STOCKFISH_PATH = "/stockfish-nnue-16-single.js";

interface ParsedInfo {
  depth?: number;
  score?: number;
  isMate?: boolean;
  mateIn?: number;
  pv?: string;
  multipv?: number;
  nps?: number;
}

function parseInfo(line: string): ParsedInfo {
  const result: ParsedInfo = {};
  const parts = line.split(" ");
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === "depth") result.depth = Number.parseInt(parts[i + 1]);
    if (parts[i] === "nps") result.nps = Number.parseInt(parts[i + 1]);
    if (parts[i] === "multipv") result.multipv = Number.parseInt(parts[i + 1]);
    if (parts[i] === "score") {
      if (parts[i + 1] === "cp") {
        result.score = Number.parseInt(parts[i + 2]);
        result.isMate = false;
      } else if (parts[i + 1] === "mate") {
        result.isMate = true;
        result.mateIn = Number.parseInt(parts[i + 2]);
        result.score = parts[i + 2].startsWith("-") ? -99999 : 99999;
      }
    }
    if (parts[i] === "pv") {
      result.pv = parts.slice(i + 1).join(" ");
      break;
    }
  }
  return result;
}

function parseBestMove(line: string): string | null {
  const m = line.match(/^bestmove\s+(\S+)/);
  return m ? m[1] : null;
}

export function useStockfish() {
  const engineRef = useRef<Worker | null>(null);
  const analysisBufferRef = useRef<
    Map<number, { from: string; to: string; san: string; score: number }>
  >(new Map());
  const currentDepthRef = useRef(0);
  const npsRef = useRef(0);

  const { difficulty, gameStatus, analysis, setAnalysis } = useGameStore();

  const send = useCallback((cmd: string) => {
    engineRef.current?.postMessage(cmd);
  }, []);

  const analyze = useCallback(
    (position: string) => {
      if (!engineRef.current) return;
      const depth = DIFFICULTY_DEPTH[difficulty];
      const skill = DIFFICULTY_SKILL[difficulty];
      analysisBufferRef.current.clear();
      currentDepthRef.current = 0;
      setAnalysis({ isThinking: true, topMoves: [] });
      send("stop");
      send("setoption name MultiPV value 3");
      send(`setoption name Skill Level value ${skill}`);
      send(`position fen ${position}`);
      send(`go depth ${depth}`);
    },
    [difficulty, send, setAnalysis],
  );

  const handleBotMove = useCallback(() => {
    const { fen: currentFen } = useGameStore.getState();
    const depth = DIFFICULTY_DEPTH[difficulty];
    const skill = DIFFICULTY_SKILL[difficulty];
    send("stop");
    send("setoption name MultiPV value 1");
    send(`setoption name Skill Level value ${skill}`);
    send(`position fen ${currentFen}`);
    send(`go depth ${depth}`);
  }, [difficulty, send]);

  useEffect(() => {
    const worker = new Worker(STOCKFISH_PATH, { type: "classic" });
    engineRef.current = worker;

    worker.onmessage = (e: MessageEvent<string>) => {
      const line = e.data;

      if (
        line.startsWith("info") &&
        line.includes("score") &&
        line.includes("pv")
      ) {
        const parsed = parseInfo(line);
        if (!parsed.pv || parsed.multipv === undefined) return;

        const moveParts = parsed.pv.split(" ");
        const rawMove = moveParts[0];
        if (!rawMove || rawMove.length < 4) return;

        const from = rawMove.slice(0, 2);
        const to = rawMove.slice(2, 4);
        const score = parsed.score ?? 0;
        if (parsed.nps) npsRef.current = parsed.nps;

        try {
          const chess = new Chess(useGameStore.getState().fen);
          const mv = chess.move({ from, to, promotion: rawMove[4] || "q" });
          if (!mv) return;

          const san = mv.san;

          if (
            (parsed.depth ?? 0) > currentDepthRef.current ||
            parsed.multipv === 1
          ) {
            if (parsed.multipv === 1) {
              currentDepthRef.current = parsed.depth ?? currentDepthRef.current;
              analysisBufferRef.current.clear();
            }
            analysisBufferRef.current.set(parsed.multipv, {
              from,
              to,
              san,
              score,
            });

            const topMoves = Array.from(analysisBufferRef.current.entries())
              .sort(([a], [b]) => a - b)
              .map(([, mv], i) => ({
                from: mv.from,
                to: mv.to,
                san: mv.san,
                evaluation: mv.score,
                rank: (i + 1) as 1 | 2 | 3,
              }));

            setAnalysis({
              depth: parsed.depth ?? currentDepthRef.current,
              evaluation: analysisBufferRef.current.get(1)?.score ?? 0,
              isMate: parsed.isMate ?? false,
              mateIn: parsed.mateIn ?? null,
              topMoves,
              isThinking: true,
              nps: npsRef.current,
            });
          }
        } catch {
          /* ignore parse errors */
        }
      }

      if (line.startsWith("bestmove")) {
        const bestMove = parseBestMove(line);
        setAnalysis({ isThinking: false });

        const state = useGameStore.getState();
        if (state.gameMode === "vs-bot") {
          const isPlayerTurn =
            (state.playerColor === "white" && state.turn === "w") ||
            (state.playerColor === "black" && state.turn === "b");

          if (!isPlayerTurn && bestMove && bestMove !== "(none)") {
            const from = bestMove.slice(0, 2);
            const to = bestMove.slice(2, 4);
            const promo = bestMove[4] || "q";
            setTimeout(() => state.makeMove(from, to, promo), 300);
          }
        }
      }
    };

    worker.onerror = (err) => console.error("Stockfish error:", err);
    send("uci");
    send("isready");

    return () => {
      worker.terminate();
      engineRef.current = null;
    };
  }, [send, setAnalysis]);

  // Trigger analysis when FEN changes and game is playing
  const fen = useGameStore((s) => s.fen);
  useEffect(() => {
    if (gameStatus !== "playing") return;
    const state = useGameStore.getState();
    if (state.gameMode === "vs-bot") {
      const isPlayerTurn =
        (state.playerColor === "white" && state.turn === "w") ||
        (state.playerColor === "black" && state.turn === "b");
      if (isPlayerTurn) {
        analyze(fen);
      } else {
        handleBotMove();
      }
    } else {
      analyze(fen);
    }
  }, [fen, gameStatus, analyze, handleBotMove]);

  return { analyze, isThinking: analysis.isThinking };
}
