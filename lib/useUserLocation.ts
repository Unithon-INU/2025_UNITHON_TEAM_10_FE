// hooks/useUserLocation.ts
import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { Region } from "@mj-studio/react-native-naver-map";

export default function useUserLocation(initialDelta = 0.01) {
  const [locationGranted, setLocationGranted] = useState(false);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { granted } = await Location.requestForegroundPermissionsAsync();
        if (!granted) {
          console.warn("위치 권한이 거부되었습니다.");
          return;
        }
        setLocationGranted(true);

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        setInitialRegion({
          latitude,
          longitude,
          latitudeDelta: initialDelta,
          longitudeDelta: initialDelta,
        });
      } catch (err) {
        console.error("위치 요청 실패:", err);
      }
    })();
  }, []);

  return { initialRegion, locationGranted };
}
