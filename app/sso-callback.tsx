import { View, ActivityIndicator } from "react-native";
import { colors } from "@/constants/theme";

export default function SsoCallbackScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

