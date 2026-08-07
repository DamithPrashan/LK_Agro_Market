import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    watch: {
      ignored: ["**/frontend/assets/**"],
    },

    proxy: {
      "/backend": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
        // Remove "/backend" before forwarding to PHP server
        rewrite: (path) => path.replace(/^\/backend/, ""),
      },
    },
  },
});