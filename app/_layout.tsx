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
import * as SecureStorage from "expo-secure-store";

export default function RootLayout() {
  const [loaded, error] = useFonts({
    NanumSquareNeo: require("/assets/fonts/NanumSquareNeo-Rg.ttf"),
    NanumSquareNeoBold: require("/assets/fonts/NanumSquareNeo-Bd.ttf"),
    NanumSquareNeoExtraBold: require("/assets/fonts/NanumSquareNeo-Eb.ttf"),
  });
  const [loginCheck, setLoginCheck] = useState<boolean>();

  const checkLogin = async () => {
    const token = await SecureStorage.getItemAsync("token");
    if (token)
      try {
        const res = await AuthApi.checkLogin();
        SplashScreen.hide();
        setLoginCheck(true);
        if (res) router.replace("/(tabs)");
        else router.replace("/(auth)/login");
      } catch (e) {
        router.replace("/(auth)/login");
        setLoginCheck(false);
      }
    else router.replace("/(auth)/login");
  };

  useEffect(() => {
    if (loaded) {
      checkLogin();
    }
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
            key="tabs"
            name="(tabs)"
            options={{ headerShown: false }}
          ></Stack.Screen>
          <Stack.Screen
            key="index"
            name="index"
            options={{ headerShown: false }}
          ></Stack.Screen>
          <Stack.Screen
            key="login"
            name="(auth)/login"
            options={{ headerShown: false }}
          ></Stack.Screen>
          <Stack.Screen
            key="register"
            name="(auth)/register"
            options={{
              headerTransparent: true,
              headerBackButtonDisplayMode: "minimal",
              headerTitle: ''
            }}
          ></Stack.Screen>
          <Stack.Screen
            key="article_read"
            name="article/[categoryId]/[id]"
            options={{
              title: "게시글",
              headerBackButtonDisplayMode: "minimal",
            }}
          ></Stack.Screen>
          <Stack.Screen
            key="article_write"
            name="article/[categoryId]/write"
            options={{
              title: "글 작성",
              headerBackButtonDisplayMode: "minimal",
              headerRight: () => (
                <Button>
                  <ButtonText>작성</ButtonText>
                </Button>
              ),
            }}
          ></Stack.Screen>

          <Stack.Screen
            key="scan"
            name="scan"
            options={{
              headerTitle: "물체 스캔",
              headerBackButtonDisplayMode: "minimal",
            }}
          ></Stack.Screen>

          <Stack.Screen
            key="settings"
            name="settings"
            options={{
              headerTitle: "설정",
              headerBackButtonDisplayMode: "minimal",
            }}
          ></Stack.Screen>
        </Stack>
      </QueryClientProvider>
    </GluestackUIProvider>
  );
}
