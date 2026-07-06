/** Line chart drawer. Projects each point through the scales, then strokes. */

import type { DrawContext } from "../core/types.js";

export function drawLine(context: DrawContext): void {
  const { renderer, data, xScale, yScale, plot, color, style } = context;
  if (data.length === 0) return;

  const points = data.map((d) => ({
    x: xScale.map(d.x),
    y: yScale.map(d.y),
  }));

  if (style.area) {
    const baseline = plot.y + plot.height;
    renderer.area(points, baseline, style.areaColor, style.smooth);
  }

  renderer.polyline(points, {
    stroke: color,
    width: style.lineWidth,
    smooth: style.smooth,
  });

  if (style.showPoints && style.pointRadius > 0) {
    for (const p of points) {
      renderer.circle(p.x, p.y, style.pointRadius, color);
    }
  }
}
