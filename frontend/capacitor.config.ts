import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.leanhostzone.nutritrack",
  appName: "NutriTrack",
  webDir: "dist",
  ios: {
    contentInset: "automatic",
  },
  server: {
    // Allow the app to reach the live backend when running on device
    allowNavigation: ["www.leanhostzone.com"],
  },
};

export default config;
