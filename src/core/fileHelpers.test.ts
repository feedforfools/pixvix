import { describe, it, expect } from "vitest";
import { isValidImageFile } from "./fileHelpers";

// Mock File for Node.js environment
function createMockFile(name: string, type: string): File {
  const blob = new Blob([""], { type });
  return new File([blob], name, { type });
}

describe("fileHelpers", () => {
  describe("isValidImageFile", () => {
    it("accepts PNG files", () => {
      const file = createMockFile("test.png", "image/png");
      expect(isValidImageFile(file)).toBe(true);
    });

    it("accepts JPEG files", () => {
      const file = createMockFile("test.jpg", "image/jpeg");
      expect(isValidImageFile(file)).toBe(true);
    });

    it("accepts GIF files", () => {
      const file = createMockFile("test.gif", "image/gif");
      expect(isValidImageFile(file)).toBe(true);
    });

    it("accepts WebP files", () => {
      const file = createMockFile("test.webp", "image/webp");
      expect(isValidImageFile(file)).toBe(true);
    });

    it("accepts BMP files", () => {
      const file = createMockFile("test.bmp", "image/bmp");
      expect(isValidImageFile(file)).toBe(true);
    });

    it("accepts SVG files", () => {
      const file = createMockFile("test.svg", "image/svg+xml");
      expect(isValidImageFile(file)).toBe(true);
    });

    it("rejects text files", () => {
      const file = createMockFile("test.txt", "text/plain");
      expect(isValidImageFile(file)).toBe(false);
    });

    it("rejects PDF files", () => {
      const file = createMockFile("test.pdf", "application/pdf");
      expect(isValidImageFile(file)).toBe(false);
    });

    it("rejects JSON files", () => {
      const file = createMockFile("test.json", "application/json");
      expect(isValidImageFile(file)).toBe(false);
    });

    it("rejects files with empty type", () => {
      const file = createMockFile("test", "");
      expect(isValidImageFile(file)).toBe(false);
    });

    it("rejects video files", () => {
      const file = createMockFile("test.mp4", "video/mp4");
      expect(isValidImageFile(file)).toBe(false);
    });
  });
});
