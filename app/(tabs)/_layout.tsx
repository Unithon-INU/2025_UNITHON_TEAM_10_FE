import { router, Stack, Tabs } from "expo-router";
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from "react-native";
import { useNavigation, useSegments } from "expo-router";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import type { BottomTabBarButtonProps, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

const TabBarButton = ({
  iconName,
  ...props
}: Omit<{
  iconName: keyof typeof FontAwesome.glyphMap;
} & BottomTabBarButtonProps, 'children'>) => (
  <TouchableOpacity
    onPress={props.onPress}
    style={[styles.tabButton]}
  >
    <View style={[styles.iconContainer]}>
      <FontAwesome name={iconName} size={28} color={props.accessibilityState?.selected ? '#5EDAA3' : 'black'} />
    </View>
  </TouchableOpacity>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // 모든 탭의 기본 헤더 숨김
        tabBarStyle: {
          height: 100,
        },
      }}
    >
      <Tabs.Screen
        name={"index"}
        options={{
          tabBarButton: (props) => (
            <TabBarButton {...props} iconName={"home"} />
          ),
        }}
      />
      <Tabs.Screen
        name={"board"}
        options={{
          tabBarButton: (props) => (
            <TabBarButton {...props} iconName={"clipboard"} />
          ),
        }}
      />

      <Tabs.Screen
        name="scanPlaceholder" // 임의의 이름
        options={{
          tabBarButton: () => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="scan"
              onPress={() => router.push("/scan")}
              style={[styles.tabButton]}
            >
              <View
                style={[
                  styles.iconContainer,
                  styles.scanIconContainer, // 스캔 탭 아이콘 컨테이너 스타일
                ]}
              >
                <FontAwesome
                  name="camera"
                  size={28} // 스캔 아이콘 크기 조절
                  color="#fff" // 스캔 아이콘 색상 조절
                />
              </View>
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="map" // app/(tabs)/location.tsx
        options={{
          tabBarButton: (props) => <TabBarButton {...props} iconName={"map-marker"} />,
        }}
      />
      <Tabs.Screen
        name="my" // app/(tabs)/profile.tsx
        options={{
          tabBarButton: (props) => <TabBarButton {...props} iconName={"user"} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingBottom: 0,
  },
  tabBar: {
    flexDirection: "row",
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 5,
    // 기본 탭 버튼의 스타일
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    // 다른 탭 아이콘 컨테이너 스타일 (필요하다면)
  },
  // ⭐️ 스캔 탭 아이콘 컨테이너 스타일 (원형 배경)
  scanIconContainer: {
    backgroundColor: "#000", // 파란색 배경
    borderRadius: 30, // 원형으로 만듦 (크기의 절반)
    width: 50, // 원형 크기
    height: 50, // 원형 크기
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000", // 그림자 효과
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5, // 안드로이드 그림자
  },
});
