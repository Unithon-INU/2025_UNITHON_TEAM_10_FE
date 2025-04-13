import React from "react";
import { Text, View } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from "react-native-vision-camera";
export default function Index() {
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();

  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'ean-8'],
    onCodeScanned: (codes) => {
      console.log(codes[0].value)
      
    }
  })
  

  if (!hasPermission) {
    requestPermission()
  
    return (
      <View>
        <Text>No Permission</Text>
      </View>
    );
  }
  if (device == null)
    return (
      <View>
        <Text>No Camera</Text>
      </View>
    );



  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Camera style={{position:'absolute', top:0, left:0, right:0,bottom:0}} device={device} isActive codeScanner={codeScanner}  />
      <Text>Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}
