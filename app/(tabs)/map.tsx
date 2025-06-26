import React, { useRef, useState } from "react";
import { Text, TouchableOpacity } from "react-native";
import {
  NaverMapMarkerOverlay,
  NaverMapView,
  NaverMapViewRef,
  Region,
} from "@mj-studio/react-native-naver-map";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon, CloseIcon } from "@/components/ui/icon";
import useDebounce from "@/lib/useDebounce";
import RecycleCenterApi, { LocationInfo } from "@/api/recycleCenter";
import useUserLocation from "@/lib/useUserLocation";

export default function Page() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<NaverMapViewRef>(null);

  const { initialRegion } = useUserLocation();
  const [index, setIndex] = useState(-1);
  const [recycleLocations, setRecycleLocations] = useState<LocationInfo[]>([]);

  const fetchLocations = useDebounce(async (region: Region) => {
    const radiusKm = Math.min(
      (region.latitudeDelta / 2) * 111,
      (region.longitudeDelta / 2) *
        111 *
        Math.cos(region.latitude * (Math.PI / 180))
    );
    const centers = await RecycleCenterApi.fetchCenters(
      region.latitude,
      region.longitude,
      radiusKm
    );
    if (centers)
      setRecycleLocations((prev) => Array.from(new Set([...prev, ...centers])));
  }, 1000);
  if (!initialRegion) return <></>;
  return (
    <>
      <NaverMapView
        ref={mapRef}
        style={{ flex: 1 }}
        locale="ko"
        logoAlign="BottomRight"
        initialCamera={{ ...initialRegion, zoom: 13 }}
        onCameraChanged={(e) => fetchLocations(e.region)}
        onInitialized={() => console.log("Map Initialized")}
      >
        {recycleLocations.map((e, i) => (
          <NaverMapMarkerOverlay
            key={`${e.latitude}-${e.longitude}-${i}-${e.name}`}
            latitude={e.latitude}
            longitude={e.longitude}
            onTap={() => setIndex(i)}
            tintColor={index === i ? "red" : undefined}
          />
        ))}
      </NaverMapView>

      {index !== -1 && (
        <VStack
          className="absolute bg-white p-5 left-5 right-5 rounded-xl gap-2"
          style={{ bottom: insets.bottom }}
        >
          <HStack className="items-center justify-between">
            <Text>{recycleLocations[index].name}</Text>
            <TouchableOpacity className="p-2" onPress={() => setIndex(-1)}>
              <Icon as={CloseIcon} size="xl" />
            </TouchableOpacity>
          </HStack>
          <HStack>
            <Text style={{ flex: 1 }}>주소</Text>
            <Text style={{ flex: 9 }}>{recycleLocations[index].address}</Text>
          </HStack>
          <HStack>
            <Text style={{ flex: 1 }}>유형</Text>
            <Text style={{ flex: 9 }}>
              {recycleLocations[index].specialWasteType}
            </Text>
          </HStack>
        </VStack>
      )}
    </>
  );
}
