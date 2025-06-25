import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Alert, SafeAreaView, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { ChevronRightIcon, Icon } from "@/components/ui/icon";
import AuthApi from "@/api/auth";
import * as SecureStorage from "expo-secure-store";
import { useNavigation } from "expo-router";
import { CommonActions } from "@react-navigation/native";

export default function Page() {
  const navigation = useNavigation();
  return (
    <SafeAreaView>
      <VStack className="">
        <TouchableOpacity
          className="p-5 bg-white gap-5"
          onPress={() =>
            Alert.alert("로그아웃", "정말로 로그아웃할까요?", [
              { text: "아니오" },
              {
                text: "예",
                onPress: async () => {
                  try {
                    await AuthApi.logout();
                    await SecureStorage.deleteItemAsync("token");

                    navigation.dispatch(
                      CommonActions.reset({
                        routes: [{ name: "(auth)/login" }],
                      })
                    );
                  } catch (e) {
                    Alert.alert("알림", "로그아웃에 실패했어요.");
                  }
                },
              },
            ])
          }
        >
          <HStack className="justify-between  ">
            <Text>로그아웃</Text> <Icon as={ChevronRightIcon} />
          </HStack>
        </TouchableOpacity>
      </VStack>
    </SafeAreaView>
  );
}
