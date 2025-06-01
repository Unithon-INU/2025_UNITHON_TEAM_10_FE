import { SafeAreaView, Text as TextView, View } from "react-native";
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
const ImageIcon = ({
  image,
  size = "md",
}: {
  image: any;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeNumber = size == "sm" ? 4 : size == "md" ? 8 : 12;
  return <Image source={image} className={`w-${sizeNumber} h-${sizeNumber}`} />;
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

  return (
    <SafeAreaView className="bg-white h-full ">
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
            <Meter unit="점">340</Meter>
            <Divider orientation="vertical" />
            <Meter unit="kg" desc="이산화탄소">
              2.3
            </Meter>

            <Divider orientation="vertical" />
            <Meter unit="km" desc="자동차">
              3
            </Meter>
          </HStack>
          <HStack className="bg-[#F9F9F9] items-center justify-center gap-4 py-4 rounded-xl ">
            <ImageIcon image={require("/assets/images/pet.png")} size="md" />
            <Text className="text-highlight-md">24</Text>
            <Divider orientation="vertical" />

            <ImageIcon image={require("/assets/images/can.png")} size="md" />
            <Text className="text-highlight-md">24</Text>
            <Divider orientation="vertical" />

            <ImageIcon image={require("/assets/images/vynyl.png")} size="md" />
            <Text className="text-highlight-md">24</Text>
            <Divider orientation="vertical" />

            <ImageIcon image={require("/assets/images/box.png")} size="md" />
            <Text className="text-highlight-md">24</Text>
          </HStack>
        </VStack>
        <HStack className="justify-center px-[20%] py-4 bg-[#f9f9f9] rounded-xl">
          <Box>
            <SearchIcon
              stroke={"#6d6d6d"}
              fillOpacity={0}
              width="30"
              height="30"
            />
          </Box>
          <Input className="flex-1 border-0">
            <InputField
              placeholder={placeHolder}
              className="font-nanum-square"
            />
          </Input>
        </HStack>
      </VStack>
    </SafeAreaView>
  );
}
