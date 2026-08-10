import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      "/backend": {
        target: "http://localhost",
        // target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => "/LK_Agro_Market" + path,
        // rewrite: (path) => path.replace(/^\/backend/, ""),
      },
    },
  },
});