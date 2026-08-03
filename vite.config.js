// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig({
//   plugins: [react()],
//   optimizeDeps: {
//     include: ["react-is"],
//   },
//   server: {
//     watch: {
//       ignored: ["**/frontend/assests/**"],
//     },
//     proxy: {
//       "/backend": {
//         //target: "http://localhost:8000",
//         target: "http://127.0.0.1:80",   // XAMPP Apache port 80
//         changeOrigin: true,
//         secure: false,
//         rewrite: (path) => "/LK_Agro_Market" + path, // project lives in htdocs/LK_Agro_Market
//       },
//     },
//   },
// });
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["react-is"],
  },
  server: {
    watch: {
      ignored: ["**/frontend/assests/**"],
    },
    proxy: {
      "/backend": {
        // target: "http://localhost:8000",
        target: "http://127.0.0.1:80",   // XAMPP Apache port 80
        changeOrigin: true,
        secure: false,
        rewrite: (path) => "/lk_agro/LK_Agro_Market" + path, // project lives in htdocs/lk_agro/LK_Agro_Market
      },
    },
  },
});