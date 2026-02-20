// capacitor.config.ts
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.voyonx.app",
  appName: "Voyonx",
  webDir: "client/dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
  },
};

export default config;
