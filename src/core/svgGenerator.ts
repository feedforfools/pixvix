import type { PixelColor, GridConfig, OutputFrame } from "../types";
import { colorToHex } from "./gridSampler";

interface SvgRect {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

/**
 * Generate an optimized SVG string from sampled color data.
 * Uses row merging to minimize file size by combining adjacent same-color pixels.
 */
export function generateSvg(
  colors: (PixelColor | null)[][],
  gridConfig: GridConfig,
  _imageWidth: number,
  _imageHeight: number,
  ignoredPixels: Set<string>,
  outputFrame?: OutputFrame | null
): string {
  const { gridSize } = gridConfig;
  const rects: SvgRect[] = [];

  // Determine bounds
  const startRow = outputFrame?.startRow ?? 0;
  const endRow = outputFrame?.endRow ?? colors.length - 1;
  const startCol = outputFrame?.startCol ?? 0;
  const endCol = outputFrame?.endCol ?? (colors[0]?.length ?? 0) - 1;

  // Calculate output SVG dimensions (1 unit per pixel)
  const outputCols = endCol - startCol + 1;
  const outputRows = endRow - startRow + 1;

  // Process each row within the frame
  for (let row = startRow; row <= endRow; row++) {
    const rowColors = colors[row];
    if (!rowColors) continue;

    let runStart = startCol;
    let runColor: string | null = null;
    let runWidth = 0;

    for (let col = startCol; col <= endCol + 1; col++) {
      const key = `${col}-${row}`;
      const isIgnored = ignoredPixels.has(key);
      const color = col <= endCol && !isIgnored ? rowColors[col] : null;
      const hexColor = color ? colorToHex(color) : null;

      // Check if we should end the current run
      if (hexColor !== runColor) {
        // Emit the previous run if it exists
        if (runColor !== null && runWidth > 0) {
          rects.push({
            x: runStart - startCol, // Offset to 0-based output coords
            y: row - startRow,
            width: runWidth,
            height: 1,
            color: runColor,
          });
        }

        // Start a new run
        runStart = col;
        runColor = hexColor;
        runWidth = hexColor !== null ? 1 : 0;
      } else if (hexColor !== null) {
        // Continue the current run
        runWidth++;
      }
    }
  }

  // Build SVG string with pixel-based viewBox
  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${outputCols} ${outputRows}" width="${
    outputCols * gridSize
  }" height="${outputRows * gridSize}">\n`;

  for (const rect of rects) {
    svg += `  <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" fill="${rect.color}"/>\n`;
  }

  svg += `</svg>`;

  return svg;
}

/**
 * Download an SVG string as a file.
 */
export function downloadSvg(svgContent: string, filename: string): void {
  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
