import type { Point, PixelColor, GridConfig } from "../types";

/**
 * Calculate the center pixel coordinates of a grid cell.
 */
export function getCellCenter(
  col: number,
  row: number,
  config: GridConfig
): Point {
  const { gridSize, offsetX, offsetY } = config;
  return {
    x: col * gridSize + offsetX + Math.floor(gridSize / 2),
    y: row * gridSize + offsetY + Math.floor(gridSize / 2),
  };
}

/**
 * Calculate grid dimensions (number of columns and rows).
 */
export function getGridDimensions(
  imageWidth: number,
  imageHeight: number,
  config: GridConfig
): { cols: number; rows: number } {
  const { gridSize, offsetX, offsetY } = config;
  const cols = Math.ceil((imageWidth - offsetX) / gridSize);
  const rows = Math.ceil((imageHeight - offsetY) / gridSize);
  return { cols, rows };
}

/**
 * Read a single pixel's color from canvas ImageData.
 */
export function getPixelColor(
  imageData: ImageData,
  x: number,
  y: number
): PixelColor | null {
  // Bounds check
  if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) {
    return null;
  }

  const index = (y * imageData.width + x) * 4;
  return {
    r: imageData.data[index],
    g: imageData.data[index + 1],
    b: imageData.data[index + 2],
    a: imageData.data[index + 3],
  };
}

/**
 * Convert a PixelColor to a CSS rgba string.
 */
export function colorToRgba(color: PixelColor): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
}

/**
 * Convert a PixelColor to a hex string (ignores alpha).
 */
export function colorToHex(color: PixelColor): string {
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

/**
 * Sample all grid cells and return a 2D array of colors.
 * Returns null for cells outside the image bounds.
 */
export function sampleGrid(
  imageData: ImageData,
  config: GridConfig
): (PixelColor | null)[][] {
  const { cols, rows } = getGridDimensions(
    imageData.width,
    imageData.height,
    config
  );

  const result: (PixelColor | null)[][] = [];

  for (let row = 0; row < rows; row++) {
    const rowColors: (PixelColor | null)[] = [];
    for (let col = 0; col < cols; col++) {
      const center = getCellCenter(col, row, config);
      const color = getPixelColor(imageData, center.x, center.y);
      rowColors.push(color);
    }
    result.push(rowColors);
  }

  return result;
}

/**
 * Calculate the minimal bounding box that contains all non-ignored pixels.
 * Returns null if all pixels are ignored.
 */
export function getMinimalBoundingFrame(
  cols: number,
  rows: number,
  ignoredPixels: Set<string>
): {
  startCol: number;
  startRow: number;
  endCol: number;
  endRow: number;
} | null {
  let minCol = cols;
  let maxCol = -1;
  let minRow = rows;
  let maxRow = -1;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const key = `${col}-${row}`;
      if (!ignoredPixels.has(key)) {
        if (col < minCol) minCol = col;
        if (col > maxCol) maxCol = col;
        if (row < minRow) minRow = row;
        if (row > maxRow) maxRow = row;
      }
    }
  }

  // No visible pixels
  if (maxCol < 0 || maxRow < 0) {
    return null;
  }

  return {
    startCol: minCol,
    startRow: minRow,
    endCol: maxCol,
    endRow: maxRow,
  };
}
