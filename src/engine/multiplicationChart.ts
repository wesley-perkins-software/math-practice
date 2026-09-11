export const CHART_MIN = 1;
export const CHART_MAX = 12;

export interface ChartCell {
  row: number;
  col: number;
}

export type ChartArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

export function getProduct(row: number, col: number): number {
  return row * col;
}

const clamp = (n: number) => Math.min(CHART_MAX, Math.max(CHART_MIN, n));

/** Moves one step per arrow key, clamped at the 1–12 grid edges (no wraparound). */
export function moveSelection(current: ChartCell, key: ChartArrowKey): ChartCell {
  switch (key) {
    case 'ArrowUp':
      return { row: clamp(current.row - 1), col: current.col };
    case 'ArrowDown':
      return { row: clamp(current.row + 1), col: current.col };
    case 'ArrowLeft':
      return { row: current.row, col: clamp(current.col - 1) };
    case 'ArrowRight':
      return { row: current.row, col: clamp(current.col + 1) };
  }
}
