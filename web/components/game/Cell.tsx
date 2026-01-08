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
  isHint?: boolean
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
  isHint,
  pencilMarks,
  gridSize,
}: CellProps) {
  const selectCell = useGameStore((state) => state.selectCell)

  const handleClick = () => {
    // Allow selecting any cell for navigation/viewing
    // The makeMove function will prevent modifying initial cells
    selectCell(row, col)
  }

  const boxRows = gridSize === 4 ? 2 : gridSize === 6 ? 2 : 3
  const boxCols = gridSize === 6 ? 3 : boxRows

  const isTopBoxBoundary = row % boxRows === 0
  const isLeftBoxBoundary = col % boxCols === 0
  const isBottomBoxBoundary = row === gridSize - 1 || (row + 1) % boxRows === 0
  const isRightBoxBoundary = col === gridSize - 1 || (col + 1) % boxCols === 0

  // Determine background color
  const getBackgroundColor = () => {
    if (isHint) return '#fbbf24' // Bright yellow/gold for hints
    if (isSelected) return '#93c5fd' // Blue for selected
    if (isHighlighted) return '#dbeafe' // Light blue for highlighted
    return '#ffffff' // White for normal
  }

  return (
    <motion.button
      style={{
        borderTop: isTopBoxBoundary ? '3px solid #000' : '1px solid #999',
        borderLeft: isLeftBoxBoundary ? '3px solid #000' : '1px solid #999',
        borderBottom: isBottomBoxBoundary ? '3px solid #000' : '1px solid #999',
        borderRight: isRightBoxBoundary ? '3px solid #000' : '1px solid #999',
        backgroundColor: getBackgroundColor(),
      }}
      className={`
        aspect-square flex items-center justify-center
        transition-colors duration-150
        ${!isInitial ? 'hover:bg-blue-100 cursor-pointer' : 'cursor-default'}
        relative
      `}
      onClick={handleClick}
      animate={
        isError
          ? { x: [-4, 4, -4, 4, 0] }
          : isHint
            ? { scale: [1, 1.05, 1], backgroundColor: ['#fbbf24', '#fcd34d', '#fbbf24'] }
            : {}
      }
      transition={
        isHint
          ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.3 }
      }
      whileTap={!isInitial ? { scale: 0.92 } : {}}
    >
      {value ? (
        <motion.span
          style={{
            fontSize: gridSize === 4 ? '48px' : gridSize === 6 ? '36px' : '30px',
            fontWeight: isInitial ? 900 : 400,
            color: isInitial ? '#111827' : '#9333ea',
          }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {value}
        </motion.span>
      ) : pencilMarks && pencilMarks.size > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: gridSize === 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: '2px',
            fontSize: '10px',
            color: '#6b7280',
            position: 'absolute',
            inset: 0,
            padding: '4px',
          }}
        >
          {Array.from({ length: gridSize }, (_, i) => i + 1).map((num) => (
            <div key={num} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {pencilMarks.has(num) ? num : ''}
            </div>
          ))}
        </div>
      ) : null}

      {isError && (
        <motion.div
          className="absolute inset-0 bg-red-400 dark:bg-red-700 rounded"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        />
      )}
    </motion.button>
  )
}
