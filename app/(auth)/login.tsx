import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  TouchableHighlight,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Divider } from "@/components/ui/divider";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { router } from "expo-router";
import AuthApi, { EmailRegex, PasswordRegex } from "@/api/auth";
import * as SecureStorage from "expo-secure-store";
import { HTTPError } from "ky";

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const setFormField = (key: keyof typeof loginForm, value: string) => {
    setLoginForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogin = async () => {
    if (!EmailRegex.test(loginForm.email))
      return Alert.alert("알림", "이메일 형식이 올바르지 않아요.. 🥲");

    try {
      const token = await AuthApi.login(loginForm.email, loginForm.password);
      await SecureStorage.setItemAsync("token", token);
      router.navigate("/(tabs)");
    } catch (e) {
      console.log(e);
      if (e instanceof HTTPError) {
        switch (e.response.status) {
          case 400: {
            Alert.alert("오류", "올바르게 입력되지 않은 항목이 있어요.");
            break;
          }
          case 401: {
            Alert.alert("오류", "비밀번호가 일치하지 않아요.");
            break;
          }
          case 404: {
            Alert.alert("오류", "존재하지 않는 계정이네요..");
            break;
          }
        }
      } else Alert.alert("오류", "로그인에 실패했어요.. 🥲");
    }
  };

  return (
    <SafeAreaView>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 24,
          paddingTop: 48,
          backgroundColor: "#FFFFFF",
        }}
      >
        <Box className="py-36 items-center">
          <Text className="text-title font-nanum-square-bold">로그인</Text>
        </Box>

        <VStack className="gap-5">
          <HStack className="py-2 bg-background-500 rounded-t-xl">
            <Input className="border-0 text-center drop-shadow-xl w-[100%]">
              <InputField
                placeholder="이메일을 입력해주세요."
                className="font-nanum-square"
                value={loginForm.email}
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={(value) => setFormField("email", value)}
              />
            </Input>
          </HStack>

          <HStack className="py-2 bg-background-500 rounded-t-xl">
            <Input className="border-0 text-center drop-shadow-xl w-[100%]">
              <InputField
                placeholder="비밀번호를 입력해주세요."
                secureTextEntry={!showPassword}
                value={loginForm.password}
                onChangeText={(value) => setFormField("password", value)}
              />
            </Input>
          </HStack>

          <Button onPress={handleLogin}>
            <Text>로그인</Text>
          </Button>
        </VStack>

        <HStack className="py-5">
          <TouchableHighlight
            className="w-[50%] items-center"
            underlayColor="transparent"
          >
            <Text>계정 찾기</Text>
          </TouchableHighlight>
          <TouchableHighlight
            className="w-[50%] items-center"
            underlayColor="transparent"
            onPress={() => router.push("/(auth)/register")}
          >
            <Text>회원가입</Text>
          </TouchableHighlight>
        </HStack>

        {/* <HStack className="items-center">
          <TouchableHighlight underlayColor="transparent">
            <FontAwesome name="apple" size={32} />
          </TouchableHighlight>
          <TouchableHighlight underlayColor="transparent">
            <FontAwesome name="google" size={32} />
          </TouchableHighlight>
        </HStack> */}
      </ScrollView>
    </SafeAreaView>
  );
}
