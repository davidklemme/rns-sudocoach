'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useState } from 'react'

export default function FeedbackBadge() {
  const { showFeedback, lastStrategy, dismissFeedback } = useGameStore()
  const [expanded, setExpanded] = useState(false)

  if (!showFeedback || !lastStrategy) {
    return null
  }

  const getStrategyColor = () => {
    if (lastStrategy.confidence >= 0.9) return 'bg-green-500'
    if (lastStrategy.confidence >= 0.7) return 'bg-blue-500'
    if (lastStrategy.confidence >= 0.5) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  const getStrategyIcon = () => {
    switch (lastStrategy.strategy) {
      case 'single_candidate':
        return '🎯'
      case 'hidden_single':
        return '🔍'
      case 'elimination':
        return '❌'
      case 'naked_pair':
        return '👯'
      case 'guessing':
        return '🤔'
      default:
        return '💡'
    }
  }

  const getStrategyName = () => {
    return lastStrategy.strategy
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-20 right-4 z-50"
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden max-w-sm">
          {/* Badge Header */}
          <button
            onClick={() => setExpanded(!expanded)}
            className={`w-full p-4 ${getStrategyColor()} text-white font-semibold flex items-center justify-between hover:opacity-90 transition-opacity`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getStrategyIcon()}</span>
              <span>Strategy Detected!</span>
            </div>
            <span className="text-xl">{expanded ? '▼' : '▶'}</span>
          </button>

          {/* Expanded Content */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  {/* Strategy Name */}
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                      {getStrategyName()}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 flex-1">
                        <div
                          className={`h-2 rounded-full ${getStrategyColor()}`}
                          style={{ width: `${lastStrategy.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {Math.round(lastStrategy.confidence * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Explanation */}
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {lastStrategy.explanation}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={dismissFeedback}
                      className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Got it!
                    </button>
                    <button
                      onClick={() => {
                        dismissFeedback()
                        setExpanded(false)
                      }}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compact View */}
          {!expanded && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Click to see explanation
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
