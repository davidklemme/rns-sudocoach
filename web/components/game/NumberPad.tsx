'use client'

import { useGameStore } from '@/store/gameStore'

export default function NumberPad() {
  const { gridSize, makeMove, isPencilMode } = useGameStore()

  const handleNumberClick = (num: number) => {
    makeMove(num)
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div
        className={`
          grid gap-2
          ${gridSize === 4 ? 'grid-cols-4' : ''}
          ${gridSize === 6 ? 'grid-cols-3' : ''}
          ${gridSize === 9 ? 'grid-cols-3' : ''}
        `}
      >
        {Array.from({ length: gridSize }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num)}
            className={`
              w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16
              rounded-lg
              ${isPencilMode
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
              }
              font-bold text-lg
              transition-all duration-150
              active:scale-95
              shadow-md hover:shadow-lg
            `}
          >
            {num}
          </button>
        ))}
      </div>

      {isPencilMode && (
        <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
          ✏️ Pencil Mode Active
        </p>
      )}
    </div>
  )
}
