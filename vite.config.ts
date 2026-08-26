import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // Keep manifest/icons available, but do not leave a controlling SW in
        // production until offline caching is intentionally QA'd. A stale SW
        // causes dynamic import failures (ERR_NAME_NOT_RESOLVED / module fetch).
        selfDestroying: true,
        registerType: "prompt",
        injectRegister: false,
        includeAssets: ["favicon.svg", "icon.svg", "maskable-icon.svg"],
        manifest: {
          name: "Skuggle — School Operating and Learning Intelligence",
          short_name: "Skuggle",
          description:
            "A secure, role-aware school operating and learning intelligence platform.",
          theme_color: "#4F46E5",
          background_color: "#FAFBFD",
          display: "standalone",
          orientation: "any",
          start_url: "/",
          scope: "/",
          categories: ["education", "productivity"],
          icons: [
            {
              src: "/icon.svg",
              sizes: "any",
              type: "image/svg+xml",
              purpose: "any",
            },
            {
              src: "/maskable-icon.svg",
              sizes: "any",
              type: "image/svg+xml",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api\//],
          globPatterns: ["**/*.{js,css,html,svg,webp,avif,woff2}"],
        },
        devOptions: { enabled: false },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== "true",
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
  };
});
