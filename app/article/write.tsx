import { ButtonIcon } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { VStack } from "@/components/ui/vstack";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, KeyboardAvoidingView, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Image } from "@/components/ui/image";
import { Box } from "@/components/ui/box";
import { CloseIcon } from "@/components/ui/icon";

// ...

export default function Page() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const submit = () => {};
  const openImage = async () => {
    // ImagePicker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });
    if (result.assets) setImages((prev) => [...prev, ...result.assets]);
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
        <ScrollView
          className="p-5 bg-white"
          keyboardShouldPersistTaps="handled"
        >
          <VStack className="gap-5 flex-1">
            <HStack className="items-center gap-2">
              <Input variant="underlined" className="flex-1">
                <InputField placeholder="적고자 하는 글을 한줄로 표현한다면?" />
              </Input>
            </HStack>
            <HStack className="gap-2">
              <Textarea className="flex-1 h-72 rounded-xl">
                <TextareaInput placeholder="어떤 글을 적어볼까요?" />
              </Textarea>
            </HStack>
            <HStack>
              {images.map((image) => (
                <Box className="relative">
                  <Button
                    onPress={() => {}}
                    style={{ backgroundColor: "red" }}
                    variant="solid"
                    className="rounded-full absolute z-10 w-4 -top-4 -right-4"
                  >
                    <ButtonIcon as={CloseIcon} />
                  </Button>
                  <Image source={image.uri} className="w-32 h-32 rounded-xl" />
                </Box>
              ))}
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
