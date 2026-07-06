/**
 * createPartograph — a WHO labour-monitoring chart, composed from scaleme.js's
 * core engines (linear scales + the canvas renderer). This is the chart the
 * whole library was originally written to draw.
 *
 * Panels are stacked top-to-bottom and share one time (hours) x-axis:
 *   Fetal heart rate · Amniotic fluid / moulding · Cervicograph (dilatation +
 *   descent, with Alert & Action lines) · Contractions · Oxytocin / Drugs ·
 *   Pulse & BP · Temperature · Urine.
 */

import { resolveCanvas, prepareSurface } from "../utils/dom.js";
import { canvasRenderer } from "../core/renderer.js";
import { linearScale } from "../core/scale.js";
import type { Renderer } from "../core/renderer.js";
import type { PartographConfig } from "./types.js";

// --- Palette (clinical, pink grid) ---------------------------------------
const C = {
  gridMinor: "#f2d3d7",
  gridMajor: "#d99aa2",
  border: "#b0555f",
  ink: "#2b2b2b",
  label: "#6b4a4e",
  fhr: "#1d4ed8",
  normalBand: "#cbd5e1",
  cervix: "#1e3a8a",
  descent: "#0f766e",
  alert: "#d97706",
  action: "#dc2626",
  pulse: "#7c3aed",
  bp: "#0369a1",
  fill: "#111827",
};

const GUTTER_LEFT = 104;
const PAD_RIGHT = 16;
const PAD_TOP = 44;
const FONT = "11px system-ui, sans-serif";
const FONT_SMALL = "10px system-ui, sans-serif";
const FONT_LABEL = "600 11px system-ui, sans-serif";

interface Band {
  top: number;
  height: number;
  bottom: number;
}

export interface PartographHandle {
  render(): void;
  destroy(): void;
}

export function createPartograph(config: PartographConfig): PartographHandle {
  const canvas = resolveCanvas(config.element);
  const hours = config.hours ?? 12;
  const t0 = config.alertLineStartHour ?? 0;

  // Fixed vertical layout — a partograph is intrinsically tall.
  const heights = {
    fhr: 150,
    amniotic: 20,
    moulding: 20,
    cervix: 200,
    axis: 34,
    contractions: 74,
    oxytocin: 22,
    drugs: 22,
    pulseBp: 130,
    temp: 24,
    urine: 54,
  };
  const totalHeight =
    PAD_TOP +
    Object.values(heights).reduce((a, b) => a + b, 0) +
    16;

  function render(): void {
    canvas.style.height = `${totalHeight}px`;
    const { ctx, width } = prepareSurface(canvas);
    const r = canvasRenderer(ctx, width, totalHeight);
    r.clear();
    r.rect(0, 0, width, totalHeight, "#ffffff");

    const plotLeft = GUTTER_LEFT;
    const plotRight = width - PAD_RIGHT;
    const plotWidth = Math.max(1, plotRight - plotLeft);
    const x = linearScale([0, hours], [plotLeft, plotRight]);

    drawHeader(r, plotLeft, plotWidth, config);

    // Walk a y-cursor down the stack, handing each panel its band.
    let y = PAD_TOP;
    const band = (h: number): Band => {
      const b = { top: y, height: h, bottom: y + h };
      y += h;
      return b;
    };

    drawFetalHeartRate(r, x, band(heights.fhr), hours, plotLeft, config);
    drawLetterRow(
      r,
      x,
      band(heights.amniotic),
      hours,
      plotLeft,
      "Liquor",
      config.amnioticFluid
    );
    drawLetterRow(
      r,
      x,
      band(heights.moulding),
      hours,
      plotLeft,
      "Moulding",
      config.moulding
    );
    drawCervicograph(r, x, band(heights.cervix), hours, plotLeft, t0, config);
    drawTimeAxis(r, x, band(heights.axis), hours, plotLeft, config);
    drawContractions(r, x, band(heights.contractions), hours, plotLeft, config);
    drawGridPanel(r, x, band(heights.oxytocin), hours, plotLeft, "Oxytocin U/L");
    drawGridPanel(r, x, band(heights.drugs), hours, plotLeft, "Drugs / IV fluids");
    drawPulseBp(r, x, band(heights.pulseBp), hours, plotLeft, config);
    drawTemperature(r, x, band(heights.temp), hours, plotLeft, config);
    drawUrine(r, x, band(heights.urine), hours, plotLeft, config);
  }

  const onResize = () => render();
  if (typeof window !== "undefined") window.addEventListener("resize", onResize);
  function destroy(): void {
    if (typeof window !== "undefined")
      window.removeEventListener("resize", onResize);
  }

  render();
  return { render, destroy };
}

