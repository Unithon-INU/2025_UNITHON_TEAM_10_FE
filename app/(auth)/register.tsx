import AuthApi, { EmailRegex, PasswordRegex } from "@/api/auth";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { CommonActions } from "@react-navigation/native";
import { router, useNavigation } from "expo-router";
import { HTTPError } from "ky";
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
    if (!EmailRegex.test(registerForm.email))
      return Alert.alert("알림", "이메일 형식이 올바르지 않아요.. 🥲");
    else if (!PasswordRegex.test(registerForm.password))
      return Alert.alert(
        "알림",
        "비밀번호는 영대소문자, 숫자, 특수문자를 포함해 8자 이상이어야 해요."
      );
    else if (registerForm.nickname.length < 4)
      return Alert.alert("알림", "닉네임은 4자 이상이어야 해요.");
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
        console.log(e);
        if (e instanceof HTTPError) {
          switch (e.response.status) {
            case 409: {
              Alert.alert("오류", "이미 존재하는 이메일이예요.");
              break;
            }
            case 400: {
              Alert.alert("오류", "올바르게 입력되지 않은 항목이 있어요.");
              break; 
            }
            default:
              Alert.alert("알림 ", "회원가입에 실패했어요.. 🥲");
          }
        }
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
