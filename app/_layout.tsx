import { router, Stack } from "expo-router";
import { Alert, DevSettings } from "react-native";

export default function RootLayout() {

  DevSettings.addMenuItem('Go to', () => {
    Alert.prompt("어디로 갈까요", "", (message) => {
          router.replace(message as any );
    });
  })
  return <Stack />;
}
