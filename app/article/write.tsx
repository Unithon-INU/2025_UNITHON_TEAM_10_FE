import { ButtonIcon } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { VStack } from "@/components/ui/vstack";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { useEffect } from "react";
import { Platform, KeyboardAvoidingView, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// ...

export default function Page() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const submit = () => {};
  const openImage = () => {
    // ImagePicker
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <Text onPress={submit}>작성</Text>,
    });
  }, [navigation]);

  return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top + insets.bottom} // 헤더 높이에 따라 조정
      >
        <VStack className="justify-between flex-1">
          <ScrollView className="p-5 bg-white" keyboardShouldPersistTaps="handled">
            <VStack className="gap-5 flex-1">
              <HStack className="items-center gap-2">
                <Input variant="underlined" className="flex-1">
                  <InputField placeholder="제목을 적어주세요." />
                </Input>
              </HStack>
              <HStack className="gap-2">
                <Textarea className="flex-1 h-72">
                  <TextareaInput placeholder="어떤 글을 적어볼까요?" />
                </Textarea>
              </HStack>
            </VStack>
          </ScrollView>

          {/* 하단 도구 모음 */}
          <HStack
            className="px-4 py-3 border-t border-gray-200"
            style={{ paddingBottom: insets.bottom }}
          >
            <Button
              style={{ backgroundColor: "transparent" }}
              onPress={openImage}
            >
              <ButtonIcon as={() => <FontAwesome name="photo" />} />
              <Text>사진</Text>
            </Button>
          </HStack>
        </VStack>
      </KeyboardAvoidingView>
  );
}
