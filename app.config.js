// app.config.js
module.exports = ({ config }) => {
  return {
    ...config,
    "expo": {
      "name": "where2throw",
      "slug": "where2throw",
      "extra": {
        NCP_MAP_API_KEY: process.env.NCP_MAP_API_KEY,
        "router": {
          "origin": false
        },
        "eas": {
          "projectId": "b88499c3-8c36-449a-a4d8-f658173e3330"
        }
      },
      "version": "1.0.0",
      "orientation": "portrait",
      "icon": "./assets/images/icon.png",
      "scheme": "myapp",
      "userInterfaceStyle": "automatic",
      "newArchEnabled": true,
      "assetBundlePatterns": ["**/*", "assets/models/*.onnx"],

      "ios": {
        "supportsTablet": true,
        "infoPlist": {
          "NSCameraUsageDescription": "$(PRODUCT_NAME) needs access to your Camera.",
          "NSMicrophoneUsageDescription": "$(PRODUCT_NAME) needs access to your Microphone.",
          "NSLocalNetworkUsageDescription": "This app requires access to the local network to connect to the development server.",
          "NSBonjourServices": ["_http._tcp"] // 이건 Bonjour 탐색용
        },
        "bundleIdentifier": "com.where2throw.where2throwapp",
        "appleTeamId": "JFM39N7Z6U"
      },
      "android": {
        "adaptiveIcon": {
          "foregroundImage": "./assets/images/adaptive-icon.png",
          "backgroundColor": "#ffffff"
        },
        "permissions": [
          "android.permission.CAMERA",
          "android.permission.RECORD_AUDIO"
        ],
        "package": "com.where2throw.where2throwapp",
        "config": {
        }
      },
      "web": {
        "bundler": "metro",
        "output": "static",
        "favicon": "./assets/images/favicon.png"
      },
      "plugins": [
        "expo-router",
        [
          "expo-splash-screen",
          {
            "image": "./assets/images/splash-icon.png",
            "imageWidth": 200,
            "resizeMode": "contain",
            "backgroundColor": "#ffffff"
          }
        ],
        [
          "react-native-vision-camera",
          {
            "cameraPermissionText": "$(PRODUCT_NAME) needs access to your Camera.",
            "enableMicrophonePermission": true,
            "microphonePermissionText": "$(PRODUCT_NAME) needs access to your Microphone.",
          }
        ],
        [
          "expo-build-properties",
          {
            "android": {
              "minSdkVersion": 26,
              "extraMavenRepos": [
                "https://repository.map.naver.com/archive/maven"
              ]
            }
          }
        ],
        [
          "expo-image-picker",
          {
            "photosPermission": "The app accesses your photos to let you share them with your friends."
          }
        ],
        [
          "@mj-studio/react-native-naver-map",
          {
            "client_id": process.env.NCP_MAP_API_KEY,
            // (optional, you can set with expo-location instead of this package)
            "android": {
              "ACCESS_FINE_LOCATION": true,
              "ACCESS_COARSE_LOCATION": true,
              "ACCESS_BACKGROUND_LOCATION": true
            },
            // (optional, you can set with expo-location instead of this package)
            "ios": {
              "NSLocationAlwaysAndWhenInUseUsageDescription": "{{ your location usage description }}",
              "NSLocationWhenInUseUsageDescription": "{{ your location usage description }}",
              "NSLocationTemporaryUsageDescriptionDictionary": {
                "purposeKey": "{{ your purpose key }}",
                "usageDescription": "{{ your location usage description }}"
              }
            }
          }
        ],
      ],
      "experiments": {
        "typedRoutes": true
      },
    }
  }
}