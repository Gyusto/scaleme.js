/** Tiny color helpers — just enough to derive translucent fills from a base color. */

/**
 * Return `color` at the given alpha (0–1). Handles `#rgb`, `#rrggbb`, and any
 * `rgb(...)` string; anything else is returned unchanged.
 */
export function withAlpha(color: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));

  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    if (hex.length === 6) {
      const n = parseInt(hex, 16);
      const r = (n >> 16) & 255;
      const g = (n >> 8) & 255;
      const b = n & 255;
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
  }

  if (color.startsWith("rgb(")) {
    return color.replace("rgb(", "rgba(").replace(")", `, ${a})`);
  }

  return color;
}
