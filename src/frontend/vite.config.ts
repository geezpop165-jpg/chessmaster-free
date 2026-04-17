import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type UserConfig } from "vite";
import environment from "vite-plugin-environment";
import { resolve } from "node:path";

const ii_url =
  process.env.DFX_NETWORK === "local"
    ? "http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:8081/"
    : "https://identity.internetcomputer.org/";

process.env.II_URL = process.env.II_URL || ii_url;
process.env.STORAGE_GATEWAY_URL =
  process.env.STORAGE_GATEWAY_URL || "https://blob.caffeine.ai";

const sharedPlugins = [
  environment("all", { prefix: "CANISTER_" }),
  environment("all", { prefix: "DFX_" }),
  environment(["II_URL"]),
  environment(["STORAGE_GATEWAY_URL"]),
  react(),
];

const sharedResolve = {
  alias: [
    {
      find: "declarations",
      replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
    },
    {
      find: "@",
      replacement: fileURLToPath(new URL("./src", import.meta.url)),
    },
  ],
  dedupe: ["@dfinity/agent"],
};

// Determine which build to run
// BUILD_TARGET=extension builds the extension files only
// Default builds the main SPA
const buildTarget = process.env.BUILD_TARGET;

const mainConfig: UserConfig = {
  logLevel: "error",
  build: {
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
  css: {
    postcss: "./postcss.config.js",
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
  },
  plugins: sharedPlugins,
  resolve: sharedResolve,
};

// Extension build config — outputs content.js, background.js, and popup.html
// as self-contained IIFE bundles suitable for Chrome extension packaging
const extensionConfig: UserConfig = {
  logLevel: "error",
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: false,
    minify: false,
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/extension/content.ts"),
        background: resolve(__dirname, "src/extension/background.ts"),
        popup: resolve(__dirname, "src/extension/popup/index.html"),
      },
      output: {
        // Content and background scripts must be IIFE — no dynamic imports
        format: "iife",
        entryFileNames: (chunk) => {
          if (chunk.name === "popup") return "popup.js";
          return `${chunk.name}.js`;
        },
        chunkFileNames: "[name]-[hash].js",
        assetFileNames: "[name][extname]",
        // Prevent code-splitting for extension scripts
        manualChunks: undefined,
        inlineDynamicImports: false,
      },
    },
  },
  css: {
    postcss: "./postcss.config.js",
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  plugins: sharedPlugins,
  resolve: sharedResolve,
};

export default defineConfig(buildTarget === "extension" ? extensionConfig : mainConfig);
