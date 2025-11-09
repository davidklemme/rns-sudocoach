/**
 * Sudoku solving strategies
 * Identifies which strategy was used for a move
 */

import type { SudokuGrid } from './types'
import { getCandidates, isValidMove } from './validator'

export type Strategy =
  | 'elimination'
  | 'single_candidate'
  | 'hidden_single'
  | 'naked_pair'
  | 'naked_triple'
  | 'hidden_pair'
  | 'pointing_pair'
  | 'box_line_reduction'
  | 'x_wing'
  | 'guessing'
  | 'unknown'
  | 'advanced'

export interface StrategyResult {
  strategy: Strategy
  confidence: number
  explanation: string
  affectedCells?: Array<{ row: number; col: number }>
  eliminatedCandidates?: Array<{ row: number; col: number; value: number }>
}

/**
 * Detect which strategy was used for a move
 */
export function detectStrategy(
  grid: SudokuGrid,
  row: number,
  col: number,
  value: number
): StrategyResult {
  const gridSize = grid.length

  // Get candidates before the move
  const candidates = getCandidates(grid, row, col)

  // Single Candidate (Naked Single) - only one possible value
  if (candidates.length === 1 && candidates[0] === value) {
    return {
      strategy: 'single_candidate',
      confidence: 1.0,
      explanation: `This cell could only be ${value}. All other numbers were already used in this row, column, or box.`,
      affectedCells: getRelatedCells(gridSize, row, col),
    }
  }

  // Hidden Single - only place for this number in row/column/box
  const hiddenSingle = detectHiddenSingle(grid, row, col, value)
  if (hiddenSingle) {
    return hiddenSingle
  }

  // Elimination - value was determined by eliminating other possibilities
  if (candidates.length <= 3 && candidates.includes(value)) {
    return {
      strategy: 'elimination',
      confidence: 0.8,
      explanation: `By eliminating other numbers, ${value} was one of the few remaining possibilities for this cell.`,
      affectedCells: getRelatedCells(gridSize, row, col),
    }
  }

  // Naked Pair/Triple detection
  const nakedSet = detectNakedSet(grid, row, col, value)
  if (nakedSet) {
    return nakedSet
  }

  // Check if this was a valid move based on candidates
  if (candidates.includes(value)) {
    return {
      strategy: 'unknown',
      confidence: 0.5,
      explanation: `${value} was a valid choice for this cell, but the specific strategy used is unclear.`,
    }
  }

  // If not in candidates, might be guessing or error
  return {
    strategy: 'guessing',
    confidence: 0.3,
    explanation: `This move doesn't follow a clear logical pattern. Consider looking for cells with fewer possibilities first.`,
  }
}

/**
 * Detect Hidden Single strategy
 */
function detectHiddenSingle(
  grid: SudokuGrid,
  row: number,
  col: number,
  value: number
): StrategyResult | null {
  const gridSize = grid.length

  // Check if value appears only once in row candidates
  const rowPositions = countValueInRowCandidates(grid, row, value)
  if (rowPositions.length === 1 && rowPositions[0] === col) {
    return {
      strategy: 'hidden_single',
      confidence: 0.95,
      explanation: `${value} could only go in this position in row ${row + 1}. All other cells in this row already ruled out ${value}.`,
      affectedCells: getRowCells(gridSize, row),
    }
  }

  // Check if value appears only once in column candidates
  const colPositions = countValueInColumnCandidates(grid, col, value)
  if (colPositions.length === 1 && colPositions[0] === row) {
    return {
      strategy: 'hidden_single',
      confidence: 0.95,
      explanation: `${value} could only go in this position in column ${col + 1}. All other cells in this column already ruled out ${value}.`,
      affectedCells: getColumnCells(gridSize, col),
    }
  }

  // Check if value appears only once in box candidates
  const boxPositions = countValueInBoxCandidates(grid, row, col, value)
  if (boxPositions.length === 1 && boxPositions[0].row === row && boxPositions[0].col === col) {
    return {
      strategy: 'hidden_single',
      confidence: 0.95,
      explanation: `${value} could only go in this position in this box. All other cells in this box already ruled out ${value}.`,
      affectedCells: getBoxCells(grid.length, row, col),
    }
  }

  return null
}

/**
 * Detect Naked Pair/Triple strategy
 */
function detectNakedSet(
  grid: SudokuGrid,
  row: number,
  col: number,
  value: number
): StrategyResult | null {
  // This is a simplified detection - full implementation would check for actual naked pairs
  const candidates = getCandidates(grid, row, col)

  if (candidates.length === 2) {
    // Check if there's another cell in the row with the same 2 candidates
    const gridSize = grid.length
    for (let c = 0; c < gridSize; c++) {
      if (c !== col && grid[row][c] === null) {
        const otherCandidates = getCandidates(grid, row, c)
        if (
          otherCandidates.length === 2 &&
          arraysEqual(candidates.sort(), otherCandidates.sort())
        ) {
          return {
            strategy: 'naked_pair',
            confidence: 0.85,
            explanation: `This cell and another cell in row ${row + 1} both have only ${candidates.join(' and ')} as possibilities, forming a Naked Pair.`,
            affectedCells: [
              { row, col },
              { row, col: c },
            ],
          }
        }
      }
    }
  }

  return null
}

