'use client';

import React, { Suspense, useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';

import { GameShell } from '@/components/layout/GameShell';
import { Header } from '@/components/layout/Header';
import { Grid } from '@/components/sudoku/Grid';
import { NumberDock } from '@/components/sudoku/NumberDock';
import { ActionBar } from '@/components/sudoku/ActionBar';
import { CoachZone } from '@/components/coach/CoachZone';
import { PlayerSelect } from '@/components/coach/PlayerSelect';
import CompletionModal from '@/components/game/CompletionModal';

import { CellHighlights, posKey } from '@/lib/colors/highlights';
import { findConflicts, createConflictHighlights, createHighlightsForHint, StrategyHintResult } from '@/lib/colors/strategy-highlights';
import { GridSize, Difficulty } from '@/lib/sudoku/types';

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          <p className="text-gray-500">Loading...</p>
        </div>
      }
    >
      <Play />
    </Suspense>
  );
}

function Play() {
  const searchParams = useSearchParams();

  const {
    currentGrid,
    initialGrid,
    gridSize,
    difficulty,
    startNewGame,
    makeMove,
    selectCell,
    selectedCell,
    isComplete,
    startTime,
    endTime,
    clearCell,
    pencilMarks,
    isPencilMode,
    togglePencilMode,
    addPencilMark,
    undo,
    redo,
    moveHistory,
    historyIndex,
    useHint,
    hintCell,
    hintStrategy,
    dismissHint,
    highlightedCells,
  } = useGameStore();

  const [elapsedTime, setElapsedTime] = useState('0:00');
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);
  const [coachMessage, setCoachMessage] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<CellHighlights>(new Map());

  // Persist player selection — empty string means "skipped"
  useEffect(() => {
    const savedName = localStorage.getItem('rns-player-name');
    if (savedName !== null) {
      setPlayerName(savedName || null);
    } else {
      setShowPlayerSelect(true);
    }
  }, []);

  useEffect(() => {
    if (!currentGrid) {
      const sizeParam = searchParams.get('size');
      const size = sizeParam === '6' ? 6 : sizeParam === '9' ? 9 : 4;
      const diff = size === 9 ? 'medium' : size === 6 ? 'easy' : 'beginner';
      startNewGame(size as GridSize, diff, Date.now());
    }
  }, [currentGrid, startNewGame, searchParams]);

  useEffect(() => {
    if (!startTime || isComplete) return;

    const updateTimer = () => {
      const end = endTime || Date.now();
      const elapsed = Math.floor((end - startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      setElapsedTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime, isComplete]);

  const getHintMessage = useCallback(() => {
    const name = playerName || '';
    const prefix = name ? `${name}, ` : '';

    if (!hintStrategy) {
      return `${prefix}Look at the green cell! Try to figure out what goes there.`;
    }

    switch (hintStrategy.strategy) {
      case 'single_candidate':
        return `${prefix}Look at the green cell! Count the numbers in its row, column, and box - only one is missing!`;
      case 'hidden_single':
        return `${prefix}Check the highlighted area. This number can only go in the green cell!`;
      case 'elimination':
        return `${prefix}Use elimination! Cross out numbers that are already used nearby.`;
      case 'naked_pair':
        return `${prefix}Look at the yellow cells! They share the same two numbers, so the green cell can only be one thing!`;
      case 'pointing_pair':
        return `${prefix}Look at how the boxes connect to the rows and columns!`;
      case 'advanced':
        return `${prefix}This puzzle is tricky! Try using pencil marks to track which numbers could go where.`;
      default:
        return `${prefix}Look at the green cell! Check which numbers are already in its row, column, and box.`;
    }
  }, [playerName, hintStrategy]);

  // Build the full highlights map: selection < hints < conflicts
  useEffect(() => {
    if (!currentGrid) return;

    const newHighlights: CellHighlights = new Map();

    // Layer 1: row/col/box selection highlights (lowest priority)
    // highlightedCells uses "row,col" keys; posKey uses "row-col"
    highlightedCells.forEach((key) => {
      const [row, col] = key.split(',').map(Number);
      newHighlights.set(`${row}-${col}`, { type: 'focus', intensity: 'subtle' });
    });

    // Layer 2: hint highlights override selection
    if (hintCell && hintStrategy) {
      const hintResult: StrategyHintResult = {
        type: hintStrategy.strategy,
        targetCell: { row: hintCell.row, col: hintCell.col },
        targetValue: hintCell.value,
        relatedCells: hintStrategy.affectedCells,
      };
      const hintHighlights = createHighlightsForHint(hintResult, gridSize);
      hintHighlights.forEach((h, k) => newHighlights.set(k, h));
      setCoachMessage(getHintMessage());
    } else if (hintCell) {
      newHighlights.set(posKey({ row: hintCell.row, col: hintCell.col }), {
        type: 'solvable',
        animate: true,
      });
      setCoachMessage(getHintMessage());
    } else if (hintStrategy?.strategy === 'advanced') {
      setCoachMessage(getHintMessage());
    }

    // Layer 3: conflict highlights (highest priority)
    const conflicts = findConflicts(currentGrid, gridSize);
    if (conflicts.length > 0) {
      const conflictHighlights = createConflictHighlights(conflicts);
      conflictHighlights.forEach((h, k) => newHighlights.set(k, h));
      setCoachMessage(
        playerName
          ? `Oops ${playerName}, there's a duplicate! Look at the red cells.`
          : "Oops, there's a duplicate! Look at the red cells."
      );
    } else if (!hintCell && hintStrategy?.strategy !== 'advanced') {
      setCoachMessage(null);
    }

    setHighlights(newHighlights);
  }, [currentGrid, hintCell, hintStrategy, gridSize, playerName, highlightedCells, getHintMessage]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const digitMatch = e.code.match(/^Digit(\d)$/);
      if (digitMatch) {
        const num = parseInt(digitMatch[1]);
        if (num >= 1 && num <= gridSize) {
          if (e.shiftKey) {
            addPencilMark(num);
          } else {
            makeMove(num);
          }
        }
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        clearCell();
        return;
      }

      if (!selectedCell || !currentGrid) return;

      let newRow = selectedCell.row;
      let newCol = selectedCell.col;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          newRow = Math.max(0, selectedCell.row - 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newRow = Math.min(gridSize - 1, selectedCell.row + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newCol = Math.max(0, selectedCell.col - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          newCol = Math.min(gridSize - 1, selectedCell.col + 1);
          break;
        default:
          return;
      }

      if (newRow !== selectedCell.row || newCol !== selectedCell.col) {
        selectCell(newRow, newCol);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, currentGrid, gridSize, makeMove, selectCell, clearCell, addPencilMark]);

  // Compute which numbers are fully placed (appear gridSize times)
  const completedNumbers = useMemo(() => {
    if (!currentGrid) return new Set<number>();
    const counts = new Map<number, number>();
    currentGrid.forEach((row) =>
      row.forEach((cell) => {
        if (cell !== null && cell !== 0) {
          counts.set(cell, (counts.get(cell) ?? 0) + 1);
        }
      })
    );
    const completed = new Set<number>();
    counts.forEach((count, num) => {
      if (count === gridSize) completed.add(num);
    });
    return completed;
  }, [currentGrid, gridSize]);

  const handlePlayerSelect = useCallback((name: string) => {
    localStorage.setItem('rns-player-name', name); // '' persists skip
    setPlayerName(name || null);
    setShowPlayerSelect(false);
  }, []);

  const handleGridSizeChange = useCallback(
    (size: GridSize) => {
      dismissHint();
      setHighlights(new Map());
      setCoachMessage(null);
      startNewGame(size, difficulty, Date.now());
    },
    [difficulty, startNewGame, dismissHint]
  );

  const handleDifficultyChange = useCallback(
    (diff: Difficulty) => {
      dismissHint();
      setHighlights(new Map());
      setCoachMessage(null);
      startNewGame(gridSize, diff, Date.now());
    },
    [gridSize, startNewGame, dismissHint]
  );

  const handleNumberClick = useCallback(
    (num: number) => {
      if (isPencilMode) {
        addPencilMark(num);
      } else {
        makeMove(num);
      }
    },
    [isPencilMode, addPencilMark, makeMove]
  );

  const handleNewGame = useCallback(() => {
    dismissHint();
    setHighlights(new Map());
    startNewGame(gridSize, difficulty, Date.now());
    setCoachMessage(
      playerName ? `New puzzle, ${playerName}! Let's do this!` : "New puzzle! Let's do this!"
    );
  }, [gridSize, difficulty, startNewGame, playerName, dismissHint]);

  if (!currentGrid || !initialGrid) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <GameShell
        header={
          <Header
            gridSize={gridSize}
            difficulty={difficulty}
            playerName={playerName}
            onGridSizeChange={handleGridSizeChange}
            onDifficultyChange={handleDifficultyChange}
            onPlayerClick={() => setShowPlayerSelect(true)}
            onNewGame={handleNewGame}
          />
        }
        grid={
          <Grid
            grid={currentGrid}
            initialGrid={initialGrid}
            gridSize={gridSize}
            selectedCell={selectedCell}
            highlights={highlights}
            pencilMarks={pencilMarks}
            onCellClick={selectCell}
          />
        }
        coach={<CoachZone playerName={playerName} message={coachMessage} />}
        controls={
          <div className="space-y-3">
            <NumberDock
              gridSize={gridSize}
              onNumberClick={handleNumberClick}
              isPencilMode={isPencilMode}
              completedNumbers={completedNumbers}
            />
            <ActionBar
              canUndo={historyIndex >= 0}
              canRedo={historyIndex < moveHistory.length - 1}
              isPencilMode={isPencilMode}
              onUndo={undo}
              onRedo={redo}
              onTogglePencil={togglePencilMode}
              onHint={useHint}
              onClear={clearCell}
              onNewGame={handleNewGame}
            />
          </div>
        }
      />

      {showPlayerSelect && <PlayerSelect onSelect={handlePlayerSelect} />}
      <CompletionModal elapsedTime={elapsedTime} />
    </>
  );
}
