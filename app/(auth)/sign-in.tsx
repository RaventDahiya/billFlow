import { View, Text } from "react-native";
import { Link } from "expo-router";
import React from "react";

const signIn = () => {
  return (
    <View>
      <Text>sign-in</Text>
      <Link
        href="/(auth)/sign-up"
        className="mt-4 rounded bg-success px-4 py-2"
      >
        sign up
      </Link>
    </View>
  );
};

export default signIn;
