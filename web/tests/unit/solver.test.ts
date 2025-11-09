/**
 * Tests for Sudoku solver
 */

import {
  solve,
  getSolution,
  hasUniqueSolution,
  countSolutions,
  getHint,
} from '@/lib/sudoku/solver'
import { createEmptyGrid, cloneGrid, isGridSolved } from '@/lib/sudoku/validator'
import type { SudokuGrid } from '@/lib/sudoku/types'

describe('Solver', () => {
  describe('solve', () => {
    it('should solve an easy 9x9 puzzle', () => {
      const grid: SudokuGrid = [
        [5, 3, null, null, 7, null, null, null, null],
        [6, null, null, 1, 9, 5, null, null, null],
        [null, 9, 8, null, null, null, null, 6, null],
        [8, null, null, null, 6, null, null, null, 3],
        [4, null, null, 8, null, 3, null, null, 1],
        [7, null, null, null, 2, null, null, null, 6],
        [null, 6, null, null, null, null, 2, 8, null],
        [null, null, null, 4, 1, 9, null, null, 5],
        [null, null, null, null, 8, null, null, 7, 9],
      ]

      const result = solve(grid)
      expect(result).toBe(true)
      expect(isGridSolved(grid)).toBe(true)
    })

    it('should solve a 4x4 puzzle', () => {
      const grid: SudokuGrid = [
        [null, 2, null, 4],
        [4, null, 2, null],
        [null, 1, null, 2],
        [2, null, 4, null],
      ]

      const result = solve(grid)
      expect(result).toBe(true)
      expect(isGridSolved(grid)).toBe(true)
    })

    it('should return false for unsolvable puzzle', () => {
      const grid: SudokuGrid = [
        [1, 1, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
      ]

      const result = solve(grid)
      expect(result).toBe(false)
    })

    it('should return true for already solved puzzle', () => {
      const grid: SudokuGrid = [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9],
      ]

      const result = solve(grid)
      expect(result).toBe(true)
      expect(isGridSolved(grid)).toBe(true)
    })

    it('should solve empty grid', () => {
      const grid = createEmptyGrid(4)
      const result = solve(grid)
      expect(result).toBe(true)
      expect(isGridSolved(grid)).toBe(true)
    })
  })

  describe('getSolution', () => {
    it('should return solved grid without modifying original', () => {
      const grid: SudokuGrid = [
        [5, 3, null, null, 7, null, null, null, null],
        [6, null, null, 1, 9, 5, null, null, null],
        [null, 9, 8, null, null, null, null, 6, null],
        [8, null, null, null, 6, null, null, null, 3],
        [4, null, null, 8, null, 3, null, null, 1],
        [7, null, null, null, 2, null, null, null, 6],
        [null, 6, null, null, null, null, 2, 8, null],
        [null, null, null, 4, 1, 9, null, null, 5],
        [null, null, null, null, 8, null, null, 7, 9],
      ]

      const original = cloneGrid(grid)
      const solution = getSolution(grid)

      expect(solution).not.toBeNull()
      expect(isGridSolved(solution!)).toBe(true)

      // Original should be unchanged
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          expect(grid[r][c]).toBe(original[r][c])
        }
      }
    })

    it('should return null for unsolvable puzzle', () => {
      const grid: SudokuGrid = [
        [1, 1, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
      ]

      const solution = getSolution(grid)
      expect(solution).toBeNull()
    })
  })

  describe('hasUniqueSolution', () => {
    it('should return true for puzzle with unique solution', () => {
      const grid: SudokuGrid = [
        [5, 3, null, null, 7, null, null, null, null],
        [6, null, null, 1, 9, 5, null, null, null],
        [null, 9, 8, null, null, null, null, 6, null],
        [8, null, null, null, 6, null, null, null, 3],
        [4, null, null, 8, null, 3, null, null, 1],
        [7, null, null, null, 2, null, null, null, 6],
        [null, 6, null, null, null, null, 2, 8, null],
        [null, null, null, 4, 1, 9, null, null, 5],
        [null, null, null, null, 8, null, null, 7, 9],
      ]

      expect(hasUniqueSolution(grid)).toBe(true)
    })

    it('should return false for empty grid (multiple solutions)', () => {
      const grid = createEmptyGrid(4)
      expect(hasUniqueSolution(grid)).toBe(false)
    })

    it('should return false for puzzle with multiple solutions', () => {
      const grid: SudokuGrid = [
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
      ]

      expect(hasUniqueSolution(grid)).toBe(false)
    })
  })

  describe('countSolutions', () => {
    it('should count 1 for puzzle with unique solution', () => {
      const grid: SudokuGrid = [
        [5, 3, null, null, 7, null, null, null, null],
        [6, null, null, 1, 9, 5, null, null, null],
        [null, 9, 8, null, null, null, null, 6, null],
        [8, null, null, null, 6, null, null, null, 3],
        [4, null, null, 8, null, 3, null, null, 1],
        [7, null, null, null, 2, null, null, null, 6],
        [null, 6, null, null, null, null, 2, 8, null],
        [null, null, null, 4, 1, 9, null, null, 5],
        [null, null, null, null, 8, null, null, 7, 9],
      ]

      expect(countSolutions(grid, 2)).toBe(1)
    })

    it('should count 2 (max) for empty 4x4 grid', () => {
      const grid = createEmptyGrid(4)
      expect(countSolutions(grid, 2)).toBe(2)
    })

    it('should return 0 for unsolvable puzzle', () => {
      const grid: SudokuGrid = [
        [1, 1, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
      ]

      expect(countSolutions(grid, 2)).toBe(0)
    })
  })

  describe('getHint', () => {
    it('should return valid hint for partially solved puzzle', () => {
      const grid: SudokuGrid = [
        [5, 3, null, null, 7, null, null, null, null],
        [6, null, null, 1, 9, 5, null, null, null],
        [null, 9, 8, null, null, null, null, 6, null],
        [8, null, null, null, 6, null, null, null, 3],
        [4, null, null, 8, null, 3, null, null, 1],
        [7, null, null, null, 2, null, null, null, 6],
        [null, 6, null, null, null, null, 2, 8, null],
        [null, null, null, 4, 1, 9, null, null, 5],
        [null, null, null, null, 8, null, null, 7, 9],
      ]

      const hint = getHint(grid)
      expect(hint).not.toBeNull()
      expect(hint!.row).toBeGreaterThanOrEqual(0)
      expect(hint!.row).toBeLessThan(9)
      expect(hint!.col).toBeGreaterThanOrEqual(0)
      expect(hint!.col).toBeLessThan(9)
      expect(hint!.value).toBeGreaterThanOrEqual(1)
      expect(hint!.value).toBeLessThanOrEqual(9)
      expect(grid[hint!.row][hint!.col]).toBeNull()
    })

    it('should return null for solved puzzle', () => {
      const grid: SudokuGrid = [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9],
      ]

      const hint = getHint(grid)
      expect(hint).toBeNull()
    })

    it('should return null for unsolvable puzzle', () => {
      const grid: SudokuGrid = [
        [1, 1, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
      ]

      const hint = getHint(grid)
      expect(hint).toBeNull()
    })
  })
})
