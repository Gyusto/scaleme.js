/** Public + internal types shared across the library. */

import type { Renderer } from "./renderer.js";
import type { Scale } from "./scale.js";

export interface DataPoint {
  x: number;
  y: number;
}

export type ChartType = "line" | "bar";

export interface ChartOptions {
  /** Series color. Defaults per chart type. */
  color?: string;
  /** Inner padding (px) reserved for axis labels. */
  padding?: Partial<Padding>;
  /** Draw X/Y axis lines + tick labels. Default true. */
  axes?: boolean;
  /** Draw horizontal grid lines. Default true. */
  grid?: boolean;
  /** Draw a dot at each data point (line charts). Default true. */
  points?: boolean;
  /** Background fill for the plot. Default transparent. */
  background?: string;

  // --- Style options ---
  /** Stroke width for line charts (px). Default 2. */
  lineWidth?: number;
  /** Radius of data-point dots (px). Default 3. Set 0 to hide, or use `points: false`. */
  pointRadius?: number;
  /** Draw a smooth curve instead of straight segments (line charts). Default false. */
  smooth?: boolean;
  /** Fill the area under a line. Default false. */
  area?: boolean;
  /** Explicit area fill color. Defaults to the series color at low opacity. */
  areaColor?: string;
  /** Corner radius for bars (px). Default 2. */
  barRadius?: number;
  /** Bar fill as a fraction of the slot width (0–1). Default 0.6. */
  barPadding?: number;
}

/** Fully-resolved style, computed once by the orchestrator. */
export interface ResolvedStyle {
  lineWidth: number;
  pointRadius: number;
  showPoints: boolean;
  smooth: boolean;
  area: boolean;
  areaColor: string;
  barRadius: number;
  barPadding: number;
}

export interface ChartConfig extends ChartOptions {
  type: ChartType;
  element: string | HTMLElement | HTMLCanvasElement;
  data: DataPoint[];
}

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** The rectangular drawing area inside the padding. */
export interface PlotArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Everything a chart-type drawer needs to render one series. */
export interface DrawContext {
  renderer: Renderer;
  data: DataPoint[];
  xScale: Scale;
  yScale: Scale;
  plot: PlotArea;
  color: string;
  style: ResolvedStyle;
}
