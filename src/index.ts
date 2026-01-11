/**
 * Pixvix - Pixel Art to SVG Converter
 *
 * This is the library entry point for using pixvix as a package.
 * Import the Layout component to render the full converter UI.
 *
 * Usage:
 * ```tsx
 * import { Layout } from 'pixvix';
 * import 'pixvix/styles';  // Import the styles
 * ```
 */

// Import styles so they get bundled
import "./index.css";

// Main application component
export { Layout } from "./components/Layout";

// Core algorithms (for advanced usage)
export {
  sampleGrid,
  getGridDimensions,
  getCellCenter,
  getCellBounds,
  colorToHex,
  colorToRgba,
  getMinimalBoundingFrame,
  extractPalette,
} from "./core/gridSampler";

export { generateSvg, downloadSvg, downloadPng } from "./core/svgGenerator";

export {
  rgbToHsl,
  hslToRgb,
  groupColorsByHue,
  getAdjustedColor,
  createDefaultAdjustment,
  isDefaultAdjustment,
  applyAdjustmentToColor,
  hasActiveAdjustments,
} from "./core/colorGroups";

export {
  readFileAsDataURL,
  loadImageFromDataURL,
  isValidImageFile,
} from "./core/fileHelpers";

// Type exports
export type {
  Point,
  SampleMode,
  GridConfig,
  PixelColor,
  CropRegion,
  OutputFrame,
  WorkflowStep,
  AppState,
  Dimensions,
  PaletteEntry,
  HSLColor,
  ColorGroupId,
  ColorGroup,
  GroupAdjustment,
  GroupAdjustments,
  ColorReplacements,
} from "./types";
