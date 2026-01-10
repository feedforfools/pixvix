/** Represents a point with x and y coordinates */
export interface Point {
  x: number;
  y: number;
}

/** Sampling method for grid cells */
export type SampleMode = "center" | "average";

/** Grid configuration for pixel sampling */
export interface GridConfig {
  gridSize: number;
  offsetX: number;
  offsetY: number;
  sampleMode: SampleMode;
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

/** Entry in the color palette */
export interface PaletteEntry {
  hexCode: string;
  color: PixelColor;
  count: number;
}

/** HSL color representation */
export interface HSLColor {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

/** Predefined color group identifiers */
export type ColorGroupId =
  | "reds"
  | "oranges"
  | "yellows"
  | "greens"
  | "cyans"
  | "blues"
  | "purples"
  | "grays";

/** A group of colors with shared hue range */
export interface ColorGroup {
  id: ColorGroupId;
  name: string;
  colors: PaletteEntry[];
  /** Representative hue for the group (for display) */
  representativeHue: number;
}

/** Adjustments to apply to a color group */
export interface GroupAdjustment {
  /** Hue rotation in degrees (-180 to 180) */
  hueShift: number;
  /** Saturation multiplier (0 to 2, where 1 = no change) */
  saturationScale: number;
  /** Lightness multiplier (0 to 2, where 1 = no change) */
  lightnessScale: number;
}

/** Map of group adjustments (groupId → adjustment) */
export type GroupAdjustments = Map<ColorGroupId, GroupAdjustment>;

/** Map of color replacements (original hex → replacement color) - legacy */
export type ColorReplacements = Map<string, PixelColor>;
