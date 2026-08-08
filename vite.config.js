import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["react-is"],
  },
  server: {
    watch: {
      ignored: ["**/frontend/assets/**", "**/frontend/assests/**"],
    },
    proxy: {
      "/backend": {
        // Option 1: XAMPP Apache (default for this workspace setup)
        target: "http://127.0.0.1:80",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => "/LK_Agro_Market" + path,

        // Option 2: PHP Built-in Server (uncomment if running `php -S localhost:8000` inside backend/)
        // target: "http://localhost:8000",
        // changeOrigin: true,
        // secure: false,
        // rewrite: (path) => path.replace(/^\/backend/, ""),
      },
    },
  },
});