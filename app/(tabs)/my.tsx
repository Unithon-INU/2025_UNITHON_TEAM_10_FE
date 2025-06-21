import FocusAwareStatusBar from "@/components/ui/focus-aware-status-bar";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { View } from "@/components/ui/view";
import { VStack } from "@/components/ui/vstack";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView, TouchableOpacity, FlatList } from "react-native";
import { ArticleInfo } from "./board";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/ui/image";
import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Grid, GridItem } from "@/components/ui/grid";

export default function Page() {
  const tabItems = ["요약", "통계", "업적"];
  const [currentTab, setCurrentTab] = useState(0);
  return (
    <>
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
            <Card className="bg-white rounded-xl">
              <HStack className="gap-2">
                <Box className="bg-primary-500 justify-center p-3 rounded-full">
                  <Icon
                    as={() => (
                      <FontAwesome name="recycle" size={28} color="white" />
                    )}
                  />
                </Box>
                <VStack className="gap-2">
                  <Text className="text-description">총 분리배출</Text>
                  <Text className="text-highlight-md">
                    428
                    <Text>건</Text>
                  </Text>
                </VStack>
              </HStack>
            </Card>
          </GridItem>
          <GridItem
            _extra={{
              className: "col-span-1",
            }}
          >
            <Card className="bg-white rounded-xl">
              <HStack className="gap-2">
                <Box className="bg-primary-500 justify-center p-3 rounded-full">
                  <Icon
                    as={() => (
                      <FontAwesome name="recycle" size={28} color="white" />
                    )}
                  />
                </Box>
                <VStack className="gap-2">
                  <Text className="text-description">총 분리배출</Text>
                  <Text className="text-highlight-md">
                    428
                    <Text>건</Text>
                  </Text>
                </VStack>
              </HStack>
            </Card>
          </GridItem>
        </Grid>
      )}
    </>
  );
}
