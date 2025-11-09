/**
 * Game state management with Zustand
 */

import { create } from 'zustand'
import type { SudokuGrid, GridSize, Difficulty, Move } from '@/lib/sudoku/types'
import { generatePuzzle } from '@/lib/sudoku/generator'
import { isValidMove, cloneGrid } from '@/lib/sudoku/validator'
import { detectStrategy, type Strategy, type StrategyResult } from '@/lib/sudoku/strategies'
import { extractFeatures } from '@/lib/ml/features'
import { mockPredict } from '@/lib/ml/mock'

export interface GameState {
  // Puzzle data
  puzzleId: string | null
  initialGrid: SudokuGrid | null
  currentGrid: SudokuGrid | null
  solution: SudokuGrid | null
  gridSize: GridSize
  difficulty: Difficulty

  // Game state
  selectedCell: { row: number; col: number } | null
  moveHistory: Move[]
  historyIndex: number
  hintsUsed: number
  mistakes: number
  isComplete: boolean
  startTime: number | null
  endTime: number | null

  // Pencil marks (candidates)
  pencilMarks: Map<string, Set<number>>
  isPencilMode: boolean

  // UI state
  highlightedCells: Set<string>
  errorCells: Set<string>

  // Teaching state
  lastStrategy: StrategyResult | null
  showFeedback: boolean
  strategiesUsed: Map<Strategy, number>

  // Actions
  startNewGame: (size: GridSize, difficulty: Difficulty, seed?: number) => void
  selectCell: (row: number, col: number) => void
  makeMove: (value: number) => void
  clearCell: () => void
  undo: () => void
  redo: () => void
  togglePencilMode: () => void
  addPencilMark: (value: number) => void
  removePencilMark: (value: number) => void
  clearPencilMarks: () => void
  useHint: () => void
  resetGame: () => void
  dismissFeedback: () => void
}

