import React from "react";
import { View, Text, TouchableOpacity, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser, useClerk } from "@clerk/expo";
import { usePostHog } from "posthog-react-native";
import images from "@/constants/images";

export default function SettingsScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const posthog = usePostHog();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            posthog?.capture("user_signed_out");
            posthog?.reset();
            await signOut();
          } catch (err: any) {
            Alert.alert("Error", err?.message ?? "Failed to sign out");
          }
        },
      },
    ]);
  };

  const displayName =
    user?.fullName ||
    user?.firstName ||
    user?.emailAddresses[0]?.emailAddress?.split("@")[0] ||
    "User";
  const displayEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses[0]?.emailAddress ||
    "";

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-3xl font-sans-bold text-primary mb-6">
        Settings
      </Text>

      {/* User Profile Card */}
      <View className="rounded-3xl border border-border bg-card p-5 mb-6">
        <View className="flex-row items-center gap-4">
          {user?.imageUrl ? (
            <Image
              source={{ uri: user.imageUrl }}
              className="size-16 rounded-full"
            />
          ) : (
            <Image source={images.avatar} className="size-16 rounded-full" />
          )}
          <View className="flex-1">
            <Text className="text-xl font-sans-bold text-primary">
              {displayName}
            </Text>
            {displayEmail ? (
              <Text className="text-sm font-sans-medium text-muted-foreground mt-0.5">
                {displayEmail}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Account Actions */}
      <View className="gap-3">
        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.8}
          className="items-center rounded-2xl border border-destructive/30 bg-destructive/10 py-4"
        >
          <Text className="text-base font-sans-bold text-destructive">
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
