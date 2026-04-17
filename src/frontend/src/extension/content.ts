/**
 * ChessMaster Free — chess.com Content Script
 *
 * Runs as an IIFE side-effect in the chess.com page context.
 * Detects FEN from the live board, runs Stockfish analysis, and injects an overlay panel.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import OverlayPanel from "./OverlayPanel";
import { StockfishWorker } from "./stockfishWorker";
import type { EngineAnalysis } from "./types";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChessBoard extends HTMLElement {
  game?: {
    fen(): string;
  };
}

// ─── FEN Extraction ──────────────────────────────────────────────────────────

const PIECE_TO_FEN: Record<string, string> = {
  wK: "K",
  wQ: "Q",
  wR: "R",
  wB: "B",
  wN: "N",
  wP: "P",
  bK: "k",
  bQ: "q",
  bR: "r",
  bB: "b",
  bN: "n",
  bP: "p",
};

function extractFenFromPieces(board: HTMLElement): string | null {
  try {
    const ranks: string[] = [];
    for (let rank = 8; rank >= 1; rank--) {
      let empty = 0;
      let rankStr = "";
      for (let file = 1; file <= 8; file++) {
        const sq = `${String.fromCharCode(96 + file)}${rank}`;
        const piece = board.querySelector(
          `[class*="square-${sq}"] piece, piece[class*="square-${sq}"]`,
        );
        if (piece) {
          if (empty > 0) {
            rankStr += empty;
            empty = 0;
          }
          // Class names like "piece wK square-e1"
          const cls = piece.className;
          const match = cls.match(/\b(wK|wQ|wR|wB|wN|wP|bK|bQ|bR|bB|bN|bP)\b/);
          rankStr += match ? (PIECE_TO_FEN[match[1]] ?? "?") : "?";
        } else {
          empty++;
        }
      }
      if (empty > 0) rankStr += empty;
      ranks.push(rankStr);
    }
    const pieceStr = ranks.join("/");
    if (pieceStr === "8/8/8/8/8/8/8/8") return null;

    // Detect whose turn it is from chess.com DOM.
    // Strategy 1: active clock indicator
    let sideToMove = "w";
    try {
      const bottomActive = document.querySelector(
        ".clock-bottom.clock-player-turn, .clock-bottom .clock-player-turn",
      );
      const topActive = document.querySelector(
        ".clock-top.clock-player-turn, .clock-top .clock-player-turn",
      );
      if (bottomActive || topActive) {
        // Determine board orientation: white at bottom means bottom clock = white
        const boardEl2 = document.querySelector("chess-board");
        const orientation =
          boardEl2?.getAttribute("board-orientation") ??
          boardEl2?.getAttribute("data-board-orientation") ??
          "white";
        const whiteIsBottom = orientation !== "black";
        if (bottomActive) {
          sideToMove = whiteIsBottom ? "w" : "b";
        } else {
          sideToMove = whiteIsBottom ? "b" : "w";
        }
      } else {
        // Strategy 2: count half-moves in the move list
        // Even count → white to move; odd → black to move
        const moveItems = document.querySelectorAll(
          ".move-list-item, .node.selected ~ .node, .vertical-move-list .node",
        );
        // Simpler: count all half-move nodes in the move list
        const halfMoves = document.querySelectorAll(
          "[data-ply], .move.white, .move.black, .node",
        ).length;
        sideToMove = halfMoves % 2 === 0 ? "w" : "b";
        // Suppress unused variable warning
        void moveItems;
      }
    } catch {
      // keep sideToMove = 'w' default
    }

    return `${pieceStr} ${sideToMove} - - 0 1`;
  } catch {
    return null;
  }
}

function getFenFromBoard(board: HTMLElement): string | null {
  // 1. Primary: .game.fen() method
  const chessBoardEl = board as ChessBoard;
  try {
    const fen = chessBoardEl.game?.fen();
    if (fen?.includes("/")) return fen;
  } catch {
    /* fall through */
  }

  // 2. Fallback: data-fen attribute
  const dataFen = board.getAttribute("data-fen");
  if (dataFen?.includes("/")) return dataFen;

  // 3. Fallback: Parse piece positions from DOM elements
  const fromPieces = extractFenFromPieces(board);
  if (fromPieces) return fromPieces;

  // 4. Fallback: window globals
  try {
    const w = window as unknown as Record<string, unknown>;
    const cb = w.chessboard as { fen?: () => string } | undefined;
    const fen1 = typeof cb?.fen === "function" ? cb.fen() : null;
    if (fen1?.includes("/")) return fen1;

    const cc = w.chesscom as { fen?: () => string } | undefined;
    const fen2 = typeof cc?.fen === "function" ? cc.fen() : null;
    if (fen2?.includes("/")) return fen2;
  } catch {
    /* fall through */
  }

  return null;
}

