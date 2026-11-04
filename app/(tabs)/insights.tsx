import { View, Text } from "react-native";
import React from "react";
import { SafeAreaView as RNsafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";

const SafeAreaView = styled(RNsafeAreaView);
const insights = () => {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-3xl font-bold text-center text-primary">
        insights
      </Text>
    </SafeAreaView>
  );
};

export default insights;
