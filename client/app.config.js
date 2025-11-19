import 'dotenv/config'

export default {
  expo: {
    name: process.env.APP_NAME || "NeuroMed",
    slug: "neuromed",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/images/light-mode-icon.png",
    scheme: "neuromed",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    description: "A wellness and health insights app powered by NeuroMed.",
    owner: "hospital-ai",
    runtimeVersion: {
      policy: "appVersion" // recommended for OTA updates
    },

    updates: {
      url: "https://u.expo.dev/5d6ec21d-85ab-4479-b217-11b455ee7df0"
    },

    extra: {
      WEATHER_API_KEY: process.env.WEATHER_API_KEY,
      CITY: process.env.CITY || "Lagos",
      GOAL: process.env.GOAL ? parseFloat(process.env.GOAL) : 2.5,
      Google_Api: process.env.Google_Api,
      eas: {
        projectId: "5d6ec21d-85ab-4479-b217-11b455ee7df0"
      }
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.neuromed.app",
      buildNumber: "3", // ✅ Added (increment per release)
      icon: "./assets/images/icon.png",
      config: {
        usesNonExemptEncryption: false
      },
      infoPlist: {
        NSHealthShareUsageDescription:
          "NeuroMed uses your Health data to show daily step counts and wellness insights.",
        NSHealthUpdateUsageDescription:
          "NeuroMed writes your health data to personalize your experience."
      }
    },

    android: {
      package: "com.neuromed.app",
      versionCode: 3, // ✅ Added (increment per release)
      adaptiveIcon: {
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundColor: "#ffffff",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        "android.permission.ACTIVITY_RECOGNITION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.BODY_SENSORS"
      ],
      config: {
        googleMaps: {
          apiKey: process.env.Google_Api
        }
      }
    },

    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
      meta: {
        themeColor: "#ffffff",
        description: "Track your wellness and health metrics with NeuroMed."
      }
    },

    plugins: [
      [
        "expo-font",
        {
          fonts: [
            "./assets/fonts/Roboto-Regular.ttf",
            "./assets/fonts/Roboto-Medium.ttf",
            "./assets/fonts/Roboto-Bold.ttf",
            "./assets/fonts/Roboto-Light.ttf"
          ]
        }
      ],
      [
        "expo-secure-store",
        {
          configureAndroidBackup: true,
          faceIDPermission:
            "Allow NeuroMed to access your Face ID biometric data."
        }
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/light-mode-icon.png",
          imageWidth: 220,
          resizeMode: "contain",
          backgroundColor: "#E6F4FE",
          dark: {
            backgroundColor: "#0A1D37",
            image: "./assets/images/dark-mode-icon.png"
          }
        }
      ],
      "expo-router",
      "expo-web-browser",
      [
        "react-native-google-fit",
        {
          scopes: [
            "https://www.googleapis.com/auth/fitness.activity.read",
            "https://www.googleapis.com/auth/fitness.location.read"
          ]
        }
      ]
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },

    assetBundlePatterns: ["**/*"],

    doctor: {
      reactNativeDirectoryCheck: {
        exclude: [
          "react-native-google-fit",
          "react-native-network-info",
          "react-native-health"
        ]
      }
    }
  }
};
