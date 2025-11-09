'use client'

import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'

interface CellProps {
  row: number
  col: number
  value: number | null
  isInitial: boolean
  isSelected: boolean
  isHighlighted: boolean
  isError: boolean
  pencilMarks?: Set<number>
  gridSize: number
}

export default function Cell({
  row,
  col,
  value,
  isInitial,
  isSelected,
  isHighlighted,
  isError,
  pencilMarks,
  gridSize,
}: CellProps) {
  const selectCell = useGameStore((state) => state.selectCell)

  const handleClick = () => {
    if (!isInitial) {
      selectCell(row, col)
    }
  }

  const getCellBorderClasses = () => {
    const borders = []

    // Box borders (thicker)
    const boxRows = gridSize === 4 ? 2 : gridSize === 6 ? 2 : 3
    const boxCols = gridSize === 6 ? 3 : boxRows

    if (row % boxRows === 0 && row !== 0) {
      borders.push('border-t-2')
    }
    if (col % boxCols === 0 && col !== 0) {
      borders.push('border-l-2')
    }

    // Grid borders (normal)
    if (row === 0) {
      borders.push('border-t-2')
    }
    if (col === 0) {
      borders.push('border-l-2')
    }
    if (row === gridSize - 1) {
      borders.push('border-b-2')
    }
    if (col === gridSize - 1) {
      borders.push('border-r-2')
    }

    // Regular borders
    if (!borders.includes('border-t-2')) {
      borders.push('border-t')
    }
    if (!borders.includes('border-l-2')) {
      borders.push('border-l')
    }
    if (!borders.includes('border-b-2')) {
      borders.push('border-b')
    }
    if (!borders.includes('border-r-2')) {
      borders.push('border-r')
    }

    return borders.join(' ')
  }

  const getCellBackgroundClass = () => {
    if (isSelected) {
      return 'bg-blue-200 dark:bg-blue-900'
    }
    if (isHighlighted) {
      return 'bg-blue-50 dark:bg-blue-950'
    }
    return 'bg-white dark:bg-gray-800'
  }

  const getTextColorClass = () => {
    if (isInitial) {
      return 'text-gray-900 dark:text-gray-100 font-bold'
    }
    return 'text-blue-600 dark:text-blue-400'
  }

  return (
    <motion.button
      className={`
        aspect-square flex items-center justify-center
        ${getCellBorderClasses()}
        ${getCellBackgroundClass()}
        ${getTextColorClass()}
        border-gray-400 dark:border-gray-600
        transition-colors duration-150
        ${!isInitial ? 'hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer' : 'cursor-default'}
        relative
      `}
      onClick={handleClick}
      animate={isError ? { x: [-3, 3, -3, 3, 0] } : {}}
      transition={{ duration: 0.3 }}
      whileTap={!isInitial ? { scale: 0.95 } : {}}
    >
      {value ? (
        <motion.span
          className={`text-lg sm:text-xl md:text-2xl ${gridSize === 9 ? 'text-base sm:text-lg md:text-xl' : ''}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {value}
        </motion.span>
      ) : pencilMarks && pencilMarks.size > 0 ? (
        <div className={`grid ${gridSize === 4 ? 'grid-cols-2' : gridSize === 6 ? 'grid-cols-3' : 'grid-cols-3'} gap-0 text-xs text-gray-500 dark:text-gray-400 absolute inset-0 p-1`}>
          {Array.from({ length: gridSize }, (_, i) => i + 1).map((num) => (
            <div key={num} className="flex items-center justify-center">
              {pencilMarks.has(num) ? num : ''}
            </div>
          ))}
        </div>
      ) : null}

      {isError && (
        <motion.div
          className="absolute inset-0 bg-red-200 dark:bg-red-900 opacity-50"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  )
}
