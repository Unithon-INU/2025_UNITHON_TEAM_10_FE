import AuthApi from "@/api/auth";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { CommonActions } from "@react-navigation/native";
import { router, useNavigation } from "expo-router";
import { useState } from "react";
import { Alert, SafeAreaView } from "react-native";

export default function Page() {
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    nickname: "",
  });
  const setFormField = (key: keyof typeof registerForm, value: string) => {
    setRegisterForm((prev) => ({ ...prev, [key]: value }));
  };

  const register = () => {
    AuthApi.regsiter(
      registerForm.email,
      registerForm.password,
      registerForm.nickname
    )
      .then(() => {
        Alert.alert(
          "알림 ",
          "가입해주셔서 감사합니다! 즐거운 분리배출 생활이 되길 바라요!"
        );
        router.back();
      })
      .catch((e) => {
        console.error(e);
        Alert.alert("알림 ", "회원가입에 실패했어요.. 🥲");
      });
  };

  return (
    <SafeAreaView>
      <VStack className="h-full p-5 justify-between">
        <Box className="h-48 justify-center items-center">
          <Text className="text-title">회원가입</Text>
        </Box>
        <VStack className="gap-4">
          <VStack className="bg-white rounded-xl p-5 gap-2 ">
            <Text>이메일</Text>
            <Input className="border-0  drop-shadow-xl bg-background-500 rounded-xl h-14">
              <InputField
                placeholder={"ecomaster@where2throw.com"}
                className="font-nanum-square"
                value={registerForm.email}
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={(text) => setFormField("email", text)}
              />
            </Input>
          </VStack>
          <VStack className="bg-white rounded-xl p-5 gap-2 ">
            <Text>비밀번호</Text>
            <Input className="border-0  drop-shadow-xl bg-background-500 rounded-xl h-14">
              <InputField
                placeholder={"*******"}
                className="font-nanum-square"
                value={registerForm.password}
                type="password"
                secureTextEntry={true}
                onChangeText={(text) => setFormField("password", text)}
              />
            </Input>
          </VStack>
          <VStack className="bg-white rounded-xl p-5 gap-2 ">
            <Text>닉네임</Text>
            <Input className="border-0  drop-shadow-xl bg-background-500 rounded-xl h-14">
              <InputField
                placeholder={"에코마스터"}
                className="font-nanum-square"
                value={registerForm.nickname}
                onChangeText={(text) => setFormField("nickname", text)}
              />
            </Input>
          </VStack>
        </VStack>
        <Button className="rounded-xl" onPress={register}>
          <ButtonText>회원가입</ButtonText>
        </Button>
      </VStack>
    </SafeAreaView>
  );
}
