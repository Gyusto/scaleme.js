/**
 * Bar chart drawer. Bars are centered on each x position and grow up from
 * the y-zero baseline (or the bottom of the plot if 0 is out of domain).
 */

import type { DrawContext } from "../core/types.js";

export function drawBar(context: DrawContext): void {
  const { renderer, data, xScale, yScale, plot, color, style } = context;
  if (data.length === 0) return;

  // Bar slot width from the spacing between adjacent x positions.
  const slot =
    data.length > 1
      ? Math.abs(xScale.map(data[1]!.x) - xScale.map(data[0]!.x))
      : plot.width;
  const barWidth = Math.max(1, slot * style.barPadding);

  // Baseline: pixel row for value 0, clamped into the plot area.
  const baseline = Math.min(
    plot.y + plot.height,
    Math.max(plot.y, yScale.map(0))
  );

  for (const d of data) {
    const cx = xScale.map(d.x);
    const y = yScale.map(d.y);
    const top = Math.min(y, baseline);
    const height = Math.abs(baseline - y);
    // Don't round more than the bar is tall, or short bars look like pills.
    const radius = Math.min(style.barRadius, height / 2);
    if (radius > 0) {
      renderer.roundRect(cx - barWidth / 2, top, barWidth, height, radius, color);
    } else {
      renderer.rect(cx - barWidth / 2, top, barWidth, height, color);
    }
  }
}
