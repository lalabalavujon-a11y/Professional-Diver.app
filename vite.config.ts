import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Replit plugins removed — web-only build.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  server: {
    host: true,
    strictPort: true,
    proxy: {
      // Express routes are prefixed with /api
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  optimizeDeps: {
    include: ["pdfjs-dist"],
  },
});