// -------------------------------------------------------------------------
// Shared helpers
// -------------------------------------------------------------------------

/** Vertical hour-column lines + outer border for a panel band. */
function columnGrid(
  r: Renderer,
  x: ReturnType<typeof linearScale>,
  band: Band,
  hours: number,
  left: number,
  right: number
): void {
  for (let h = 0; h <= hours; h++) {
    const px = x.map(h);
    r.line(
      { x: px, y: band.top },
      { x: px, y: band.bottom },
      { stroke: h % 1 === 0 ? C.gridMinor : C.gridMinor, width: 1 }
    );
  }
  // Border
  r.line({ x: left, y: band.top }, { x: right, y: band.top }, { stroke: C.border, width: 1 });
  r.line({ x: left, y: band.bottom }, { x: right, y: band.bottom }, { stroke: C.border, width: 1 });
  r.line({ x: left, y: band.top }, { x: left, y: band.bottom }, { stroke: C.border, width: 1 });
  r.line({ x: right, y: band.top }, { x: right, y: band.bottom }, { stroke: C.border, width: 1 });
}

function rowLabel(r: Renderer, text: string, band: Band, sub?: string): void {
  const cy = (band.top + band.bottom) / 2;
  r.text(text, GUTTER_LEFT - 10, sub ? cy - 6 : cy, {
    fill: C.label,
    font: FONT_LABEL,
    align: "right",
    baseline: "middle",
  });
  if (sub) {
    r.text(sub, GUTTER_LEFT - 10, cy + 8, {
      fill: C.label,
      font: FONT_SMALL,
      align: "right",
      baseline: "middle",
    });
  }
}

function colWidth(
  x: ReturnType<typeof linearScale>,
  hours: number,
  left: number
): number {
  return (x.map(hours) - left) / hours;
}

// -------------------------------------------------------------------------
// Panels
// -------------------------------------------------------------------------

function drawHeader(
  r: Renderer,
  left: number,
  width: number,
  cfg: PartographConfig
): void {
  const p = cfg.patient ?? {};
  r.text("PARTOGRAPH", left, 14, {
    fill: C.border,
    font: "700 15px system-ui, sans-serif",
    baseline: "middle",
  });
  const fields = [
    `Name: ${p.name ?? "—"}`,
    `Gravida: ${p.gravida ?? "—"}`,
    `Para: ${p.para ?? "—"}`,
    `Hosp. No: ${p.hospitalNo ?? "—"}`,
  ];
  r.text(fields.join("    "), left + 120, 14, {
    fill: C.label,
    font: FONT,
    baseline: "middle",
  });
  const line2 = [
    `Admitted: ${p.admittedAt ?? "—"}`,
    `Ruptured membranes: ${p.rupturedMembranes ?? "—"}`,
  ];
  r.text(line2.join("    "), left, 30, {
    fill: C.label,
    font: FONT_SMALL,
    baseline: "middle",
  });
}

