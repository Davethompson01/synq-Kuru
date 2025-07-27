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
    target: "es2020",
  },
  optimizeDeps: {
    include: ['@base-org/account'],
    esbuildOptions: {
      target: 'es2022',
    },
  },
  define: {
    'process.env': {},
  },
}));
