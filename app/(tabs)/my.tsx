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
  ScrollView,
  RefreshControl,
} from "react-native";
import { ArticleInfo } from "./board";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/ui/image";
import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Grid, GridItem } from "@/components/ui/grid";
import { LineChart } from "react-native-chart-kit";
import { useQuery } from "@tanstack/react-query";
import SimpleVictoryChart from "@/lib/test";
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import DashboardApi from "@/api/dashboard";

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
    <Card className="bg-white rounded-xl shadow-drop">
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

  const dashboardInfo = useQuery({
    queryKey: ["dashboard"],
    queryFn: DashboardApi.fetchMyRecords
  });

  const score = 340;

  const pan = Gesture.Pan();

  return (
    <GestureHandlerRootView>
      <SafeAreaView className="bg-primary-500" />
      <FocusAwareStatusBar
        animated={true}
        backgroundColor={"#5EDAA3"}
        barStyle={"light-content"}
      />
      <VStack className=" bg-primary-500 p-5 gap-3 rounded-b-xl">
        <HStack className="justify-between">
          <Text className="text-highlight-lg " style={{ color: "white" }}>
            마이페이지
          </Text>
          <TouchableOpacity
            className="bg-[#3EF4A4] aspect-square p-1 rounded-xl"
            onPress={() => router.push("/settings")}
          >
            <MaterialIcons name="settings" color="white" size={30} />
          </TouchableOpacity>
        </HStack>
        <HStack className="justify-between">
          <HStack className="gap-2">
            <Text className="text-title color-white">갱갱갱</Text>
            <Text className="bg-white rounded-full px-1 py-0.5">
              Lv. {Math.floor(score / 100)}
            </Text>
          </HStack>
          {/* <Image/> */}
        </HStack>
        <VStack className="bg-white rounded-xl p-4 gap-2">
          <HStack className="justify-between">
            <Text>현재 포인트</Text>
            <Text className="text-highlight-md">
              {score}
              <Text className="text-body">점</Text>
            </Text>
          </HStack>
          <Progress
            value={score % 100}
            size="md"
            orientation="horizontal"
            className="mb-3"
          >
            <ProgressFilledTrack />
          </Progress>
          <Text>
            다음 레벨까지{" "}
            <Text className="text-highlight-md">{100 - (score % 100)}</Text> 점
          </Text>
        </VStack>
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
      <ScrollView
        refreshControl={
          <RefreshControl
            onRefresh={dashboardInfo.refetch}
            refreshing={dashboardInfo.isRefetching}
          />
        }
      >
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
                    icon={
                      <FontAwesome color="white" size={28} name="recycle" />
                    }
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
        <Box className="p-4">
          <SimpleVictoryChart />
        </Box>
      </ScrollView>
    </GestureHandlerRootView>
  );
}
