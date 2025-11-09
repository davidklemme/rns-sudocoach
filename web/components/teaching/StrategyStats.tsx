'use client'

import { useGameStore } from '@/store/gameStore'
import { getAllStrategies } from '@/lib/sudoku/strategies'

export default function StrategyStats() {
  const { strategiesUsed } = useGameStore()

  const allStrategies = getAllStrategies()
  const totalMoves = Array.from(strategiesUsed.values()).reduce((sum, count) => sum + count, 0)

  if (totalMoves === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          Strategy Usage
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          Make some moves to see your strategy usage!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
        Strategy Usage
      </h2>

      <div className="space-y-3">
        {Array.from(strategiesUsed.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([strategy, count]) => {
            const percentage = (count / totalMoves) * 100
            const strategyInfo = allStrategies.find((s) => s.name === strategy)

            return (
              <div key={strategy} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {strategy.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>

                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      strategyInfo?.difficulty === 'beginner'
                        ? 'bg-green-500'
                        : strategyInfo?.difficulty === 'intermediate'
                        ? 'bg-blue-500'
                        : 'bg-purple-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {strategyInfo && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {strategyInfo.description}
                  </p>
                )}
              </div>
            )
          })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Total Moves:</span>
          <span className="text-gray-600 dark:text-gray-400">{totalMoves}</span>
        </div>
      </div>
    </div>
  )
}
