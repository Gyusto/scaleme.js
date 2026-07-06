/**
 * DOM helpers: resolving the mount target and preparing a
 * crisp, high-DPI canvas to draw into.
 */

export function resolveCanvas(
  element: string | HTMLElement | HTMLCanvasElement
): HTMLCanvasElement {
  let node: HTMLElement | null;

  if (typeof element === "string") {
    node = document.querySelector<HTMLElement>(element);
    if (!node) throw new Error(`scaleme: no element matches "${element}"`);
  } else {
    node = element;
  }

  if (node instanceof HTMLCanvasElement) return node;

  // A container was passed — create a canvas inside it that fills the box.
  const canvas = document.createElement("canvas");
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  node.appendChild(canvas);
  return canvas;
}

export interface CanvasSurface {
  ctx: CanvasRenderingContext2D;
  /** Logical (CSS pixel) width the chart should lay itself out in. */
  width: number;
  /** Logical (CSS pixel) height. */
  height: number;
  dpr: number;
}

/**
 * Size the canvas backing store for the device pixel ratio and scale the
 * context so all downstream drawing can use plain CSS-pixel coordinates.
 */
export function prepareSurface(canvas: HTMLCanvasElement): CanvasSurface {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  // Fall back to the attribute size if CSS layout hasn't given it a box.
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width || canvas.width || 300));
  const height = Math.max(1, Math.round(rect.height || canvas.height || 150));

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("scaleme: could not acquire a 2D canvas context");

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height, dpr };
}
