import {
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TextInput,
  TextInputProps,
  TouchableHighlight,
} from "react-native";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import Svg, { Path } from "react-native-svg";
import { Divider } from "@/components/ui/divider";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { ImageIcon } from "@/components/ui/icon";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { ImageCard } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import DashboardApi from "@/api/dashboard";
import { SplashScreen, useNavigation } from "expo-router";
import { Meter } from "@/components/ui/meter";
import WasteApi from "@/api/waste";
import useDebounce from "@/lib/useDebounce";
import FocusAwareStatusBar from "@/components/ui/focus-aware-status-bar";
import { CommonActions } from "@react-navigation/native";
import * as SecureStorage from "expo-secure-store";
import { HTTPError } from "ky";

const TrashStat = ({ count, icon }: { count: number; icon: any }) => (
  <HStack className="items-center gap-1">
    <ImageIcon image={icon} size="md" />
    <Text className="text-highlight-md">{count}</Text>
  </HStack>
);

export default function Main() {
  const phrases = [
    "햇반 용기, 어떻게 버려요?",
    "비닐봉투는 재활용될까요?",
    "유리병 라벨은 제거해야 하나요?",
    "컵라면 용기는 어떻게 버릴까요?",
    "칫솔은 일반 쓰레기인가요?",
  ];
  const placeHolder = useMemo(
    () => phrases[Math.floor(Math.random() * phrases.length)],
    []
  );

  const [searchInput, setSearchInput] = useState("");
  const [searchBoxSize, setSearchBoxSize] = useState<{
    width?: number;
    height?: number;
  }>({});
  const [query, setQuery] = useState("");
  const debounceQuery = useDebounce((query) => setQuery(query), 1000);

  useEffect(() => {
    debounceQuery(searchInput);
  }, [searchInput]);

  const [searchBoxFocused, setSearchBoxFocused] = useState(false);
  const navigation = useNavigation();

  const myRecords = useQuery({
    queryKey: ["myRecords"],
    queryFn: async () => {
      try {
        return await DashboardApi.fetchMyRecords();
      } catch (e) {
        if (e instanceof HTTPError && e.response.status == 403) {
          await SecureStorage.deleteItemAsync("token");

          navigation.dispatch(
            CommonActions.reset({
              routes: [{ name: "(auth)/login" }],
            })
          );
          throw new Error("로그인 안됨");
        }
      }
    },
  });
  const banners = useQuery({
    queryKey: ["banners"],
    queryFn: async () => await DashboardApi.fetchBanners(),
  });

  const searchResults = useQuery({
    queryKey: ["search", query],
    queryFn: async ({ queryKey: [_, query] }) =>
      WasteApi.searchWasteByName(query),
  });

  const currentPoints = myRecords.data?.userInfo.currentPoints;
  const amount = (myRecords.data?.userInfo.currentPoints ?? 0) / 5;

  const achievements = [
    {
      unit: "점",
      value: currentPoints,
    },
    {
      unit: "kg",
      value: amount * 0.035,
      label: "이산화탄소",
    },
    {
      unit: "km",
      value: amount * 100,
    },
  ];
  const recycleStats = myRecords.data?.trashStat;

  useEffect(() => {
    if (!myRecords.isLoading) {
      SplashScreen.hideAsync();
    }
  }, [myRecords.isLoading]);

  if (myRecords.isLoading) return <Box></Box>;

  return (
    <SafeAreaView className="bg-white h-full ">
      <ScrollView>
        <FocusAwareStatusBar
          animated={true}
          backgroundColor={"white"}
          barStyle={"dark-content"}
        />
        <VStack className="px-6 gap-5">
          <VStack className="gap-10">
            <Text className="text-title">
              쓰레기 버리고{"\n"}포인트 얻어볼까요?
            </Text>
            <Box className="items-center">
              <Svg width="118" height="144" viewBox="0 0 118 144" fill="none">
                <Path
                  d="M59.0625 0.25C73.2075 0.25 84.6875 11.73 84.6875 25.875V26.0801C99.0887 27.7713 110.312 40.0199 110.312 54.9336C110.312 59.5973 109.185 64.0054 107.237 67.9004C113.695 72.7178 118 80.3536 118 89.0146C118 103.57 106.11 115.46 91.5547 115.46H66.75V143.853H46.25V115.46H26.5703C12.0153 115.46 0.125 103.57 0.125 89.0146C0.125114 80.3536 4.43032 72.7178 10.8877 67.9004C8.79943 63.7335 7.74564 59.1242 7.81543 54.4639C7.88528 49.8039 9.07621 45.2292 11.2881 41.127C13.5002 37.0245 16.6681 33.5146 20.5234 30.8955C24.3788 28.2764 28.8086 26.6249 33.4375 26.0801V25.875C33.4375 11.73 44.9175 0.25 59.0625 0.25Z"
                  fill="#6BCCB0"
                />
              </Svg>
            </Box>
            <HStack className="gap-5 justify-center items-center">
              {achievements?.map((achieve, i) => (
                <HStack key={`achievement-${i}`}>
                  <Meter key={i} unit={achieve.unit} desc={achieve.label}>
                    {achieve.value}
                  </Meter>
                  {i < (achievements?.length ?? 0) - 1 && (
                    <Divider
                      orientation="vertical"
                      className="bg-placeholder w-[0.5px]"
                    />
                  )}
                </HStack>
              ))}
            </HStack>
            <HStack className="bg-background-500 items-center justify-center gap-4 py-4 rounded-xl ">
              <TrashStat
                count={recycleStats?.plasticCount ?? 0}
                icon={require("../../assets/images/pet.png")}
              />
              <Divider
                orientation="vertical"
                className="bg-placeholder w-[0.5px]"
              />
              <TrashStat
                count={recycleStats?.metalCount ?? 0}
                icon={require("../../assets/images/can.png")}
              />
              <Divider
                orientation="vertical"
                className="bg-placeholder w-[0.5px]"
              />
              <TrashStat
                count={recycleStats?.cardboardCount ?? 0}
                icon={require("../../assets/images/box.png")}
              />
              <Divider
                orientation="vertical"
                className="bg-placeholder w-[0.5px]"
              />
              <TrashStat
                count={recycleStats?.vynylCount ?? 0}
                icon={require("../../assets/images/vynyl.png")}
              />
            </HStack>
          </VStack>
          <VStack>
            <HStack className="justify-center  py-4 bg-background-500 rounded-t-xl">
              <MaterialIcons name="search" size={32} color="#6d6d6d" />
              <Input
                className="border-0 text-center drop-shadow-xl max-w-[80%]"
                style={{ width: (searchBoxSize?.width ?? 0) + 20 }}
              >
                <InputField
                  onPress={() => setSearchBoxFocused(true)}
                  onFocus={() => setSearchBoxFocused(true)}
                  placeholder={placeHolder}
                  className="font-nanum-square"
                  onChangeText={(text) => setSearchInput(text)}
                  value={searchInput}
                />
              </Input>
              <Text
                onLayout={({ nativeEvent: { layout } }) => {
                  setSearchBoxSize(layout);
                }}
                className="absolute opacity-0"
              >
                {searchInput.length > 0 ? searchInput : placeHolder}
              </Text>
            </HStack>
            <Box className="relative">
              {searchBoxFocused && (
                <ScrollView className="absolute top-0 w-full  bg-[#f1f1f1] rounded-b-xl z-10 h-48 shadow-drop">
                  {searchResults.data?.map((candidate) => (
                    <VStack key={`search-result-${candidate}`}>
                      <TouchableHighlight
                        activeOpacity={0.6}
                        underlayColor="#dddddd"
                        onPress={() => {
                          setSearchBoxFocused(false);
                          setSearchInput(candidate);
                        }}
                        className="items-center py-4 "
                      >
                        <Text>{candidate}</Text>
                      </TouchableHighlight>
                      <Divider
                        orientation="horizontal"
                        className="bg-placeholder h-[0.5px]"
                      />
                    </VStack>
                  ))}
                </ScrollView>
              )}
            </Box>
          </VStack>

          {banners.data?.map((banner) => (
            <ImageCard
              key={banner.title}
              title={banner.title}
              backgroundImage={banner.backgroundImage}
              overlayOpacity={0}
              onClick={() => {
                alert("banner");
              }}
            />
          ))}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
