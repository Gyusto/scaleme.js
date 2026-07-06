/**
 * createChart: the public entry point and orchestrator.
 *
 * Pipeline:  data → domains → scales → renderer (axes + series).
 * Returns a small handle so callers can re-render, update data, or destroy.
 */

import { resolveCanvas, prepareSurface } from "../utils/dom.js";
import { canvasRenderer } from "./renderer.js";
import { linearScale } from "./scale.js";
import { extent } from "../utils/math.js";
import { drawAxes } from "./axes.js";
import { drawLine } from "../charts/line.js";
import { drawBar } from "../charts/bar.js";
import { withAlpha } from "../utils/color.js";
import type {
  ChartConfig,
  DataPoint,
  Padding,
  PlotArea,
  ResolvedStyle,
} from "./types.js";

const DEFAULT_PADDING: Padding = { top: 16, right: 20, bottom: 28, left: 44 };
const DEFAULT_COLORS: Record<ChartConfig["type"], string> = {
  line: "#2563eb",
  bar: "#16a34a",
};

export interface ChartHandle {
  /** Replace the series data and repaint. */
  update(data: DataPoint[]): void;
  /** Repaint (e.g. after the canvas has been resized). */
  render(): void;
  /** Remove listeners; leaves the canvas in place. */
  destroy(): void;
}

export function createChart(config: ChartConfig): ChartHandle {
  const canvas = resolveCanvas(config.element);

  const padding: Padding = { ...DEFAULT_PADDING, ...config.padding };
  const color = config.color ?? DEFAULT_COLORS[config.type];
  const showAxes = config.axes ?? true;
  const showGrid = config.grid ?? true;

  const style: ResolvedStyle = {
    lineWidth: config.lineWidth ?? 2,
    pointRadius: config.pointRadius ?? 3,
    showPoints: config.points ?? true,
    smooth: config.smooth ?? false,
    area: config.area ?? false,
    areaColor: config.areaColor ?? withAlpha(color, 0.15),
    barRadius: config.barRadius ?? 2,
    barPadding: config.barPadding ?? 0.6,
  };

  let data = config.data;

  function render(): void {
    const { ctx, width, height } = prepareSurface(canvas);
    const renderer = canvasRenderer(ctx, width, height);
    renderer.clear();

    const plot: PlotArea = {
      x: padding.left,
      y: padding.top,
      width: Math.max(1, width - padding.left - padding.right),
      height: Math.max(1, height - padding.top - padding.bottom),
    };

    if (config.background) {
      renderer.rect(plot.x, plot.y, plot.width, plot.height, config.background);
    }

    // --- Domains ---
    const xs = data.map((d) => d.x);
    const ys = data.map((d) => d.y);
    const xExt = extent(xs);
    const yExt = extent(ys);

    // Bars are centered on their x, so pad the x domain by half a slot to
    // keep the first/last bar off the axis edges.
    let xDomain: [number, number] = [xExt.min, xExt.max];
    if (config.type === "bar" && data.length > 1) {
      const step = (xExt.max - xExt.min) / (data.length - 1);
      xDomain = [xExt.min - step / 2, xExt.max + step / 2];
    }

    // Charts read best anchored at zero unless the data goes negative.
    const yMin = Math.min(0, yExt.min);
    const yMax = Math.max(0, yExt.max);
    const yDomain: [number, number] = [yMin, yMax === yMin ? yMin + 1 : yMax];

    const xScale = linearScale(xDomain, [plot.x, plot.x + plot.width]);
    // Range is inverted (bottom → top) so larger values sit higher.
    const yScale = linearScale(yDomain, [plot.y + plot.height, plot.y]);

    if (showAxes) {
      drawAxes(renderer, xScale, yScale, plot, { grid: showGrid });
    }

    const drawContext = {
      renderer,
      data,
      xScale,
      yScale,
      plot,
      color,
      style,
    };

    if (config.type === "line") drawLine(drawContext);
    else if (config.type === "bar") drawBar(drawContext);
  }

  function update(next: DataPoint[]): void {
    data = next;
    render();
  }

  // Repaint on resize so the chart stays crisp and correctly laid out.
  const onResize = () => render();
  if (typeof window !== "undefined") {
    window.addEventListener("resize", onResize);
  }

  function destroy(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", onResize);
    }
  }

  render();
  return { update, render, destroy };
}
