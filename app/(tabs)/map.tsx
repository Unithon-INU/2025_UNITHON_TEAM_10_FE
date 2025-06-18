import * as Location from "expo-location";
import React, { useEffect } from "react";
import { NaverMapView, Region } from "@mj-studio/react-native-naver-map";
import { useLocationPermission } from "react-native-vision-camera";

export default function Page() {
  const jejuRegion: Region = {
    latitude: 33.20530773,
    longitude: 126.14656715029,
    latitudeDelta: 0.38,
    longitudeDelta: 0.8,
  };

  useEffect(() => {
    (async () => {
      try {
        const { granted } = await Location.requestForegroundPermissionsAsync();
        /**
         * Note: Foreground permissions should be granted before asking for the background permissions
         * (your app can't obtain background permission without foreground permission).
         */
        if (granted) {
          await Location.requestBackgroundPermissionsAsync();
        }
      } catch (e) {
        console.error(`Location request has been failed: ${e}`);
      }
    })();
  }, []);

  return (
    <NaverMapView
      style={{ flex: 1 }}
      locale="ko"
      logoAlign={"BottomRight"}
      onInitialized={() => console.log("initialized!")}
      onOptionChanged={() => console.log("Option Changed!")}
    ></NaverMapView>
  );
}