function drawFetalHeartRate(
  r: Renderer,
  x: ReturnType<typeof linearScale>,
  band: Band,
  hours: number,
  left: number,
  cfg: PartographConfig
): void {
  const right = x.map(hours);
  const y = linearScale([80, 200], [band.bottom, band.top]);

  // Horizontal grid every 10; labels + major line every 20.
  for (let v = 80; v <= 200; v += 10) {
    const py = y.map(v);
    const major = v % 20 === 0;
    r.line({ x: left, y: py }, { x: right, y: py }, {
      stroke: major ? C.gridMajor : C.gridMinor,
      width: 1,
    });
    if (major)
      r.text(String(v), left - 6, py, {
        fill: C.label,
        font: FONT_SMALL,
        align: "right",
        baseline: "middle",
      });
  }
  // Normal-range band (110–160 bpm).
  for (const v of [110, 160]) {
    r.line({ x: left, y: y.map(v) }, { x: right, y: y.map(v) }, {
      stroke: C.normalBand,
      width: 1,
      dash: [3, 3],
    });
  }
  columnGrid(r, x, band, hours, left, right);
  rowLabel(r, "Fetal heart", band, "rate");

  const pts = cfg.fetalHeartRate.map((d) => ({ x: x.map(d.hour), y: y.map(d.value) }));
  r.polyline(pts, { stroke: C.fhr, width: 1.5 });
  for (const p of pts) r.circle(p.x, p.y, 2.5, C.fhr);
}

function drawLetterRow(
  r: Renderer,
  x: ReturnType<typeof linearScale>,
  band: Band,
  hours: number,
  left: number,
  label: string,
  values: { hour: number; value: string }[]
): void {
  const right = x.map(hours);
  columnGrid(r, x, band, hours, left, right);
  rowLabel(r, label, band);
  const cy = (band.top + band.bottom) / 2;
  const cw = colWidth(x, hours, left);
  for (const d of values) {
    r.text(d.value, x.map(d.hour) + cw / 2, cy, {
      fill: C.ink,
      font: FONT,
      align: "center",
      baseline: "middle",
    });
  }
}

function drawCervicograph(
  r: Renderer,
  x: ReturnType<typeof linearScale>,
  band: Band,
  hours: number,
  left: number,
  t0: number,
  cfg: PartographConfig
): void {
  const right = x.map(hours);
  const y = linearScale([0, 10], [band.bottom, band.top]); // cervix cm
  const yDesc = linearScale([0, 5], [band.bottom, band.top]); // descent 0–5

  for (let v = 0; v <= 10; v++) {
    const py = y.map(v);
    r.line({ x: left, y: py }, { x: right, y: py }, {
      stroke: v % 5 === 0 ? C.gridMajor : C.gridMinor,
      width: 1,
    });
    r.text(String(v), left - 6, py, {
      fill: C.cervix,
      font: FONT_SMALL,
      align: "right",
      baseline: "middle",
    });
  }
  // Descent scale (0–5) on the right edge.
  for (let v = 0; v <= 5; v++) {
    r.text(String(v), right + 6, yDesc.map(v), {
      fill: C.descent,
      font: FONT_SMALL,
      align: "left",
      baseline: "middle",
    });
  }
  columnGrid(r, x, band, hours, left, right);
  rowLabel(r, "Cervix (cm)", band, "✕  |  Descent ◯");

  // Alert line: 4 cm at t0 → 10 cm at t0+6 (1 cm/hr).
  const alertEnd = Math.min(hours, t0 + 6);
  r.line(
    { x: x.map(t0), y: y.map(4) },
    { x: x.map(alertEnd), y: y.map(4 + (alertEnd - t0)) },
    { stroke: C.alert, width: 1.5 }
  );
  labelOnLine(r, x, y, t0 + 2.2, 4 + 2.2, "Alert", C.alert);

  // Action line: parallel, 4 hours to the right.
  const actStart = t0 + 4;
  const actEnd = Math.min(hours, actStart + 6);
  if (actStart < hours) {
    r.line(
      { x: x.map(actStart), y: y.map(4) },
      { x: x.map(actEnd), y: y.map(4 + (actEnd - actStart)) },
      { stroke: C.action, width: 1.5, dash: [5, 4] }
    );
    labelOnLine(r, x, y, actStart + 2.2, 4 + 2.2, "Action", C.action);
  }

  // Cervix plotted with ✕, connected.
  const cvx = cfg.cervix.map((d) => ({ px: x.map(d.hour), py: y.map(d.value) }));
  r.polyline(cvx.map((p) => ({ x: p.px, y: p.py })), { stroke: C.cervix, width: 1.5 });
  for (const p of cvx) drawX(r, p.px, p.py, 4, C.cervix);

  // Descent plotted with ◯, connected (dashed).
  const dsc = cfg.descent.map((d) => ({ px: x.map(d.hour), py: yDesc.map(d.value) }));
  r.polyline(dsc.map((p) => ({ x: p.px, y: p.py })), {
    stroke: C.descent,
    width: 1.25,
    dash: [4, 3],
  });
  for (const p of dsc) {
    r.circle(p.px, p.py, 4, "#ffffff");
    r.circle(p.px, p.py, 4, C.descent);
    r.circle(p.px, p.py, 2.4, "#ffffff");
  }
}

