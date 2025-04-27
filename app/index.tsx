import { runOnJS } from "react-native-reanimated";

import { Asset } from "expo-asset";

import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import {
  Camera,
  Frame,
  runAtTargetFps,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
  useFrameProcessor,
  VisionCameraProxy,
} from "react-native-vision-camera";

import { InferenceSession, Tensor } from "onnxruntime-react-native";
import { useSharedValue, Worklets } from "react-native-worklets-core";

const plugin = VisionCameraProxy.initFrameProcessorPlugin(
  "runWasteClassifier",
  {}
);

export default function Index() {
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();

  const result = useSharedValue<number | null>(null);

  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    runAtTargetFps(5, () => {
      "worklet";
      if (frame.isValid) {
        const output = plugin?.call(frame);
        result.value = output as number;
      }
    });
  }, []);

  const classNames = [
    "cardboard",
    "glass",
    "metal",
    "paper",
    "plastic",
    "trash",
  ];

  const codeScanner = useCodeScanner({
    codeTypes: ["ean-13", "ean-8"],
    onCodeScanned: (codes) => {
      alert(codes[0].value);
    },
  });
  if (!hasPermission) {
    requestPermission();

    return (
      <View>
        <Text>No Permission</Text>
      </View>
    );
  }
  if (device == null)
    return (
      <View>
        <Text>No Camera</Text>
      </View>
    );

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Camera
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        device={device}
        isActive
        // codeScanner={codeScanner}
        frameProcessor={frameProcessor}
        fps={[0, 2]}
        // photoQualityBalance="speed"
        // photo={false}
        // video={false}
        // audio={false}
      />
      <Text
        style={{
          backgroundColor: "white",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1,
        }}
      >
        결과: {classNames[Number(result)]}
      </Text>
    </View>
  );
}
