import React from "react";
import { View, Text } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";

export default function SubscriptionDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View>
      <Text>Subscription details: {id}</Text>
      <Link href="/">Go back</Link>
    </View>
  );
}
