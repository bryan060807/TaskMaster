import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [reactRouter(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3100,
    allowedHosts: ["windows.local", "taskmaster.aibry.shop", "localhost"],
    proxy: {
      "/api/auth": {
        target: "http://windows.local:3101",
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/api\/auth/, "/auth"),
      },
      "/api": {
        target: "http://windows.local:3101",
        changeOrigin: true,
      },
    },
  },
});