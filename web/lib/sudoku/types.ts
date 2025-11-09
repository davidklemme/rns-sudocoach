/**
 * Core types for Sudoku game logic
 */

export type GridSize = 4 | 6 | 9

export type CellValue = number | null

export type SudokuGrid = CellValue[][]

export type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert'

export interface Puzzle {
  id: string
  grid: SudokuGrid
  solution: SudokuGrid
  difficulty: Difficulty
  gridSize: GridSize
  createdAt: Date
}

export interface Cell {
  row: number
  col: number
  value: CellValue
  isInitial: boolean
  candidates?: number[]
}

export interface Move {
  row: number
  col: number
  value: number
  timestamp: number
}

export interface Position {
  row: number
  col: number
}
