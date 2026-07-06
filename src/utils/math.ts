/**
 * Math helpers for the data + scale engines.
 * Kept pure and dependency-free so they're trivial to test.
 */

export interface Extent {
  min: number;
  max: number;
}

/** Min/max of a numeric list. Returns a 0..1 fallback for empty input. */
export function extent(values: number[]): Extent {
  if (values.length === 0) return { min: 0, max: 1 };

  let min = values[0]!;
  let max = values[0]!;
  for (let i = 1; i < values.length; i++) {
    const v = values[i]!;
    if (v < min) min = v;
    if (v > max) max = v;
  }

  // A flat series (min === max) would collapse the scale; pad it out.
  if (min === max) {
    if (min === 0) return { min: 0, max: 1 };
    const pad = Math.abs(min) * 0.1;
    return { min: min - pad, max: max + pad };
  }

  return { min, max };
}

export function clamp(value: number, lo: number, hi: number): number {
  return value < lo ? lo : value > hi ? hi : value;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * "Nice" round tick values spanning [min, max], à la D3's ticks().
 * Produces human-friendly step sizes (1, 2, 5 × 10ⁿ).
 */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) return [min];
  if (count <= 0) return [];

  const span = max - min;
  const rawStep = span / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;

  let step: number;
  if (normalized >= 5) step = 10 * magnitude;
  else if (normalized >= 2) step = 5 * magnitude;
  else if (normalized >= 1) step = 2 * magnitude;
  else step = magnitude;

  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  // Guard against float drift with a tiny epsilon on the upper bound.
  for (let v = start; v <= max + step * 1e-9; v += step) {
    // Round to kill accumulated floating-point noise (e.g. 0.30000000004).
    ticks.push(Number(v.toFixed(10)));
  }
  return ticks;
}

/** Compact number formatting for axis labels (1_500 → "1.5k"). */
export function formatTick(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return trimZeros(value / 1_000_000) + "M";
  if (abs >= 1_000) return trimZeros(value / 1_000) + "k";
  return trimZeros(value);
}

function trimZeros(n: number): string {
  return Number(n.toFixed(2)).toString();
}
