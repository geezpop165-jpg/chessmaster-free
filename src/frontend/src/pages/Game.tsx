import { useNavigate } from "@tanstack/react-router";
import { Chess } from "chess.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { Chessboard, ChessboardProvider } from "react-chessboard";
import type {
  Arrow,
  PieceDropHandlerArgs,
  SquareHandlerArgs,
} from "react-chessboard";
import { AnalysisSidebar } from "../components/game/AnalysisSidebar";
import { EvaluationBar } from "../components/game/EvaluationBar";
import { GameHeader } from "../components/game/GameHeader";
import { GameOverlay } from "../components/game/GameOverlay";
import { useStockfish } from "../hooks/useStockfish";
import { useGameStore } from "../store/gameStore";

export default function GamePage() {
  const navigate = useNavigate();
  const {
    fen,
    turn,
    gameMode,
    difficulty,
    playerColor,
    boardFlipped,
    gameStatus,
    analysis,
    moveHistory,
    selectedSquare,
    lastMove,
    makeMove,
    flipBoard,
    resignGame,
    initGame,
    setDifficulty,
    setGameMode,
    setSelectedSquare,
    getLegalMoves,
  } = useGameStore();

  useStockfish();

  const [legalMoveSquares, setLegalMoveSquares] = useState<string[]>([]);
  const [promotionPending, setPromotionPending] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const prevTurnRef = useRef(turn);

  // Redirect if no game started
  useEffect(() => {
    if (gameStatus === "idle") {
      navigate({ to: "/" });
    }
  }, [gameStatus, navigate]);

  // Pass-and-play: flip board automatically after each move
  useEffect(() => {
    if (
      gameMode === "pass-and-play" &&
      turn !== prevTurnRef.current &&
      gameStatus === "playing"
    ) {
      const timer = setTimeout(() => flipBoard(), 400);
      prevTurnRef.current = turn;
      return () => clearTimeout(timer);
    }
    prevTurnRef.current = turn;
  }, [turn, gameMode, flipBoard, gameStatus]);

  // Update legal move highlights when a square is selected
  useEffect(() => {
    if (selectedSquare) {
      setLegalMoveSquares(getLegalMoves(selectedSquare));
    } else {
      setLegalMoveSquares([]);
    }
  }, [selectedSquare, getLegalMoves]);

  const isMyTurn = useMemo(() => {
    if (gameMode === "pass-and-play") return true;
    return (
      (playerColor === "white" && turn === "w") ||
      (playerColor === "black" && turn === "b")
    );
  }, [gameMode, playerColor, turn]);

  // Last move squares for highlighting
  const lastMoveSquares = useMemo(() => {
    if (!lastMove) return {};
    const styles: Record<string, React.CSSProperties> = {};
    styles[lastMove.from] = { backgroundColor: "oklch(var(--primary) / 0.2)" };
    styles[lastMove.to] = { backgroundColor: "oklch(var(--primary) / 0.35)" };
    return styles;
  }, [lastMove]);

  const handleSquareClick = ({ square, piece }: SquareHandlerArgs) => {
    if (!isMyTurn || gameStatus !== "playing") return;
    void piece;

    if (selectedSquare) {
      if (legalMoveSquares.includes(square)) {
        const chess = new Chess(fen);
        const movingPiece = chess.get(
          selectedSquare as Parameters<typeof chess.get>[0],
        );
        const isPromotion =
          movingPiece?.type === "p" &&
          ((movingPiece.color === "w" && square[1] === "8") ||
            (movingPiece.color === "b" && square[1] === "1"));

        if (isPromotion) {
          setPromotionPending({ from: selectedSquare, to: square });
          setSelectedSquare(null);
          return;
        }
        makeMove(selectedSquare, square);
      } else {
        const chess = new Chess(fen);
        const clickedPiece = chess.get(
          square as Parameters<typeof chess.get>[0],
        );
        if (clickedPiece && clickedPiece.color === turn) {
          setSelectedSquare(square);
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      const chess = new Chess(fen);
      const clickedPiece = chess.get(square as Parameters<typeof chess.get>[0]);
      if (clickedPiece && clickedPiece.color === turn) {
        setSelectedSquare(square);
      }
    }
  };

  const handlePieceDrop = ({
    sourceSquare,
    targetSquare,
  }: PieceDropHandlerArgs): boolean => {
    if (!isMyTurn || gameStatus !== "playing" || !targetSquare) return false;
    return makeMove(sourceSquare, targetSquare);
  };

  const handlePromotion = (piece: string) => {
    if (!promotionPending) return;
    makeMove(promotionPending.from, promotionPending.to, piece);
    setPromotionPending(null);
  };

  // Build arrow hints from top moves
  const arrows: Arrow[] = useMemo(() => {
    const colors = ["#10b981cc", "#38bdf8cc", "#fbbf24cc"];
    return analysis.topMoves.slice(0, 3).map((mv, i) => ({
      startSquare: mv.from,
      endSquare: mv.to,
      color: colors[i],
    }));
  }, [analysis.topMoves]);

  // Build square styles: selected, legal moves
  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: "oklch(var(--primary) / 0.45)",
        boxShadow: "inset 0 0 0 2px oklch(var(--primary) / 0.8)",
      };
    }
    for (const sq of legalMoveSquares) {
      styles[sq] = {
        background:
          "radial-gradient(circle, oklch(var(--accent) / 0.5) 30%, transparent 31%)",
      };
    }
    return styles;
  }, [selectedSquare, legalMoveSquares]);

  const handleNewGame = () => initGame(gameMode, difficulty, playerColor);
  const handleResign = () => resignGame();

  if (gameStatus === "idle") return null;

  const isGameOver =
    gameStatus === "checkmate" ||
    gameStatus === "stalemate" ||
    gameStatus === "resigned" ||
    gameStatus === "draw";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GameHeader
        gameMode={gameMode}
        difficulty={difficulty}
        turn={turn}
        isThinking={analysis.isThinking}
        onFlipBoard={flipBoard}
        onNewGame={handleNewGame}
        onResign={handleResign}
        onDifficultyChange={setDifficulty}
        onModeChange={(mode) => {
          setGameMode(mode);
          initGame(mode, difficulty, playerColor);
        }}
      />

      {/* Main layout: eval bar | board | sidebar (mobile: stacked) */}
      <div className="flex-1 flex min-h-0 overflow-hidden flex-col lg:flex-row">
        {/* Evaluation Bar — left on desktop, hidden on mobile */}
        <div className="hidden lg:flex">
          <EvaluationBar
            evaluation={analysis.evaluation}
            isMate={analysis.isMate}
            mateIn={analysis.mateIn}
          />
        </div>

        {/* Board + mobile eval area */}
        <div className="flex flex-1 items-center justify-center p-3 sm:p-4 lg:p-6 bg-background min-w-0 min-h-0">
          {/* Mobile: horizontal eval bar above board */}
          <div className="lg:hidden w-full max-w-[min(calc(100vw-2rem),560px)] mb-3">
            <EvaluationBar
              evaluation={analysis.evaluation}
              isMate={analysis.isMate}
              mateIn={analysis.mateIn}
              horizontal
            />
          </div>
          <div
            className="w-full max-w-[min(calc(100vh-13rem),600px)] lg:max-w-[min(calc(100vh-10rem),660px)] aspect-square board-shadow rounded-sm"
            data-ocid="game.board"
          >
            <ChessboardProvider
              options={{
                position: fen,
                boardOrientation: boardFlipped ? "black" : "white",
                arrows,
                squareStyles: { ...squareStyles, ...lastMoveSquares },
                allowDrawingArrows: true,
                showAnimations: true,
                animationDurationInMs: 200,
                onSquareClick: handleSquareClick,
                onPieceDrop: handlePieceDrop,
                canDragPiece: ({ isSparePiece }) =>
                  !isSparePiece && isMyTurn && gameStatus === "playing",
                lightSquareStyle: { backgroundColor: "var(--chess-light)" },
                darkSquareStyle: { backgroundColor: "var(--chess-dark)" },
                boardStyle: { borderRadius: "4px", overflow: "hidden" },
              }}
            >
              <Chessboard />
            </ChessboardProvider>
          </div>
        </div>

        {/* Analysis Sidebar */}
        <AnalysisSidebar
          analysis={analysis}
          moveHistory={moveHistory}
          turn={turn}
          gameMode={gameMode}
          playerColor={playerColor}
        />
      </div>

      {/* Promotion Dialog */}
      {promotionPending && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
          data-ocid="promotion.dialog"
        >
          <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-display font-bold text-lg text-center text-foreground">
              Promote Pawn
            </h3>
            <div className="flex gap-3">
              {["q", "r", "b", "n"].map((p) => (
                <button
                  key={p}
                  type="button"
                  data-ocid={`promotion.piece_${p}`}
                  onClick={() => handlePromotion(p)}
                  className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center text-3xl hover:bg-accent transition-smooth border border-border hover:border-primary cursor-pointer"
                >
                  {turn === "w"
                    ? { q: "♕", r: "♖", b: "♗", n: "♘" }[p]
                    : { q: "♛", r: "♜", b: "♝", n: "♞" }[p]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {isGameOver && (
        <GameOverlay
          status={gameStatus}
          turn={turn}
          gameMode={gameMode}
          playerColor={playerColor}
          onNewGame={handleNewGame}
          onHome={() => navigate({ to: "/" })}
        />
      )}
    </div>
  );
}
