/**
 * Sudoku validation logic
 * Validates moves and board states according to Sudoku rules
 */

import type { SudokuGrid, GridSize, CellValue } from './types'

/**
 * Check if a value is valid for a specific cell
 */
export function isValidMove(
  grid: SudokuGrid,
  row: number,
  col: number,
  value: number
): boolean {
  const gridSize = grid.length as GridSize

  // Check if position is valid
  if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
    return false
  }

  // Check if value is in valid range
  if (value < 1 || value > gridSize) {
    return false
  }

  // Check row for duplicates
  for (let c = 0; c < gridSize; c++) {
    if (c !== col && grid[row][c] === value) {
      return false
    }
  }

  // Check column for duplicates
  for (let r = 0; r < gridSize; r++) {
    if (r !== row && grid[r][col] === value) {
      return false
    }
  }

  // Check box for duplicates
  const boxDimensions = getBoxDimensions(gridSize)
  const boxRow = Math.floor(row / boxDimensions.rows) * boxDimensions.rows
  const boxCol = Math.floor(col / boxDimensions.cols) * boxDimensions.cols

  for (let r = boxRow; r < boxRow + boxDimensions.rows; r++) {
    for (let c = boxCol; c < boxCol + boxDimensions.cols; c++) {
      if ((r !== row || c !== col) && grid[r][c] === value) {
        return false
      }
    }
  }

  return true
}

/**
 * Check if the entire grid is valid (no conflicts)
 */
export function isValidGrid(grid: SudokuGrid): boolean {
  const gridSize = grid.length as GridSize

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const value = grid[row][col]
      if (value !== null) {
        // Temporarily remove the value to check if it's valid
        grid[row][col] = null
        const valid = isValidMove(grid, row, col, value)
        grid[row][col] = value

        if (!valid) {
          return false
        }
      }
    }
  }

  return true
}

/**
 * Check if the grid is completely filled
 */
export function isGridComplete(grid: SudokuGrid): boolean {
  return grid.every(row => row.every(cell => cell !== null))
}

/**
 * Check if the grid is solved (complete and valid)
 */
export function isGridSolved(grid: SudokuGrid): boolean {
  return isGridComplete(grid) && isValidGrid(grid)
}

/**
 * Get the box size for a given grid size
 * 4x4 → 2x2, 6x6 → 2x3, 9x9 → 3x3
 */
export function getBoxSize(gridSize: GridSize): number {
  switch (gridSize) {
    case 4:
      return 2
    case 6:
      return 2
    case 9:
      return 3
    default:
      throw new Error(`Invalid grid size: ${gridSize}`)
  }
}

/**
 * Get box dimensions (rows x cols)
 */
export function getBoxDimensions(gridSize: GridSize): { rows: number; cols: number } {
  switch (gridSize) {
    case 4:
      return { rows: 2, cols: 2 }
    case 6:
      return { rows: 2, cols: 3 }
    case 9:
      return { rows: 3, cols: 3 }
    default:
      throw new Error(`Invalid grid size: ${gridSize}`)
  }
}

/**
 * Get all possible candidates for a cell
 */
export function getCandidates(grid: SudokuGrid, row: number, col: number): number[] {
  const gridSize = grid.length as GridSize

  if (grid[row][col] !== null) {
    return []
  }

  const candidates: number[] = []

  for (let value = 1; value <= gridSize; value++) {
    if (isValidMove(grid, row, col, value)) {
      candidates.push(value)
    }
  }

  return candidates
}

/**
 * Create an empty grid of specified size
 */
export function createEmptyGrid(size: GridSize): SudokuGrid {
  return Array.from({ length: size }, () => Array(size).fill(null))
}

/**
 * Deep clone a grid
 */
export function cloneGrid(grid: SudokuGrid): SudokuGrid {
  return grid.map(row => [...row])
}

/**
 * Check if two grids are equal
 */
export function areGridsEqual(grid1: SudokuGrid, grid2: SudokuGrid): boolean {
  if (grid1.length !== grid2.length) {
    return false
  }

  return grid1.every((row, r) =>
    row.every((cell, c) => cell === grid2[r][c])
  )
}
