import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/backend": {
        target: "http://localhost/LK_Agro_Market",   // XAMPP Apache port 80
        changeOrigin: true,
        secure: false,
      },
    },
  },
});