'use client'

import { useGameStore } from '@/store/gameStore'

export default function Controls() {
  const {
    undo,
    redo,
    clearCell,
    togglePencilMode,
    useHint,
    resetGame,
    historyIndex,
    moveHistory,
    isPencilMode,
    hintsUsed,
    mistakes,
    isComplete,
    startTime,
    endTime,
  } = useGameStore()

  const canUndo = historyIndex >= 0
  const canRedo = historyIndex < moveHistory.length - 1

  const getElapsedTime = () => {
    if (!startTime) return '0:00'

    const end = endTime || Date.now()
    const elapsed = Math.floor((end - startTime) / 1000)
    const minutes = Math.floor(elapsed / 60)
    const seconds = elapsed % 60

    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
          <div className="text-xs text-gray-600 dark:text-gray-400">Time</div>
          <div className="text-lg font-bold">{getElapsedTime()}</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
          <div className="text-xs text-gray-600 dark:text-gray-400">Hints</div>
          <div className="text-lg font-bold">{hintsUsed}</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
          <div className="text-xs text-gray-600 dark:text-gray-400">Mistakes</div>
          <div className="text-lg font-bold text-red-600 dark:text-red-400">{mistakes}</div>
        </div>
      </div>

      {/* Completion message */}
      {isComplete && (
        <div className="bg-green-100 dark:bg-green-900 border-2 border-green-500 rounded-lg p-4 text-center">
          <p className="text-xl font-bold text-green-800 dark:text-green-200">
            🎉 Puzzle Complete!
          </p>
          <p className="text-sm text-green-700 dark:text-green-300">
            Time: {getElapsedTime()} | Hints: {hintsUsed} | Mistakes: {mistakes}
          </p>
        </div>
      )}

      {/* Primary controls */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          ↶ Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          ↷ Redo
        </button>
      </div>

      {/* Secondary controls */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={clearCell}
          className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors active:scale-95"
        >
          Clear
        </button>
        <button
          onClick={togglePencilMode}
          className={`px-3 py-2 rounded-lg font-medium transition-colors active:scale-95 ${
            isPencilMode
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
          }`}
        >
          ✏️ Pencil
        </button>
        <button
          onClick={useHint}
          disabled={isComplete}
          className="px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-medium transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          💡 Hint
        </button>
      </div>

      {/* Reset button */}
      <button
        onClick={resetGame}
        className="w-full px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 font-medium transition-colors"
      >
        Reset Puzzle
      </button>
    </div>
  )
}
