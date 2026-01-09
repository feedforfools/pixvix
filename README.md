# pixvix

A browser-based pixel art to SVG converter. No server uploads—everything runs locally in your browser.

## 🚀 Quick Start

### Run Locally
```bash
git clone https://github.com/YOUR_USERNAME/pixvix.git
cd pixvix
npm install
npm run dev
```

## 📖 Usage

1. **Upload** — Drop or select a pixel art image (PNG recommended)
2. **Crop** *(optional)* — Select a region to process
3. **Grid** — Adjust grid size and offset to align with pixel boundaries
4. **Refine** — Click pixels to mark as transparent, set output bounds
5. **Export** — Download the generated SVG or PNG

## 🛠 Development

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at localhost:5173
npm run build        # Production build
npm run lint         # ESLint check
npm test             # Run tests once
npm run test:watch   # Run tests in watch mode
```

### Project Structure

```
src/
  components/    # React UI components
    ui/          # shadcn primitives (don't modify)
  core/          # Pure functions — NO React, NO side effects
    gridSampler.ts       # Grid math and pixel sampling
    gridSampler.test.ts  # Tests for grid sampling
    svgGenerator.ts      # SVG/PNG generation with row-merge optimization
    svgGenerator.test.ts # Tests for SVG generation
    fileHelpers.ts       # File reading utilities
    fileHelpers.test.ts  # Tests for file helpers
  hooks/         # React hooks for state management
  types/         # TypeScript interfaces
```

### Testing

Tests are written with [Vitest](https://vitest.dev/) and focus on the core algorithms:

- **Grid sampling** — Cell center calculation, grid dimensions, pixel color extraction
- **SVG generation** — Row merging, transparency handling, output frame bounds
- **File helpers** — Image file validation

Tests run automatically before deployment via GitHub Actions. Any test failure will block the deploy.

```bash
npm test             # Run all tests
npm run test:watch   # Watch mode for development
```

## 🏗 Tech Stack

- **React 19** + TypeScript + Vite
- **shadcn/ui** (Radix Primitives + Tailwind CSS)
- **HTML5 Canvas API** for image processing
- **Vitest** for testing
- **GitHub Pages** for deployment

## 📐 Architecture

### Dual Canvas Pattern

Two canvas refs in `PixelCanvas.tsx`:
- `sourceCanvasRef` (hidden) — Original image at native resolution for `getImageData()` reads
- `displayCanvasRef` (visible) — User-facing canvas with CSS `image-rendering: pixelated`

### SVG Row Merging

Adjacent same-color pixels are merged into single `<rect>` elements to minimize file size:

```
[red][red][red][blue][blue] → <rect width="3" fill="red"/> <rect width="2" fill="blue"/>
```
