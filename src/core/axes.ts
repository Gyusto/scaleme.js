/** Axis + grid rendering, shared by every chart type. */

import type { Renderer } from "./renderer.js";
import type { Scale } from "./scale.js";
import type { PlotArea } from "./types.js";
import { formatTick } from "../utils/math.js";

const AXIS_COLOR = "#c9ccd1";
const GRID_COLOR = "#eceef1";
const LABEL_COLOR = "#6b7280";
const LABEL_FONT = "11px system-ui, sans-serif";

export interface AxesConfig {
  grid: boolean;
  xTickCount?: number;
  yTickCount?: number;
}

export function drawAxes(
  renderer: Renderer,
  xScale: Scale,
  yScale: Scale,
  plot: PlotArea,
  config: AxesConfig
): void {
  const bottom = plot.y + plot.height;
  const right = plot.x + plot.width;

  // Y axis: grid lines + labels
  for (const tick of yScale.ticks(config.yTickCount ?? 5)) {
    const y = yScale.map(tick);
    if (y < plot.y - 0.5 || y > bottom + 0.5) continue;

    if (config.grid) {
      renderer.line(
        { x: plot.x, y },
        { x: right, y },
        { stroke: GRID_COLOR, width: 1 }
      );
    }
    renderer.text(formatTick(tick), plot.x - 8, y, {
      fill: LABEL_COLOR,
      font: LABEL_FONT,
      align: "right",
      baseline: "middle",
    });
  }

  // X axis: labels along the bottom
  for (const tick of xScale.ticks(config.xTickCount ?? 6)) {
    const x = xScale.map(tick);
    if (x < plot.x - 0.5 || x > right + 0.5) continue;

    renderer.text(formatTick(tick), x, bottom + 8, {
      fill: LABEL_COLOR,
      font: LABEL_FONT,
      align: "center",
      baseline: "top",
    });
  }

  // Axis lines (drawn last so they sit above the grid)
  renderer.line(
    { x: plot.x, y: plot.y },
    { x: plot.x, y: bottom },
    { stroke: AXIS_COLOR, width: 1 }
  );
  renderer.line(
    { x: plot.x, y: bottom },
    { x: right, y: bottom },
    { stroke: AXIS_COLOR, width: 1 }
  );
}
