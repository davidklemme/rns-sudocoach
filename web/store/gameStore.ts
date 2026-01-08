/**
 * Game state management with Zustand
 */

import { create } from 'zustand'
import type { SudokuGrid, GridSize, Difficulty, Move } from '@/lib/sudoku/types'
import { generatePuzzle } from '@/lib/sudoku/generator'
import { isValidMove, cloneGrid, getCandidates } from '@/lib/sudoku/validator'
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

  // Highlight preferences
  showRowHighlight: boolean
  showColumnHighlight: boolean
  showBoxHighlight: boolean

  // Error feedback
  showErrorFeedback: boolean

  // Auto-clean pencil marks
  autoCleanPencilMarks: boolean

  // Teaching state
  lastStrategy: StrategyResult | null
  showFeedback: boolean
  strategiesUsed: Map<Strategy, number>

  // Hint state
  hintCell: { row: number; col: number; value: number } | null
  hintStrategy: StrategyResult | null
  showHint: boolean

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
  dismissHint: () => void
  resetGame: () => void
  dismissFeedback: () => void
  toggleRowHighlight: () => void
  toggleColumnHighlight: () => void
  toggleBoxHighlight: () => void
  applyHighlightPreset: (difficulty: Difficulty) => void
  toggleErrorFeedback: () => void
  toggleAutoCleanPencilMarks: () => void
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
  showRowHighlight: true,
  showColumnHighlight: false,
  showBoxHighlight: false,
  showErrorFeedback: true,
  autoCleanPencilMarks: true,
  lastStrategy: null,
  showFeedback: false,
  strategiesUsed: new Map(),
  hintCell: null,
  hintStrategy: null,
  showHint: false,

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
      hintCell: null,
      hintStrategy: null,
      showHint: false,
    })

    // Apply highlight preset for the difficulty
    get().applyHighlightPreset(difficulty)
  },

  // Select a cell
  selectCell: (row: number, col: number) => {
    const { currentGrid, gridSize, showRowHighlight, showColumnHighlight, showBoxHighlight } = get()

    if (!currentGrid || row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
      return
    }

    // Allow selecting any cell (including initial cells for navigation)
    set({ selectedCell: { row, col } })

    // Update highlighted cells based on preferences
    const highlighted = new Set<string>()

    // Same row (if enabled)
    if (showRowHighlight) {
      for (let c = 0; c < gridSize; c++) {
        highlighted.add(cellKey(row, c))
      }
    }

    // Same column (if enabled)
    if (showColumnHighlight) {
      for (let r = 0; r < gridSize; r++) {
        highlighted.add(cellKey(r, col))
      }
    }

    // Same box (if enabled)
    if (showBoxHighlight) {
      const boxSize = gridSize === 4 ? 2 : gridSize === 6 ? 2 : 3
      const boxColSize = gridSize === 6 ? 3 : boxSize
      const boxRow = Math.floor(row / boxSize) * boxSize
      const boxCol = Math.floor(col / boxColSize) * boxColSize

      for (let r = boxRow; r < boxRow + boxSize; r++) {
        for (let c = boxCol; c < boxCol + boxColSize; c++) {
          highlighted.add(cellKey(r, c))
        }
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
      // Invalid move - show error if feedback is enabled
      if (get().showErrorFeedback) {
        const errorCells = new Set<string>()
        errorCells.add(cellKey(row, col))
        set({ errorCells })

        // Clear error after animation
        setTimeout(() => {
          set({ errorCells: new Set() })
        }, 300)
      }

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

    // Auto-clean pencil marks from related cells if enabled
    if (get().autoCleanPencilMarks) {
      const boxSize = gridSize === 4 ? 2 : gridSize === 6 ? 2 : 3
      const boxColSize = gridSize === 6 ? 3 : boxSize
      const boxRow = Math.floor(row / boxSize) * boxSize
      const boxCol = Math.floor(col / boxColSize) * boxColSize

      // Clean from same row, column, and box
      for (let i = 0; i < gridSize; i++) {
        // Clean from same row
        const rowKey = cellKey(row, i)
        const rowMarks = newPencilMarks.get(rowKey)
        if (rowMarks && rowMarks.has(value)) {
          rowMarks.delete(value)
          if (rowMarks.size === 0) {
            newPencilMarks.delete(rowKey)
          }
        }

        // Clean from same column
        const colKey = cellKey(i, col)
        const colMarks = newPencilMarks.get(colKey)
        if (colMarks && colMarks.has(value)) {
          colMarks.delete(value)
          if (colMarks.size === 0) {
            newPencilMarks.delete(colKey)
          }
        }
      }

      // Clean from same box
      for (let r = boxRow; r < boxRow + boxSize; r++) {
        for (let c = boxCol; c < boxCol + boxColSize; c++) {
          const boxKey = cellKey(r, c)
          const boxMarks = newPencilMarks.get(boxKey)
          if (boxMarks && boxMarks.has(value)) {
            boxMarks.delete(value)
            if (boxMarks.size === 0) {
              newPencilMarks.delete(boxKey)
            }
          }
        }
      }
    }

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

  // Use a hint - show strategy for selected cell or find best next move
  useHint: () => {
    const { solution, currentGrid, gridSize, selectedCell } = get()

    if (!solution || !currentGrid) {
      return
    }

    let targetCell: { row: number; col: number; value: number } | null = null

    // If a cell is selected and empty, use that cell
    if (selectedCell && currentGrid[selectedCell.row][selectedCell.col] === null) {
      const correctValue = solution[selectedCell.row][selectedCell.col]
      if (correctValue !== null) {
        targetCell = {
          row: selectedCell.row,
          col: selectedCell.col,
          value: correctValue,
        }
      }
    }

    // Otherwise, find the best next move (cell with fewest candidates)
    if (!targetCell) {
      let bestCell: { row: number; col: number; value: number; candidatesCount: number } | null = null

      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          // Skip filled cells
          if (currentGrid[row][col] !== null) continue

          const candidates = getCandidates(currentGrid, row, col)

          // If we haven't found a cell yet, or this cell has fewer candidates
          if (bestCell === null || candidates.length < bestCell.candidatesCount) {
            const correctValue = solution[row][col]
            if (correctValue !== null) {
              bestCell = {
                row,
                col,
                value: correctValue,
                candidatesCount: candidates.length,
              }

              // If only one candidate, this is the best we can find
              if (candidates.length === 1) {
                break
              }
            }
          }
        }
        // Early exit if we found a single candidate
        if (bestCell && bestCell.candidatesCount === 1) break
      }

      if (!bestCell) {
        return
      }

      targetCell = {
        row: bestCell.row,
        col: bestCell.col,
        value: bestCell.value,
      }
    }

    // Detect the strategy for this move
    const strategy = detectStrategy(currentGrid, targetCell.row, targetCell.col, targetCell.value)

    // Enable all helper lights to assist with the hint (teaching mode)
    set({
      showRowHighlight: true,
      showColumnHighlight: true,
      showBoxHighlight: true,
    })

    // Set the hint to display (don't fill it in automatically - teach, don't solve!)
    // Note: We store the value internally for validation but HintDisplay won't show it
    set({
      hintCell: { row: targetCell.row, col: targetCell.col, value: targetCell.value },
      hintStrategy: strategy,
      showHint: true,
      hintsUsed: get().hintsUsed + 1,
      selectedCell: { row: targetCell.row, col: targetCell.col },
    })

    // Highlight the row, column, and box for the hint cell
    const highlighted = new Set<string>()
    const boxSize = gridSize === 4 ? 2 : gridSize === 6 ? 2 : 3
    const boxColSize = gridSize === 6 ? 3 : boxSize
    const boxRow = Math.floor(targetCell.row / boxSize) * boxSize
    const boxCol = Math.floor(targetCell.col / boxColSize) * boxColSize

    // Add row cells
    for (let c = 0; c < gridSize; c++) {
      highlighted.add(cellKey(targetCell.row, c))
    }

    // Add column cells
    for (let r = 0; r < gridSize; r++) {
      highlighted.add(cellKey(r, targetCell.col))
    }

    // Add box cells
    for (let r = boxRow; r < boxRow + boxSize; r++) {
      for (let c = boxCol; c < boxCol + boxColSize; c++) {
        highlighted.add(cellKey(r, c))
      }
    }

    set({ highlightedCells: highlighted })
  },

  // Dismiss hint
  dismissHint: () => {
    set({
      hintCell: null,
      hintStrategy: null,
      showHint: false,
      highlightedCells: new Set(),
    })
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
      hintCell: null,
      hintStrategy: null,
      showHint: false,
    })
  },

  // Dismiss feedback
  dismissFeedback: () => {
    set({ showFeedback: false })
  },

  // Toggle row highlighting
  toggleRowHighlight: () => {
    set((state) => ({ showRowHighlight: !state.showRowHighlight }))
    // Re-highlight selected cell with new preferences
    const { selectedCell } = get()
    if (selectedCell) {
      get().selectCell(selectedCell.row, selectedCell.col)
    }
  },

  // Toggle column highlighting
  toggleColumnHighlight: () => {
    set((state) => ({ showColumnHighlight: !state.showColumnHighlight }))
    // Re-highlight selected cell with new preferences
    const { selectedCell } = get()
    if (selectedCell) {
      get().selectCell(selectedCell.row, selectedCell.col)
    }
  },

  // Toggle box highlighting
  toggleBoxHighlight: () => {
    set((state) => ({ showBoxHighlight: !state.showBoxHighlight }))
    // Re-highlight selected cell with new preferences
    const { selectedCell } = get()
    if (selectedCell) {
      get().selectCell(selectedCell.row, selectedCell.col)
    }
  },

  // Apply highlight preset based on difficulty
  applyHighlightPreset: (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'beginner':
        set({ showRowHighlight: true, showColumnHighlight: true, showBoxHighlight: true })
        break
      case 'easy':
        set({ showRowHighlight: true, showColumnHighlight: true, showBoxHighlight: false })
        break
      case 'medium':
        set({ showRowHighlight: true, showColumnHighlight: false, showBoxHighlight: false })
        break
      case 'hard':
      case 'expert':
        set({ showRowHighlight: false, showColumnHighlight: false, showBoxHighlight: false })
        break
    }
    // Re-highlight selected cell with new preferences
    const { selectedCell } = get()
    if (selectedCell) {
      get().selectCell(selectedCell.row, selectedCell.col)
    }
  },

  // Toggle error feedback
  toggleErrorFeedback: () => {
    set((state) => ({ showErrorFeedback: !state.showErrorFeedback }))
  },

  // Toggle auto-clean pencil marks
  toggleAutoCleanPencilMarks: () => {
    set((state) => ({ autoCleanPencilMarks: !state.autoCleanPencilMarks }))
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
