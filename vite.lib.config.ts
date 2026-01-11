import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import dts from "vite-plugin-dts";
import path from "path";

/**
 * Vite configuration for building pixvix as a library.
 * This produces ES modules and type declarations for use as a package.
 */
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
    dts({
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx", "src/main.tsx"],
      outDir: "dist/lib",
      rollupTypes: true,
      tsconfigPath: "./tsconfig.lib.json",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist/lib",
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "Pixvix",
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      // Externalize peer dependencies - they won't be bundled
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        // Preserve module structure for tree-shaking
        preserveModules: false,
        // Name the CSS file consistently
        assetFileNames: (assetInfo) => {
          if (
            assetInfo.name === "style.css" ||
            assetInfo.name?.endsWith(".css")
          ) {
            return "style.css";
          }
          return assetInfo.name || "assets/[name][extname]";
        },
        // Global vars for UMD build (not used with ES modules)
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
        },
      },
    },
    // Generate source maps for debugging
    sourcemap: true,
    // Don't minify - let consumers handle that
    minify: false,
    // CSS will be extracted to a single file
    cssCodeSplit: false,
  },
});
