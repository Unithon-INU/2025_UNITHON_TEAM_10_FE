// import { runOnJS } from "react-native-reanimated";

import { useIsFocused } from "@react-navigation/native";
import { Asset } from "expo-asset";

import React, { useEffect, useState } from "react";
import { Dimensions, LayoutChangeEvent, Text, View } from "react-native";
import {
  Camera,
  CameraDevice,
  runAtTargetFps,
  useCameraDevice,
  useCameraDevices,
  useCameraPermission,
  useCodeScanner,
  useFrameProcessor,
  VisionCameraProxy,
} from "react-native-vision-camera";

import {
  useRunOnJS,
  useSharedValue,
  Worklets,
} from "react-native-worklets-core";
import useAppState from "./hooks/useAppState";

import { useTensorflowModel } from "react-native-fast-tflite";

import { useResizePlugin } from "vision-camera-resize-plugin";
import {
  Canvas,
  Rect,
  Text as SkiaText,
  useFont,
} from "@shopify/react-native-skia";
import { cocoClasses } from "./coco_classes";

type RelativeBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type AbsoluteBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function restoreToCanvasBox(
  box: RelativeBox,
  scale: number,
  padX: number,
  padY: number,
  frameWidth: number,
  frameHeight: number,
  canvasWidth: number,
  canvasHeight: number
): AbsoluteBox {
  // Step 1: letterbox 이미지 기준 → 원본 프레임 기준 상대좌표
  const inputSize = 640;
  const xInInput = box.x * inputSize;
  const yInInput = box.y * inputSize;

  const x = (xInInput - padX) / (frameWidth * scale);
  const y = (yInInput - padY) / (frameHeight * scale);
  const w = (box.width * inputSize) / (frameWidth * scale);
  const h = (box.height * inputSize) / (frameHeight * scale);

  // Step 2: 원본 프레임 기준 상대좌표 → 실제 캔버스 픽셀 좌표
  return {
    x: x * canvasWidth,
    y: y * canvasHeight,
    width: w * canvasWidth,
    height: h * canvasHeight,
  };
}

const plugin = VisionCameraProxy.initFrameProcessorPlugin(
  "runWasteClassifier",
  {}
);
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
  // const plugin = useTensorflowModel(
  //   require("../assets/models/yolo11n_float32.tflite")
  // );

  const device = devices.find((d) => d.position === "back");
  const { hasPermission, requestPermission } = useCameraPermission();

  const [result, setResult] = useState<number | null>();
  const setDetectionsOnJS = useRunOnJS((boxes: DetectionResult | null) => {
    if (boxes) setDetections(boxes);
  }, []);
  const { resize } = useResizePlugin();
  // const model = plugin.state === "loaded" ? plugin.model : undefined;
  const [detections, setDetections] = useState<DetectionResult>();

  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    if (frame.isValid) {
      // const resized = resize(frame, {
      //   scale: {
      //     width: 640,
      //     height: 640,
      //   },
      //   pixelFormat: "rgb",
      //   dataType: "float32",
      // });

      // for (let i = 0; i < resized.length; i++) {
      //   resized[i] /= 255.0;
      // }

      // if (resized == null || resized.length === 0) {
      //   console.warn("resize 실패 혹은 빈 데이터");
      //   return;
      // }

      // try {
      //   const outputs = plugin.model?.runSync([resized] as Float32Array[]);
      //   if (!outputs || outputs[0] == null) {
      //     console.warn("Outputs are undefined or null");
      //     return;
      //   }
      //   // 출력 배열을 Float32Array로 변환
      //   const outputArray = outputs[0] as Float32Array;

      //   const detections = processYoloOutput(outputArray);

      //   // const filteredDetections = nonMaxSuppression(detections, 0.5);
      //   console.log(`Detected ${detections.length} objects!`);

      //   setDetectionsOnJS(detections);
      // } catch (e) {
      //   console.error("runSync 실패:", (e as Error).message);
      // }
      runAtTargetFps(5, () => {
        "worklet";
        const result = plugin?.call(frame) as any as DetectionResult;
        console.log(JSON.stringify(result));
        setDetectionsOnJS(result);
      });
    }
  }, []);

  const codeScanner = useCodeScanner({
    codeTypes: ["ean-13", "ean-8"],
    onCodeScanned: (codes) => {
      alert(codes[0].value);
    },
  });

  // Android 15에 대응하기 위해 앱이 포그라운드에서 활성상태인 경우에만 카메라를 활성화합니다.
  // 추가로, useCameraDevice 훅이 아닌 직접 카메라를 가져오는 방식으로 변경했습니다.
  const isFocused = useIsFocused();
  const appState = useAppState();
  const isActive = isFocused && appState === "active";

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCanvasSize({ width, height });
  };
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
  if (device == null)
    return (
      <View>
        <Text>No Camera</Text>
      </View>
    );
  // // if (!model || model == null)
  //   return (
  //     <View>
  //       <Text>Loading Model...</Text>
  //     </View>
  //   );

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
        // codeScanner={codeScanner}
        frameProcessor={frameProcessor}
        photoQualityBalance="speed"
        photo={false}
        video={false}
        audio={false}
      />
      <Canvas
        onLayout={onLayout}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {detections?.detections?.map(({ box, classId: className }, idx) => {
          const { x, y, width, height } = restoreToCanvasBox(
            box,
            detections.scale,
            detections.padX,
            detections.padY,
            detections.frameWidth,
            detections.frameHeight,
            canvasSize.width,
            canvasSize.height
          );
          console.log(x,y,width,height)
          // → 이제 이 box는 원래 frame 비율 기준 상대좌표가 됨 → 화면 비례 스케일 하면 끝

          return (
            <Rect
              key={idx}
              x={x}
              y={y}
              width={width}
              height={height}
              color="red"
              style="stroke"
              strokeWidth={2}
            >
              <SkiaText
                x={x}
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
