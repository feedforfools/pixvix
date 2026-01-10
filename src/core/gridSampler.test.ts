import { describe, it, expect } from "vitest";
import {
  getCellCenter,
  getCellBounds,
  getGridDimensions,
  getPixelColor,
  getAverageColor,
  colorToRgba,
  colorToHex,
  isPixelTransparent,
  getMinimalBoundingFrame,
  extractPalette,
} from "./gridSampler";
import type { GridConfig, PixelColor } from "../types";

// Mock ImageData for Node.js environment
function createMockImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number
): ImageData {
  return {
    data,
    width,
    height,
    colorSpace: "srgb",
  } as ImageData;
}

describe("gridSampler", () => {
  describe("getCellCenter", () => {
    it("calculates center of first cell with no offset", () => {
      const config: GridConfig = {
        gridSize: 10,
        offsetX: 0,
        offsetY: 0,
        sampleMode: "center",
      };
      const center = getCellCenter(0, 0, config);
      expect(center).toEqual({ x: 5, y: 5 });
    });

    it("calculates center of cell at (1, 1) with no offset", () => {
      const config: GridConfig = {
        gridSize: 10,
        offsetX: 0,
        offsetY: 0,
        sampleMode: "center",
      };
      const center = getCellCenter(1, 1, config);
      expect(center).toEqual({ x: 15, y: 15 });
    });

    it("applies offset correctly", () => {
      const config: GridConfig = {
        gridSize: 10,
        offsetX: 3,
        offsetY: 5,
        sampleMode: "center",
      };
      const center = getCellCenter(0, 0, config);
      expect(center).toEqual({ x: 8, y: 10 });
    });

    it("handles odd grid sizes", () => {
      const config: GridConfig = {
        gridSize: 7,
        offsetX: 0,
        offsetY: 0,
        sampleMode: "center",
      };
      const center = getCellCenter(0, 0, config);
      expect(center).toEqual({ x: 3, y: 3 });
    });
  });

  describe("getGridDimensions", () => {
    it("calculates grid dimensions with no offset", () => {
      const config: GridConfig = {
        gridSize: 10,
        offsetX: 0,
        offsetY: 0,
        sampleMode: "center",
      };
      const dims = getGridDimensions(100, 80, config);
      expect(dims).toEqual({ cols: 10, rows: 8 });
    });

    it("calculates grid dimensions with offset", () => {
      const config: GridConfig = {
        gridSize: 10,
        offsetX: 5,
        offsetY: 5,
        sampleMode: "center",
      };
      const dims = getGridDimensions(100, 80, config);
      expect(dims).toEqual({ cols: 10, rows: 8 });
    });

    it("handles non-divisible dimensions", () => {
      const config: GridConfig = {
        gridSize: 10,
        offsetX: 0,
        offsetY: 0,
        sampleMode: "center",
      };
      const dims = getGridDimensions(95, 85, config);
      expect(dims).toEqual({ cols: 10, rows: 9 });
    });
  });

  describe("getPixelColor", () => {
    it("reads pixel color from image data", () => {
      // Create a simple 2x2 image data
      const data = new Uint8ClampedArray([
        255,
        0,
        0,
        255, // Red pixel at (0,0)
        0,
        255,
        0,
        255, // Green pixel at (1,0)
        0,
        0,
        255,
        255, // Blue pixel at (0,1)
        255,
        255,
        255,
        255, // White pixel at (1,1)
      ]);
      const imageData = createMockImageData(data, 2, 2);

      expect(getPixelColor(imageData, 0, 0)).toEqual({
        r: 255,
        g: 0,
        b: 0,
        a: 255,
      });
      expect(getPixelColor(imageData, 1, 0)).toEqual({
        r: 0,
        g: 255,
        b: 0,
        a: 255,
      });
      expect(getPixelColor(imageData, 0, 1)).toEqual({
        r: 0,
        g: 0,
        b: 255,
        a: 255,
      });
      expect(getPixelColor(imageData, 1, 1)).toEqual({
        r: 255,
        g: 255,
        b: 255,
        a: 255,
      });
    });

    it("returns null for out of bounds coordinates", () => {
      const data = new Uint8ClampedArray([255, 0, 0, 255]);
      const imageData = createMockImageData(data, 1, 1);

      expect(getPixelColor(imageData, -1, 0)).toBeNull();
      expect(getPixelColor(imageData, 0, -1)).toBeNull();
      expect(getPixelColor(imageData, 1, 0)).toBeNull();
      expect(getPixelColor(imageData, 0, 1)).toBeNull();
    });
  });

  describe("colorToRgba", () => {
    it("converts color to rgba string", () => {
      expect(colorToRgba({ r: 255, g: 0, b: 0, a: 255 })).toBe(
        "rgba(255, 0, 0, 1)"
      );
      expect(colorToRgba({ r: 0, g: 128, b: 255, a: 128 })).toBe(
        "rgba(0, 128, 255, 0.5019607843137255)"
      );
    });
  });

  describe("colorToHex", () => {
    it("converts color to hex string", () => {
      expect(colorToHex({ r: 255, g: 0, b: 0, a: 255 })).toBe("#ff0000");
      expect(colorToHex({ r: 0, g: 255, b: 0, a: 255 })).toBe("#00ff00");
      expect(colorToHex({ r: 0, g: 0, b: 255, a: 255 })).toBe("#0000ff");
      expect(colorToHex({ r: 255, g: 255, b: 255, a: 255 })).toBe("#ffffff");
      expect(colorToHex({ r: 0, g: 0, b: 0, a: 255 })).toBe("#000000");
    });

    it("pads single-digit hex values", () => {
      expect(colorToHex({ r: 0, g: 15, b: 10, a: 255 })).toBe("#000f0a");
    });
  });

  describe("isPixelTransparent", () => {
    const opaquePixel: PixelColor = { r: 255, g: 0, b: 0, a: 255 };
    const transparentPixel: PixelColor = { r: 255, g: 0, b: 0, a: 0 };

    it("returns true for pixels in ignoredPixels set", () => {
      const colors: (PixelColor | null)[][] = [[opaquePixel]];
      const ignored = new Set(["0-0"]);
      expect(isPixelTransparent(0, 0, colors, ignored)).toBe(true);
    });

    it("returns true for pixels with alpha = 0", () => {
      const colors: (PixelColor | null)[][] = [[transparentPixel]];
      const ignored = new Set<string>();
      expect(isPixelTransparent(0, 0, colors, ignored)).toBe(true);
    });

    it("returns true for null pixels in color array", () => {
      const colors: (PixelColor | null)[][] = [[null]];
      const ignored = new Set<string>();
      expect(isPixelTransparent(0, 0, colors, ignored)).toBe(true);
    });

    it("returns false for opaque non-ignored pixels", () => {
      const colors: (PixelColor | null)[][] = [[opaquePixel]];
      const ignored = new Set<string>();
      expect(isPixelTransparent(0, 0, colors, ignored)).toBe(false);
    });

    it("works without color data (legacy behavior)", () => {
      const ignored = new Set(["0-0"]);
      expect(isPixelTransparent(0, 0, null, ignored)).toBe(true);
      expect(isPixelTransparent(1, 0, null, ignored)).toBe(false);
    });
  });

  describe("getMinimalBoundingFrame", () => {
    const opaque: PixelColor = { r: 255, g: 0, b: 0, a: 255 };
    const transparent: PixelColor = { r: 0, g: 0, b: 0, a: 0 };

    it("returns bounds excluding ignored pixels", () => {
      // 3x3 grid, middle pixel ignored
      const colors: (PixelColor | null)[][] = [
        [opaque, opaque, opaque],
        [opaque, opaque, opaque],
        [opaque, opaque, opaque],
      ];
      const ignored = new Set(["0-0", "2-0", "0-2", "2-2"]); // corners ignored

      const frame = getMinimalBoundingFrame(3, 3, ignored, colors);
      expect(frame).toEqual({
        startCol: 0,
        startRow: 0,
        endCol: 2,
        endRow: 2,
      });
    });

    it("returns bounds excluding originally transparent pixels", () => {
      // 4x4 grid with transparent border
      const colors: (PixelColor | null)[][] = [
        [transparent, transparent, transparent, transparent],
        [transparent, opaque, opaque, transparent],
        [transparent, opaque, opaque, transparent],
        [transparent, transparent, transparent, transparent],
      ];
      const ignored = new Set<string>();

      const frame = getMinimalBoundingFrame(4, 4, ignored, colors);
      expect(frame).toEqual({
        startCol: 1,
        startRow: 1,
        endCol: 2,
        endRow: 2,
      });
    });

    it("handles L-shaped content with transparent corners", () => {
      const colors: (PixelColor | null)[][] = [
        [opaque, transparent, transparent],
        [opaque, transparent, transparent],
        [opaque, opaque, opaque],
      ];
      const ignored = new Set<string>();

      const frame = getMinimalBoundingFrame(3, 3, ignored, colors);
      expect(frame).toEqual({
        startCol: 0,
        startRow: 0,
        endCol: 2,
        endRow: 2,
      });
    });

    it("returns null when all pixels are transparent", () => {
      const colors: (PixelColor | null)[][] = [
        [transparent, transparent],
        [transparent, transparent],
      ];
      const ignored = new Set<string>();

      const frame = getMinimalBoundingFrame(2, 2, ignored, colors);
      expect(frame).toBeNull();
    });

    it("returns null when all pixels are ignored", () => {
      const colors: (PixelColor | null)[][] = [
        [opaque, opaque],
        [opaque, opaque],
      ];
      const ignored = new Set(["0-0", "1-0", "0-1", "1-1"]);

      const frame = getMinimalBoundingFrame(2, 2, ignored, colors);
      expect(frame).toBeNull();
    });

    it("works without color data (legacy behavior)", () => {
      const ignored = new Set(["0-0", "2-0"]);
      const frame = getMinimalBoundingFrame(3, 1, ignored);
      expect(frame).toEqual({
        startCol: 1,
        startRow: 0,
        endCol: 1,
        endRow: 0,
      });
    });
  });

  describe("getCellBounds", () => {
    it("calculates bounds of first cell with no offset", () => {
      const config: GridConfig = {
        gridSize: 10,
        offsetX: 0,
        offsetY: 0,
        sampleMode: "center",
      };
      const bounds = getCellBounds(0, 0, config, 100, 100);
      expect(bounds).toEqual({ x1: 0, y1: 0, x2: 10, y2: 10 });
    });

    it("calculates bounds with offset", () => {
      const config: GridConfig = {
        gridSize: 10,
        offsetX: 3,
        offsetY: 5,
        sampleMode: "center",
      };
      const bounds = getCellBounds(0, 0, config, 100, 100);
      expect(bounds).toEqual({ x1: 3, y1: 5, x2: 13, y2: 15 });
    });

    it("clamps to image bounds", () => {
      const config: GridConfig = {
        gridSize: 10,
        offsetX: 0,
        offsetY: 0,
        sampleMode: "center",
      };
      // Cell at (9,9) would extend beyond 95x95 image
      const bounds = getCellBounds(9, 9, config, 95, 95);
      expect(bounds).toEqual({ x1: 90, y1: 90, x2: 95, y2: 95 });
    });
  });

  describe("getAverageColor", () => {
    it("averages all pixels in a cell", () => {
      // Create a 4x4 image with uniform colors in a 2x2 block
      // Top-left 2x2: red (255,0,0)
      const data = new Uint8ClampedArray([
        255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 0, 255,
        255, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ]);
      const imageData = createMockImageData(data, 4, 4);
      const config: GridConfig = {
        gridSize: 2,
        offsetX: 0,
        offsetY: 0,
        sampleMode: "average",
      };

      const color = getAverageColor(imageData, 0, 0, config);
      // Average of 2 red and 2 green pixels
      expect(color).toEqual({ r: 128, g: 128, b: 0, a: 255 });
    });

    it("returns null for cell outside bounds", () => {
      const data = new Uint8ClampedArray([255, 0, 0, 255]);
      const imageData = createMockImageData(data, 1, 1);
      const config: GridConfig = {
        gridSize: 2,
        offsetX: 0,
        offsetY: 0,
        sampleMode: "average",
      };

      const color = getAverageColor(imageData, 5, 5, config);
      expect(color).toBeNull();
    });

    it("handles partial cells at edges", () => {
      // 3x3 image with all white pixels
      const data = new Uint8ClampedArray(3 * 3 * 4).fill(255);
      const imageData = createMockImageData(data, 3, 3);
      const config: GridConfig = {
        gridSize: 2,
        offsetX: 0,
        offsetY: 0,
        sampleMode: "average",
      };

      // Cell at (1,1) only covers 1 pixel (at position 2,2)
      const color = getAverageColor(imageData, 1, 1, config);
      expect(color).toEqual({ r: 255, g: 255, b: 255, a: 255 });
    });
  });

  describe("extractPalette", () => {
    const red: PixelColor = { r: 255, g: 0, b: 0, a: 255 };
    const green: PixelColor = { r: 0, g: 255, b: 0, a: 255 };
    const blue: PixelColor = { r: 0, g: 0, b: 255, a: 255 };
    const transparent: PixelColor = { r: 0, g: 0, b: 0, a: 0 };

    it("extracts unique colors sorted by frequency", () => {
      const colors: (PixelColor | null)[][] = [
        [red, red, green],
        [red, blue, green],
      ];
      const ignored = new Set<string>();

      const palette = extractPalette(colors, ignored);

      expect(palette).toHaveLength(3);
      expect(palette[0].hexCode).toBe("#ff0000"); // red: 3 occurrences
      expect(palette[0].count).toBe(3);
      expect(palette[1].hexCode).toBe("#00ff00"); // green: 2 occurrences
      expect(palette[1].count).toBe(2);
      expect(palette[2].hexCode).toBe("#0000ff"); // blue: 1 occurrence
      expect(palette[2].count).toBe(1);
    });

    it("excludes ignored pixels", () => {
      const colors: (PixelColor | null)[][] = [
        [red, red],
        [green, blue],
      ];
      const ignored = new Set(["0-0"]); // ignore first red

      const palette = extractPalette(colors, ignored);

      // Red should now only have 1 count
      const redEntry = palette.find((p) => p.hexCode === "#ff0000");
      expect(redEntry?.count).toBe(1);
    });

    it("excludes transparent pixels", () => {
      const colors: (PixelColor | null)[][] = [
        [red, transparent],
        [transparent, red],
      ];
      const ignored = new Set<string>();

      const palette = extractPalette(colors, ignored);

      expect(palette).toHaveLength(1);
      expect(palette[0].hexCode).toBe("#ff0000");
      expect(palette[0].count).toBe(2);
    });

    it("respects output frame bounds", () => {
      const colors: (PixelColor | null)[][] = [
        [red, red, red],
        [green, green, green],
        [blue, blue, blue],
      ];
      const ignored = new Set<string>();
      const outputFrame = { startCol: 1, startRow: 1, endCol: 2, endRow: 2 };

      const palette = extractPalette(colors, ignored, outputFrame);

      // Should only include green (row 1) and blue (row 2), columns 1-2
      expect(palette).toHaveLength(2);
      expect(palette[0].count).toBe(2); // green
      expect(palette[1].count).toBe(2); // blue
    });

    it("returns empty array for all transparent image", () => {
      const colors: (PixelColor | null)[][] = [
        [transparent, transparent],
        [transparent, null],
      ];
      const ignored = new Set<string>();

      const palette = extractPalette(colors, ignored);

      expect(palette).toHaveLength(0);
    });
  });
});
