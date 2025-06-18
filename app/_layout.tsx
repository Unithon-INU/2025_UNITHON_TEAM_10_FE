import { router, SplashScreen, Stack, Tabs } from "expo-router";
import { Alert, Appearance, DevSettings } from "react-native";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "../global.css";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { BottomTabBar, BottomTabView } from "@react-navigation/bottom-tabs";
import AuthApi from "@/api/auth";
import { Button, ButtonText } from "@/components/ui/button";

export default function RootLayout() {
  const [loaded, error] = useFonts({
    NanumSquareNeo: require("/assets/fonts/NanumSquareNeo-Rg.ttf"),
    NanumSquareNeoBold: require("/assets/fonts/NanumSquareNeo-Bd.ttf"),
    NanumSquareNeoExtraBold: require("/assets/fonts/NanumSquareNeo-Eb.ttf"),
  });
  const [loginCheck, setLoginCheck] = useState<boolean>();

  useEffect(() => {
    if (loaded)
      AuthApi.checkLogin().then((res) => {
        SplashScreen.hide();
        setLoginCheck(res);
        if (res) router.replace("/(tabs)");
        else router.replace("/(auth)/login");
      });
  }, [loaded]);

  // loginCheck 로딩중일 때 포함
  if (!loaded && !error && loginCheck === undefined) {
    return null;
  }

  DevSettings.addMenuItem("Go to", () => {
    Alert.prompt("어디로 갈까요", "", (message) => {
      router.replace(message as any);
    });
  });

  const queryClient = new QueryClient();
  return (
    <GluestackUIProvider>
      <QueryClientProvider client={queryClient}>
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          ></Stack.Screen>
          <Stack.Screen
            name="index"
            options={{ headerShown: false }}
          ></Stack.Screen>
          <Stack.Screen
            name="(auth)/login"
            options={{ headerShown: false }}
          ></Stack.Screen>
          <Stack.Screen
            name="article/[id]"
            options={{
              title: "게시글",
              headerBackButtonDisplayMode: "minimal",
            }}
          ></Stack.Screen>
          <Stack.Screen
            name="article/write"
            options={{
              title: "글 작성",
              headerBackButtonDisplayMode: "minimal",
              headerRight: () => <Button><ButtonText>작성</ButtonText></Button>,
            }}
          ></Stack.Screen>

          <Stack.Screen
            name="scan"
            options={{
              headerTitle: "물체 스캔",
              headerBackButtonDisplayMode: "minimal",
            }}
          ></Stack.Screen>
        </Stack>
      </QueryClientProvider>
    </GluestackUIProvider>
  );
}
