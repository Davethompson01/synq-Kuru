import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2015",
    rollupOptions: {
      external: [],
    },
    commonjsOptions: {
      include: [],
    },
    minify: 'esbuild',
  },
  optimizeDeps: {
    exclude: ["@rollup/rollup-linux-x64-gnu"],
  },
  define: {
    global: 'globalThis',
  },
  esbuild: {
    target: 'es2015',
  },
}));
