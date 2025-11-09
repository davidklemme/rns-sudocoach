/**
 * Tests for ML feature extraction
 */

import {
  extractFeatures,
  getFeatureVectorSize,
  featuresToArray,
  normalizeFeatures,
} from '@/lib/ml/features'
import { createEmptyGrid } from '@/lib/sudoku/validator'
import type { SudokuGrid } from '@/lib/sudoku/types'

describe('ML Features', () => {
  describe('extractFeatures', () => {
    it('should extract features from game state', () => {
      const grid: SudokuGrid = createEmptyGrid(9)
      grid[0][0] = 5
      grid[0][1] = 3
      grid[1][0] = 6

      const features = extractFeatures(grid, 0, 2, 4, {
        timeSinceLastMove: 1500,
        errorCount: 2,
      })

      expect(features.row).toBe(0)
      expect(features.col).toBe(2)
      expect(features.value).toBe(4)
      expect(features.timeTaken).toBe(1500)
      expect(features.errorCount).toBe(2)
      expect(features.boardState.length).toBe(81)
      expect(features.availableCandidates.length).toBe(9)
    })

    it('should flatten grid correctly', () => {
      const grid: SudokuGrid = createEmptyGrid(4)
      grid[0][0] = 1
      grid[0][1] = 2
      grid[1][0] = 3

      const features = extractFeatures(grid, 0, 2, 4)

      expect(features.boardState[0]).toBe(1)
      expect(features.boardState[1]).toBe(2)
      expect(features.boardState[9]).toBe(3) // Row 1, col 0 (padded to 9x9, so row 1 starts at index 9)
    })

    it('should encode candidates correctly', () => {
      const grid: SudokuGrid = createEmptyGrid(9)
      grid[0][0] = 1
      grid[0][1] = 2

      const features = extractFeatures(grid, 0, 2, 3)

      // Cell [0][2] should have candidates excluding 1 and 2
      expect(features.availableCandidates.length).toBe(9)
      expect(features.availableCandidates[0]).toBe(0) // 1 is used
      expect(features.availableCandidates[1]).toBe(0) // 2 is used
      expect(features.availableCandidates[2]).toBe(1) // 3 is available
    })

    it('should encode recent moves', () => {
      const grid: SudokuGrid = createEmptyGrid(9)

      const features = extractFeatures(grid, 0, 0, 1, {
        recentMoves: [
          { row: 1, col: 2 },
          { row: 3, col: 4 },
        ],
      })

      expect(features.recentMoves.length).toBe(5)
      expect(features.recentMoves[0]).toBe(1 * 9 + 2) // 11
      expect(features.recentMoves[1]).toBe(3 * 9 + 4) // 31
      expect(features.recentMoves[2]).toBe(-1) // Empty
    })

    it('should calculate completion percentage', () => {
      const grid: SudokuGrid = createEmptyGrid(4)
      grid[0][0] = 1
      grid[0][1] = 2
      // 2 out of 16 cells filled

      const features = extractFeatures(grid, 0, 2, 3)

      expect(features.completionPercentage).toBe(2 / 16)
    })

    it('should encode previous strategies', () => {
      const grid: SudokuGrid = createEmptyGrid(9)

      const features = extractFeatures(grid, 0, 0, 1, {
        previousStrategies: ['elimination', 'single_candidate'],
      })

      expect(features.previousStrategies.length).toBe(5)
      expect(features.previousStrategies[0]).toBe(0) // elimination
      expect(features.previousStrategies[1]).toBe(1) // single_candidate
      expect(features.previousStrategies[2]).toBe(-1) // Empty
    })
  })

  describe('getFeatureVectorSize', () => {
    it('should return correct feature vector size', () => {
      const size = getFeatureVectorSize()
      expect(size).toBe(106)
    })
  })

  describe('featuresToArray', () => {
    it('should convert features to flat array', () => {
      const grid: SudokuGrid = createEmptyGrid(9)
      const features = extractFeatures(grid, 0, 0, 1)
      const array = featuresToArray(features)

      expect(array.length).toBe(106)
      expect(array[81]).toBe(0) // row
      expect(array[82]).toBe(0) // col
      expect(array[83]).toBe(1) // value
    })

    it('should include all feature components', () => {
      const grid: SudokuGrid = createEmptyGrid(4)
      grid[0][0] = 1

      const features = extractFeatures(grid, 0, 1, 2, {
        timeSinceLastMove: 3000,
        errorCount: 1,
      })

      const array = featuresToArray(features)

      // Check various indices
      expect(array[81]).toBe(0) // row
      expect(array[82]).toBe(1) // col
      expect(array[83]).toBe(2) // value
      expect(array[93]).toBe(3) // time in seconds
      expect(array[100]).toBe(1) // error count
    })
  })

  describe('normalizeFeatures', () => {
    it('should normalize all features to 0-1 range', () => {
      const grid: SudokuGrid = createEmptyGrid(9)
      grid[0][0] = 9 // Max value

      const features = extractFeatures(grid, 8, 8, 9, {
        timeSinceLastMove: 15000,
        errorCount: 5,
      })

      const array = featuresToArray(features)
      const normalized = normalizeFeatures(array)

      // All values should be in [-1, 1] range
      normalized.forEach((value, index) => {
        expect(value).toBeGreaterThanOrEqual(-1)
        expect(value).toBeLessThanOrEqual(1)
      })

      // Check specific normalizations
      expect(normalized[0]).toBe(9 / 9) // Board state max
      expect(normalized[81]).toBe(8 / 8) // Row max
      expect(normalized[82]).toBe(8 / 8) // Col max
      expect(normalized[83]).toBe((9 - 1) / 8) // Value max
    })

    it('should handle zero values correctly', () => {
      const grid: SudokuGrid = createEmptyGrid(9)
      const features = extractFeatures(grid, 0, 0, 1)
      const array = featuresToArray(features)
      const normalized = normalizeFeatures(array)

      expect(normalized[0]).toBe(0) // Empty cell
      expect(normalized[81]).toBe(0) // Row 0
      expect(normalized[82]).toBe(0) // Col 0
    })

    it('should handle time normalization', () => {
      const grid: SudokuGrid = createEmptyGrid(9)

      const features1 = extractFeatures(grid, 0, 0, 1, {
        timeSinceLastMove: 0,
      })
      const array1 = featuresToArray(features1)
      const normalized1 = normalizeFeatures(array1)
      expect(normalized1[93]).toBe(0) // 0 seconds

      const features2 = extractFeatures(grid, 0, 0, 1, {
        timeSinceLastMove: 30000,
      })
      const array2 = featuresToArray(features2)
      const normalized2 = normalizeFeatures(array2)
      expect(normalized2[93]).toBe(1) // 30 seconds (max)

      const features3 = extractFeatures(grid, 0, 0, 1, {
        timeSinceLastMove: 60000,
      })
      const array3 = featuresToArray(features3)
      const normalized3 = normalizeFeatures(array3)
      expect(normalized3[93]).toBe(1) // Capped at 1
    })
  })

  describe('edge cases', () => {
    it('should handle 4x4 grid', () => {
      const grid: SudokuGrid = createEmptyGrid(4)
      const features = extractFeatures(grid, 0, 0, 1)

      expect(features.boardState.length).toBe(81) // Padded to 9x9
      expect(features.row).toBe(0)
      expect(features.col).toBe(0)
    })

    it('should handle 6x6 grid', () => {
      const grid: SudokuGrid = createEmptyGrid(6)
      const features = extractFeatures(grid, 2, 3, 4)

      expect(features.boardState.length).toBe(81)
      expect(features.row).toBe(2)
      expect(features.col).toBe(3)
    })

    it('should handle empty context', () => {
      const grid: SudokuGrid = createEmptyGrid(9)
      const features = extractFeatures(grid, 0, 0, 1, {})

      expect(features.timeTaken).toBe(0)
      expect(features.errorCount).toBe(0)
      expect(features.recentMoves.every((m) => m === -1)).toBe(true)
      expect(features.previousStrategies.every((s) => s === -1)).toBe(true)
    })
  })
})
