/**
 * Mock ML model for development and testing
 * Returns rule-based predictions that mimic ML behavior
 */

import type { MoveFeatures } from './features'
import type { MLPrediction } from './service'
import { detectStrategy } from '../sudoku/strategies'
import { createEmptyGrid } from '../sudoku/validator'

/**
 * Mock ML prediction using rule-based detection
 * This simulates what the real ML model will return
 */
export async function mockPredict(features: MoveFeatures): Promise<MLPrediction> {
  // Simulate async delay (ML inference time)
  await new Promise((resolve) => setTimeout(resolve, 20 + Math.random() * 30))

  // Reconstruct grid from board state
  const grid = reconstructGrid(features.boardState)

  // Use rule-based detection
  const strategy = detectStrategy(grid, features.row, features.col, features.value)

  // Create probability distribution
  const probabilities = createProbabilityDistribution(
    strategy.strategy,
    strategy.confidence
  )

  return {
    strategy: strategy.strategy,
    confidence: strategy.confidence,
    probabilities,
  }
}

/**
 * Reconstruct grid from flattened board state
 */
function reconstructGrid(boardState: number[]): any {
  const grid: any = []

  for (let r = 0; r < 9; r++) {
    grid[r] = []
    for (let c = 0; c < 9; c++) {
      const value = boardState[r * 9 + c]
      grid[r][c] = value === 0 ? null : value
    }
  }

  return grid
}

/**
 * Create probability distribution for strategies
 */
function createProbabilityDistribution(
  primaryStrategy: string,
  confidence: number
): Record<string, number> {
  const strategies = [
    'elimination',
    'single_candidate',
    'hidden_single',
    'naked_pair',
    'naked_triple',
    'hidden_pair',
    'pointing_pair',
    'box_line_reduction',
    'x_wing',
    'guessing',
    'unknown',
    'advanced',
  ]

  const probabilities: Record<string, number> = {}
  let remaining = 1.0 - confidence

  strategies.forEach((strategy) => {
    if (strategy === primaryStrategy) {
      probabilities[strategy] = confidence
    } else {
      // Distribute remaining probability
      const prob = remaining / (strategies.length - 1)
      probabilities[strategy] = prob
    }
  })

  return probabilities
}

/**
 * Mock model training data generator
 * Generates synthetic training examples
 */
export function generateTrainingData(count: number): Array<{
  features: MoveFeatures
  label: string
}> {
  const data: Array<{ features: MoveFeatures; label: string }> = []

  // This would generate synthetic training data
  // For now, returns empty array (real data would come from player moves)

  return data
}

/**
 * Export model metrics (for monitoring)
 */
export interface ModelMetrics {
  accuracy: number
  precision: Record<string, number>
  recall: Record<string, number>
  f1Score: Record<string, number>
  inferenceTimeMs: number
}

/**
 * Get mock model metrics
 */
export function getMockModelMetrics(): ModelMetrics {
  return {
    accuracy: 0.87, // Mock accuracy
    precision: {
      single_candidate: 0.95,
      hidden_single: 0.88,
      elimination: 0.82,
      naked_pair: 0.78,
      guessing: 0.65,
    },
    recall: {
      single_candidate: 0.92,
      hidden_single: 0.85,
      elimination: 0.80,
      naked_pair: 0.75,
      guessing: 0.70,
    },
    f1Score: {
      single_candidate: 0.93,
      hidden_single: 0.86,
      elimination: 0.81,
      naked_pair: 0.76,
      guessing: 0.67,
    },
    inferenceTimeMs: 35, // Average inference time
  }
}
