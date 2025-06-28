import { ButtonIcon } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { VStack } from "@/components/ui/vstack";
import { FontAwesome } from "@expo/vector-icons";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Platform, KeyboardAvoidingView, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Image } from "@/components/ui/image";
import { Box } from "@/components/ui/box";
import { CloseIcon } from "@/components/ui/icon";
import api from "@/api/api";

export default function Page() {
  const navigation = useNavigation();
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();

  const insets = useSafeAreaInsets();
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const submit = useCallback(async (title: string, content: string) => {
    try {
      const result = await api.post(`posts/${categoryId}/write`, {
        json: {
          title,
          content,
          images: [],
        },
        headers: {
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJja20wNzI4d2FzaEBnbWFpbC5jb20iLCJpYXQiOjE3NTA2NjMxMDMsImV4cCI6MTc1MDc0OTUwM30.nn7cRRZ1D7mr9opPri7D8uXNN3xqFyvqnvSwKT_oaOA",
        },
      });
      if (!result.ok) throw new Error();
      else {
        alert("글을 작성했어요!");
        router.back();
      }
    } catch (e) {
      console.error(e);
      alert("글 작성에 실패했어요.. 🥲");
    }
  }, [title, content, images]);
  const openImage = async () => {
    // ImagePicker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });
    if (result.assets) {
      const uploadedImages: string[] = [];
      for (const image of result.assets) {
        if (!image.base64 || !image.fileName) continue;
        const buffer = Buffer.from(image.base64, "base64");
        // minioClient
        //   .putObject("where2throw", image.fileName, buffer)
        //   .then((_) => uploadedImages.push(image.assetId!));
      }
      // 이미지 업로드가 성공한 것만
      setImages((prev) => [
        ...prev,
        ...result.assets.filter(({ assetId }) =>
          uploadedImages.includes(assetId!)
        ),
      ]);
      // Todo: 오브젝트 스토리지에서 사진 가져오기
      // setImageUrls(minioClient.getObject(''))
    }
  };

useEffect(() => {
  navigation.setOptions({
    headerRight: () => (
      <Text onPress={() => {
        // 항상 최신 상태 사용
        submit(title, content);
      }}>
        작성
      </Text>
    ),
  });
}, [navigation, title, content, submit]);

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
                <InputField
                  placeholder="적고자 하는 글을 한줄로 표현한다면?"
                  value={title}
                  onChangeText={setTitle}
                />
              </Input>
            </HStack>
            <HStack className="gap-2">
              <Textarea className="flex-1 h-72 rounded-xl">
                <TextareaInput
                  placeholder="어떤 글을 적어볼까요?"
                  value={content}
                  onChangeText={setContent}
                />
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
        {/* <HStack
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
        </HStack> */}
      </VStack>
    </KeyboardAvoidingView>
  );
}
