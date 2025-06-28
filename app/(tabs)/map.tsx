import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  NaverMapMarkerOverlay,
  NaverMapView,
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

type LocationInfo = {
  address: string;
  time: string;
  department: string;
  phone: string;
  latitude: number;
  longitude: number;
};

export default function Page() {
  const inset = useSafeAreaInsets();

  const [index, setIndex] = useState<number>(-1);

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
    <>
      <NaverMapView
        style={{ flex: 1 }}
        locale="ko"
        logoAlign={"BottomRight"}
        onInitialized={() => console.log("initialized!")}
        onOptionChanged={() => console.log("Option Changed!")}
      >
        {locations.map((e, i) => {
          return (
            <>
              <NaverMapMarkerOverlay
                latitude={e.latitude}
                longitude={e.longitude}
                onTap={() => {
                  setIndex(i);
                }}
                tintColor={index==i ? "red" : undefined}
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
            <Text className="w-[80%]">{locations[index].address}</Text>
            {/* <Image source={{}}></Image> */}
            <TouchableOpacity className="p-2" onPress={() => {
              setIndex(-1);
            }}>
              <Icon as={CloseIcon} size="xl" />
            </TouchableOpacity>
          </HStack>
          <HStack>
            <Text className="w-[25%]">운영시간</Text>
            <Text>{locations[index].time}</Text>
          </HStack>
          <HStack>
            <Text className="w-[25%]">담당부서</Text>
            <Text>{locations[index].department}</Text>
          </HStack>
          <HStack>
            <Text className="w-[25%]">전화번호</Text>
            <Text>{locations[index].phone}</Text>
          </HStack>
          
          <HStack className="gap-4">
            
          </HStack>
        </VStack>
      )}
    </>
  );
}
