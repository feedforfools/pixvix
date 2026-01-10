import type {
  Point,
  PixelColor,
  GridConfig,
  OutputFrame,
  PaletteEntry,
} from "../types";

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
 * Calculate the bounds of a grid cell (top-left and clamped bottom-right).
 */
export function getCellBounds(
  col: number,
  row: number,
  config: GridConfig,
  imageWidth: number,
  imageHeight: number
): { x1: number; y1: number; x2: number; y2: number } {
  const { gridSize, offsetX, offsetY } = config;
  const x1 = col * gridSize + offsetX;
  const y1 = row * gridSize + offsetY;
  // Clamp to image bounds
  const x2 = Math.min(x1 + gridSize, imageWidth);
  const y2 = Math.min(y1 + gridSize, imageHeight);
  return { x1, y1, x2, y2 };
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
 * Calculate the average color of all pixels within a grid cell.
 * Returns null if the cell is entirely outside bounds or all pixels are transparent.
 */
export function getAverageColor(
  imageData: ImageData,
  col: number,
  row: number,
  config: GridConfig
): PixelColor | null {
  const { x1, y1, x2, y2 } = getCellBounds(
    col,
    row,
    config,
    imageData.width,
    imageData.height
  );

  // Cell is outside image bounds
  if (x1 >= imageData.width || y1 >= imageData.height || x2 <= x1 || y2 <= y1) {
    return null;
  }

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let totalA = 0;
  let count = 0;

  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      const index = (y * imageData.width + x) * 4;
      totalR += imageData.data[index];
      totalG += imageData.data[index + 1];
      totalB += imageData.data[index + 2];
      totalA += imageData.data[index + 3];
      count++;
    }
  }

  if (count === 0) return null;

  return {
    r: Math.round(totalR / count),
    g: Math.round(totalG / count),
    b: Math.round(totalB / count),
    a: Math.round(totalA / count),
  };
}

/**
 * Sample all grid cells and return a 2D array of colors.
 * Uses center-pixel sampling by default, or average-color when sampleMode is "average".
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

  const useAverage = config.sampleMode === "average";
  const result: (PixelColor | null)[][] = [];

  for (let row = 0; row < rows; row++) {
    const rowColors: (PixelColor | null)[] = [];
    for (let col = 0; col < cols; col++) {
      const color = useAverage
        ? getAverageColor(imageData, col, row, config)
        : getPixelColor(
            imageData,
            ...(Object.values(getCellCenter(col, row, config)) as [
              number,
              number
            ])
          );
      rowColors.push(color);
    }
    result.push(rowColors);
  }

  return result;
}

/**
 * Check if a pixel should be treated as transparent.
 * A pixel is transparent if it's in the ignoredPixels set OR has alpha = 0.
 */
export function isPixelTransparent(
  col: number,
  row: number,
  colors: (PixelColor | null)[][] | null,
  ignoredPixels: Set<string>
): boolean {
  const key = `${col}-${row}`;
  if (ignoredPixels.has(key)) return true;

  // Check if originally transparent (alpha = 0)
  if (colors) {
    const color = colors[row]?.[col];
    if (color === null || color.a === 0) return true;
  }

  return false;
}

/**
 * Calculate the minimal bounding box that contains all non-ignored pixels.
 * A pixel is considered ignored if it's in ignoredPixels OR has alpha = 0.
 * Returns null if all pixels are ignored/transparent.
 */
export function getMinimalBoundingFrame(
  cols: number,
  rows: number,
  ignoredPixels: Set<string>,
  colors?: (PixelColor | null)[][] | null
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
      if (!isPixelTransparent(col, row, colors ?? null, ignoredPixels)) {
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

/**
 * Extract unique colors from sampled grid and return a palette sorted by frequency.
 * Respects outputFrame bounds if provided, and excludes ignored/transparent pixels.
 */
export function extractPalette(
  colors: (PixelColor | null)[][],
  ignoredPixels: Set<string>,
  outputFrame?: OutputFrame | null
): PaletteEntry[] {
  const colorCounts = new Map<string, { color: PixelColor; count: number }>();

  // Determine bounds
  const startRow = outputFrame?.startRow ?? 0;
  const endRow = outputFrame?.endRow ?? colors.length - 1;
  const startCol = outputFrame?.startCol ?? 0;
  const endCol = outputFrame?.endCol ?? (colors[0]?.length ?? 0) - 1;

  for (let row = startRow; row <= endRow; row++) {
    const rowColors = colors[row];
    if (!rowColors) continue;

    for (let col = startCol; col <= endCol; col++) {
      const key = `${col}-${row}`;
      if (ignoredPixels.has(key)) continue;

      const color = rowColors[col];
      if (!color || color.a === 0) continue;

      const hexCode = colorToHex(color);
      const existing = colorCounts.get(hexCode);
      if (existing) {
        existing.count++;
      } else {
        colorCounts.set(hexCode, { color, count: 1 });
      }
    }
  }

  // Convert to array and sort by frequency (most used first)
  const palette: PaletteEntry[] = [];
  for (const [hexCode, { color, count }] of colorCounts) {
    palette.push({ hexCode, color, count });
  }

  palette.sort((a, b) => b.count - a.count);
  return palette;
}
