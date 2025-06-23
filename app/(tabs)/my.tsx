import FocusAwareStatusBar from "@/components/ui/focus-aware-status-bar";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { View } from "@/components/ui/view";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

import { VStack } from "@/components/ui/vstack";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { ArticleInfo } from "./board";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/ui/image";
import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Grid, GridItem } from "@/components/ui/grid";
import { LineChart } from "react-native-chart-kit";

type StatCardProps = {
  title: string;
  count: number | string;
  icon: React.ReactNode;
  colorClass?: string; // e.g., "bg-primary-500"
};

export const StatCard = ({
  title,
  count,
  icon,
  colorClass = "bg-primary-500",
}: StatCardProps) => {
  return (
    <Card className="bg-white rounded-xl">
      <HStack className="gap-2">
        <Box
          className={`${colorClass} justify-center p-3 rounded-full aspect-square `}
        >
          <Icon as={() => icon} width={24} height={24} />
        </Box>
        <VStack className="gap-2">
          <Text className="text-description">{title}</Text>
          <Text className="text-highlight-md">
            {count}
            <Text>건</Text>
          </Text>
        </VStack>
      </HStack>
    </Card>
  );
};

export default function Page() {
  const tabItems = ["요약"];
  const [currentTab, setCurrentTab] = useState(0);

  const [chartWidth, setChartWidth] = useState<number>();

  const pan = Gesture.Pan();


  return (
    <GestureHandlerRootView>
      <SafeAreaView className="bg-primary-500" />
      <FocusAwareStatusBar
        animated={true}
        backgroundColor={"#5EDAA3"}
        barStyle={"light-content"}
      />
      <VStack className=" bg-primary-500 p-5 gap-3">
        <HStack className="justify-between">
          <Text className="text-highlight-lg " style={{ color: "white" }}>
            마이페이지
          </Text>
          <TouchableOpacity
            className="bg-[#3EF4A4] aspect-square p-1 rounded-xl"
            onPress={() => router.push("/article/write")}
          >
            <MaterialIcons name="settings" color="white" size={30} />
          </TouchableOpacity>
        </HStack>
        <HStack className="justify-between">
          <HStack className="gap-2">
            <Text className="text-title color-white">갱갱갱</Text>
            <Text className="bg-white rounded-full px-1 py-0.5">Lv. 6</Text>
          </HStack>
          {/* <Image/> */}
        </HStack>
      </VStack>
      <HStack className="gap-6 justify-center pt-4 border-b-[1px] border-b-placeholder">
        {tabItems.map((tab, i) => (
          <TouchableOpacity
            className="border-b-primary-500 px-5 py-1"
            style={{ borderBottomWidth: i == currentTab ? 2 : 0 }}
            onPress={() => setCurrentTab(i)}
          >
            <Text className="text-highlight-md">{tab}</Text>
          </TouchableOpacity>
        ))}
      </HStack>
      <GestureDetector gesture={pan}>
        <Box>
          {currentTab === 0 && (
            <Grid
              _extra={{
                className: "grid-cols-2 ",
              }}
              className="gap-4 p-4"
            >
              <GridItem
                _extra={{
                  className: "col-span-1",
                }}
              >
                <StatCard
                  title={"총 분리배출"}
                  count={456}
                  icon={<FontAwesome color="white" size={28} name="recycle" />}
                />
              </GridItem>
              <GridItem
                _extra={{
                  className: "col-span-1",
                }}
              >
                <StatCard
                  title={"획득 배지"}
                  count={456}
                  icon={
                    <FontAwesome color="white" size={24} name="certificate" />
                  }
                />
              </GridItem>
              <GridItem
                _extra={{
                  className: "col-span-1",
                }}
              >
                <StatCard
                  title={"연속 활동"}
                  count={456}
                  icon={
                    <FontAwesome color="white" size={24} name="line-chart" />
                  }
                />
              </GridItem>
              <GridItem
                _extra={{
                  className: "col-span-1",
                }}
              >
                <StatCard
                  title={"현재 포인트"}
                  count={456}
                  icon={<FontAwesome color="white" size={24} name="star" />}
                />
              </GridItem>
            </Grid>
          )}
        </Box>
      </GestureDetector>
      <Box className="p-4" onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
        <LineChart
          data={{
            labels: ["월", "화", "수", "목", "금", "토", "일"],
            legend: ['배출 건수', '획득 포인트'],
            datasets: [
              {
                data: [
                  Math.random() * 100,
                  Math.random() * 100,
                  Math.random() * 100,
                  Math.random() * 100,
                  Math.random() * 100,
                  Math.random() * 100,
                ],
                color: (opacity = 1) => `#FF928A`,
              },
              {
                data: [
                  Math.random() * 100,
                  Math.random() * 100,
                  Math.random() * 100,
                  Math.random() * 100,
                  Math.random() * 100,
                  Math.random() * 100,
                ],
                color: (opacity = 1) => `#8979FF`,
              },
            ],
          }}
          width={chartWidth ?? 0} // from react-native
          height={220}
          yAxisInterval={1} // optional, defaults to 1
          
          chartConfig={{
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            decimalPlaces: 2, // optional, defaults to 2dp
            color: (opacity = 1) => `rgba(0,0,0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0,0,0, ${opacity})`,
            style: {
              borderRadius: 16,
              backgroundColor: "transparent",
            },
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#000",
            },
            
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
            backgroundColor: "white",
          }}
        ></LineChart>
      </Box>
    </GestureHandlerRootView>
  );
}