/**
 * Helper: Get all cells in the same row, column, and box
 */
function getRelatedCells(
  gridSize: number,
  row: number,
  col: number
): Array<{ row: number; col: number }> {
  const cells: Array<{ row: number; col: number }> = []

  // Same row
  for (let c = 0; c < gridSize; c++) {
    if (c !== col) cells.push({ row, col: c })
  }

  // Same column
  for (let r = 0; r < gridSize; r++) {
    if (r !== row) cells.push({ row: r, col })
  }

  // Same box
  cells.push(...getBoxCells(gridSize, row, col))

  // Remove duplicates
  const unique = new Map<string, { row: number; col: number }>()
  cells.forEach((cell) => {
    const key = `${cell.row},${cell.col}`
    unique.set(key, cell)
  })

  return Array.from(unique.values())
}

/**
 * Get all cells in a row
 */
function getRowCells(gridSize: number, row: number): Array<{ row: number; col: number }> {
  const cells: Array<{ row: number; col: number }> = []
  for (let c = 0; c < gridSize; c++) {
    cells.push({ row, col: c })
  }
  return cells
}

/**
 * Get all cells in a column
 */
function getColumnCells(gridSize: number, col: number): Array<{ row: number; col: number }> {
  const cells: Array<{ row: number; col: number }> = []
  for (let r = 0; r < gridSize; r++) {
    cells.push({ row: r, col })
  }
  return cells
}

/**
 * Get all cells in a box
 */
function getBoxCells(
  gridSize: number,
  row: number,
  col: number
): Array<{ row: number; col: number }> {
  const cells: Array<{ row: number; col: number }> = []
  const boxSize = gridSize === 4 ? 2 : gridSize === 6 ? 2 : 3
  const boxColSize = gridSize === 6 ? 3 : boxSize
  const boxRow = Math.floor(row / boxSize) * boxSize
  const boxCol = Math.floor(col / boxColSize) * boxColSize

  for (let r = boxRow; r < boxRow + boxSize; r++) {
    for (let c = boxCol; c < boxCol + boxColSize; c++) {
      if (r !== row || c !== col) {
        cells.push({ row: r, col: c })
      }
    }
  }

  return cells
}

/**
 * Count where a value can go in a row
 */
function countValueInRowCandidates(grid: SudokuGrid, row: number, value: number): number[] {
  const positions: number[] = []
  const gridSize = grid.length

  for (let col = 0; col < gridSize; col++) {
    if (grid[row][col] === null) {
      const candidates = getCandidates(grid, row, col)
      if (candidates.includes(value)) {
        positions.push(col)
      }
    }
  }

  return positions
}

/**
 * Count where a value can go in a column
 */
function countValueInColumnCandidates(grid: SudokuGrid, col: number, value: number): number[] {
  const positions: number[] = []
  const gridSize = grid.length

  for (let row = 0; row < gridSize; row++) {
    if (grid[row][col] === null) {
      const candidates = getCandidates(grid, row, col)
      if (candidates.includes(value)) {
        positions.push(row)
      }
    }
  }

  return positions
}

/**
 * Count where a value can go in a box
 */
function countValueInBoxCandidates(
  grid: SudokuGrid,
  row: number,
  col: number,
  value: number
): Array<{ row: number; col: number }> {
  const positions: Array<{ row: number; col: number }> = []
  const gridSize = grid.length
  const boxSize = gridSize === 4 ? 2 : gridSize === 6 ? 2 : 3
  const boxColSize = gridSize === 6 ? 3 : boxSize
  const boxRow = Math.floor(row / boxSize) * boxSize
  const boxCol = Math.floor(col / boxColSize) * boxColSize

  for (let r = boxRow; r < boxRow + boxSize; r++) {
    for (let c = boxCol; c < boxCol + boxColSize; c++) {
      if (grid[r][c] === null) {
        const candidates = getCandidates(grid, r, c)
        if (candidates.includes(value)) {
          positions.push({ row: r, col: c })
        }
      }
    }
  }

  return positions
}

/**
 * Check if two arrays are equal
 */
function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  return a.every((val, index) => val === b[index])
}

/**
 * Get all available strategies for teaching
 */
export function getAllStrategies(): Array<{
  name: Strategy
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  description: string
}> {
  return [
    {
      name: 'elimination',
      difficulty: 'beginner',
      description: 'Rule out numbers that are already used in the same row, column, or box.',
    },
    {
      name: 'single_candidate',
      difficulty: 'beginner',
      description: 'Find cells where only one number is possible.',
    },
    {
      name: 'hidden_single',
      difficulty: 'intermediate',
      description: 'Find numbers that can only go in one place within a row, column, or box.',
    },
    {
      name: 'naked_pair',
      difficulty: 'intermediate',
      description: 'Two cells in a row/column/box with the same two candidates eliminate those numbers from other cells.',
    },
    {
      name: 'naked_triple',
      difficulty: 'advanced',
      description: 'Three cells with the same three candidates eliminate those numbers from other cells.',
    },
    {
      name: 'pointing_pair',
      difficulty: 'advanced',
      description: 'When candidates for a number in a box are all in the same row/column, eliminate from the rest of that row/column.',
    },
    {
      name: 'x_wing',
      difficulty: 'advanced',
      description: 'Advanced pattern that eliminates candidates across rows and columns.',
    },
  ]
}
