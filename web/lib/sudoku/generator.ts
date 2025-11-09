/**
 * Sudoku puzzle generator
 * Generates puzzles with unique solutions at various difficulty levels
 */

import type { SudokuGrid, GridSize, Difficulty, Puzzle } from './types'
import { createEmptyGrid, cloneGrid, isValidMove } from './validator'
import { solve, hasUniqueSolution } from './solver'

/**
 * Generate a complete solved Sudoku grid
 */
export function generateSolvedGrid(size: GridSize, seed?: number): SudokuGrid {
  const grid = createEmptyGrid(size)

  // Use seed for deterministic generation (for reproducible puzzles)
  const random = seed !== undefined ? seededRandom(seed) : Math.random

  // Fill first row with shuffled numbers
  const numbers = shuffleArray(
    Array.from({ length: size }, (_, i) => i + 1),
    random
  )
  for (let c = 0; c < size; c++) {
    grid[0][c] = numbers[c]
  }

  // Solve the rest
  solve(grid)

  return grid
}

/**
 * Generate a Sudoku puzzle at specified difficulty
 */
export function generatePuzzle(
  size: GridSize,
  difficulty: Difficulty,
  seed?: number
): Puzzle {
  const solution = generateSolvedGrid(size, seed)
  const grid = cloneGrid(solution)

  const clues = getCluesForDifficulty(size, difficulty)
  const totalCells = size * size

  // Remove numbers while maintaining unique solution
  removeNumbers(grid, totalCells - clues, seed)

  // Ensure we have a unique solution
  if (!hasUniqueSolution(grid)) {
    // Retry with different seed
    return generatePuzzle(size, difficulty, seed ? seed + 1 : Date.now())
  }

  return {
    id: generatePuzzleId(size, difficulty, seed),
    grid,
    solution,
    difficulty,
    gridSize: size,
    createdAt: new Date(),
  }
}


/**
 * Remove numbers from grid while maintaining unique solution
 */
function removeNumbers(grid: SudokuGrid, count: number, seed?: number): void {
  const random = seed !== undefined ? seededRandom(seed * 2) : Math.random
  const size = grid.length
  const positions: Array<{ row: number; col: number }> = []

  // Create list of all positions
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      positions.push({ row, col })
    }
  }

  // Shuffle positions
  shuffleArray(positions, random)

  let removed = 0
  for (const { row, col } of positions) {
    if (removed >= count) break

    const backup = grid[row][col]
    grid[row][col] = null

    // Check if still has unique solution
    if (hasUniqueSolution(grid)) {
      removed++
    } else {
      // Restore the number
      grid[row][col] = backup
    }
  }
}

/**
 * Get number of clues for difficulty level
 */
function getCluesForDifficulty(size: GridSize, difficulty: Difficulty): number {
  const totalCells = size * size

  switch (size) {
    case 4:
      switch (difficulty) {
        case 'beginner':
          return 12 // 75%
        case 'easy':
          return 10 // 62.5%
        case 'medium':
          return 8 // 50%
        case 'hard':
          return 6 // 37.5%
        case 'expert':
          return 5 // 31.25%
      }
      break

    case 6:
      switch (difficulty) {
        case 'beginner':
          return 27 // 75%
        case 'easy':
          return 24 // 67%
        case 'medium':
          return 20 // 56%
        case 'hard':
          return 16 // 44%
        case 'expert':
          return 14 // 39%
      }
      break

    case 9:
      switch (difficulty) {
        case 'beginner':
          return 50 // 62%
        case 'easy':
          return 40 // 49%
        case 'medium':
          return 32 // 40%
        case 'hard':
          return 26 // 32%
        case 'expert':
          return 22 // 27%
      }
      break
  }

  return Math.floor(totalCells * 0.4)
}

/**
 * Get box size for grid
 */
function getBoxSizeForGrid(size: GridSize): number {
  switch (size) {
    case 4:
      return 2
    case 6:
      return 2
    case 9:
      return 3
    default:
      return 3
  }
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[], random: () => number): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/**
 * Create a seeded random number generator
 */
function seededRandom(seed: number): () => number {
  let state = seed
  return function () {
    state = (state * 9301 + 49297) % 233280
    return state / 233280
  }
}

/**
 * Generate a unique puzzle ID
 */
function generatePuzzleId(size: GridSize, difficulty: Difficulty, seed?: number): string {
  const timestamp = seed || Date.now()
  return `${size}x${size}-${difficulty}-${timestamp}`
}

/**
 * Quick puzzle generation (non-unique solution check, faster)
 * Use for practice/casual mode
 */
export function generateQuickPuzzle(
  size: GridSize,
  difficulty: Difficulty,
  seed?: number
): Puzzle {
  const solution = generateSolvedGrid(size, seed)
  const grid = cloneGrid(solution)

  const clues = getCluesForDifficulty(size, difficulty)
  const totalCells = size * size
  const random = seed !== undefined ? seededRandom(seed * 2) : Math.random

  // Simply remove random numbers without checking uniqueness
  const positions: Array<{ row: number; col: number }> = []
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      positions.push({ row, col })
    }
  }

  shuffleArray(positions, random)

  const toRemove = totalCells - clues
  for (let i = 0; i < toRemove; i++) {
    const { row, col } = positions[i]
    grid[row][col] = null
  }

  return {
    id: generatePuzzleId(size, difficulty, seed),
    grid,
    solution,
    difficulty,
    gridSize: size,
    createdAt: new Date(),
  }
}
