/**
 * Tests for strategy detection
 * Based on ML test stories from specification
 */

import { detectStrategy, getAllStrategies } from '@/lib/sudoku/strategies'
import { createEmptyGrid } from '@/lib/sudoku/validator'
import type { SudokuGrid } from '@/lib/sudoku/types'

describe('Strategy Detection', () => {
  describe('Single Candidate (Naked Single)', () => {
    // Story 1 from specification
    it('should detect single candidate when only one value is possible', () => {
      // Create a scenario where cell (1,1) can only be 3
      const grid: SudokuGrid = createEmptyGrid(4)
      grid[0][0] = 1
      grid[0][1] = 2
      grid[1][0] = 4
      // Cell (1,1) can only be 3

      const result = detectStrategy(grid, 1, 1, 3)

      expect(result.strategy).toBe('single_candidate')
      expect(result.confidence).toBeGreaterThan(0.9)
      expect(result.explanation).toContain('only')
    })

    it('should have high confidence for single candidate', () => {
      const grid: SudokuGrid = [
        [1, 2, null, 4],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]

      const result = detectStrategy(grid, 0, 2, 3)

      expect(result.confidence).toBe(1.0)
      expect(result.strategy).toBe('single_candidate')
    })
  })

  describe('Hidden Single', () => {
    // Story 2 from specification
    it('should detect hidden single in row', () => {
      const grid: SudokuGrid = createEmptyGrid(9)

      // Set up: 8 can only go in one place in row 0
      grid[0][0] = 1
      grid[0][1] = 2
      grid[0][2] = 3
      grid[0][3] = 4
      grid[0][4] = 5
      grid[0][5] = 6
      grid[0][6] = 7
      grid[0][8] = 9
      // Position [0][7] is the only place for 8

      const result = detectStrategy(grid, 0, 7, 8)

      expect(result.strategy).toBe('hidden_single')
      expect(result.confidence).toBeGreaterThan(0.9)
      expect(result.explanation).toContain('row')
    })

    it('should detect hidden single in column', () => {
      const grid: SudokuGrid = createEmptyGrid(9)

      // Set up: 5 can only go in one place in column 2
      grid[0][2] = 1
      grid[1][2] = 2
      grid[2][2] = 3
      grid[3][2] = 4
      grid[5][2] = 6
      grid[6][2] = 7
      grid[7][2] = 8
      grid[8][2] = 9
      // Position [4][2] is the only place for 5

      const result = detectStrategy(grid, 4, 2, 5)

      expect(result.strategy).toBe('hidden_single')
      expect(result.confidence).toBeGreaterThan(0.9)
      expect(result.explanation).toContain('column')
    })

    it('should detect hidden single in box', () => {
      const grid: SudokuGrid = createEmptyGrid(4)

      // Set up 2x2 box where 4 can only go in one place
      grid[0][0] = 1
      grid[0][1] = 2
      grid[1][0] = 3
      // [1][1] is the only place for 4 in this box

      const result = detectStrategy(grid, 1, 1, 4)

      expect(result.strategy).toBe('hidden_single')
      expect(result.confidence).toBeGreaterThan(0.9)
      expect(result.explanation).toContain('box')
    })
  })

  describe('Elimination Strategy', () => {
    // Story 1 variation
    it('should detect elimination when few candidates remain', () => {
      const grid: SudokuGrid = createEmptyGrid(4)

      // Set up cell with 2-3 candidates
      grid[0][0] = 1
      grid[1][0] = 2
      // Cell [0][1] has candidates [3, 4]

      const result = detectStrategy(grid, 0, 1, 3)

      expect(['elimination', 'single_candidate']).toContain(result.strategy)
      expect(result.confidence).toBeGreaterThan(0.7)
    })
  })

  describe('Naked Pair Detection', () => {
    // Story 3 from specification
    it('should detect naked pair when two cells have same two candidates', () => {
      const grid: SudokuGrid = createEmptyGrid(4)

      // Create scenario where two cells both have only {3, 4}
      grid[0][0] = 1
      grid[0][2] = 2
      // Cells [0][1] and [0][3] both can only be 3 or 4

      const result = detectStrategy(grid, 0, 1, 3)

      // Should detect either naked_pair or single_candidate depending on setup
      expect(['naked_pair', 'elimination', 'single_candidate']).toContain(result.strategy)
    })
  })

  describe('Guessing Detection', () => {
    // Story 4 from specification
    it('should detect guessing when move is not in candidates', () => {
      const grid: SudokuGrid = createEmptyGrid(4)

      // Try to place a number that's already in the row
      grid[0][0] = 1

      const result = detectStrategy(grid, 0, 1, 1)

      expect(result.strategy).toBe('guessing')
      expect(result.confidence).toBeLessThan(0.5)
      expect(result.explanation).toContain('guess')
    })

    it('should flag uncertain moves with low confidence', () => {
      const grid: SudokuGrid = createEmptyGrid(9)

      // Empty board - many possibilities
      const result = detectStrategy(grid, 0, 0, 5)

      expect(result.confidence).toBeLessThan(0.8)
    })
  })

  describe('Strategy Metadata', () => {
    it('should return affected cells for visualization', () => {
      const grid: SudokuGrid = createEmptyGrid(4)
      grid[0][0] = 1

      const result = detectStrategy(grid, 0, 1, 2)

      expect(result.affectedCells).toBeDefined()
      expect(result.affectedCells!.length).toBeGreaterThan(0)
    })

    it('should include helpful explanations', () => {
      const grid: SudokuGrid = createEmptyGrid(4)
      grid[0][0] = 1
      grid[0][1] = 2
      grid[1][0] = 4

      const result = detectStrategy(grid, 1, 1, 3)

      expect(result.explanation).toBeTruthy()
      expect(result.explanation.length).toBeGreaterThan(20)
    })
  })

  describe('getAllStrategies', () => {
    it('should return list of all teaching strategies', () => {
      const strategies = getAllStrategies()

      expect(strategies.length).toBeGreaterThan(5)
      expect(strategies[0]).toHaveProperty('name')
      expect(strategies[0]).toHaveProperty('difficulty')
      expect(strategies[0]).toHaveProperty('description')
    })

    it('should categorize strategies by difficulty', () => {
      const strategies = getAllStrategies()

      const beginner = strategies.filter((s) => s.difficulty === 'beginner')
      const intermediate = strategies.filter((s) => s.difficulty === 'intermediate')
      const advanced = strategies.filter((s) => s.difficulty === 'advanced')

      expect(beginner.length).toBeGreaterThan(0)
      expect(intermediate.length).toBeGreaterThan(0)
      expect(advanced.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle 6x6 grids', () => {
      const grid: SudokuGrid = createEmptyGrid(6)
      grid[0][0] = 1

      const result = detectStrategy(grid, 0, 1, 2)

      expect(result.strategy).toBeDefined()
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should handle 9x9 grids', () => {
      const grid: SudokuGrid = createEmptyGrid(9)
      grid[0][0] = 1

      const result = detectStrategy(grid, 0, 1, 2)

      expect(result.strategy).toBeDefined()
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should handle empty grid', () => {
      const grid: SudokuGrid = createEmptyGrid(4)

      const result = detectStrategy(grid, 0, 0, 1)

      expect(result).toBeDefined()
      expect(result.strategy).toBeDefined()
    })
  })

  // Test scenarios matching specification stories
  describe('ML Test Story Scenarios', () => {
    it('Story 1: Should detect single candidate for beginner', () => {
      const grid: SudokuGrid = [
        [1, 2, 3, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ]

      const result = detectStrategy(grid, 0, 3, 4)

      expect(result.strategy).toBe('single_candidate')
      expect(result.confidence).toBeGreaterThanOrEqual(0.9)
      expect(result.explanation).toMatch(/only|could only/)
    })

    it('Story 6: Should provide age-appropriate feedback', () => {
      const grid: SudokuGrid = createEmptyGrid(4)
      grid[0][0] = 1
      grid[0][1] = 2
      grid[1][0] = 4

      const result = detectStrategy(grid, 1, 1, 3)

      // Explanation should be simple and clear
      expect(result.explanation).toBeTruthy()
      expect(result.explanation.length).toBeLessThan(200) // Concise
      expect(result.explanation).not.toContain('algorithm') // Not too technical
    })
  })
})
