import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

// Strict Content-Security-Policy for the packaged UI. Added only to production
// builds because the dev server's hot reload needs inline scripts.
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-src 'none'";
const productionCsp = () => ({
  name: "synapse-production-csp",
  apply: "build",
  transformIndexHtml: (html) =>
    html.replace("<head>", `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`)
});

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { background: resolve("src/main/background.js") },
        output: { format: "cjs", entryFileNames: "[name].cjs" }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { preload: resolve("src/preload/preload.js") },
        output: { format: "cjs", entryFileNames: "[name].cjs" }
      }
    }
  },
  renderer: {
    root: "src/renderer",
    plugins: [react(), productionCsp()],
    build: {
      rollupOptions: { input: { index: resolve("src/renderer/index.html") } }
    }
  }
});
