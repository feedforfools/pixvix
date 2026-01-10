import type {
  PixelColor,
  GridConfig,
  OutputFrame,
  GroupAdjustments,
} from "../types";
import { colorToHex } from "./gridSampler";
import { getAdjustedColor } from "./colorGroups";

interface SvgRect {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

/**
 * Get the effective color after applying group adjustments.
 */
function getEffectiveColor(
  color: PixelColor,
  groupAdjustments?: GroupAdjustments
): string {
  if (groupAdjustments && groupAdjustments.size > 0) {
    const adjusted = getAdjustedColor(color, groupAdjustments);
    return colorToHex(adjusted);
  }
  return colorToHex(color);
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
  outputFrame?: OutputFrame | null,
  groupAdjustments?: GroupAdjustments
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
      // Treat fully transparent pixels as ignored (alpha = 0 means originally transparent)
      const isTransparent = color !== null && color.a === 0;
      const hexColor =
        color && !isTransparent
          ? getEffectiveColor(color, groupAdjustments)
          : null;

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

/**
 * Generate a PNG from sampled color data at a specified scale.
 * Returns a data URL of the PNG image.
 */
export function generatePngDataUrl(
  colors: (PixelColor | null)[][],
  ignoredPixels: Set<string>,
  outputFrame?: OutputFrame | null,
  targetWidth?: number,
  targetHeight?: number,
  groupAdjustments?: GroupAdjustments
): string {
  // Determine bounds
  const startRow = outputFrame?.startRow ?? 0;
  const endRow = outputFrame?.endRow ?? colors.length - 1;
  const startCol = outputFrame?.startCol ?? 0;
  const endCol = outputFrame?.endCol ?? (colors[0]?.length ?? 0) - 1;

  // Calculate output dimensions (in pixels, 1:1 with grid cells)
  const outputCols = endCol - startCol + 1;
  const outputRows = endRow - startRow + 1;

  // Use target dimensions if provided, otherwise use 1:1
  const canvasWidth = targetWidth ?? outputCols;
  const canvasHeight = targetHeight ?? outputRows;

  // Calculate scale factor for each "pixel"
  const pixelWidth = canvasWidth / outputCols;
  const pixelHeight = canvasHeight / outputRows;

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to create canvas context");
  }

  // Clear canvas (transparent background)
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Draw each pixel as a scaled rectangle
  for (let row = startRow; row <= endRow; row++) {
    const rowColors = colors[row];
    if (!rowColors) continue;

    for (let col = startCol; col <= endCol; col++) {
      const key = `${col}-${row}`;
      const isIgnored = ignoredPixels.has(key);
      let color = rowColors[col];

      // Skip ignored, null, or fully transparent pixels
      if (isIgnored || color === null || color.a === 0) continue;

      // Apply group adjustments if available
      if (groupAdjustments && groupAdjustments.size > 0) {
        color = getAdjustedColor(color, groupAdjustments);
      }

      // Calculate position in output canvas
      const x = (col - startCol) * pixelWidth;
      const y = (row - startRow) * pixelHeight;

      // Set fill color with alpha
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${
        color.a / 255
      })`;
      ctx.fillRect(
        Math.floor(x),
        Math.floor(y),
        Math.ceil(pixelWidth),
        Math.ceil(pixelHeight)
      );
    }
  }

  return canvas.toDataURL("image/png");
}

/**
 * Download a PNG from sampled color data at a specified scale.
 */
export function downloadPng(
  colors: (PixelColor | null)[][],
  ignoredPixels: Set<string>,
  filename: string,
  outputFrame?: OutputFrame | null,
  targetWidth?: number,
  targetHeight?: number,
  groupAdjustments?: GroupAdjustments
): void {
  const dataUrl = generatePngDataUrl(
    colors,
    ignoredPixels,
    outputFrame,
    targetWidth,
    targetHeight,
    groupAdjustments
  );

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
