import React, { useState } from "react";
import { SafeAreaView, ScrollView, TouchableHighlight } from "react-native";
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from "@react-navigation/native";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Divider } from "@/components/ui/divider";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { router} from "expo-router";


export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);

   const handleLogin = () => {
    router.navigate("/(tabs)");
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
                placeholder="아이디를 입력해주세요."
                className="font-nanum-square"
              />
            </Input>
          </HStack>

          <HStack className="py-2 bg-background-500 rounded-t-xl">
            <Input className="border-0 text-center drop-shadow-xl w-[100%]">
              <InputField
                placeholder="비밀번호를 입력해주세요."
                secureTextEntry={!showPassword}
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
