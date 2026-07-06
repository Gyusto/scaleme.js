/**
 * scaleme.js — a tiny, dependency-free charting library.
 *
 *   import { createChart } from "scaleme.js";
 *
 *   createChart({
 *     type: "line",
 *     element: "#app",
 *     data: [ { x: 1, y: 10 }, { x: 2, y: 20 }, { x: 3, y: 15 } ],
 *   });
 */

export { createChart } from "./core/chart.js";
export type { ChartHandle } from "./core/chart.js";

export { linearScale } from "./core/scale.js";
export type { Scale } from "./core/scale.js";

export { canvasRenderer } from "./core/renderer.js";
export type { Renderer, Point, LineStyle, TextStyle } from "./core/renderer.js";

export type {
  ChartConfig,
  ChartOptions,
  ChartType,
  DataPoint,
  Padding,
  PlotArea,
  DrawContext,
  ResolvedStyle,
} from "./core/types.js";

export { extent, niceTicks, formatTick, clamp, lerp } from "./utils/math.js";
export { withAlpha } from "./utils/color.js";

// Partograph — the WHO labour chart this library was first written for.
export { createPartograph } from "./partograph/partograph.js";
export type { PartographHandle } from "./partograph/partograph.js";
export type {
  PartographConfig,
  PartographData,
  PartographPatient,
  TimedValue,
  Contraction,
  BloodPressure,
  AmnioticFluid,
  Moulding,
} from "./partograph/types.js";
