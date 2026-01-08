'use client'

import React, { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import Board from '@/components/game/Board'
import NumberPad from '@/components/game/NumberPad'
import FeedbackBadge from '@/components/teaching/FeedbackBadge'
import HintDisplay from '@/components/teaching/HintDisplay'

export default function Play() {
  const {
    currentGrid,
    gridSize,
    difficulty,
    startNewGame,
    makeMove,
    selectCell,
    selectedCell,
    hintsUsed,
    mistakes,
    isComplete,
    startTime,
    endTime,
    historyIndex,
    moveHistory,
    isPencilMode,
    undo,
    redo,
    clearCell,
    togglePencilMode,
    useHint,
    resetGame,
    showRowHighlight,
    showColumnHighlight,
    showBoxHighlight,
    toggleRowHighlight,
    toggleColumnHighlight,
    toggleBoxHighlight,
    showErrorFeedback,
    toggleErrorFeedback,
    autoCleanPencilMarks,
    toggleAutoCleanPencilMarks
  } = useGameStore()

  // Timer state that updates every second
  const [elapsedTime, setElapsedTime] = useState('0:00')

  // Mobile keyboard input
  const mobileInputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Start a new game if none exists
    if (!currentGrid) {
      startNewGame(9, 'medium', Date.now())
    }
  }, [currentGrid, startNewGame])

  // Update timer every second
  useEffect(() => {
    if (!startTime || isComplete) return

    const updateTimer = () => {
      const end = endTime || Date.now()
      const elapsed = Math.floor((end - startTime) / 1000)
      const minutes = Math.floor(elapsed / 60)
      const seconds = elapsed % 60
      setElapsedTime(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [startTime, endTime, isComplete])

  // Focus mobile input when cell is selected (triggers native keyboard)
  useEffect(() => {
    if (selectedCell && mobileInputRef.current && window.innerWidth < 640) {
      mobileInputRef.current.focus()
    }
  }, [selectedCell])

  // Get addPencilMark for direct pencil mark handling
  const addPencilMark = useGameStore((state) => state.addPencilMark)

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys 1-9
      const digitMatch = e.code.match(/^Digit(\d)$/)
      if (digitMatch) {
        const num = parseInt(digitMatch[1])
        if (num >= 1 && num <= gridSize) {
          // Shift+Number = always pencil mark (toggle the mark)
          // Number alone = always normal entry
          if (e.shiftKey) {
            addPencilMark(num)
          } else {
            makeMove(num)
          }
          // Clear mobile input after move
          if (mobileInputRef.current) {
            mobileInputRef.current.value = ''
          }
        }
        return
      }

      // Backspace/Delete to clear
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        clearCell()
        if (mobileInputRef.current) {
          mobileInputRef.current.value = ''
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
  }, [selectedCell, currentGrid, gridSize, makeMove, selectCell, clearCell, addPencilMark])

  const handleNewGame = (size: typeof gridSize, diff: typeof difficulty) => {
    startNewGame(size, diff, Date.now())
  }

  return (
    <main className="h-screen flex flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Sudoku Fun! 🎨
          </h1>
          <div className="flex gap-2">
            <select
              value={gridSize}
              onChange={(e) => handleNewGame(Number(e.target.value) as typeof gridSize, difficulty)}
              className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border-2 border-purple-300 font-medium"
            >
              <option value={4}>4×4</option>
              <option value={6}>6×6</option>
              <option value={9}>9×9</option>
            </select>
            <select
              value={difficulty}
              onChange={(e) => handleNewGame(gridSize, e.target.value as typeof difficulty)}
              className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border-2 border-pink-300 font-medium"
            >
              <option value="beginner">Beginner</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>

        {/* Layout: Responsive - vertical on mobile, horizontal on desktop */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
          {/* Left side: Board only on desktop */}
          <div className="flex-1 flex items-center justify-center min-w-0">
            <div className="w-full h-full max-w-[600px] max-h-[600px] aspect-square">
              <Board />
            </div>
          </div>

          {/* Right side: All controls on desktop - narrower width */}
          <div className="w-full lg:w-56 flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
            {/* Stats - Compact */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center shadow">
                <div className="text-lg">⏱️</div>
                <div className="text-xs text-gray-500">Time</div>
                <div className="text-sm font-bold">{elapsedTime}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center shadow">
                <div className="text-lg">💡</div>
                <div className="text-xs text-gray-500">Hints</div>
                <div className="text-sm font-bold">{hintsUsed}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center shadow">
                <div className="text-lg">❌</div>
                <div className="text-xs text-gray-500">Errors</div>
                <div className="text-sm font-bold">{mistakes}</div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-lg">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginBottom: '6px' }}>
                <button
                  onClick={undo}
                  disabled={historyIndex < 0}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    backgroundColor: historyIndex < 0 ? '#d1d5db' : '#a855f7',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '12px',
                    transition: 'all 0.15s',
                    border: 'none',
                    cursor: historyIndex < 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  ⏪ Undo
                </button>
                <button
                  onClick={redo}
                  disabled={historyIndex >= moveHistory.length - 1}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    backgroundColor: historyIndex >= moveHistory.length - 1 ? '#d1d5db' : '#a855f7',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '12px',
                    transition: 'all 0.15s',
                    border: 'none',
                    cursor: historyIndex >= moveHistory.length - 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  ⏩ Redo
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '6px' }}>
                <button
                  onClick={clearCell}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '12px',
                    transition: 'all 0.15s',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  🗑️ Erase
                </button>
                <button
                  onClick={togglePencilMode}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    backgroundColor: isPencilMode ? '#f97316' : '#e5e7eb',
                    color: isPencilMode ? 'white' : '#111827',
                    fontWeight: '600',
                    fontSize: '12px',
                    transition: 'all 0.15s',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  ✏️ Notes
                </button>
                <button
                  onClick={useHint}
                  disabled={isComplete}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    backgroundColor: isComplete ? '#d1d5db' : '#eab308',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '12px',
                    transition: 'all 0.15s',
                    border: 'none',
                    cursor: isComplete ? 'not-allowed' : 'pointer',
                  }}
                >
                  💡 Hint
                </button>
              </div>
              <button
                onClick={resetGame}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#e5e7eb',
                  color: '#111827',
                  fontWeight: '500',
                  fontSize: '12px',
                  transition: 'all 0.15s',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                🔄 Reset
              </button>
            </div>

            {/* Helper Lights */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-lg">
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>✨ Helper Lights</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <button
                  onClick={toggleRowHighlight}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    transition: 'all 0.15s',
                    backgroundColor: showRowHighlight ? '#3b82f6' : '#e5e7eb',
                    color: showRowHighlight ? 'white' : '#111827',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  ↔️ Row
                </button>
                <button
                  onClick={toggleColumnHighlight}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    transition: 'all 0.15s',
                    backgroundColor: showColumnHighlight ? '#3b82f6' : '#e5e7eb',
                    color: showColumnHighlight ? 'white' : '#111827',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  ↕️ Col
                </button>
                <button
                  onClick={toggleBoxHighlight}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    transition: 'all 0.15s',
                    backgroundColor: showBoxHighlight ? '#3b82f6' : '#e5e7eb',
                    color: showBoxHighlight ? 'white' : '#111827',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  ⬜ Box
                </button>
              </div>
            </div>

            {/* Fun Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-lg">
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>🎨 Settings</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  onClick={toggleErrorFeedback}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    transition: 'all 0.15s',
                    backgroundColor: showErrorFeedback ? '#ef4444' : '#e5e7eb',
                    color: showErrorFeedback ? 'white' : '#111827',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {showErrorFeedback ? '🔴 Error Flash: ON' : '🔴 Error Flash: OFF'}
                </button>
                <button
                  onClick={toggleAutoCleanPencilMarks}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    transition: 'all 0.15s',
                    backgroundColor: autoCleanPencilMarks ? '#3b82f6' : '#e5e7eb',
                    color: autoCleanPencilMarks ? 'white' : '#111827',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {autoCleanPencilMarks ? '🧹 Auto-Clean: ON' : '🧹 Auto-Clean: OFF'}
                </button>
              </div>
            </div>

            {/* Number Pad */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-lg">
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>🔢 Numbers</div>
              <NumberPad />
            </div>
          </div>
        </div>

        {/* Completion Celebration */}
        {isComplete && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md shadow-2xl text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Amazing Job!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You solved it in {elapsedTime}!
              </p>
              <button
                onClick={() => handleNewGame(gridSize, difficulty)}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg transition-all active:scale-95 shadow-lg"
              >
                Play Again! 🎮
              </button>
            </div>
          </div>
        )}

        {/* Feedback Badge (floating) */}
        <FeedbackBadge />

        {/* Hint Display (floating) */}
        <HintDisplay />

        {/* Hidden input for mobile keyboard - only on small screens */}
        <input
          ref={mobileInputRef}
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          className="md:hidden fixed opacity-0 pointer-events-none"
          style={{ position: 'fixed', top: '-100px' }}
          aria-label="Number input"
        />
      </div>
    </main>
  )
}
