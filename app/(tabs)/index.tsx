import "@/global.css";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import subscription from "./subscription";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-bold text-success">
        Welcome to Nativewind!
      </Text>
      <Link href="/onboarding" className="mt-4 rounded bg-success px-4 py-2">
        <Text className="text-background">Get Started</Text>
      </Link>
      <Link
        href="/(auth)/sign-in"
        className="mt-4 rounded bg-success px-4 py-2"
      >
        <Text className="text-background">sign in</Text>
      </Link>
      <Link
        href="/(auth)/sign-up"
        className="mt-4 rounded bg-success px-4 py-2"
      >
        <Text className="text-background">sign up</Text>
      </Link>
      <Link
        href={{
          pathname: "/subscriptions/[id]",
          params: { id: "spotify" },
        }}
      >
        <Text className="text-background">spotify subscription</Text>
      </Link>
      <Link
        href={{
          pathname: "/subscriptions/[id]",
          params: { id: "claude" },
        }}
        className="mt-4 rounded bg-success px-4 py-2"
      >
        <Text className="text-background">claude subscription</Text>
      </Link>
    </View>
  );
}