// ─── Overlay Injection ───────────────────────────────────────────────────────

function createOverlayContainer(): HTMLElement {
  const host = document.createElement("div");
  host.id = "chessmaster-overlay-host";
  host.style.cssText = [
    "position: fixed",
    "top: 80px",
    "right: 16px",
    "z-index: 2147483647",
    "pointer-events: auto",
  ].join(";");
  return host;
}

function attachShadowRoot(host: HTMLElement): ShadowRoot {
  return host.attachShadow({ mode: "open" });
}

function createReactMount(shadowRoot: ShadowRoot): HTMLDivElement {
  const mount = document.createElement("div");
  mount.id = "chessmaster-react-root";
  shadowRoot.appendChild(mount);
  return mount;
}

// ─── Main Controller ─────────────────────────────────────────────────────────

(function init() {
  let previousFen: string | null = null;
  let reactRoot: ReturnType<typeof ReactDOM.createRoot> | null = null;
  let stockfish: StockfishWorker | null = null;
  let currentAnalysis: EngineAnalysis | null = null;
  let isActive = false;
  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let boardObserver: MutationObserver | null = null;
  let boardEl: HTMLElement | null = null;

  function renderOverlay() {
    reactRoot?.render(
      React.createElement(OverlayPanel, {
        analysis: currentAnalysis,
        isActive,
      }),
    );
  }

  function handleFenChange(newFen: string) {
    if (newFen === previousFen) return;
    previousFen = newFen;
    isActive = true;

    stockfish?.analyze(newFen, (analysis: EngineAnalysis) => {
      currentAnalysis = analysis;
      renderOverlay();
    });
  }

  function pollFen() {
    if (!boardEl) return;
    const fen = getFenFromBoard(boardEl);
    if (fen) handleFenChange(fen);
  }

  function startMonitoring(board: HTMLElement) {
    boardEl = board;

    // Inject overlay host into document body
    if (!document.getElementById("chessmaster-overlay-host")) {
      const host = createOverlayContainer();
      const shadowRoot = attachShadowRoot(host);
      const mount = createReactMount(shadowRoot);
      document.body.appendChild(host);
      reactRoot = ReactDOM.createRoot(mount);
      renderOverlay();
    }

    // Initialize Stockfish
    if (!stockfish) {
      stockfish = new StockfishWorker();
    }

    // MutationObserver on the chess-board element for attribute/child changes
    if (!boardObserver) {
      boardObserver = new MutationObserver(() => pollFen());
      boardObserver.observe(board, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-fen", "class"],
      });
    }

    // 100ms polling as a reliable backup
    if (!pollInterval) {
      pollFen(); // initial read
      pollInterval = setInterval(pollFen, 100);
    }
  }

  function waitForBoard() {
    // Check if board already exists
    const board = document.querySelector<HTMLElement>("chess-board");
    if (board) {
      startMonitoring(board);
      return;
    }

    // Watch for chess-board to appear in the DOM
    const bodyObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            const found =
              node.tagName?.toLowerCase() === "chess-board"
                ? (node as HTMLElement)
                : node.querySelector<HTMLElement>("chess-board");
            if (found) {
              bodyObserver.disconnect();
              startMonitoring(found);
              return;
            }
          }
        }
      }
    });

    bodyObserver.observe(document.body, { childList: true, subtree: true });

    // Timeout fallback: try again after 5s if board still not found
    setTimeout(() => {
      const retryBoard = document.querySelector<HTMLElement>("chess-board");
      if (retryBoard && !pollInterval) {
        bodyObserver.disconnect();
        startMonitoring(retryBoard);
      }
    }, 5000);
  }

  // Wait for DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForBoard, { once: true });
  } else {
    waitForBoard();
  }
})();
