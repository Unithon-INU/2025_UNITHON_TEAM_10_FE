import { router, SplashScreen, Stack, Tabs } from "expo-router";
import { Alert, Appearance, DevSettings } from "react-native";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "../global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BottomTabBar, BottomTabView } from "@react-navigation/bottom-tabs";

export default function RootLayout() {
  const [loaded, error] = useFonts({
    NanumSquareNeo: require("/assets/fonts/NanumSquareNeo-Rg.ttf"),
    NanumSquareNeoBold: require("/assets/fonts/NanumSquareNeo-Bd.ttf"),
    NanumSquareNeoExtraBold: require("/assets/fonts/NanumSquareNeo-Eb.ttf"),
  });

  if (!loaded && !error) {
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
        </Stack>
      </QueryClientProvider>
    </GluestackUIProvider>
  );
}
