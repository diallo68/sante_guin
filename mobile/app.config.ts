import type { ExpoConfig } from "expo/config";

const bundleId = "org.mondocteur.mobile";
const schemeFromBundleId = "mondocteur";

const env = {
  appName: "MonDocteur",
  appSlug: "mondocteur-mobile",
  logoUrl: "",
  scheme: schemeFromBundleId,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    permissions: ["POST_NOTIFICATIONS"],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    ["expo-audio", { microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone." }],
    ["expo-video", { supportsBackgroundPlayback: true, supportsPictureInPicture: true }],
    ["expo-splash-screen", { image: "./assets/images/splash-icon.png", imageWidth: 200, resizeMode: "contain", backgroundColor: "#ffffff" }],
    ["expo-build-properties", { android: { buildArchs: ["armeabi-v7a", "arm64-v8a"] } }],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: "032dab67-c25e-4917-852f-5f0edf973496",
    },
  },
};

export default config;
