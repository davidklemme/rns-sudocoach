'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import Board from '@/components/game/Board'
import NumberPad from '@/components/game/NumberPad'
import Controls from '@/components/game/Controls'
import Link from 'next/link'

export default function Play() {
  const { currentGrid, gridSize, difficulty, startNewGame, makeMove, selectCell, selectedCell } =
    useGameStore()

  useEffect(() => {
    // Start a new game if none exists
    if (!currentGrid) {
      startNewGame(9, 'medium', Date.now())
    }
  }, [currentGrid, startNewGame])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys 1-9
      if (e.key >= '1' && e.key <= '9') {
        const num = parseInt(e.key)
        if (num <= gridSize) {
          makeMove(num)
        }
        return
      }

      // Arrow keys for navigation
      if (!selectedCell || !currentGrid) return

      let newRow = selectedCell.row
      let newCol = selectedCell.col

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          newRow = Math.max(0, selectedCell.row - 1)
          break
        case 'ArrowDown':
          e.preventDefault()
          newRow = Math.min(gridSize - 1, selectedCell.row + 1)
          break
        case 'ArrowLeft':
          e.preventDefault()
          newCol = Math.max(0, selectedCell.col - 1)
          break
        case 'ArrowRight':
          e.preventDefault()
          newCol = Math.min(gridSize - 1, selectedCell.col + 1)
          break
        default:
          return
      }

      if (newRow !== selectedCell.row || newCol !== selectedCell.col) {
        selectCell(newRow, newCol)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCell, currentGrid, gridSize, makeMove, selectCell])

  const handleNewGame = (size: typeof gridSize, diff: typeof difficulty) => {
    startNewGame(size, diff, Date.now())
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            ← Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Sudoku Teacher
          </h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        {/* New Game Options */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            New Game
          </h2>

          <div className="space-y-4">
            {/* Grid Size */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Grid Size
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleNewGame(4, difficulty)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    gridSize === 4
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  4x4
                </button>
                <button
                  onClick={() => handleNewGame(6, difficulty)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    gridSize === 6
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  6x6
                </button>
                <button
                  onClick={() => handleNewGame(9, difficulty)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    gridSize === 9
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  9x9
                </button>
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Difficulty
              </label>
              <div className="flex gap-2 flex-wrap">
                {(['beginner', 'easy', 'medium', 'hard', 'expert'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => handleNewGame(gridSize, diff)}
                    className={`px-3 py-2 rounded-lg transition-colors capitalize ${
                      difficulty === diff
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Board */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            <Board />
          </div>

          {/* Controls & Number Pad */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <Controls />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <NumberPad />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
            How to Play
          </h3>
          <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
            <li>• Click a cell to select it</li>
            <li>• Use number buttons or keyboard (1-9) to fill cells</li>
            <li>• Use arrow keys to navigate between cells</li>
            <li>• Enable Pencil Mode to add candidate numbers</li>
            <li>• Use Hint if you get stuck (fills selected cell)</li>
            <li>• Undo/Redo to review your moves</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
