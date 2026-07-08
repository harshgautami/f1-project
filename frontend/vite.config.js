import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Served from "/" locally and on Vercel. For GitHub Pages project sites the
  // CI sets VITE_BASE to "/<repo>/" so asset URLs resolve under the subpath.
  base: process.env.VITE_BASE || "/",
  server: {
    port: 3000,
    // Proxy API calls to the backend in dev so the browser talks to a single
    // origin (no CORS needed locally). Production points VITE_API_URL at the
    // deployed backend instead.
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        // Split big vendors into separately-cacheable chunks.
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          charts: ["recharts"],
          motion: ["framer-motion"],
        },
      },
    },
  },
});
