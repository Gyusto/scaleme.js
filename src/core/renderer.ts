/**
 * Renderer: high-level drawing primitives over a backing surface.
 *
 * Charts talk to this interface, never to the raw canvas context — so a
 * future SVG renderer can implement the same shape without touching charts.
 */

export interface Point {
  x: number;
  y: number;
}

export interface LineStyle {
  stroke?: string;
  width?: number;
  /** Dash pattern in pixels, e.g. [4, 4]. */
  dash?: number[];
  /** Draw a smooth (Catmull-Rom) curve through the points instead of segments. */
  smooth?: boolean;
}

export interface TextStyle {
  fill?: string;
  font?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
}

export interface Renderer {
  clear(): void;
  polyline(points: Point[], style?: LineStyle): void;
  line(a: Point, b: Point, style?: LineStyle): void;
  rect(x: number, y: number, w: number, h: number, fill: string): void;
  /** Filled rectangle with rounded corners (radius clamped to half the shorter side). */
  roundRect(x: number, y: number, w: number, h: number, radius: number, fill: string): void;
  /** Filled area under a series, closed down to `baseline` (a pixel y). */
  area(points: Point[], baseline: number, fill: string, smooth?: boolean): void;
  circle(cx: number, cy: number, r: number, fill: string): void;
  text(str: string, x: number, y: number, style?: TextStyle): void;
}

/** Trace a Catmull-Rom spline through the points onto the current path. */
function traceSmooth(ctx: CanvasRenderingContext2D, pts: Point[]): void {
  ctx.moveTo(pts[0]!.x, pts[0]!.y);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2 < pts.length ? i + 2 : pts.length - 1]!;
    // Catmull-Rom → cubic Bézier control points.
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
}

export function canvasRenderer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): Renderer {
  return {
    clear() {
      ctx.clearRect(0, 0, width, height);
    },

    polyline(points, style = {}) {
      if (points.length < 2) return;
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = style.stroke ?? "#000";
      ctx.lineWidth = style.width ?? 1;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      if (style.dash) ctx.setLineDash(style.dash);
      if (style.smooth) {
        traceSmooth(ctx, points);
      } else {
        points.forEach((p, i) =>
          i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
        );
      }
      ctx.stroke();
      ctx.restore();
    },

    roundRect(x, y, w, h, radius, fill) {
      const r = Math.max(0, Math.min(radius, Math.abs(w) / 2, Math.abs(h) / 2));
      ctx.beginPath();
      ctx.fillStyle = fill;
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();
    },

    area(points, baseline, fill, smooth = false) {
      if (points.length < 2) return;
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = fill;
      if (smooth) traceSmooth(ctx, points);
      else points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.lineTo(points[points.length - 1]!.x, baseline);
      ctx.lineTo(points[0]!.x, baseline);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },

    line(a, b, style = {}) {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = style.stroke ?? "#000";
      ctx.lineWidth = style.width ?? 1;
      if (style.dash) ctx.setLineDash(style.dash);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.restore();
    },

    rect(x, y, w, h, fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, w, h);
    },

    circle(cx, cy, r, fill) {
      ctx.beginPath();
      ctx.fillStyle = fill;
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    },

    text(str, x, y, style = {}) {
      ctx.save();
      ctx.fillStyle = style.fill ?? "#000";
      ctx.font = style.font ?? "12px system-ui, sans-serif";
      ctx.textAlign = style.align ?? "left";
      ctx.textBaseline = style.baseline ?? "alphabetic";
      ctx.fillText(str, x, y);
      ctx.restore();
    },
  };
}
