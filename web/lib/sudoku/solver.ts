/**
 * Sudoku solver using backtracking algorithm
 */

import type { SudokuGrid, GridSize } from './types'
import { cloneGrid, isValidMove, getCandidates } from './validator'

/**
 * Solve a Sudoku puzzle using backtracking
 * Returns true if solved, false if no solution exists
 */
export function solve(grid: SudokuGrid): boolean {
  const emptyCell = findEmptyCell(grid)

  // Base case: no empty cells means puzzle is solved
  if (!emptyCell) {
    return true
  }

  const { row, col } = emptyCell
  const gridSize = grid.length as GridSize

  // Try each number from 1 to gridSize
  for (let num = 1; num <= gridSize; num++) {
    if (isValidMove(grid, row, col, num)) {
      grid[row][col] = num

      if (solve(grid)) {
        return true
      }

      // Backtrack
      grid[row][col] = null
    }
  }

  return false
}

/**
 * Get a solved version of the grid without modifying the original
 */
export function getSolution(grid: SudokuGrid): SudokuGrid | null {
  const gridCopy = cloneGrid(grid)

  if (solve(gridCopy)) {
    return gridCopy
  }

  return null
}

/**
 * Check if a puzzle has a unique solution
 */
export function hasUniqueSolution(grid: SudokuGrid): boolean {
  const solutions: SudokuGrid[] = []

  function findSolutions(g: SudokuGrid, maxSolutions: number = 2): void {
    if (solutions.length >= maxSolutions) {
      return
    }

    const emptyCell = findEmptyCell(g)

    if (!emptyCell) {
      solutions.push(cloneGrid(g))
      return
    }

    const { row, col } = emptyCell
    const gridSize = g.length as GridSize

    for (let num = 1; num <= gridSize; num++) {
      if (isValidMove(g, row, col, num)) {
        g[row][col] = num
        findSolutions(g, maxSolutions)
        g[row][col] = null

        if (solutions.length >= maxSolutions) {
          return
        }
      }
    }
  }

  const gridCopy = cloneGrid(grid)
  findSolutions(gridCopy, 2)

  return solutions.length === 1
}

/**
 * Count the number of solutions (up to a maximum)
 */
export function countSolutions(grid: SudokuGrid, max: number = 2): number {
  let count = 0

  function countSolutionsRecursive(g: SudokuGrid): void {
    if (count >= max) {
      return
    }

    const emptyCell = findEmptyCell(g)

    if (!emptyCell) {
      count++
      return
    }

    const { row, col } = emptyCell
    const gridSize = g.length as GridSize

    for (let num = 1; num <= gridSize; num++) {
      if (isValidMove(g, row, col, num)) {
        g[row][col] = num
        countSolutionsRecursive(g)
        g[row][col] = null

        if (count >= max) {
          return
        }
      }
    }
  }

  const gridCopy = cloneGrid(grid)
  countSolutionsRecursive(gridCopy)

  return count
}

/**
 * Find an empty cell in the grid
 * Uses MRV (Minimum Remaining Values) heuristic for better performance
 */
function findEmptyCell(grid: SudokuGrid): { row: number; col: number } | null {
  const gridSize = grid.length
  let minCandidates = gridSize + 1
  let bestCell: { row: number; col: number } | null = null

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (grid[row][col] === null) {
        const candidates = getCandidates(grid, row, col)

        if (candidates.length === 0) {
          // No valid candidates means this configuration is unsolvable
          return { row, col }
        }

        if (candidates.length < minCandidates) {
          minCandidates = candidates.length
          bestCell = { row, col }

          // If only one candidate, this is the best we can do
          if (minCandidates === 1) {
            return bestCell
          }
        }
      }
    }
  }

  return bestCell
}

/**
 * Get a hint for the next move (finds a cell with minimum candidates)
 */
export function getHint(grid: SudokuGrid): { row: number; col: number; value: number } | null {
  const emptyCell = findEmptyCell(grid)

  if (!emptyCell) {
    return null
  }

  const { row, col } = emptyCell
  const candidates = getCandidates(grid, row, col)

  if (candidates.length === 0) {
    return null
  }

  // Create a copy and solve to find the correct value
  const gridCopy = cloneGrid(grid)
  if (solve(gridCopy)) {
    const value = gridCopy[row][col]
    if (value !== null) {
      return { row, col, value }
    }
  }

  return null
}