function drawTimeAxis(
  r: Renderer,
  x: ReturnType<typeof linearScale>,
  band: Band,
  hours: number,
  left: number,
  _cfg: PartographConfig
): void {
  const right = x.map(hours);
  columnGrid(r, x, band, hours, left, right);
  rowLabel(r, "Hours", band, "Time");
  const cw = colWidth(x, hours, left);
  for (let h = 0; h < hours; h++) {
    r.text(String(h + 1), x.map(h) + cw / 2, band.top + 12, {
      fill: C.ink,
      font: FONT,
      align: "center",
      baseline: "middle",
    });
  }
}

function drawContractions(
  r: Renderer,
  x: ReturnType<typeof linearScale>,
  band: Band,
  hours: number,
  left: number,
  cfg: PartographConfig
): void {
  const right = x.map(hours);
  const rows = 5;
  const rowH = band.height / rows;
  for (let i = 1; i <= rows; i++) {
    const py = band.bottom - i * rowH;
    r.line({ x: left, y: py }, { x: right, y: py }, { stroke: C.gridMinor, width: 1 });
  }
  columnGrid(r, x, band, hours, left, right);
  rowLabel(r, "Contractions", band, "per 10 min");
  r.text("5", left - 6, band.top + rowH / 2, {
    fill: C.label, font: FONT_SMALL, align: "right", baseline: "middle",
  });

  const cw = colWidth(x, hours, left);
  for (const c of cfg.contractions) {
    const cellX = x.map(Math.floor(c.hour));
    const n = Math.max(0, Math.min(rows, c.count));
    for (let i = 0; i < n; i++) {
      const cellY = band.bottom - (i + 1) * rowH;
      drawContractionCell(r, cellX + 1, cellY + 1, cw - 2, rowH - 2, c.intensity);
    }
  }
}

function drawContractionCell(
  r: Renderer,
  x: number,
  y: number,
  w: number,
  h: number,
  intensity: "mild" | "moderate" | "strong"
): void {
  if (intensity === "strong") {
    r.rect(x, y, w, h, C.fill); // solid
  } else if (intensity === "moderate") {
    r.rect(x, y, w, h, "#eef0f2");
    hatchRect(r, x, y, w, h, 4, "#4b5563"); // diagonal hatch, clipped to cell
  } else {
    r.rect(x, y, w, h, "#d1d5db"); // light fill for mild
  }
}

/** 45° diagonal hatch fill, with every line clipped to the rect. */
function hatchRect(
  r: Renderer,
  x: number,
  y: number,
  w: number,
  h: number,
  gap: number,
  color: string
): void {
  // Anti-diagonal lines x' + y' = k, clipped to [x,x+w] × [y,y+h].
  for (let k = x + y + gap; k < x + w + y + h; k += gap) {
    const x1 = Math.max(x, k - (y + h));
    const x2 = Math.min(x + w, k - y);
    if (x1 > x2) continue;
    r.line({ x: x1, y: k - x1 }, { x: x2, y: k - x2 }, { stroke: color, width: 1 });
  }
}

function drawGridPanel(
  r: Renderer,
  x: ReturnType<typeof linearScale>,
  band: Band,
  hours: number,
  left: number,
  label: string
): void {
  const right = x.map(hours);
  columnGrid(r, x, band, hours, left, right);
  rowLabel(r, label, band);
}

