import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/backend": {
        target: "http://127.0.0.1:80",   // XAMPP Apache port 80
        changeOrigin: true,
        secure: false,
        rewrite: (path) => "/LK_Agro_Market" + path, // project lives in htdocs/LK_Agro_Market
      },
    },
  },
});