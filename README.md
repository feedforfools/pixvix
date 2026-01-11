# pixvix

A browser-based pixel art to SVG converter. No server uploads—everything runs locally in your browser.

## 📦 Use as a Library

Pixvix can be used as a standalone app or embedded in another project as a package.

```bash
# Install from GitHub
npm install github:feedforfools/pixvix
```

```tsx
import { Layout } from 'pixvix';
import 'pixvix/styles';

function App() {
  return <Layout />;
}
```

The UI is fully themeable via CSS variables.

## 🚀 Quick Start

### Run Locally
```bash
git clone https://github.com/feedforfools/pixvix.git
cd pixvix
npm install
npm run dev
```

## 📖 Usage

1. **Upload** — Drop or select a pixel art image (PNG recommended)
2. **Crop** *(optional)* — Select a region to process
3. **Grid** — Adjust grid size, offset, and sampling method
4. **Refine** — Mark pixels as transparent, adjust output bounds, edit colors
5. **Export** — Download the generated SVG or PNG

## 🛠 Development

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at localhost:5173
npm run build        # Production build (GitHub Pages)
npm run build:lib    # Build as library package
npm run lint         # ESLint check
npm test             # Run tests once
npm run test:watch   # Run tests in watch mode
```

### Project Structure

```
src/
  index.ts       # Library entry point (exports for package usage)
  components/    # React UI components
    ui/          # shadcn primitives (don't modify)
  core/          # Pure functions — NO React, NO side effects
    gridSampler.ts       # Grid math and pixel sampling
    svgGenerator.ts      # SVG/PNG generation with row-merge optimization
    colorGroups.ts       # Color grouping and HSL adjustments
    fileHelpers.ts       # File reading utilities
  hooks/         # React hooks for state management
  types/         # TypeScript interfaces
```

### Testing

Tests are written with [Vitest](https://vitest.dev/) and focus on the core algorithms:

- **Grid sampling** — Cell center calculation, grid dimensions, pixel color extraction, average color sampling, palette extraction
- **SVG generation** — Row merging, transparency handling, output frame bounds, color replacements
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
