'use client'

import { useGameStore } from '@/store/gameStore'
import Cell from './Cell'

export default function Board() {
  const {
    currentGrid,
    initialGrid,
    selectedCell,
    highlightedCells,
    errorCells,
    pencilMarks,
    gridSize,
    hintCell,
  } = useGameStore()

  if (!currentGrid || !initialGrid) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">No game loaded</p>
      </div>
    )
  }

  const cellKey = (row: number, col: number): string => `${row},${col}`

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div
        className={`
          grid gap-0
          w-full
          h-full
          max-w-[800px]
          max-h-[800px]
          aspect-square
        `}
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
        }}
      >
        {currentGrid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const key = cellKey(rowIndex, colIndex)
            const isInitial = initialGrid[rowIndex][colIndex] !== null
            const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex
            const isHighlighted = highlightedCells.has(key) && !isSelected
            const isError = errorCells.has(key)
            const marks = pencilMarks.get(key)
            const isHint = hintCell?.row === rowIndex && hintCell?.col === colIndex

            return (
              <Cell
                key={key}
                row={rowIndex}
                col={colIndex}
                value={cell}
                isInitial={isInitial}
                isSelected={isSelected}
                isHighlighted={isHighlighted}
                isError={isError}
                isHint={isHint}
                pencilMarks={marks}
                gridSize={gridSize}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