const cellKey = (row: number, col: number): string => `${row},${col}`

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  puzzleId: null,
  initialGrid: null,
  currentGrid: null,
  solution: null,
  gridSize: 9,
  difficulty: 'medium',
  selectedCell: null,
  moveHistory: [],
  historyIndex: -1,
  hintsUsed: 0,
  mistakes: 0,
  isComplete: false,
  startTime: null,
  endTime: null,
  pencilMarks: new Map(),
  isPencilMode: false,
  highlightedCells: new Set(),
  errorCells: new Set(),
  lastStrategy: null,
  showFeedback: false,
  strategiesUsed: new Map(),

  // Start a new game
  startNewGame: (size: GridSize, difficulty: Difficulty, seed?: number) => {
    const puzzle = generatePuzzle(size, difficulty, seed)

    set({
      puzzleId: puzzle.id,
      initialGrid: puzzle.grid,
      currentGrid: cloneGrid(puzzle.grid),
      solution: puzzle.solution,
      gridSize: size,
      difficulty,
      selectedCell: null,
      moveHistory: [],
      historyIndex: -1,
      hintsUsed: 0,
      mistakes: 0,
      isComplete: false,
      startTime: Date.now(),
      endTime: null,
      pencilMarks: new Map(),
      isPencilMode: false,
      highlightedCells: new Set(),
      errorCells: new Set(),
      lastStrategy: null,
      showFeedback: false,
      strategiesUsed: new Map(),
    })
  },

  // Select a cell
  selectCell: (row: number, col: number) => {
    const { currentGrid, gridSize, initialGrid } = get()

    if (!currentGrid || row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
      return
    }

    // Can't select initial cells
    if (initialGrid && initialGrid[row][col] !== null) {
      return
    }

    set({ selectedCell: { row, col } })

    // Update highlighted cells (same row, col, box)
    const highlighted = new Set<string>()

    // Same row
    for (let c = 0; c < gridSize; c++) {
      highlighted.add(cellKey(row, c))
    }

    // Same column
    for (let r = 0; r < gridSize; r++) {
      highlighted.add(cellKey(r, col))
    }

    // Same box
    const boxSize = gridSize === 4 ? 2 : gridSize === 6 ? 2 : 3
    const boxColSize = gridSize === 6 ? 3 : boxSize
    const boxRow = Math.floor(row / boxSize) * boxSize
    const boxCol = Math.floor(col / boxColSize) * boxColSize

    for (let r = boxRow; r < boxRow + boxSize; r++) {
      for (let c = boxCol; c < boxCol + boxColSize; c++) {
        highlighted.add(cellKey(r, c))
      }
    }

    set({ highlightedCells: highlighted })
  },

  // Make a move
  makeMove: (value: number) => {
    const {
      selectedCell,
      currentGrid,
      solution,
      initialGrid,
      moveHistory,
      historyIndex,
      isPencilMode,
      gridSize,
    } = get()

    if (!selectedCell || !currentGrid || !solution || !initialGrid) {
      return
    }

    const { row, col } = selectedCell

    // Can't modify initial cells
    if (initialGrid[row][col] !== null) {
      return
    }

    // Handle pencil mode
    if (isPencilMode) {
      get().addPencilMark(value)
      return
    }

    // Validate move
    if (!isValidMove(currentGrid, row, col, value)) {
      // Invalid move - show error
      const errorCells = new Set<string>()
      errorCells.add(cellKey(row, col))
      set({ errorCells })

      // Clear error after animation
      setTimeout(() => {
        set({ errorCells: new Set() })
      }, 300)

      set((state) => ({ mistakes: state.mistakes + 1 }))
      return
    }

    // Make the move
    const newGrid = cloneGrid(currentGrid)
    const previousValue = newGrid[row][col]
    newGrid[row][col] = value

    // Add to history (remove any future history)
    const moveTimestamp = Date.now()
    const newMove: Move = {
      row,
      col,
      value,
      timestamp: moveTimestamp,
    }

    const newHistory = moveHistory.slice(0, historyIndex + 1)
    newHistory.push(newMove)

    // Clear pencil marks for this cell
    const newPencilMarks = new Map(get().pencilMarks)
    newPencilMarks.delete(cellKey(row, col))

    // Update state immediately for responsive UI
    set({
      currentGrid: newGrid,
      moveHistory: newHistory,
      historyIndex: newHistory.length - 1,
      pencilMarks: newPencilMarks,
    })

    // Check if puzzle is complete
    const isComplete = checkCompletion(newGrid, solution)
    if (isComplete) {
      set({
        isComplete: true,
        endTime: Date.now(),
      })
    }

    // Run ML prediction asynchronously in the background
    const predictStrategy = async () => {
      try {
        // Calculate time since last move
        const timeSinceLastMove =
          moveHistory.length > 0 ? moveTimestamp - moveHistory[moveHistory.length - 1].timestamp : 0

        // Extract recent moves (last 5)
        const recentMoves = moveHistory.slice(-5).map((m) => ({ row: m.row, col: m.col }))

        // Get previous strategies (last 5)
        const previousStrategies = Array.from(get().strategiesUsed.keys()).slice(-5)

        // Extract features for ML model
        const features = extractFeatures(currentGrid, row, col, value, {
          timeSinceLastMove,
          recentMoves,
          errorCount: get().mistakes,
          previousStrategies,
        })

        // Run async ML prediction
        const prediction = await mockPredict(features)

        // Convert ML prediction to StrategyResult format
        const strategy: StrategyResult = {
          strategy: prediction.strategy as Strategy,
          confidence: prediction.confidence,
          explanation: `Strategy detected: ${prediction.strategy} (${Math.round(prediction.confidence * 100)}% confidence)`,
        }

        // Update strategies used counter
        const currentStrategiesUsed = get().strategiesUsed
        const newStrategiesUsed = new Map(currentStrategiesUsed)
        const count = newStrategiesUsed.get(strategy.strategy) || 0
        newStrategiesUsed.set(strategy.strategy, count + 1)

        // Update state with ML results
        set({
          lastStrategy: strategy,
          showFeedback: strategy.confidence > 0.7, // Show feedback for confident detections
          strategiesUsed: newStrategiesUsed,
        })
      } catch (error) {
        console.error('ML prediction failed:', error)
        // Fallback to rule-based detection on error
        const strategy = detectStrategy(currentGrid, row, col, value)
        const newStrategiesUsed = new Map(get().strategiesUsed)
        const count = newStrategiesUsed.get(strategy.strategy) || 0
        newStrategiesUsed.set(strategy.strategy, count + 1)

        set({
          lastStrategy: strategy,
          showFeedback: strategy.confidence > 0.7,
          strategiesUsed: newStrategiesUsed,
        })
      }
    }

    // Fire and forget - don't block UI
    predictStrategy()
  },

  // Clear the selected cell
  clearCell: () => {
    const { selectedCell, currentGrid, initialGrid, moveHistory, historyIndex } = get()

    if (!selectedCell || !currentGrid || !initialGrid) {
      return
    }

    const { row, col } = selectedCell

    // Can't clear initial cells
    if (initialGrid[row][col] !== null) {
      return
    }

    const newGrid = cloneGrid(currentGrid)
    newGrid[row][col] = null

    const newMove: Move = {
      row,
      col,
      value: 0, // 0 indicates clearing
      timestamp: Date.now(),
    }

    const newHistory = moveHistory.slice(0, historyIndex + 1)
    newHistory.push(newMove)

    set({
      currentGrid: newGrid,
      moveHistory: newHistory,
      historyIndex: newHistory.length - 1,
    })
  },

  // Undo last move
  undo: () => {
    const { moveHistory, historyIndex, initialGrid } = get()

    if (historyIndex < 0 || !initialGrid) {
      return
    }

    const newGrid = cloneGrid(initialGrid)

    // Replay moves up to historyIndex - 1
    for (let i = 0; i < historyIndex; i++) {
      const move = moveHistory[i]
      newGrid[move.row][move.col] = move.value === 0 ? null : move.value
    }

    set({
      currentGrid: newGrid,
      historyIndex: historyIndex - 1,
      isComplete: false,
    })
  },

  // Redo next move
  redo: () => {
    const { moveHistory, historyIndex, currentGrid } = get()

    if (historyIndex >= moveHistory.length - 1 || !currentGrid) {
      return
    }

    const nextMove = moveHistory[historyIndex + 1]
    const newGrid = cloneGrid(currentGrid)
    newGrid[nextMove.row][nextMove.col] = nextMove.value === 0 ? null : nextMove.value

    set({
      currentGrid: newGrid,
      historyIndex: historyIndex + 1,
    })
  },

  // Toggle pencil mode
  togglePencilMode: () => {
    set((state) => ({ isPencilMode: !state.isPencilMode }))
  },

  // Add pencil mark to selected cell
  addPencilMark: (value: number) => {
    const { selectedCell, pencilMarks, currentGrid } = get()

    if (!selectedCell || !currentGrid) {
      return
    }

    const { row, col } = selectedCell

    // Can't add pencil marks to filled cells
    if (currentGrid[row][col] !== null) {
      return
    }

    const key = cellKey(row, col)
    const newPencilMarks = new Map(pencilMarks)

    if (!newPencilMarks.has(key)) {
      newPencilMarks.set(key, new Set())
    }

    const marks = newPencilMarks.get(key)!
    if (marks.has(value)) {
      marks.delete(value)
    } else {
      marks.add(value)
    }

    set({ pencilMarks: newPencilMarks })
  },

  // Remove pencil mark
  removePencilMark: (value: number) => {
    const { selectedCell, pencilMarks } = get()

    if (!selectedCell) {
      return
    }

    const key = cellKey(selectedCell.row, selectedCell.col)
    const newPencilMarks = new Map(pencilMarks)

    if (newPencilMarks.has(key)) {
      newPencilMarks.get(key)!.delete(value)
    }

    set({ pencilMarks: newPencilMarks })
  },

  // Clear all pencil marks for selected cell
  clearPencilMarks: () => {
    const { selectedCell, pencilMarks } = get()

    if (!selectedCell) {
      return
    }

    const key = cellKey(selectedCell.row, selectedCell.col)
    const newPencilMarks = new Map(pencilMarks)
    newPencilMarks.delete(key)

    set({ pencilMarks: newPencilMarks })
  },

  // Use a hint
  useHint: () => {
    const { selectedCell, solution, currentGrid } = get()

    if (!selectedCell || !solution || !currentGrid) {
      return
    }

    const { row, col } = selectedCell
    const correctValue = solution[row][col]

    if (correctValue === null) {
      return
    }

    // Make the move automatically
    const newGrid = cloneGrid(currentGrid)
    newGrid[row][col] = correctValue

    set({
      currentGrid: newGrid,
      hintsUsed: get().hintsUsed + 1,
    })

    // Check completion
    const isComplete = checkCompletion(newGrid, solution)
    if (isComplete) {
      set({
        isComplete: true,
        endTime: Date.now(),
      })
    }
  },

  // Reset to initial state
  resetGame: () => {
    const { initialGrid } = get()

    if (!initialGrid) {
      return
    }

    set({
      currentGrid: cloneGrid(initialGrid),
      selectedCell: null,
      moveHistory: [],
      historyIndex: -1,
      hintsUsed: 0,
      mistakes: 0,
      isComplete: false,
      startTime: Date.now(),
      endTime: null,
      pencilMarks: new Map(),
      isPencilMode: false,
      highlightedCells: new Set(),
      errorCells: new Set(),
      lastStrategy: null,
      showFeedback: false,
      strategiesUsed: new Map(),
    })
  },

  // Dismiss feedback
  dismissFeedback: () => {
    set({ showFeedback: false })
  },
}))

// Helper function to check if puzzle is complete
function checkCompletion(grid: SudokuGrid, solution: SudokuGrid): boolean {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] !== solution[r][c]) {
        return false
      }
    }
  }
  return true
}
