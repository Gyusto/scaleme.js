/**
 * Scale engine: converts data-space values into pixel-space positions.
 *
 * A scale owns a `domain` (the data range, e.g. [0, 100]) and a `range`
 * (the pixel range, e.g. [40, 380]). `map()` projects a value across.
 */

import { niceTicks } from "../utils/math.js";

export interface Scale {
  /** Project a data value to a pixel coordinate. */
  map(value: number): number;
  /** Inverse: pixel coordinate back to a data value (for hit-testing). */
  invert(pixel: number): number;
  domain: readonly [number, number];
  range: readonly [number, number];
  /** Round tick values across the domain, for axis rendering. */
  ticks(count?: number): number[];
}

export function linearScale(
  domain: readonly [number, number],
  range: readonly [number, number]
): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const dSpan = d1 - d0 || 1; // avoid divide-by-zero on a degenerate domain

  return {
    domain,
    range,
    map(value: number): number {
      const t = (value - d0) / dSpan;
      return r0 + t * (r1 - r0);
    },
    invert(pixel: number): number {
      const t = (pixel - r0) / (r1 - r0 || 1);
      return d0 + t * dSpan;
    },
    ticks(count = 5): number[] {
      return niceTicks(d0, d1, count);
    },
  };
}
