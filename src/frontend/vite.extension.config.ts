/**
 * Extension-specific Vite build config.
 * Builds content.ts and background.ts as IIFE bundles for Chrome MV3.
 * Run via: BUILD_TARGET=extension pnpm vite build --config vite.extension.config.ts
 */

import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  logLevel: "error",
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: false,
    minify: false,
    rollupOptions: {
      input: {
        content: fileURLToPath(new URL("src/extension/content.ts", import.meta.url)),
        background: fileURLToPath(new URL("src/extension/background.ts", import.meta.url)),
      },
      output: {
        // Chrome content scripts and service workers must be IIFE — no dynamic imports
        format: "iife",
        entryFileNames: "[name].js",
        chunkFileNames: "[name]-[hash].js",
        assetFileNames: "[name][extname]",
        // Disable code splitting so every script is fully self-contained
        inlineDynamicImports: false,
        manualChunks: undefined,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
  },
  define: {
    global: "globalThis",
  },
});
