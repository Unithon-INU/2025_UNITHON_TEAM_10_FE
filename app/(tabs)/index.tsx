import {
  SafeAreaView,
} from "react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";

import Login from "@/app/login";
import Main from "@/app/main"
import Scan from "@/app/scan";
import Test from "@/app/test";


export default function Index() {
  
  return (
    <SafeAreaView className="bg-white h-full ">
      <Login/>
    </SafeAreaView>
  );
}
