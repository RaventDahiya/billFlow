import "@/global.css";
import { Link } from "expo-router";

import { Text, View } from "react-native";
import subscription from "./subscription";
import { SafeAreaView as RNsafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";

const SafeAreaView = styled(RNsafeAreaView);

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-3xl font-bold text-center text-primary">home</Text>
    </SafeAreaView>
  );
}
