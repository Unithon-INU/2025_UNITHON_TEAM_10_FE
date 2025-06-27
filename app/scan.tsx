import { useIsFocused } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  Platform,
  View,
  Dimensions,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from "react-native";
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
import { cocoClasses } from "../lib/coco_classes";
import { Box } from "@/components/ui/box";
import { Pressable } from "@/components/ui/pressable";
import { VStack } from "@/components/ui/vstack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText } from "@/components/ui/button";
import { CloseIcon, Icon } from "@/components/ui/icon";
import { useQuery } from "@tanstack/react-query";
import WasteApi from "@/api/waste";

const plugin = VisionCameraProxy.initFrameProcessorPlugin("detect", {});

type DetectionResult = {
  detections: {
    classId: number;
    confidence: number;
    box: {
      x: number; // 0.0~1.0 relative to original frame's width (center x)
      y: number; // 0.0~1.0 relative to original frame's height (center y)
      width: number; // 0.0~1.0 relative width
      height: number; // 0.0~1.0 relative height
    };
  }[];
  // iOS에서 원본 프레임 기준 상대 좌표를 넘겨주므로, 이 값들은 이제 UI 렌더링에 직접 사용되지 않음
  scale: number;
  padX: number;
  padY: number;
  frameWidth: number; // Original frame's width (e.g., 1920)
  frameHeight: number; // Original frame's height (e.g., 1080)
};

// 화면 크기 정보
const { width: initialScreenWidth, height: initialScreenHeight } =
  Dimensions.get("window");

