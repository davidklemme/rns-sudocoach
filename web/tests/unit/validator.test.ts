/**
 * Tests for Sudoku validator
 */

import {
  isValidMove,
  isValidGrid,
  isGridComplete,
  isGridSolved,
  getBoxSize,
  getBoxDimensions,
  getCandidates,
  createEmptyGrid,
  cloneGrid,
  areGridsEqual,
} from '@/lib/sudoku/validator'
import type { SudokuGrid } from '@/lib/sudoku/types'

describe('Validator', () => {
  describe('isValidMove', () => {
    it('should return true for a valid move in 9x9 grid', () => {
      const grid: SudokuGrid = createEmptyGrid(9)
      expect(isValidMove(grid, 0, 0, 5)).toBe(true)
    })

    it('should return false for duplicate in row', () => {
      const grid: SudokuGrid = createEmptyGrid(9)
      grid[0][0] = 5
      expect(isValidMove(grid, 0, 1, 5)).toBe(false)
    })

    it('should return false for duplicate in column', () => {
      const grid: SudokuGrid = createEmptyGrid(9)
      grid[0][0] = 5
      expect(isValidMove(grid, 1, 0, 5)).toBe(false)
    })

    it('should return false for duplicate in 3x3 box', () => {
      const grid: SudokuGrid = createEmptyGrid(9)
      grid[0][0] = 5
      expect(isValidMove(grid, 1, 1, 5)).toBe(false)
    })

    it('should return false for out of range value', () => {
      const grid: SudokuGrid = createEmptyGrid(9)
      expect(isValidMove(grid, 0, 0, 10)).toBe(false)
      expect(isValidMove(grid, 0, 0, 0)).toBe(false)
    })

    it('should return false for invalid position', () => {
      const grid: SudokuGrid = createEmptyGrid(9)
      expect(isValidMove(grid, -1, 0, 5)).toBe(false)
      expect(isValidMove(grid, 0, 9, 5)).toBe(false)
    })

    it('should work correctly for 4x4 grid', () => {
      const grid: SudokuGrid = createEmptyGrid(4)
      grid[0][0] = 1
      expect(isValidMove(grid, 0, 1, 2)).toBe(true)
      expect(isValidMove(grid, 0, 1, 1)).toBe(false)
      expect(isValidMove(grid, 1, 1, 1)).toBe(false) // same 2x2 box
    })

    it('should work correctly for 6x6 grid', () => {
      const grid: SudokuGrid = createEmptyGrid(6)
      grid[0][0] = 1
      expect(isValidMove(grid, 0, 1, 2)).toBe(true)
      expect(isValidMove(grid, 0, 1, 1)).toBe(false)
    })

    it('should allow replacing current cell value', () => {
      const grid: SudokuGrid = createEmptyGrid(9)
      grid[0][0] = 5
      expect(isValidMove(grid, 0, 0, 7)).toBe(true)
    })
  })

  describe('isValidGrid', () => {
    it('should return true for empty grid', () => {
      const grid = createEmptyGrid(9)
      expect(isValidGrid(grid)).toBe(true)
    })

    it('should return true for valid partially filled grid', () => {
      const grid = createEmptyGrid(9)
      grid[0][0] = 1
      grid[0][1] = 2
      grid[1][0] = 3
      expect(isValidGrid(grid)).toBe(true)
    })

    it('should return false for grid with duplicate in row', () => {
      const grid = createEmptyGrid(9)
      grid[0][0] = 5
      grid[0][1] = 5
      expect(isValidGrid(grid)).toBe(false)
    })

    it('should return false for grid with duplicate in column', () => {
      const grid = createEmptyGrid(9)
      grid[0][0] = 5
      grid[1][0] = 5
      expect(isValidGrid(grid)).toBe(false)
    })

    it('should return false for grid with duplicate in box', () => {
      const grid = createEmptyGrid(9)
      grid[0][0] = 5
      grid[1][1] = 5
      expect(isValidGrid(grid)).toBe(false)
    })
  })

  describe('isGridComplete', () => {
    it('should return false for empty grid', () => {
      const grid = createEmptyGrid(9)
      expect(isGridComplete(grid)).toBe(false)
    })

    it('should return false for partially filled grid', () => {
      const grid = createEmptyGrid(9)
      grid[0][0] = 1
      expect(isGridComplete(grid)).toBe(false)
    })

    it('should return true for completely filled grid', () => {
      const grid: SudokuGrid = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [4, 5, 6, 7, 8, 9, 1, 2, 3],
        [7, 8, 9, 1, 2, 3, 4, 5, 6],
        [2, 3, 4, 5, 6, 7, 8, 9, 1],
        [5, 6, 7, 8, 9, 1, 2, 3, 4],
        [8, 9, 1, 2, 3, 4, 5, 6, 7],
        [3, 4, 5, 6, 7, 8, 9, 1, 2],
        [6, 7, 8, 9, 1, 2, 3, 4, 5],
        [9, 1, 2, 3, 4, 5, 6, 7, 8],
      ]
      expect(isGridComplete(grid)).toBe(true)
    })
  })

  describe('isGridSolved', () => {
    it('should return false for empty grid', () => {
      const grid = createEmptyGrid(9)
      expect(isGridSolved(grid)).toBe(false)
    })

    it('should return false for complete but invalid grid', () => {
      const grid: SudokuGrid = Array.from({ length: 9 }, () => Array(9).fill(1))
      expect(isGridSolved(grid)).toBe(false)
    })

    it('should return true for valid solved grid', () => {
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
      expect(isGridSolved(grid)).toBe(true)
    })
  })

  describe('getBoxSize', () => {
    it('should return 2 for 4x4 grid', () => {
      expect(getBoxSize(4)).toBe(2)
    })

    it('should return 2 for 6x6 grid', () => {
      expect(getBoxSize(6)).toBe(2)
    })

    it('should return 3 for 9x9 grid', () => {
      expect(getBoxSize(9)).toBe(3)
    })
  })

  describe('getBoxDimensions', () => {
    it('should return 2x2 for 4x4 grid', () => {
      expect(getBoxDimensions(4)).toEqual({ rows: 2, cols: 2 })
    })

    it('should return 2x3 for 6x6 grid', () => {
      expect(getBoxDimensions(6)).toEqual({ rows: 2, cols: 3 })
    })

    it('should return 3x3 for 9x9 grid', () => {
      expect(getBoxDimensions(9)).toEqual({ rows: 3, cols: 3 })
    })
  })

  describe('getCandidates', () => {
    it('should return all numbers for empty cell in empty grid', () => {
      const grid = createEmptyGrid(9)
      const candidates = getCandidates(grid, 0, 0)
      expect(candidates).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    })

    it('should return empty array for filled cell', () => {
      const grid = createEmptyGrid(9)
      grid[0][0] = 5
      expect(getCandidates(grid, 0, 0)).toEqual([])
    })

    it('should exclude numbers in same row', () => {
      const grid = createEmptyGrid(9)
      grid[0][0] = 1
      grid[0][1] = 2
      const candidates = getCandidates(grid, 0, 2)
      expect(candidates).not.toContain(1)
      expect(candidates).not.toContain(2)
      expect(candidates).toContain(3)
    })

    it('should exclude numbers in same column', () => {
      const grid = createEmptyGrid(9)
      grid[0][0] = 1
      grid[1][0] = 2
      const candidates = getCandidates(grid, 2, 0)
      expect(candidates).not.toContain(1)
      expect(candidates).not.toContain(2)
      expect(candidates).toContain(3)
    })

    it('should exclude numbers in same box', () => {
      const grid = createEmptyGrid(9)
      grid[0][0] = 1
      grid[1][1] = 2
      const candidates = getCandidates(grid, 2, 2)
      expect(candidates).not.toContain(1)
      expect(candidates).not.toContain(2)
      expect(candidates).toContain(3)
    })

    it('should work for 4x4 grid', () => {
      const grid = createEmptyGrid(4)
      grid[0][0] = 1
      const candidates = getCandidates(grid, 0, 1)
      expect(candidates.length).toBeLessThan(4)
      expect(candidates).not.toContain(1)
    })
  })

  describe('createEmptyGrid', () => {
    it('should create 4x4 grid', () => {
      const grid = createEmptyGrid(4)
      expect(grid.length).toBe(4)
      expect(grid[0].length).toBe(4)
      expect(grid.every(row => row.every(cell => cell === null))).toBe(true)
    })

    it('should create 9x9 grid', () => {
      const grid = createEmptyGrid(9)
      expect(grid.length).toBe(9)
      expect(grid[0].length).toBe(9)
    })
  })

  describe('cloneGrid', () => {
    it('should create independent copy', () => {
      const original = createEmptyGrid(9)
      original[0][0] = 5
      const clone = cloneGrid(original)

      expect(clone[0][0]).toBe(5)

      clone[0][0] = 7
      expect(original[0][0]).toBe(5)
      expect(clone[0][0]).toBe(7)
    })
  })

  describe('areGridsEqual', () => {
    it('should return true for identical grids', () => {
      const grid1 = createEmptyGrid(9)
      const grid2 = createEmptyGrid(9)
      grid1[0][0] = 5
      grid2[0][0] = 5
      expect(areGridsEqual(grid1, grid2)).toBe(true)
    })

    it('should return false for different grids', () => {
      const grid1 = createEmptyGrid(9)
      const grid2 = createEmptyGrid(9)
      grid1[0][0] = 5
      grid2[0][0] = 7
      expect(areGridsEqual(grid1, grid2)).toBe(false)
    })

    it('should return false for different sized grids', () => {
      const grid1 = createEmptyGrid(4)
      const grid2 = createEmptyGrid(9)
      expect(areGridsEqual(grid1, grid2)).toBe(false)
    })
  })
})
