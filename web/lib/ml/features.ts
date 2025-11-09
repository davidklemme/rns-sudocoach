/**
 * Feature extraction for ML model
 * Converts game state into feature vectors for strategy classification
 */

import type { SudokuGrid } from '../sudoku/types'
import { getCandidates } from '../sudoku/validator'

export interface MoveFeatures {
  // Board state (flattened)
  boardState: number[] // 81 values for 9x9 (0 for empty, 1-9 for filled)

  // Move context
  row: number // 0-8
  col: number // 0-8
  value: number // 1-9

  // Cell candidates (one-hot encoded)
  availableCandidates: number[] // Array of 9 (1 if candidate, 0 if not)

  // Timing
  timeTaken: number // milliseconds since last move

  // Move history (last 5 moves)
  recentMoves: number[] // Last 5 cell indices (row * 9 + col)

  // Board completion
  completionPercentage: number // 0.0 to 1.0

  // Error context
  errorCount: number // Number of mistakes so far

  // Previous strategies (one-hot encoded)
  previousStrategies: number[] // Last 5 strategy types
}

/**
 * Extract features from current game state
 */
export function extractFeatures(
  grid: SudokuGrid,
  row: number,
  col: number,
  value: number,
  context: {
    timeSinceLastMove?: number
    recentMoves?: Array<{ row: number; col: number }>
    errorCount?: number
    previousStrategies?: string[]
  } = {}
): MoveFeatures {
  const gridSize = grid.length

  // Flatten board state
  const boardState = flattenGrid(grid, gridSize)

  // Get candidates for the target cell
  const candidates = getCandidates(grid, row, col)
  const availableCandidates = encodeCandidates(candidates, gridSize)

  // Encode recent moves as cell indices
  const recentMoves = encodeRecentMoves(context.recentMoves || [], gridSize)

  // Calculate completion percentage
  const completionPercentage = calculateCompletion(grid)

  // Encode previous strategies
  const previousStrategies = encodeStrategies(context.previousStrategies || [])

  return {
    boardState,
    row,
    col,
    value,
    availableCandidates,
    timeTaken: context.timeSinceLastMove || 0,
    recentMoves,
    completionPercentage,
    errorCount: context.errorCount || 0,
    previousStrategies,
  }
}

/**
 * Flatten grid to 1D array for ML model
 */
function flattenGrid(grid: SudokuGrid, size: number): number[] {
  const flattened: number[] = []

  // Pad or truncate to 81 elements (9x9 grid)
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (r < size && c < size) {
        flattened.push(grid[r][c] || 0)
      } else {
        flattened.push(0) // Padding for smaller grids
      }
    }
  }

  return flattened
}

/**
 * One-hot encode candidates
 */
function encodeCandidates(candidates: number[], gridSize: number): number[] {
  const encoded = Array(9).fill(0)

  candidates.forEach((num) => {
    if (num >= 1 && num <= 9) {
      encoded[num - 1] = 1
    }
  })

  return encoded
}

/**
 * Encode recent moves as cell indices
 */
function encodeRecentMoves(
  moves: Array<{ row: number; col: number }>,
  gridSize: number
): number[] {
  const encoded = Array(5).fill(-1) // -1 for no move

  moves.slice(-5).forEach((move, index) => {
    encoded[index] = move.row * gridSize + move.col
  })

  return encoded
}

/**
 * Calculate board completion percentage
 */
function calculateCompletion(grid: SudokuGrid): number {
  const size = grid.length
  let filled = 0
  let total = size * size

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== null) {
        filled++
      }
    }
  }

  return filled / total
}

/**
 * One-hot encode strategy types
 */
function encodeStrategies(strategies: string[]): number[] {
  const strategyMap: Record<string, number> = {
    elimination: 0,
    single_candidate: 1,
    hidden_single: 2,
    naked_pair: 3,
    naked_triple: 4,
    hidden_pair: 5,
    pointing_pair: 6,
    box_line_reduction: 7,
    x_wing: 8,
    guessing: 9,
    unknown: 10,
    advanced: 11,
  }

  const encoded = Array(5).fill(-1) // Last 5 strategies

  strategies.slice(-5).forEach((strategy, index) => {
    encoded[index] = strategyMap[strategy] ?? -1
  })

  return encoded
}

/**
 * Get total feature vector size
 */
export function getFeatureVectorSize(): number {
  return (
    81 + // boardState
    1 + // row
    1 + // col
    1 + // value
    9 + // availableCandidates
    1 + // timeTaken
    5 + // recentMoves
    1 + // completionPercentage
    1 + // errorCount
    5 // previousStrategies
  )
  // Total: 106 features
}

/**
 * Convert features to flat array for ML model
 */
export function featuresToArray(features: MoveFeatures): number[] {
  return [
    ...features.boardState,
    features.row,
    features.col,
    features.value,
    ...features.availableCandidates,
    features.timeTaken / 1000, // Normalize to seconds
    ...features.recentMoves,
    features.completionPercentage,
    features.errorCount,
    ...features.previousStrategies,
  ]
}

/**
 * Normalize features for ML model
 */
export function normalizeFeatures(features: number[]): number[] {
  return features.map((value, index) => {
    // Board state (0-9)
    if (index < 81) {
      return value / 9
    }

    // Row/Col (0-8)
    if (index === 81 || index === 82) {
      return value / 8
    }

    // Value (1-9)
    if (index === 83) {
      return (value - 1) / 8
    }

    // Candidates (already 0-1)
    if (index >= 84 && index < 93) {
      return value
    }

    // Time (normalize to 0-30 seconds)
    if (index === 93) {
      return Math.min(value / 30, 1)
    }

    // Recent moves (cell indices 0-80)
    if (index >= 94 && index < 99) {
      return value < 0 ? -1 : value / 80
    }

    // Completion (already 0-1)
    if (index === 99) {
      return value
    }

    // Error count (normalize to 0-10)
    if (index === 100) {
      return Math.min(value / 10, 1)
    }

    // Previous strategies (indices 0-11)
    if (index >= 101) {
      return value < 0 ? -1 : value / 11
    }

    return value
  })
}
