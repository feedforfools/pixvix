/** Represents a point with x and y coordinates */
export interface Point {
  x: number;
  y: number;
}

/** Grid configuration for pixel sampling */
export interface GridConfig {
  gridSize: number;
  offsetX: number;
  offsetY: number;
}

/** RGBA color representation */
export interface PixelColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Crop region in image coordinates */
export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Output frame bounds (in grid cell coordinates) */
export interface OutputFrame {
  startCol: number;
  startRow: number;
  endCol: number;
  endRow: number;
}

/** Workflow step identifiers */
export type WorkflowStep = "upload" | "crop" | "grid" | "refine" | "export";

/** Application state shape */
export interface AppState {
  originalImage: HTMLImageElement | null;
  gridSize: number;
  offsetX: number;
  offsetY: number;
  ignoredPixels: Set<string>;
  showPreview: boolean;
}

/** Image dimensions */
export interface Dimensions {
  width: number;
  height: number;
}
