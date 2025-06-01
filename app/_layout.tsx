import { router, SplashScreen, Stack } from "expo-router";
import { Alert, Appearance, DevSettings } from "react-native";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "../global.css";

export default function RootLayout() {
  const [loaded, error] = useFonts({
    NanumSquareNeo: require("/assets/fonts/NanumSquareNeo-Variable.ttf"),
  });
  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  DevSettings.addMenuItem("Go to", () => {
    Alert.prompt("어디로 갈까요", "", (message) => {
      router.replace(message as any);
    });
  });
  return (
    <GluestackUIProvider>
      <Stack>
        <Stack.Screen name="index" options={{headerShown: false}}></Stack.Screen>
      </Stack>
    </GluestackUIProvider>
  );
}
