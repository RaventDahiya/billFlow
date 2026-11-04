import { View, Text } from "react-native";
import React from "react";
import { Link } from "expo-router";

const signUp = () => {
  return (
    <View>
      <Text>signUp</Text>
      <Link
        href="/(auth)/sign-in"
        className="mt-4 rounded bg-success px-4 py-2"
      >
        sign in
      </Link>
    </View>
  );
};

export default signUp;
