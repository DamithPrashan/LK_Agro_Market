import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/backend": {
        target: "http://127.0.0.1:8000",   // XAMPP Apache port 80
        changeOrigin: true,
        secure: false,
      },
    },
  },
});