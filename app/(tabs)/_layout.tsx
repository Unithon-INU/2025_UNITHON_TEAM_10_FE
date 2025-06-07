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
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

// CustomTabBar 컴포넌트
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <SafeAreaView style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          // 아이콘 이름 매핑
          const iconName: keyof typeof FontAwesome.glyphMap =
            (
              {
                index: "home",
                settings: "cog",
                scanPlaceholder: "camera", // 스캔 아이콘 (확대경/스캔 모양으로 변경)
                location: "map-marker",
                profile: "user",
              } as Record<string, keyof typeof FontAwesome.glyphMap>
            )[route.name] || "question-circle";

          const onPress = () => {
            if (isScanTab) router.push("/scan");
            else {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          const isScanTab = route.name === "scanPlaceholder"; // 스캔 탭인지 확인

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[
                styles.tabButton,
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  isScanTab && styles.scanIconContainer, // 스캔 탭 아이콘 컨테이너 스타일
                ]}
              >
                <FontAwesome
                  name={iconName}
                  size={isScanTab ? 30 : 40} // 스캔 아이콘 크기 조절
                  color={isScanTab ? "#fff" : isFocused ? "#007AFF" : "#222"} // 스캔 아이콘 색상 조절
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />} // ⭐️ 여기에서 커스텀 탭바 컴포넌트 사용
      screenOptions={{
        headerShown: false, // 모든 탭의 기본 헤더 숨김
      }}
    >
      <Stack></Stack>
      <Tabs.Screen
        name="index" // app/(tabs)/index.tsx
        options={{
          title: "홈",
        }}
      />
      <Tabs.Screen
        name="settings" // app/(tabs)/settings.tsx
        options={{
          title: "설정",
        }}
      />
      <Tabs.Screen
        name="scanPlaceholder" // 임의의 이름
      />

      <Tabs.Screen
        name="location" // app/(tabs)/location.tsx
        options={{
          title: "위치",
        }}
      />
      <Tabs.Screen
        name="profile" // app/(tabs)/profile.tsx
        options={{
          title: "프로필",
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
    width: 60, // 원형 크기
    height: 60, // 원형 크기
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000", // 그림자 효과
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5, // 안드로이드 그림자
  },
});