function drawPulseBp(
  r: Renderer,
  x: ReturnType<typeof linearScale>,
  band: Band,
  hours: number,
  left: number,
  cfg: PartographConfig
): void {
  const right = x.map(hours);
  const y = linearScale([60, 180], [band.bottom, band.top]);
  for (let v = 60; v <= 180; v += 20) {
    const py = y.map(v);
    r.line({ x: left, y: py }, { x: right, y: py }, { stroke: C.gridMinor, width: 1 });
    r.text(String(v), left - 6, py, {
      fill: C.label, font: FONT_SMALL, align: "right", baseline: "middle",
    });
  }
  columnGrid(r, x, band, hours, left, right);
  rowLabel(r, "Pulse ●", band, "& BP ↕");

  // BP as vertical arrows (systolic top, diastolic bottom).
  for (const b of cfg.bloodPressure ?? []) {
    const px = x.map(b.hour);
    const ys = y.map(b.systolic);
    const yd = y.map(b.diastolic);
    r.line({ x: px, y: ys }, { x: px, y: yd }, { stroke: C.bp, width: 1.5 });
    drawArrowHead(r, px, ys, -1, C.bp);
    drawArrowHead(r, px, yd, 1, C.bp);
  }

  const pts = cfg.pulse.map((d) => ({ x: x.map(d.hour), y: y.map(d.value) }));
  r.polyline(pts, { stroke: C.pulse, width: 1.5 });
  for (const p of pts) r.circle(p.x, p.y, 2.5, C.pulse);
}

function drawTemperature(
  r: Renderer,
  x: ReturnType<typeof linearScale>,
  band: Band,
  hours: number,
  left: number,
  cfg: PartographConfig
): void {
  const right = x.map(hours);
  columnGrid(r, x, band, hours, left, right);
  rowLabel(r, "Temp °C", band);
  const cw = colWidth(x, hours, left);
  const cy = (band.top + band.bottom) / 2;
  for (const t of cfg.temperature ?? []) {
    r.text(t.value.toFixed(1), x.map(Math.floor(t.hour)) + cw / 2, cy, {
      fill: C.ink, font: FONT_SMALL, align: "center", baseline: "middle",
    });
  }
}

function drawUrine(
  r: Renderer,
  x: ReturnType<typeof linearScale>,
  band: Band,
  hours: number,
  left: number,
  _cfg: PartographConfig
): void {
  const right = x.map(hours);
  const rows = ["Protein", "Acetone", "Volume"];
  const rowH = band.height / rows.length;
  for (let i = 1; i < rows.length; i++) {
    const py = band.top + i * rowH;
    r.line({ x: left, y: py }, { x: right, y: py }, { stroke: C.gridMinor, width: 1 });
  }
  columnGrid(r, x, band, hours, left, right);
  rows.forEach((name, i) => {
    r.text(`Urine · ${name}`, left - 6, band.top + (i + 0.5) * rowH, {
      fill: C.label, font: FONT_SMALL, align: "right", baseline: "middle",
    });
  });
}

// -------------------------------------------------------------------------
// Mark helpers
// -------------------------------------------------------------------------

function drawX(r: Renderer, cx: number, cy: number, s: number, color: string): void {
  r.line({ x: cx - s, y: cy - s }, { x: cx + s, y: cy + s }, { stroke: color, width: 2 });
  r.line({ x: cx - s, y: cy + s }, { x: cx + s, y: cy - s }, { stroke: color, width: 2 });
}

function drawArrowHead(
  r: Renderer,
  x: number,
  y: number,
  dir: 1 | -1,
  color: string
): void {
  const s = 3.5;
  r.polyline(
    [
      { x: x - s, y: y + dir * s },
      { x, y },
      { x: x + s, y: y + dir * s },
    ],
    { stroke: color, width: 1.5 }
  );
}

function labelOnLine(
  r: Renderer,
  x: ReturnType<typeof linearScale>,
  y: ReturnType<typeof linearScale>,
  hour: number,
  cm: number,
  text: string,
  color: string
): void {
  r.text(text, x.map(hour), y.map(cm) - 4, {
    fill: color,
    font: "italic 600 11px system-ui, sans-serif",
    align: "center",
    baseline: "bottom",
  });
}