export default function Scan() {
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [screenDimensions, setScreenDimensions] = useState({
    width: initialScreenWidth,
    height: initialScreenHeight,
  });

  const inset = useSafeAreaInsets();

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
        // iOS에서 이미 원본 프레임 기준으로 정규화된 상대 좌표를 반환하도록 수정했으므로,
        // 여기서는 추가적인 변환이 필요 없습니다.
        const result = plugin?.call(frame) as any as DetectionResult;
        console.log(JSON.stringify(result));
        setDetectionsOnJS(result);
      });
    }
  }, []);

  // 화면 크기 변경 감지
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenDimensions({
        width: window.width,
        height: window.height,
      });
    });

    return () => subscription?.remove();
  }, []);

  // Android 15에 대응하기 위해 앱이 포그라운드에서 활성상태인 경우에만 카메라를 활성화합니다.
  const isFocused = useIsFocused();
  const appState = useAppState();
  const isActive = isFocused && appState === "active";

  const [activeClass, setActiveClass] = useState<number>();
  const recycleQuery = useQuery({
    queryKey: ["recycle", activeClass],
    queryFn: ({ queryKey: [_, activeClass] }) =>
      WasteApi.recycle(cocoClasses[activeClass as number] , 1),
  });

  useEffect(() => {
    const devices = Camera.getAvailableCameraDevices();
    setDevices(devices);
  }, [appState]);

  const font = useFont(require("../assets/fonts/SpaceMono-Regular.ttf"), 16);

  // 상대 좌표(0.0~1.0, 원본 프레임 기준)를 화면 픽셀 좌표로 변환하는 함수
  const convertToScreenCoordinates = (
    relativeXCenter: number, // 원본 프레임 기준 중심 X 상대 좌표
    relativeYCenter: number, // 원본 프레임 기준 중심 Y 상대 좌표
    relativeWidth: number, // 원본 프레임 기준 너비 상대 값
    relativeHeight: number, // 원본 프레임 기준 높이 상대 값
    frameWidth: number, // 원본 프레임의 실제 너비 (iOS에서 넘어온 값)
    frameHeight: number // 원본 프레임의 실제 높이 (iOS에서 넘어온 값)
  ) => {
    if (Platform.OS === "ios") {
      // 카메라 프리뷰가 화면에 어떻게 표시되는지 계산합니다.
      // VisionCamera의 `Camera` 컴포넌트는 `style` prop에 따라 자동으로 `aspect-fit` 또는 `aspect-fill`을 처리합니다.
      // 여기서는 카메라 프리뷰가 화면 전체를 채우지만, 원본 프레임의 가로세로 비율이 유지된다고 가정합니다.

      const cameraAspectRatio = frameWidth / frameHeight;
      const screenAspectRatio =
        screenDimensions.width / screenDimensions.height;

      let displayWidth, displayHeight, offsetX, offsetY;

      if (cameraAspectRatio > screenAspectRatio) {
        // 카메라 프레임이 화면보다 상대적으로 가로가 길다 (예: 16:9 프레임이 9:16 화면에 표시)
        // 화면 너비를 채우고, 위아래에 레터박스(빈 공간)가 생긴다.
        displayWidth = screenDimensions.width;
        displayHeight = screenDimensions.width / cameraAspectRatio;
        offsetX = 0;
        offsetY = (screenDimensions.height - displayHeight) / 2;
      } else {
        // 카메라 프레임이 화면보다 상대적으로 세로가 길다 (예: 9:16 프레임이 16:9 화면에 표시)
        // 화면 높이를 채우고, 좌우에 필러박스(빈 공간)가 생긴다.
        displayHeight = screenDimensions.height;
        displayWidth = screenDimensions.height * cameraAspectRatio;
        offsetX = (screenDimensions.width - displayWidth) / 2;
        offsetY = 0;
      }

      // 중심 좌표 기반의 상대 좌표를 좌측 상단 픽셀 좌표로 변환
      const xTopLeftRelative = relativeXCenter - relativeWidth / 2;
      const yTopLeftRelative = relativeYCenter - relativeHeight / 2;

      // 실제 화면 픽셀 좌표로 변환
      const absoluteX = xTopLeftRelative * displayWidth + offsetX;
      const absoluteY = yTopLeftRelative * displayHeight + offsetY;
      const absoluteWidth = relativeWidth * displayWidth;
      const absoluteHeight = relativeHeight * displayHeight;

      return {
        x: absoluteX,
        y: absoluteY,
        width: absoluteWidth,
        height: absoluteHeight,
      };
    } else {
      const screenWidth = screenDimensions.width;
      const screenHeight = screenDimensions.height - 56;
      const screenMinSize = Math.min(screenWidth, screenHeight);
      const screenMaxSize = Math.max(screenWidth, screenHeight);
      const screenRatio = screenMinSize / screenMaxSize;

      relativeXCenter = relativeXCenter / frameWidth + (1 - screenRatio) / 2;
      relativeYCenter = relativeYCenter / frameHeight;
      relativeWidth = relativeWidth / frameWidth;
      relativeHeight = relativeHeight / frameHeight;

      const absoluteXCenter = screenWidth * relativeXCenter;
      const absoluteYCenter = screenHeight * relativeYCenter;
      const absoluteWidth = relativeWidth * screenMaxSize;
      const absoluteHeight = relativeHeight * screenMaxSize;

      const absoluteX = absoluteXCenter - absoluteWidth / 2;
      const absoluteY = absoluteYCenter - absoluteHeight / 2;

      // console.log(relativeXCenter, relativeYCenter, relativeWidth, relativeHeight)
      // console.log(absoluteXCenter, absoluteYCenter, absoluteWidth, absoluteHeight)

      return {
        x: absoluteX,
        y: absoluteY,
        width: absoluteWidth,
        height: absoluteHeight,
      };
    }
  };

  if (!hasPermission) {
    requestPermission();

    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>카메라 권한이 필요합니다</Text>
      </View>
    );
  }

  if (device == null || appState !== "active") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>카메라를 찾을 수 없습니다</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Camera
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: screenDimensions.width,
          height: screenDimensions.height,
        }}
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

      <Pressable
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: screenDimensions.width,
          height: screenDimensions.height,
        }}
        onPress={({ nativeEvent }) => {
          const { locationX, locationY } = nativeEvent;

          if (!detections) return;

          for (const { box, classId, confidence } of detections.detections) {
            const screenCoords = convertToScreenCoordinates(
              box.x,
              box.y,
              box.width,
              box.height,
              detections.frameWidth,
              detections.frameHeight
            );

            const withinBox =
              locationX >= screenCoords.x &&
              locationX <= screenCoords.x + screenCoords.width &&
              locationY >= screenCoords.y &&
              locationY <= screenCoords.y + screenCoords.height;

            if (withinBox) {
              setActiveClass(classId);
              break; // 여러 박스 중 가장 먼저 일치하는 것만 처리
            }
          }
        }}
      >
        <Canvas
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: screenDimensions.width,
            height: screenDimensions.height,
          }}
        >
          {detections?.detections
            ?.map(({ box, classId, confidence }, idx) => {
              const className = cocoClasses[classId] || `Class ${classId}`;

              // iOS에서 넘어온 원본 프레임 기준 상대 좌표를 화면 픽셀 좌표로 변환합니다.
              const screenCoords = convertToScreenCoordinates(
                box.x, // 원본 프레임 기준 중심 X 상대 좌표
                box.y, // 원본 프레임 기준 중심 Y 상대 좌표
                box.width, // 원본 프레임 기준 너비 상대 값
                box.height, // 원본 프레임 기준 높이 상대 값
                detections.frameWidth, // iOS에서 넘어온 원본 프레임 너비
                detections.frameHeight // iOS에서 넘어온 원본 프레임 높이
              );

              return (
                <Rect
                  key={idx}
                  x={screenCoords.x}
                  y={screenCoords.y}
                  width={screenCoords.width}
                  height={screenCoords.height}
                  color="red"
                  style="stroke"
                  strokeWidth={3}
                >
                  {/* 텍스트 위치를 박스 위로 조정하고 화면 상단 경계를 고려 */}
                  <SkiaText
                    x={screenCoords.x}
                    y={Math.max(screenCoords.y - 15, 0)} // 박스 위 15px, 최소 0px
                    text={`${className} (${(confidence * 100).toFixed(1)}%)`}
                    font={font}
                    color="red"
                  />
                </Rect>
              );
            })
            .filter(Boolean)}
        </Canvas>
      </Pressable>

      {recycleQuery.data && (
        <VStack
          className={`absolute bg-white p-5 left-5 right-5 rounded-xl gap-2`}
          style={{ bottom: inset.bottom }}
        >
          <HStack className="items-center justify-between">
            <Text>{recycleQuery.data.classificationResult.name}</Text>
            {/* <Image source={{}}></Image> */}
            <TouchableOpacity
              className="p-2"
              onPress={() => {
                setActiveClass(undefined);
              }}
            >
              <Icon as={CloseIcon} size="xl" />
            </TouchableOpacity>
          </HStack>
          <Text>{recycleQuery.data.classificationResult.disposalMethod}</Text>
          {recycleQuery.data.classificationResult.createdByAi && (
            <Text className="text-description">
              AI가 분류한 결과입니다. 부정확 할 수 있습니다.
            </Text>
          )}
          <HStack className="gap-4">
            <Button className="flex-1 rounded-xl">
              <ButtonText>더 알아보기</ButtonText>
            </Button>
            <Button
              className="flex-1 rounded-xl "
              style={{ backgroundColor: "#FD8888" }}
            >
              <ButtonText>이게 아니예요</ButtonText>
            </Button>
          </HStack>
        </VStack>
      )}

      {process.env.NODE_ENV === "development" && detections && (
        <View
          style={{
            position: "absolute",
            top: 10, // 위치를 아래쪽으로 변경
            left: 10,
            backgroundColor: "rgba(0,0,0,0.8)",
            padding: 10,
            borderRadius: 5,
            maxWidth: screenDimensions.width - 20,
          }}
        >
          <Text style={{ color: "white", fontSize: 12 }}>
            Frame: {detections.frameWidth}x{detections.frameHeight}
          </Text>
          <Text style={{ color: "white", fontSize: 12 }}>
            Screen: {screenDimensions.width}x{screenDimensions.height}
          </Text>
          <Text style={{ color: "white", fontSize: 12 }}>
            Detections: {detections.detections.length}
          </Text>
          {/* iOS에서 이 값들을 사용하지 않으므로, 디버깅 목적으로만 유지 */}
          <Text style={{ color: "white", fontSize: 12 }}>
            Scale (from iOS): {detections.scale.toFixed(3)}
          </Text>
          <Text style={{ color: "white", fontSize: 12 }}>
            Pad (from iOS): X={detections.padX.toFixed(1)}, Y=
            {detections.padY.toFixed(1)}
          </Text>
          {detections.detections.map((det, idx) => (
            <Text key={idx} style={{ color: "yellow", fontSize: 10 }}>
              {idx}: rel({det.box.x.toFixed(3)}, {det.box.y.toFixed(3)}){" "}
              {det.box.width.toFixed(3)}x{det.box.height.toFixed(3)}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
