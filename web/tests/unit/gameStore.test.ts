/**
 * Tests for game state management
 */

import { useGameStore } from '@/store/gameStore'
import type { GridSize, Difficulty } from '@/lib/sudoku/types'

describe('GameStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useGameStore.setState({
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
    })

    // Start a fresh game
    const store = useGameStore.getState()
    store.startNewGame(4, 'easy', 12345)
  })

  describe('startNewGame', () => {
    it('should initialize a new game with correct properties', () => {
      useGameStore.getState().startNewGame(9, 'medium', 12345)
      const store = useGameStore.getState()

      expect(store.gridSize).toBe(9)
      expect(store.difficulty).toBe('medium')
      expect(store.initialGrid).not.toBeNull()
      expect(store.currentGrid).not.toBeNull()
      expect(store.solution).not.toBeNull()
      expect(store.puzzleId).toContain('9x9-medium')
      expect(store.moveHistory).toEqual([])
      expect(store.historyIndex).toBe(-1)
      expect(store.hintsUsed).toBe(0)
      expect(store.mistakes).toBe(0)
      expect(store.isComplete).toBe(false)
      expect(store.startTime).not.toBeNull()
    })

    it('should generate reproducible puzzles with same seed', () => {
      useGameStore.getState().startNewGame(4, 'easy', 99999)
      const grid1 = useGameStore.getState().currentGrid

      useGameStore.getState().startNewGame(4, 'easy', 99999)
      const grid2 = useGameStore.getState().currentGrid

      expect(grid1).toEqual(grid2)
    })

    it('should reset all game state', () => {
      const store = useGameStore.getState()

      // Make some moves
      let emptyRow = -1, emptyCol = -1
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (store.currentGrid![r][c] === null) {
            emptyRow = r; emptyCol = c; break
          }
        }
        if (emptyRow >= 0) break
      }

      if (emptyRow >= 0) {
        store.selectCell(emptyRow, emptyCol)
        store.makeMove(1)
      }

      // Start new game
      useGameStore.getState().startNewGame(4, 'easy', 54321)
      const newStore = useGameStore.getState()

      expect(newStore.moveHistory.length).toBe(0)
      expect(newStore.selectedCell).toBeNull()
      expect(newStore.pencilMarks.size).toBe(0)
    })
  })

  describe('selectCell', () => {
    it('should select a valid empty cell', () => {
      const store = useGameStore.getState()

      // Find an empty cell
      let emptyRow = -1
      let emptyCol = -1
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (store.currentGrid![r][c] === null) {
            emptyRow = r
            emptyCol = c
            break
          }
        }
        if (emptyRow >= 0) break
      }

      store.selectCell(emptyRow, emptyCol)
      expect(store.selectedCell).toEqual({ row: emptyRow, col: emptyCol })
    })

    it('should not select cells outside grid bounds', () => {
      const store = useGameStore.getState()

      store.selectCell(-1, 0)
      expect(store.selectedCell).toBeNull()

      store.selectCell(0, 10)
      expect(store.selectedCell).toBeNull()
    })

    it('should not select initial (pre-filled) cells', () => {
      const store = useGameStore.getState()

      // Find a pre-filled cell
      let filledRow = -1
      let filledCol = -1
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (store.initialGrid![r][c] !== null) {
            filledRow = r
            filledCol = c
            break
          }
        }
        if (filledRow >= 0) break
      }

      if (filledRow >= 0) {
        const before = store.selectedCell
        store.selectCell(filledRow, filledCol)
        expect(store.selectedCell).toEqual(before)
      } else {
        // If no filled cells found, skip this test
        expect(true).toBe(true)
      }
    })

    it('should highlight related cells (row, column, box)', () => {
      const store = useGameStore.getState()

      store.selectCell(0, 0)
      expect(store.highlightedCells.size).toBeGreaterThan(0)

      // Check that row cells are highlighted
      expect(store.highlightedCells.has('0,1')).toBe(true)
      expect(store.highlightedCells.has('0,2')).toBe(true)

      // Check that column cells are highlighted
      expect(store.highlightedCells.has('1,0')).toBe(true)
      expect(store.highlightedCells.has('2,0')).toBe(true)
    })
  })

  describe('makeMove', () => {
    it('should make a valid move', () => {
      const store = useGameStore.getState()

      // Find empty cell
      let emptyRow = -1
      let emptyCol = -1
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (store.currentGrid![r][c] === null) {
            emptyRow = r
            emptyCol = c
            break
          }
        }
        if (emptyRow >= 0) break
      }

      store.selectCell(emptyRow, emptyCol)

      // Find a valid value for this cell
      const solution = store.solution!
      const correctValue = solution[emptyRow][emptyCol]!

      store.makeMove(correctValue)

      expect(store.currentGrid![emptyRow][emptyCol]).toBe(correctValue)
      expect(store.moveHistory.length).toBe(1)
      expect(store.historyIndex).toBe(0)
    })

    it('should not make a move without selected cell', () => {
      const store = useGameStore.getState()

      const before = store.currentGrid
      store.makeMove(1)

      expect(store.currentGrid).toEqual(before)
      expect(store.moveHistory.length).toBe(0)
    })

    it('should track mistakes for invalid moves', () => {
      const store = useGameStore.getState()

      // Find empty cell
      let emptyRow = -1
      let emptyCol = -1
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (store.currentGrid![r][c] === null) {
            emptyRow = r
            emptyCol = c
            break
          }
        }
        if (emptyRow >= 0) break
      }

      if (emptyRow < 0) {
        // No empty cells, skip
        expect(true).toBe(true)
        return
      }

      store.selectCell(emptyRow, emptyCol)

      // Try placing a value that's already in the row
      let duplicateValue: number | null = null
      for (let c = 0; c < 4; c++) {
        if (c !== emptyCol && store.currentGrid![emptyRow][c] !== null) {
          duplicateValue = store.currentGrid![emptyRow][c]
          break
        }
      }

      if (duplicateValue) {
        const mistakesBefore = store.mistakes
        store.makeMove(duplicateValue)
        expect(store.mistakes).toBe(mistakesBefore + 1)
        expect(store.currentGrid![emptyRow][emptyCol]).toBeNull()
      } else {
        // No duplicate found in row, skip
        expect(true).toBe(true)
      }
    })

    it('should detect puzzle completion', () => {
      const store = useGameStore.getState()

      // Fill in all cells with correct values
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (store.currentGrid![r][c] === null) {
            store.selectCell(r, c)
            store.makeMove(store.solution![r][c]!)
          }
        }
      }

      expect(store.isComplete).toBe(true)
      expect(store.endTime).not.toBeNull()
    })
  })

  describe('clearCell', () => {
    it('should clear a cell with a move', () => {
      const store = useGameStore.getState()

      // Make a move first
      let emptyRow = -1
      let emptyCol = -1
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (store.currentGrid![r][c] === null) {
            emptyRow = r
            emptyCol = c
            break
          }
        }
        if (emptyRow >= 0) break
      }

      store.selectCell(emptyRow, emptyCol)
      store.makeMove(1)

      expect(store.currentGrid![emptyRow][emptyCol]).not.toBeNull()

      store.clearCell()
      expect(store.currentGrid![emptyRow][emptyCol]).toBeNull()
    })

    it('should add clear to move history', () => {
      const store = useGameStore.getState()

      let emptyRow = -1
      let emptyCol = -1
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (store.currentGrid![r][c] === null) {
            emptyRow = r
            emptyCol = c
            break
          }
        }
        if (emptyRow >= 0) break
      }

      store.selectCell(emptyRow, emptyCol)
      store.makeMove(1)
      store.clearCell()

      expect(store.moveHistory.length).toBe(2)
      expect(store.moveHistory[1].value).toBe(0)
    })
  })

  describe('undo and redo', () => {
    it('should undo last move', () => {
      const store = useGameStore.getState()

      // Make a move
      let emptyRow = -1
      let emptyCol = -1
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (store.currentGrid![r][c] === null) {
            emptyRow = r
            emptyCol = c
            break
          }
        }
        if (emptyRow >= 0) break
      }

      store.selectCell(emptyRow, emptyCol)
      const value = store.solution![emptyRow][emptyCol]!
      store.makeMove(value)

      expect(store.currentGrid![emptyRow][emptyCol]).toBe(value)

      store.undo()
      expect(store.currentGrid![emptyRow][emptyCol]).toBeNull()
      expect(store.historyIndex).toBe(-1)
    })

    it('should redo undone move', () => {
      const store = useGameStore.getState()

      // Make a move
      let emptyRow = -1
      let emptyCol = -1
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (store.currentGrid![r][c] === null) {
            emptyRow = r
            emptyCol = c
            break
          }
        }
        if (emptyRow >= 0) break
      }

      store.selectCell(emptyRow, emptyCol)
      const value = store.solution![emptyRow][emptyCol]!
      store.makeMove(value)
      store.undo()
      store.redo()

      expect(store.currentGrid![emptyRow][emptyCol]).toBe(value)
      expect(store.historyIndex).toBe(0)
    })

    it('should handle multiple undo/redo operations', () => {
      const store = useGameStore.getState()

      // Make multiple moves
      const moves: Array<{ row: number; col: number; value: number }> = []

      for (let i = 0; i < 3; i++) {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (store.currentGrid![r][c] === null) {
              store.selectCell(r, c)
              const value = store.solution![r][c]!
              store.makeMove(value)
              moves.push({ row: r, col: c, value })
              break
            }
          }
          if (moves.length > i) break
        }
      }

      expect(store.moveHistory.length).toBe(3)

      // Undo all
      store.undo()
      store.undo()
      store.undo()

      expect(store.historyIndex).toBe(-1)

      // Redo all
      store.redo()
      store.redo()
      store.redo()

      expect(store.historyIndex).toBe(2)
    })

    it('should not undo when at beginning of history', () => {
      const store = useGameStore.getState()

      const before = store.historyIndex
      store.undo()

      expect(store.historyIndex).toBe(before)
    })

    it('should not redo when at end of history', () => {
      const store = useGameStore.getState()

      const before = store.historyIndex
      store.redo()

      expect(store.historyIndex).toBe(before)
    })
  })

  describe('pencil marks', () => {
    it('should toggle pencil mode', () => {
      const store = useGameStore.getState()

      expect(store.isPencilMode).toBe(false)

      store.togglePencilMode()
      expect(store.isPencilMode).toBe(true)

      store.togglePencilMode()
      expect(store.isPencilMode).toBe(false)
    })

    it('should add pencil mark in pencil mode', () => {
      const store = useGameStore.getState()

      // Find empty cell
      let emptyRow = -1
      let emptyCol = -1
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (store.currentGrid![r][c] === null) {
            emptyRow = r
            emptyCol = c
            break
          }
        }
        if (emptyRow >= 0) break
      }

      store.selectCell(emptyRow, emptyCol)
      store.togglePencilMode()
      store.makeMove(1)

      const key = `${emptyRow},${emptyCol}`
      expect(store.pencilMarks.has(key)).toBe(true)
      expect(store.pencilMarks.get(key)!.has(1)).toBe(true)
    })

    it('should toggle pencil mark on/off', () => {
      const store = useGameStore.getState()

      // Find empty cell
      let emptyRow = -1
      let emptyCol = -1
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (store.currentGrid![r][c] === null) {
            emptyRow = r
            emptyCol = c
            break
          }
        }
        if (emptyRow >= 0) break
      }

      store.selectCell(emptyRow, emptyCol)
      store.addPencilMark(2)

      const key = `${emptyRow},${emptyCol}`
      expect(store.pencilMarks.get(key)!.has(2)).toBe(true)

      store.addPencilMark(2)
      expect(store.pencilMarks.get(key)!.has(2)).toBe(false)
    })

    it('should clear pencil marks when making a move', () => {
      const store = useGameStore.getState()

      // Find empty cell
      let emptyRow = -1
      let emptyCol = -1
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (store.currentGrid![r][c] === null) {
            emptyRow = r
            emptyCol = c
            break
          }
        }
        if (emptyRow >= 0) break
      }

      store.selectCell(emptyRow, emptyCol)
      store.addPencilMark(1)
      store.addPencilMark(2)

      const key = `${emptyRow},${emptyCol}`
      expect(store.pencilMarks.has(key)).toBe(true)

      // Make a real move
      store.togglePencilMode()
      store.makeMove(store.solution![emptyRow][emptyCol]!)

      expect(store.pencilMarks.has(key)).toBe(false)
    })

    it('should clear all pencil marks for a cell', () => {
      const store = useGameStore.getState()

      let emptyRow = -1
      let emptyCol = -1
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (store.currentGrid![r][c] === null) {
            emptyRow = r
            emptyCol = c
            break
          }
        }
        if (emptyRow >= 0) break
      }

      store.selectCell(emptyRow, emptyCol)
      store.addPencilMark(1)
      store.addPencilMark(2)
      store.addPencilMark(3)

      store.clearPencilMarks()

      const key = `${emptyRow},${emptyCol}`
      expect(store.pencilMarks.has(key)).toBe(false)
    })
  })

  describe('useHint', () => {
    it('should fill selected cell with correct value', () => {
      const store = useGameStore.getState()

      // Find empty cell
      let emptyRow = -1
      let emptyCol = -1
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (store.currentGrid![r][c] === null) {
            emptyRow = r
            emptyCol = c
            break
          }
        }
        if (emptyRow >= 0) break
      }

      store.selectCell(emptyRow, emptyCol)

      const hintsBefore = store.hintsUsed
      store.useHint()

      expect(store.currentGrid![emptyRow][emptyCol]).toBe(store.solution![emptyRow][emptyCol])
      expect(store.hintsUsed).toBe(hintsBefore + 1)
    })

    it('should not use hint without selected cell', () => {
      const store = useGameStore.getState()

      const hintsBefore = store.hintsUsed
      store.useHint()

      expect(store.hintsUsed).toBe(hintsBefore)
    })
  })

  describe('resetGame', () => {
    it('should reset to initial puzzle state', () => {
      const store = useGameStore.getState()

      // Make some moves
      let emptyRow = -1
      let emptyCol = -1
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (store.currentGrid![r][c] === null) {
            emptyRow = r
            emptyCol = c
            break
          }
        }
        if (emptyRow >= 0) break
      }

      store.selectCell(emptyRow, emptyCol)
      store.makeMove(store.solution![emptyRow][emptyCol]!)

      // Reset
      store.resetGame()

      expect(store.currentGrid).toEqual(store.initialGrid)
      expect(store.moveHistory.length).toBe(0)
      expect(store.historyIndex).toBe(-1)
      expect(store.selectedCell).toBeNull()
      expect(store.hintsUsed).toBe(0)
      expect(store.mistakes).toBe(0)
      expect(store.isComplete).toBe(false)
    })
  })

  describe('different grid sizes', () => {
    it('should work with 6x6 grid', () => {
      useGameStore.getState().startNewGame(6, 'medium', 12345)
      const store = useGameStore.getState()

      expect(store.gridSize).toBe(6)
      expect(store.currentGrid!.length).toBe(6)
    })

    it('should work with 9x9 grid', () => {
      useGameStore.getState().startNewGame(9, 'hard', 12345)
      const store = useGameStore.getState()

      expect(store.gridSize).toBe(9)
      expect(store.currentGrid!.length).toBe(9)
    })
  })
})
