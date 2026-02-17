import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// Replit plugins (оставим только для dev)
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(async ({ mode }) => {
  const plugins: any[] = [react()];

  // ✅ Эти плагины нужны только в dev (на Vercel production они не нужны)
  if (mode !== "production") {
    plugins.push(runtimeErrorOverlay());

    if (process.env.REPL_ID) {
      const cartographerMod = await import("@replit/vite-plugin-cartographer");
      const devBannerMod = await import("@replit/vite-plugin-dev-banner");
      plugins.push(cartographerMod.cartographer());
      plugins.push(devBannerMod.devBanner());
    }
  }

  return {
    plugins,

    // ✅ Vercel Root Directory = client, значит src лежит тут: client/src
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@shared": path.resolve(__dirname, "../shared"),
        "@assets": path.resolve(__dirname, "../attached_assets"),
      },
    },

    // ✅ ВАЖНО: не задаём root/build как в Replit.
    // Root Directory на Vercel уже "client"
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});
