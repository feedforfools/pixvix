import { describe, it, expect } from "vitest";
import { generateSvg } from "./svgGenerator";
import type { PixelColor, GridConfig } from "../types";

describe("svgGenerator", () => {
  describe("generateSvg", () => {
    it("generates SVG with single pixel", () => {
      const colors: (PixelColor | null)[][] = [
        [{ r: 255, g: 0, b: 0, a: 255 }],
      ];
      const config: GridConfig = { gridSize: 10, offsetX: 0, offsetY: 0 };
      const ignoredPixels = new Set<string>();

      const svg = generateSvg(colors, config, 10, 10, ignoredPixels);

      expect(svg).toContain('viewBox="0 0 10 10"');
      expect(svg).toContain('width="10"');
      expect(svg).toContain('height="10"');
      expect(svg).toContain('fill="#ff0000"');
    });

    it("merges adjacent same-color pixels in a row", () => {
      const red: PixelColor = { r: 255, g: 0, b: 0, a: 255 };
      const colors: (PixelColor | null)[][] = [[red, red, red]];
      const config: GridConfig = { gridSize: 10, offsetX: 0, offsetY: 0 };
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
      const config: GridConfig = { gridSize: 10, offsetX: 0, offsetY: 0 };
      const ignoredPixels = new Set<string>();

      const svg = generateSvg(colors, config, 30, 10, ignoredPixels);

      // Should have three rects
      const rectMatches = svg.match(/<rect/g);
      expect(rectMatches).toHaveLength(3);
    });

    it("skips ignored pixels", () => {
      const red: PixelColor = { r: 255, g: 0, b: 0, a: 255 };
      const colors: (PixelColor | null)[][] = [[red, red, red]];
      const config: GridConfig = { gridSize: 10, offsetX: 0, offsetY: 0 };
      const ignoredPixels = new Set<string>(["1-0"]); // Ignore middle pixel

      const svg = generateSvg(colors, config, 30, 10, ignoredPixels);

      // Should have two rects (first and last)
      const rectMatches = svg.match(/<rect/g);
      expect(rectMatches).toHaveLength(2);
    });

    it("handles empty grid", () => {
      const colors: (PixelColor | null)[][] = [];
      const config: GridConfig = { gridSize: 10, offsetX: 0, offsetY: 0 };
      const ignoredPixels = new Set<string>();

      const svg = generateSvg(colors, config, 10, 10, ignoredPixels);

      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
      expect(svg).not.toContain("<rect");
    });

    it("applies offset correctly", () => {
      const red: PixelColor = { r: 255, g: 0, b: 0, a: 255 };
      const colors: (PixelColor | null)[][] = [[red]];
      const config: GridConfig = { gridSize: 10, offsetX: 5, offsetY: 3 };
      const ignoredPixels = new Set<string>();

      const svg = generateSvg(colors, config, 15, 13, ignoredPixels);

      expect(svg).toContain('x="5"');
      expect(svg).toContain('y="3"');
    });
  });
});
