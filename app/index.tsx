// import { runOnJS } from "react-native-reanimated";

import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import {
  Camera,
  CameraDevice,
  runAtTargetFps,
  useCameraPermission,
  useFrameProcessor,
  VisionCameraProxy,
} from "react-native-vision-camera";

import { useRunOnJS } from "react-native-worklets-core";
import useAppState from "./hooks/useAppState";

import {
  Canvas,
  Rect,
  Text as SkiaText,
  useFont,
} from "@shopify/react-native-skia";
import { cocoClasses } from "./coco_classes";



const plugin = VisionCameraProxy.initFrameProcessorPlugin("detect", {});
type DetectionResult = {
  detections: {
    classId: number;
    confidence: number;
    box: {
      x: number; // 0.0~1.0 상대 좌표 (letterboxed image 기준)
      y: number;
      width: number;
      height: number;
    };
  }[];
  scale: number; // 리사이즈할 때 사용한 비율 (640 / 원본프레임 너비 또는 높이)
  padX: number; // letterbox X 패딩 (px 단위)
  padY: number; // letterbox Y 패딩
  frameWidth: number; // 원본 프레임 너비
  frameHeight: number; // 원본 프레임 높이
};

export default function Index() {
  const [devices, setDevices] = useState<CameraDevice[]>([]);

  const device = devices.find((d) => d.position === "back");
  const { hasPermission, requestPermission } = useCameraPermission();

  const setDetectionsOnJS = useRunOnJS((boxes: DetectionResult | null) => {
    if (boxes) setDetections(boxes);
  }, []);

  const [detections, setDetections] = useState<DetectionResult>();

  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    if (frame.isValid) {
      runAtTargetFps(5, () => {
        "worklet";
        const result = plugin?.call(frame) as any as DetectionResult;
        console.log(JSON.stringify(result));
        setDetectionsOnJS(result);
      });
    }
  }, []);

  // Android 15에 대응하기 위해 앱이 포그라운드에서 활성상태인 경우에만 카메라를 활성화합니다.
  // 추가로, useCameraDevice 훅이 아닌 직접 카메라를 가져오는 방식으로 변경했습니다.
  const isFocused = useIsFocused();
  const appState = useAppState();
  const isActive = isFocused && appState === "active";

  useEffect(() => {
    const devices = Camera.getAvailableCameraDevices();
    setDevices(devices);
  }, [appState]);

  const font = useFont(require("../assets/fonts/SpaceMono-Regular.ttf"), 32);

  if (!hasPermission) {
    requestPermission();

    return (
      <View>
        <Text>No Permission</Text>
      </View>
    );
  }
  if (device == null || appState !== 'active')
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
        isActive={isActive}
        onError={(e) => {
          console.error(e);
          alert(e);
        }}
        frameProcessor={frameProcessor}
        photoQualityBalance="speed"
        photo={false}
        video={false}
        audio={false}
      />
      <Canvas
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          aspectRatio: "16/9",
        }}
      >
        {detections?.detections?.map(({ box, classId: className }, idx) => {
          const [y, width, height] =
          // Todo: 플랫폼별 리사이징 로직이 상이해 박스 복원 로직도 상이함.
            Platform.OS == "android"
              ? [box.y + 160, box.width * 0.8, box.height * 0.8]
              : [box.y, box.width, box.height];

          return (
            <Rect
              key={idx}
              x={box.x}
              y={y}
              width={width}
              height={height}
              color="red"
              style="stroke"
              strokeWidth={2}
            >
              <SkiaText
                x={box.x}
                y={y - 10}
                text={cocoClasses[Number(className)]}
                font={font}
              />
            </Rect>
          );
        })}
      </Canvas>
    </View>
  );
}
