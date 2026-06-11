/**
 * Cell Highlight System for RnS SuDoCoach
 *
 * Manages which cells get which colors during gameplay and hints.
 */

import { HIGHLIGHT_STYLES, HighlightStyle } from './strategy-colors';
import { Position } from '@/lib/sudoku/types';

/**
 * Represents the highlight state of a single cell
 */
export interface CellHighlight {
  type: HighlightStyle;
  animate?: boolean;
  intensity?: 'subtle' | 'strong';
}

/**
 * Map of position keys to highlight states
 */
export type CellHighlights = Map<string, CellHighlight>;

/**
 * Create a position key for map lookups
 */
export function posKey(pos: Position): string {
  return `${pos.row}-${pos.col}`;
}

/**
 * Parse a position key back to Position
 */
export function parseKey(key: string): Position {
  const [row, col] = key.split('-').map(Number);
  return { row, col };
}

/**
 * Get the Tailwind classes for a cell based on its highlight state
 */
export function getHighlightClasses(
  highlight: CellHighlight | undefined,
  isSelected: boolean
): string {
  // Selected takes priority if no other highlight
  if (!highlight || highlight.type === 'none') {
    return isSelected ? HIGHLIGHT_STYLES.selected : '';
  }

  // Framer Motion in Cell handles the pulse animation via the `animate` prop.
  // Don't also apply the CSS class — they fight each other.
  return HIGHLIGHT_STYLES[highlight.type];
}

/**
 * Create an empty highlights map
 */
export function createEmptyHighlights(): CellHighlights {
  return new Map();
}

/**
 * Add a highlight to the map
 */
export function setHighlight(
  highlights: CellHighlights,
  pos: Position,
  highlight: CellHighlight
): CellHighlights {
  const newMap = new Map(highlights);
  newMap.set(posKey(pos), highlight);
  return newMap;
}

/**
 * Remove a highlight from the map
 */
export function removeHighlight(
  highlights: CellHighlights,
  pos: Position
): CellHighlights {
  const newMap = new Map(highlights);
  newMap.delete(posKey(pos));
  return newMap;
}

/**
 * Check if a position has a specific highlight type
 */
export function hasHighlight(
  highlights: CellHighlights,
  pos: Position,
  type: HighlightStyle
): boolean {
  const highlight = highlights.get(posKey(pos));
  return highlight?.type === type;
}

/**
 * Get all cells with a specific highlight type
 */
export function getCellsWithHighlight(
  highlights: CellHighlights,
  type: HighlightStyle
): Position[] {
  const cells: Position[] = [];
  highlights.forEach((highlight, key) => {
    if (highlight.type === type) {
      cells.push(parseKey(key));
    }
  });
  return cells;
}
