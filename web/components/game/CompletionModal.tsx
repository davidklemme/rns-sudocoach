'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

interface CompletionModalProps {
  elapsedTime: string;
}

interface ConfettiParticleProps {
  delay: number;
  color: string;
  x: number;
  rotation: number;
}

function ConfettiParticle({ delay, color, x, rotation }: ConfettiParticleProps) {
  return (
    <motion.div
      className={`absolute w-3 h-3 ${color} rounded-sm`}
      style={{ left: `${x}%`, top: '-20px' }}
      initial={{ y: 0, rotate: 0, opacity: 1 }}
      animate={{ y: '100vh', rotate: rotation, opacity: [1, 1, 0] }}
      transition={{ duration: 3, delay, ease: 'easeOut' }}
    />
  );
}

const CONFETTI_COLORS = [
  'bg-red-500',
  'bg-yellow-500',
  'bg-green-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-orange-500',
];

export default function CompletionModal({ elapsedTime }: CompletionModalProps) {
  const { isComplete, gridSize, difficulty, startNewGame } = useGameStore();
  const [showConfetti, setShowConfetti] = useState(false);
  const playerName =
    typeof window !== 'undefined' ? localStorage.getItem('rns-player-name') : null;

  // Generate random values once on mount (client-side only) to avoid SSR mismatch
  const [confettiData] = useState(() =>
    Array.from({ length: 50 }).map((_, i) => ({
      x: Math.random() * 100,
      rotation: Math.random() * 720 - 360,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: i * 0.05,
    }))
  );

  useEffect(() => {
    if (isComplete) {
      setShowConfetti(true);
      // Stop confetti after animation
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  const handlePlayAgain = () => {
    startNewGame(gridSize, difficulty, Date.now());
  };

  if (!isComplete) {
    return null;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4">
        {/* Confetti */}
        {showConfetti && (
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            {confettiData.map(({ x, rotation, color, delay }, i) => (
              <ConfettiParticle
                key={i}
                x={x}
                rotation={rotation}
                color={color}
                delay={delay}
              />
            ))}
          </div>
        )}

        {/* Modal */}
        <motion.div
          className="bg-white rounded-3xl p-8 max-w-md shadow-2xl text-center relative z-10"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <motion.div
            className="text-7xl mb-4"
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            🎉
          </motion.div>

          <h2 className="text-3xl font-bold mb-2 text-gray-800">
            {playerName ? `Amazing, ${playerName}!` : 'Amazing Job!'}
          </h2>

          <p className="text-gray-600 mb-2">You solved it!</p>

          <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-4 mb-6">
            <p className="text-2xl font-bold text-purple-700">{elapsedTime}</p>
            <p className="text-sm text-purple-600">
              {gridSize}×{gridSize} • {difficulty}
            </p>
          </div>

          <motion.button
            onClick={handlePlayAgain}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold text-lg transition-all shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Play Again! 🚀
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
