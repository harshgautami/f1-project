import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Served from "/" locally and on Vercel. For GitHub Pages project sites the
  // CI sets VITE_BASE to "/<repo>/" so asset URLs resolve under the subpath.
  base: process.env.VITE_BASE || "/",
  // Pre-bundle the heavy deps up front (no mid-session "optimizing…" reloads)
  // and transform the page modules at startup so first navigation is instant.
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "axios", "framer-motion", "recharts", "ogl"],
  },
  server: {
    warmup: {
      clientFiles: ["./src/pages/**/*.jsx", "./src/components/**/*.jsx"],
    },
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
  // `npm run preview` serves the production build with the same API proxy, so
  // the real (non-dev) speed can be felt locally.
  preview: {
    port: 4173,
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
