import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Plumb keeps all user data in localStorage, so it ships as a static SPA: `vite build`
// prerenders one shell to dist/client/index.html, and the host serves that shell for any
// path that isn't a file (Workers Static Assets, not_found_handling: single-page-application).
export default defineConfig({
  server: { host: "0.0.0.0", port: 8080, strictPort: true },
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart({
      spa: { enabled: true, prerender: { outputPath: "/index.html" } },
    }),
    viteReact(),
  ],
});
