import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  NaverMapMarkerOverlay,
  NaverMapView,
  NaverMapViewRef,
  Region,
} from "@mj-studio/react-native-naver-map";
import { useLocationPermission } from "react-native-vision-camera";

import locations from "@/lib/location.json";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { TouchableOpacity, Text } from "react-native";
import { ButtonText, Button } from "@/components/ui/button";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloseIcon, Icon } from "@/components/ui/icon";
import { useQuery } from "@tanstack/react-query";
import RecycleCenterApi, { LocationInfo } from "@/api/recycleCenter";
import useDebounce from "@/lib/useDebounce";

export default function Page() {
  const inset = useSafeAreaInsets();

  const [index, setIndex] = useState<number>(-1);
  const [initialLocation, setInitialLocation] =
    useState<Location.LocationObject>();
  const [currentLocation, setCurrentLocation] = useState<Region>();
  const mapRef = useRef<NaverMapViewRef>(null);

  const [recycleLocations, setRecycleLocations] = useState<LocationInfo[]>([]);

  useEffect(() => {
    (async () => {
      try {
        // 권한 요청
        const { granted } = await Location.requestForegroundPermissionsAsync();
        if (!granted) {
          console.warn("위치 권한이 거부되었습니다.");
          return;
        }

        // 백그라운드 권한 요청 (필요할 경우)
        await Location.requestBackgroundPermissionsAsync();

        // 현재 위치 가져오기
        const location = await Location.getCurrentPositionAsync({});
        setInitialLocation(location);
        console.log("현재 위치:", location);
      } catch (e) {
        console.error(`Location request has been failed: ${e}`);
      }
    })();
  }, []);

  const fetchLocations = useDebounce(async (region: Region) => {
    console.log("location");
    const centers = await RecycleCenterApi.fetchCenters(
      region.latitude,
      region.longitude,
      Math.min( (region.latitudeDelta / 2) * 111, (region.longitudeDelta / 2) * 111 * Math.cos(region.latitude * (Math.PI / 180)))
    );
    if (centers) setRecycleLocations(centers);
  }, 1000);

  return (
    <>
      <NaverMapView
        ref={mapRef}
        style={{ flex: 1 }}
        locale="ko"
        logoAlign={"BottomRight"}
        initialRegion={{
          latitude: initialLocation?.coords.latitude ?? 37.37603253590633,
          longitude: initialLocation?.coords.longitude ?? 126.63208290232771,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onCameraChanged={(e) => fetchLocations(e.region)}
        onInitialized={() => console.log("initialized!")}
        onOptionChanged={() => console.log("Option Changed!")}
      >
        {recycleLocations?.map((e, i) => {
          return (
            <>
              <NaverMapMarkerOverlay
                latitude={e.latitude}
                longitude={e.longitude}
                onTap={() => {
                  setIndex(i);
                }}
                tintColor={index == i ? "red" : undefined}
              />
            </>
          );
        })}
      </NaverMapView>

      {index != -1 && (
        <VStack
          className={`absolute bg-white p-5 left-5 right-5 rounded-xl gap-2`}
          style={{ bottom: inset.bottom }}
        >
          <HStack className="items-center justify-between">
            <Text>{recycleLocations[index].name}</Text>
            {/* <Image source={{}}></Image> */}
            <TouchableOpacity
              className="p-2"
              onPress={() => {
                setIndex(-1);
              }}
            >
              <Icon as={CloseIcon} size="xl" />
            </TouchableOpacity>
          </HStack>
          <HStack>
            <Text style={{ flex: 1 }}>주소</Text>
            <Text style={{ flex: 9 }}>{recycleLocations[index].address}</Text>
          </HStack>
          <HStack>
            <Text className="flex-1">유형</Text>
            <Text style={{ flex: 9 }}>
              {recycleLocations[index].specialWasteType}
            </Text>
          </HStack>
          <HStack className="gap-4"></HStack>
        </VStack>
      )}
    </>
  );
}
