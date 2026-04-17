// Plain TypeScript class — no React. Safe to use in content scripts.
import type { EngineAnalysis, MoveHint } from "./types";

interface ParsedInfo {
  depth?: number;
  score?: number;
  isMate?: boolean;
  mateIn?: number;
  pv?: string;
  multipv?: number;
  nps?: number;
}

function parseInfoLine(line: string): ParsedInfo {
  const result: ParsedInfo = {};
  const parts = line.split(" ");
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === "depth") result.depth = Number.parseInt(parts[i + 1], 10);
    if (parts[i] === "nps") result.nps = Number.parseInt(parts[i + 1], 10);
    if (parts[i] === "multipv")
      result.multipv = Number.parseInt(parts[i + 1], 10);
    if (parts[i] === "score") {
      if (parts[i + 1] === "cp") {
        result.score = Number.parseInt(parts[i + 2], 10);
        result.isMate = false;
      } else if (parts[i + 1] === "mate") {
        result.isMate = true;
        result.mateIn = Number.parseInt(parts[i + 2], 10);
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

/**
 * Minimal chess move validator — converts UCI move (e.g. "e2e4") to SAN-like notation.
 * We don't have chess.js in the content script context, so we produce a compact representation.
 */
function uciToLabel(uciMove: string): string {
  if (!uciMove || uciMove.length < 4) return uciMove;
  const from = uciMove.slice(0, 2);
  const to = uciMove.slice(2, 4);
  const promo = uciMove[4] ? uciMove[4].toUpperCase() : "";
  return `${from}-${to}${promo}`;
}

export class StockfishWorker {
  private worker: Worker | null = null;
  private analysisBuffer = new Map<
    number,
    {
      from: string;
      to: string;
      san: string;
      score: number;
      isMate: boolean;
      mateIn: number | null;
    }
  >();
  private currentDepth = 0;
  private nps = 0;
  private currentCallback: ((analysis: EngineAnalysis) => void) | null = null;
  private currentFen = "";
  private initialized = false;
  private pendingFen: string | null = null;
  private pendingCallback: ((analysis: EngineAnalysis) => void) | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    try {
      // chrome.runtime.getURL is available in content scripts
      const stockfishUrl =
        typeof chrome !== "undefined" && chrome.runtime
          ? chrome.runtime.getURL("stockfish-nnue-16-single.js")
          : "/stockfish-nnue-16-single.js";

      this.worker = new Worker(stockfishUrl, { type: "classic" });

      this.worker.onmessage = (e: MessageEvent<string>) => {
        this.handleMessage(e.data);
      };

      this.worker.onerror = (err) => {
        console.error("[ChessMaster] Stockfish worker error:", err);
      };

      this.worker.postMessage("uci");
      this.worker.postMessage("setoption name MultiPV value 3");
      this.worker.postMessage("isready");
    } catch (err) {
      console.error(
        "[ChessMaster] Failed to initialize Stockfish worker:",
        err,
      );
    }
  }

  private send(cmd: string): void {
    this.worker?.postMessage(cmd);
  }

  private handleMessage(line: string): void {
    if (line === "readyok") {
      this.initialized = true;
      // If analyze was called before ready, run it now
      if (this.pendingFen && this.pendingCallback) {
        this.analyze(this.pendingFen, this.pendingCallback);
        this.pendingFen = null;
        this.pendingCallback = null;
      }
      return;
    }

    if (
      line.startsWith("info") &&
      line.includes("score") &&
      line.includes("pv")
    ) {
      const parsed = parseInfoLine(line);
      if (!parsed.pv || parsed.multipv === undefined) return;

      const moveParts = parsed.pv.split(" ");
      const rawMove = moveParts[0];
      if (!rawMove || rawMove.length < 4) return;

      const from = rawMove.slice(0, 2);
      const to = rawMove.slice(2, 4);
      const score = parsed.score ?? 0;
      if (parsed.nps) this.nps = parsed.nps;

      // Try to get SAN from the current FEN context
      const san = uciToLabel(rawMove);

      if ((parsed.depth ?? 0) >= this.currentDepth || parsed.multipv === 1) {
        if (parsed.multipv === 1) {
          this.currentDepth = parsed.depth ?? this.currentDepth;
          this.analysisBuffer.clear();
        }
        this.analysisBuffer.set(parsed.multipv, {
          from,
          to,
          san,
          score,
          isMate: parsed.isMate ?? false,
          mateIn: parsed.mateIn ?? null,
        });

        const topMoves: MoveHint[] = Array.from(this.analysisBuffer.entries())
          .sort(([a], [b]) => a - b)
          .slice(0, 3)
          .map(([, mv], i) => ({
            from: mv.from,
            to: mv.to,
            san: mv.san,
            evaluation: mv.score,
            rank: (i + 1) as 1 | 2 | 3,
          }));

        const best = this.analysisBuffer.get(1);
        const analysis: EngineAnalysis = {
          depth: this.currentDepth,
          evaluation: best?.score ?? 0,
          isMate: best?.isMate ?? false,
          mateIn: best?.mateIn ?? null,
          topMoves,
          isThinking: true,
          nps: this.nps,
        };

        this.currentCallback?.(analysis);
      }
    }

    if (line.startsWith("bestmove")) {
      const best = this.analysisBuffer.get(1);
      const topMoves: MoveHint[] = Array.from(this.analysisBuffer.entries())
        .sort(([a], [b]) => a - b)
        .slice(0, 3)
        .map(([, mv], i) => ({
          from: mv.from,
          to: mv.to,
          san: mv.san,
          evaluation: mv.score,
          rank: (i + 1) as 1 | 2 | 3,
        }));

      const finalAnalysis: EngineAnalysis = {
        depth: this.currentDepth,
        evaluation: best?.score ?? 0,
        isMate: best?.isMate ?? false,
        mateIn: best?.mateIn ?? null,
        topMoves,
        isThinking: false,
        nps: this.nps,
      };

      this.currentCallback?.(finalAnalysis);
    }
  }

  analyze(fen: string, callback: (analysis: EngineAnalysis) => void): void {
    if (!this.worker) return;

    // Queue if not yet initialized
    if (!this.initialized) {
      this.pendingFen = fen;
      this.pendingCallback = callback;
      return;
    }

    this.currentFen = fen;
    this.currentCallback = callback;
    this.analysisBuffer.clear();
    this.currentDepth = 0;
    this.nps = 0;

    // Notify thinking started immediately
    callback({
      depth: 0,
      evaluation: 0,
      isMate: false,
      mateIn: null,
      topMoves: [],
      isThinking: true,
      nps: 0,
    });

    this.send("stop");
    this.send("setoption name MultiPV value 3");
    this.send(`position fen ${fen}`);
    this.send("go depth 15");
  }

  stop(): void {
    this.send("stop");
    this.currentCallback = null;
  }

  terminate(): void {
    this.stop();
    this.worker?.terminate();
    this.worker = null;
  }
}
