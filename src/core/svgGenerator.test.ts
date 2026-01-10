import { describe, it, expect } from "vitest";
import { generateSvg } from "./svgGenerator";
import type {
  PixelColor,
  GridConfig,
  GroupAdjustments,
  GroupAdjustment,
  ColorGroupId,
} from "../types";

describe("svgGenerator", () => {
  describe("generateSvg", () => {
    it("generates SVG with single pixel", () => {
      const colors: (PixelColor | null)[][] = [
        [{ r: 255, g: 0, b: 0, a: 255 }],
      ];
      const config: GridConfig = {
        gridSize: 10,
        offsetX: 0,
        offsetY: 0,
        sampleMode: "center",
      };
      const ignoredPixels = new Set<string>();

      const svg = generateSvg(colors, config, 10, 10, ignoredPixels);

      // viewBox is in grid cell units (1x1 for one pixel)
      expect(svg).toContain('viewBox="0 0 1 1"');
      // width/height is scaled by gridSize
      expect(svg).toContain('width="10"');
      expect(svg).toContain('height="10"');
      expect(svg).toContain('fill="#ff0000"');
    });

    it("merges adjacent same-color pixels in a row", () => {
      const red: PixelColor = { r: 255, g: 0, b: 0, a: 255 };
      const colors: (PixelColor | null)[][] = [[red, red, red]];
      const config: GridConfig = {
        gridSize: 10,
        offsetX: 0,
        offsetY: 0,
        sampleMode: "center",
      };
      const ignoredPixels = new Set<string>();

      const svg = generateSvg(colors, config, 30, 10, ignoredPixels);

      // Should have only one rect with width=30
      const rectMatches = svg.match(/<rect/g);
      expect(rectMatches).toHaveLength(1);
      expect(svg).toContain('width="30"');
    });

    it("creates separate rects for different colors", () => {
      const red: PixelColor = { r: 255, g: 0, b: 0, a: 255 };
      const green: PixelColor = { r: 0, g: 255, b: 0, a: 255 };
      const colors: (PixelColor | null)[][] = [[red, green, red]];
      const config: GridConfig = {
        gridSize: 10,
        offsetX: 0,
        offsetY: 0,
        sampleMode: "center",
      };
      const ignoredPixels = new Set<string>();

      const svg = generateSvg(colors, config, 30, 10, ignoredPixels);

      // Should have three rects
      const rectMatches = svg.match(/<rect/g);
      expect(rectMatches).toHaveLength(3);
    });

    it("skips ignored pixels", () => {
      const red: PixelColor = { r: 255, g: 0, b: 0, a: 255 };
      const colors: (PixelColor | null)[][] = [[red, red, red]];
      const config: GridConfig = {
        gridSize: 10,
        offsetX: 0,
        offsetY: 0,
        sampleMode: "center",
      };
      const ignoredPixels = new Set<string>(["1-0"]); // Ignore middle pixel

      const svg = generateSvg(colors, config, 30, 10, ignoredPixels);

      // Should have two rects (first and last)
      const rectMatches = svg.match(/<rect/g);
      expect(rectMatches).toHaveLength(2);
    });

    it("skips originally transparent pixels (alpha = 0)", () => {
      const red: PixelColor = { r: 255, g: 0, b: 0, a: 255 };
      const transparent: PixelColor = { r: 255, g: 0, b: 0, a: 0 }; // Same color but transparent
      const colors: (PixelColor | null)[][] = [[red, transparent, red]];
      const config: GridConfig = {
        gridSize: 10,
        offsetX: 0,
        offsetY: 0,
        sampleMode: "center",
      };
      const ignoredPixels = new Set<string>();

      const svg = generateSvg(colors, config, 30, 10, ignoredPixels);

      // Should have two rects (first and last), middle is transparent
      const rectMatches = svg.match(/<rect/g);
      expect(rectMatches).toHaveLength(2);
    });

    it("handles mixed ignored and transparent pixels", () => {
      const red: PixelColor = { r: 255, g: 0, b: 0, a: 255 };
      const transparent: PixelColor = { r: 0, g: 0, b: 0, a: 0 };
      // Row with: opaque, transparent, opaque, ignored, opaque
      const colors: (PixelColor | null)[][] = [
        [red, transparent, red, red, red],
      ];
      const config: GridConfig = {
        gridSize: 10,
        offsetX: 0,
        offsetY: 0,
        sampleMode: "center",
      };
      const ignoredPixels = new Set<string>(["3-0"]); // Ignore 4th pixel

      const svg = generateSvg(colors, config, 50, 10, ignoredPixels);

      // Should have three rects: pixel 0, pixel 2, pixel 4
      const rectMatches = svg.match(/<rect/g);
      expect(rectMatches).toHaveLength(3);
    });

    it("handles empty grid", () => {
      const colors: (PixelColor | null)[][] = [];
      const config: GridConfig = {
        gridSize: 10,
        offsetX: 0,
        offsetY: 0,
        sampleMode: "center",
      };
      const ignoredPixels = new Set<string>();

      const svg = generateSvg(colors, config, 10, 10, ignoredPixels);

      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
      expect(svg).not.toContain("<rect");
    });

    it("applies offset correctly in dimensions", () => {
      const red: PixelColor = { r: 255, g: 0, b: 0, a: 255 };
      const colors: (PixelColor | null)[][] = [[red]];
      const config: GridConfig = {
        gridSize: 10,
        offsetX: 5,
        offsetY: 3,
        sampleMode: "center",
      };
      const ignoredPixels = new Set<string>();

      const svg = generateSvg(colors, config, 15, 13, ignoredPixels);

      // SVG rects are in grid cell coordinates (0-based), offset doesn't affect rect positions
      // The rect starts at (0,0) in grid cell units
      expect(svg).toContain('x="0"');
      expect(svg).toContain('y="0"');
      expect(svg).toContain('viewBox="0 0 1 1"');
    });

    it("applies group adjustments (hue shift)", () => {
      const red: PixelColor = { r: 255, g: 0, b: 0, a: 255 };
      const colors: (PixelColor | null)[][] = [[red, red, red]];
      const config: GridConfig = {
        gridSize: 10,
        offsetX: 0,
        offsetY: 0,
        sampleMode: "center",
      };
      const ignoredPixels = new Set<string>();
      // Shift reds by 120 degrees (toward green)
      const groupAdjustments: GroupAdjustments = new Map<
        ColorGroupId,
        GroupAdjustment
      >([["reds", { hueShift: 120, saturationScale: 1, lightnessScale: 1 }]]);

      const svg = generateSvg(
        colors,
        config,
        30,
        10,
        ignoredPixels,
        null,
        groupAdjustments
      );

      // Red shifted by 120° should become green-ish
      expect(svg).not.toContain('fill="#ff0000"');
      expect(svg).toContain('fill="#00ff00"');
    });

    it("group adjustments only affect colors in that group", () => {
      const red: PixelColor = { r: 255, g: 0, b: 0, a: 255 };
      const blue: PixelColor = { r: 0, g: 0, b: 255, a: 255 };
      const colors: (PixelColor | null)[][] = [[red, blue, red]];
      const config: GridConfig = {
        gridSize: 10,
        offsetX: 0,
        offsetY: 0,
        sampleMode: "center",
      };
      const ignoredPixels = new Set<string>();
      // Only adjust reds
      const groupAdjustments: GroupAdjustments = new Map<
        ColorGroupId,
        GroupAdjustment
      >([["reds", { hueShift: 120, saturationScale: 1, lightnessScale: 1 }]]);

      const svg = generateSvg(
        colors,
        config,
        30,
        10,
        ignoredPixels,
        null,
        groupAdjustments
      );

      // Red shifted to green, blue unchanged
      expect(svg).not.toContain('fill="#ff0000"');
      expect(svg).toContain('fill="#00ff00"');
      expect(svg).toContain('fill="#0000ff"');
    });

    it("applies saturation adjustments", () => {
      const red: PixelColor = { r: 255, g: 0, b: 0, a: 255 };
      const colors: (PixelColor | null)[][] = [[red]];
      const config: GridConfig = {
        gridSize: 10,
        offsetX: 0,
        offsetY: 0,
        sampleMode: "center",
      };
      const ignoredPixels = new Set<string>();
      // Desaturate reds (saturation scale 0.5)
      const groupAdjustments: GroupAdjustments = new Map<
        ColorGroupId,
        GroupAdjustment
      >([["reds", { hueShift: 0, saturationScale: 0.5, lightnessScale: 1 }]]);

      const svg = generateSvg(
        colors,
        config,
        10,
        10,
        ignoredPixels,
        null,
        groupAdjustments
      );

      // Should still be red-ish but less saturated
      expect(svg).not.toContain('fill="#ff0000"');
      // Half saturation means some gray mixed in
      expect(svg).toMatch(/fill="#[a-f0-9]{6}"/i);
    });
  });
});
