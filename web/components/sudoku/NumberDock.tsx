'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GridSize } from '@/lib/sudoku/types';
import { getNumberColor } from '@/lib/colors/strategy-colors';

interface NumberDockProps {
  gridSize: GridSize;
  onNumberClick: (num: number) => void;
  isPencilMode: boolean;
  completedNumbers?: Set<number>;
}

/**
 * NumberDock - Number input buttons
 *
 * Rainbow-colored buttons for entering numbers.
 * Large touch targets for little fingers!
 * Shows pencil mode state and dims completed numbers.
 */
export function NumberDock({
  gridSize,
  onNumberClick,
  isPencilMode,
  completedNumbers = new Set(),
}: NumberDockProps) {
  const numbers = Array.from({ length: gridSize }, (_, i) => i + 1);

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Pencil mode indicator — outside the grid so it doesn't consume a grid cell */}
      {isPencilMode && (
        <div className="text-center text-sm text-orange-600 font-medium">
          ✏️ Notes Mode
        </div>
      )}

      <div
        className={cn(
          'grid grid-flow-col grid-rows-2 md:grid-rows-1 gap-3 px-4 py-3 rounded-xl transition-all',
          isPencilMode && 'ring-2 ring-orange-400 bg-orange-50'
        )}
      >
      {/* Number buttons */}
      {numbers.map((num) => {
        const isCompleted = completedNumbers.has(num);
        const colorClass = getNumberColor(num);

        return (
          <motion.button
            key={num}
            className={cn(
              'w-11 h-11 md:w-14 md:h-14 rounded-lg',
              'text-xl md:text-2xl font-bold',
              'shadow-md transition-all',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
              colorClass,
              isCompleted && 'opacity-40 cursor-not-allowed'
            )}
            onClick={() => onNumberClick(num)}
            whileHover={{ scale: isCompleted ? 1 : 1.05 }}
            whileTap={{ scale: isCompleted ? 1 : 0.95 }}
            disabled={isCompleted}
            aria-label={`Enter number ${num}${isPencilMode ? ' as note' : ''}`}
          >
            {num}
          </motion.button>
        );
      })}
      </div>
    </div>
  );
}
