/**
 * Integration tests for ML prediction flow
 */

import { extractFeatures, featuresToArray, normalizeFeatures } from '@/lib/ml/features'
import { mockPredict } from '@/lib/ml/mock'
import { createEmptyGrid } from '@/lib/sudoku/validator'
import type { SudokuGrid } from '@/lib/sudoku/types'

describe('ML Integration', () => {
  it('should complete full prediction flow', async () => {
    // Create a simple game state
    const grid: SudokuGrid = createEmptyGrid(9)
    grid[0][0] = 1
    grid[0][1] = 2
    grid[0][2] = 3

    // Extract features
    const features = extractFeatures(grid, 0, 3, 4, {
      timeSinceLastMove: 2000,
      recentMoves: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
      errorCount: 0,
      previousStrategies: [],
    })

    // Verify features are extracted correctly
    expect(features.row).toBe(0)
    expect(features.col).toBe(3)
    expect(features.value).toBe(4)
    expect(features.timeTaken).toBe(2000)
    expect(features.errorCount).toBe(0)

    // Convert to array and normalize
    const featureArray = featuresToArray(features)
    expect(featureArray.length).toBe(106)

    const normalized = normalizeFeatures(featureArray)
    expect(normalized.length).toBe(106)

    // All normalized values should be in valid range
    normalized.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(-1)
      expect(value).toBeLessThanOrEqual(1)
    })

    // Run async prediction
    const prediction = await mockPredict(features)

    // Verify prediction result
    expect(prediction).toHaveProperty('strategy')
    expect(prediction).toHaveProperty('confidence')
    expect(prediction).toHaveProperty('probabilities')

    expect(typeof prediction.strategy).toBe('string')
    expect(prediction.confidence).toBeGreaterThanOrEqual(0)
    expect(prediction.confidence).toBeLessThanOrEqual(1)

    // Verify probabilities sum to ~1
    const probSum = Object.values(prediction.probabilities).reduce((a, b) => a + b, 0)
    expect(probSum).toBeCloseTo(1.0, 2)
  })

  it('should handle async predictions with realistic timing', async () => {
    const grid: SudokuGrid = createEmptyGrid(4)
    grid[0][0] = 1

    const features = extractFeatures(grid, 0, 1, 2)

    const startTime = Date.now()
    const prediction = await mockPredict(features)
    const duration = Date.now() - startTime

    // Mock prediction should take 20-50ms (simulating real ML inference)
    expect(duration).toBeGreaterThanOrEqual(20)
    expect(duration).toBeLessThan(100)

    expect(prediction.strategy).toBeTruthy()
  })

  it('should handle multiple concurrent predictions', async () => {
    const grid: SudokuGrid = createEmptyGrid(9)

    // Create multiple predictions concurrently
    const predictions = await Promise.all([
      mockPredict(extractFeatures(grid, 0, 0, 1)),
      mockPredict(extractFeatures(grid, 0, 1, 2)),
      mockPredict(extractFeatures(grid, 0, 2, 3)),
      mockPredict(extractFeatures(grid, 0, 3, 4)),
      mockPredict(extractFeatures(grid, 0, 4, 5)),
    ])

    // All predictions should complete
    expect(predictions).toHaveLength(5)
    predictions.forEach((prediction) => {
      expect(prediction.strategy).toBeTruthy()
      expect(prediction.confidence).toBeGreaterThanOrEqual(0)
      expect(prediction.confidence).toBeLessThanOrEqual(1)
    })
  })

  it('should provide different strategies based on game context', async () => {
    // Single candidate scenario
    const grid1: SudokuGrid = createEmptyGrid(9)
    for (let i = 1; i <= 8; i++) {
      grid1[0][i] = i
    }

    const prediction1 = await mockPredict(extractFeatures(grid1, 0, 0, 9))
    expect(prediction1.strategy).toBe('single_candidate')
    expect(prediction1.confidence).toBeGreaterThan(0.9)

    // Elimination scenario
    const grid2: SudokuGrid = createEmptyGrid(9)
    grid2[0][0] = 1
    grid2[0][1] = 2

    const prediction2 = await mockPredict(extractFeatures(grid2, 0, 2, 3))
    expect(prediction2.strategy).toBeTruthy()
  })

  it('should include timing context in predictions', async () => {
    const grid: SudokuGrid = createEmptyGrid(9)

    // Fast move (< 1 second)
    const features1 = extractFeatures(grid, 0, 0, 1, {
      timeSinceLastMove: 500,
    })
    expect(features1.timeTaken).toBe(500)

    // Slow move (> 5 seconds)
    const features2 = extractFeatures(grid, 0, 1, 2, {
      timeSinceLastMove: 8000,
    })
    expect(features2.timeTaken).toBe(8000)

    // Both should still get predictions
    const [pred1, pred2] = await Promise.all([
      mockPredict(features1),
      mockPredict(features2),
    ])

    expect(pred1.strategy).toBeTruthy()
    expect(pred2.strategy).toBeTruthy()
  })
})
