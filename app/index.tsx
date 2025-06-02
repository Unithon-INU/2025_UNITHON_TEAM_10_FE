import {
  ColorValue,
  ImageSourcePropType,
  SafeAreaView,
  ScrollView,
  Text as TextView,
  View,
} from "react-native";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import Svg, { Path } from "react-native-svg";
import { Divider } from "@/components/ui/divider";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { SearchIcon } from "@/components/ui/icon";
import { Image } from "@/components/ui/image";
import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Card } from "@/components/ui/card";
import { ImageBackground } from "@/components/ui/image-background";
const Meter = ({
  children,
  unit,
  desc,
}: React.PropsWithChildren<{ unit: string; desc?: string }>) => {
  return (
    <VStack>
      <HStack className="flex-row justify-center">
        <Text className="text-highlight-md">{children} </Text>
        <Text>{unit}</Text>
      </HStack>
      {desc && <Text>{desc}</Text>}
    </VStack>
  );
};

const CardWithImageBackground = ({
  title,
  backgroundImage,
  overlayOpacity = 0.5, // 기본 투명도 0.5 (50%)
  textColor,
  children, // 자식 컴포넌트를 받을 수 있도록 추가
  onClick,
}: React.PropsWithChildren<{
  title: string;
  backgroundImage: ImageSourcePropType | undefined;
  overlayOpacity: number;
  textColor?: ColorValue;
  onClick?: () => void;
}>) => {
  return (
    <Box className="rounded-xl overflow-hidden" onTouchEnd={onClick}>
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        className="flex-1 justify-start h-52"
      >
        {/* 반투명 오버레이 */}
        <Box
          className="absolute top-0 left-0 right-0 bottom-0 bg-gray-800"
          style={{ opacity: overlayOpacity }}
        />

        {/* 컨텐츠 (제목 및 자식 컴포넌트) */}
        <VStack className="p-6 gap-2 z-1">
          <Text className="font-nanum-square-extra-bold text-title">
            {title}
          </Text>
          {children}
        </VStack>
      </ImageBackground>
    </Box>
  );
};

const ImageIcon = ({
  image,
  size = "md",
}: {
  image: any;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeNumber = size == "sm" ? 4 : size == "md" ? 8 : 12;
  return (
    <Image
      source={image}
      className={`w-${sizeNumber} h-${sizeNumber}`}
      alt="ImageIcon"
    />
  );
};

export default function Index() {
  const phrases = [
    "햇반 용기, 어떻게 버려요?",
    "비닐봉투는 재활용될까요?",
    "유리병 라벨은 제거해야 하나요?",
    "컵라면 용기는 어떻게 버릴까요?",
    "칫솔은 일반 쓰레기인가요?",
  ];
  const placeHolder = phrases[Math.floor(Math.random() * phrases.length)];
  const achievements = [
    {
      unit: "점",
      value: 340,
    },
    {
      unit: "kg",
      value: 2.3,
      label: "이산화탄소",
    },
    {
      unit: "km",
      value: 3,
      label: "자동차",
    },
  ];
  const recycleStats = new Array(4).fill({ value: 24 });
  const banners = [
    {
      title: "쓰레기 버리고\n포인트 얻기",
      backgroundImage: require("../assets/images/bg.png"),
    },
  ];

  return (
    <SafeAreaView className="bg-white h-full ">
      <ScrollView>
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
              {achievements.map((achieve, i) => (
                <>
                  <Meter unit={achieve.unit} desc={achieve.label}>
                    {achieve.value}
                  </Meter>
                  {i < achievements.length - 1 && (
                    <Divider
                      orientation="vertical"
                      className="bg-placeholder w-[0.5px]"
                    />
                  )}
                </>
              ))}
            </HStack>
            <HStack className="bg-background-500 items-center justify-center gap-4 py-4 rounded-xl ">
              {recycleStats.map((stat, idx) => (
                <>
                  <ImageIcon
                    image={require("/assets/images/pet.png")}
                    size="md"
                  />
                  <Text className="text-highlight-md">{stat.value}</Text>
                  {idx < recycleStats.length - 1 && (
                   <Divider
                      orientation="vertical"
                      className="bg-placeholder w-[0.5px]"
                    />
                  )}
                </>
              ))}
            </HStack>
          </VStack>
          <HStack className="items-center px-[20%] py-4 bg-background-500 rounded-xl">
            <MaterialIcons name="search" size={32} color="#6d6d6d" />
            <Input className="flex-1 border-0 text-center drop-shadow-xl">
              <InputField
                placeholder={placeHolder}
                className="font-nanum-square"
              />
            </Input>
          </HStack>
          {banners.map((banner) => (
            <CardWithImageBackground
              title={banner.title}
              backgroundImage={banner.backgroundImage}
              overlayOpacity={0}
              onClick={() => {
                alert("banner");
              }}
            ></CardWithImageBackground>
          ))}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
