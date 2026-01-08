'use client'

import { useGameStore } from '@/store/gameStore'

export default function HintDisplay() {
  const { hintStrategy, hintCell, showHint, dismissHint, gridSize } = useGameStore()

  if (!showHint || !hintStrategy || !hintCell) {
    return null
  }

  // Kid-friendly strategy names, emojis, and teaching tips
  const strategyInfo: Record<string, { name: string; emoji: string; color: string; tip: string }> = {
    'single_candidate': {
      name: 'Only One Choice!',
      emoji: '🎯',
      color: 'bg-green-500',
      tip: 'Look at the highlighted cell. Check which numbers are already in its row, column, and box. Only ONE number is missing from all three!'
    },
    'hidden_single': {
      name: 'Secret Spot!',
      emoji: '🔍',
      color: 'bg-blue-500',
      tip: 'This cell is the ONLY place in its row, column, or box where a certain number can go. Look at what numbers are missing and where else they could fit!'
    },
    'elimination': {
      name: 'Process of Elimination!',
      emoji: '❌',
      color: 'bg-purple-500',
      tip: 'Cross out numbers that can\'t go here by checking the row, column, and box. What\'s left is your answer!'
    },
    'naked_pair': {
      name: 'Twin Numbers!',
      emoji: '👯',
      color: 'bg-pink-500',
      tip: 'Two cells in the same row/column/box can only have the same two numbers. This means those numbers can\'t go anywhere else in that group!'
    },
    'naked_triple': {
      name: 'Triple Match!',
      emoji: '🎪',
      color: 'bg-orange-500',
      tip: 'Three cells share only three possible numbers between them. Eliminate those numbers from other cells in the same group!'
    },
    'unknown': {
      name: 'Think Step by Step!',
      emoji: '🤔',
      color: 'bg-gray-500',
      tip: 'Start by listing all possible numbers for this cell. Then eliminate ones that appear in the same row, column, or box.'
    },
    'guessing': {
      name: 'Use Your Notes!',
      emoji: '✏️',
      color: 'bg-yellow-500',
      tip: 'Try using pencil marks (Notes mode) to write down all possible numbers. Then look for patterns!'
    },
  }

  const info = strategyInfo[hintStrategy.strategy] || {
    name: 'Strategy Hint!',
    emoji: '💡',
    color: 'bg-indigo-500',
    tip: 'Check the row, column, and box for this cell. What numbers are already used?'
  }

  // Convert technical explanation to kid-friendly language
  const makeKidFriendly = (text: string): string => {
    return text
      .replace(/row (\d+)/gi, (_, n) => `row ${parseInt(n) + 1}`)
      .replace(/column (\d+)/gi, (_, n) => `column ${parseInt(n) + 1}`)
      .replace(/cell \((\d+),\s*(\d+)\)/gi, (_, r, c) => `the highlighted cell`)
      .replace(/candidate/gi, 'possible number')
      .replace(/eliminate/gi, 'cross out')
      .replace(/constraint/gi, 'rule')
  }

  const kidFriendlyExplanation = makeKidFriendly(hintStrategy.explanation)

  // Calculate which numbers are already used (for teaching)
  const getUsedNumbers = (): { row: number[]; col: number[]; box: number[] } => {
    const { currentGrid } = useGameStore.getState()
    if (!currentGrid || !hintCell) return { row: [], col: [], box: [] }

    const { row, col } = hintCell
    const rowNums: number[] = []
    const colNums: number[] = []
    const boxNums: number[] = []

    // Get row numbers
    for (let c = 0; c < gridSize; c++) {
      if (currentGrid[row][c] !== null) rowNums.push(currentGrid[row][c]!)
    }

    // Get column numbers
    for (let r = 0; r < gridSize; r++) {
      if (currentGrid[r][col] !== null) colNums.push(currentGrid[r][col]!)
    }

    // Get box numbers
    const boxRows = gridSize === 4 ? 2 : gridSize === 6 ? 2 : 3
    const boxCols = gridSize === 6 ? 3 : boxRows
    const boxStartRow = Math.floor(row / boxRows) * boxRows
    const boxStartCol = Math.floor(col / boxCols) * boxCols

    for (let r = boxStartRow; r < boxStartRow + boxRows; r++) {
      for (let c = boxStartCol; c < boxStartCol + boxCols; c++) {
        if (currentGrid[r][c] !== null) boxNums.push(currentGrid[r][c]!)
      }
    }

    return {
      row: [...new Set(rowNums)].sort((a, b) => a - b),
      col: [...new Set(colNums)].sort((a, b) => a - b),
      box: [...new Set(boxNums)].sort((a, b) => a - b)
    }
  }

  const usedNums = getUsedNumbers()
  const allUsed = [...new Set([...usedNums.row, ...usedNums.col, ...usedNums.box])].sort((a, b) => a - b)
  const allNumbers = Array.from({ length: gridSize }, (_, i) => i + 1)
  const possibleNumbers = allNumbers.filter(n => !allUsed.includes(n))

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-lg w-full mx-4">
      <div className={`${info.color} rounded-2xl shadow-2xl p-5 text-white`}>
        <button
          onClick={dismissHint}
          className="absolute top-2 right-2 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          aria-label="Close hint"
        >
          ✕
        </button>

        <div className="flex items-start gap-4">
          <div className="text-4xl">{info.emoji}</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">{info.name}</h3>

            {/* Strategy Teaching Tip */}
            <div className="bg-white/20 rounded-lg p-3 mb-3">
              <p className="text-sm font-medium">{info.tip}</p>
            </div>

            {/* Visual Helper - Show what's already used */}
            <div className="bg-white/10 rounded-lg p-3 mb-3">
              <p className="text-xs font-semibold mb-2 opacity-90">Numbers already used:</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="opacity-70">Row:</span>{' '}
                  <span className="font-bold">{usedNums.row.join(', ') || 'none'}</span>
                </div>
                <div>
                  <span className="opacity-70">Col:</span>{' '}
                  <span className="font-bold">{usedNums.col.join(', ') || 'none'}</span>
                </div>
                <div>
                  <span className="opacity-70">Box:</span>{' '}
                  <span className="font-bold">{usedNums.box.join(', ') || 'none'}</span>
                </div>
              </div>
              {possibleNumbers.length > 0 && possibleNumbers.length <= 3 && (
                <p className="text-sm font-bold mt-2 text-yellow-200">
                  Possible: {possibleNumbers.join(', ')} - Can you figure out which one?
                </p>
              )}
            </div>

            {/* Encouragement */}
            <p className="text-xs opacity-80 text-center">
              You can do it! Use the Helper Lights to see the row, column, and box. 🌟
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
