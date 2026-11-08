import {
  ClerkProvider,
  ClerkLoaded,
  ClerkLoading,
  useAuth,
  useUser,
} from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Stack, useRouter, useSegments, SplashScreen } from "expo-router";
import "@/global.css";
import { useFonts } from "expo-font";
import { useEffect, useRef } from "react";
import { Platform, View, ActivityIndicator } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { colors } from "@/constants/theme";
import { PostHogProvider } from "@/components/PostHogProvider";
import { posthog } from "@/lib/posthog";

// Complete any pending auth session
WebBrowser.maybeCompleteAuthSession();

// Keep the native splash visible until we explicitly hide it
SplashScreen.preventAutoHideAsync().catch(() => {});

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add your key to .env.\nRun: 1) clerk auth login  2) clerk link  3) clerk env pull — then restart the dev server."
  );
}

/**
 * Handles auth-based routing at the root level AND controls when the
 * splash screen is dismissed.
 */
function AuthGate() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const segments = useSegments();
  const router = useRouter();
  const hasHiddenSplash = useRef(false);
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isUserLoaded) return;

    if (isSignedIn && user?.id) {
      if (identifiedUserId.current === user.id) return;

      if (identifiedUserId.current) {
        posthog?.reset();
      }

      posthog?.identify(user.id, {
        $set: {
          ...(user.primaryEmailAddress?.emailAddress
            ? { email: user.primaryEmailAddress.emailAddress }
            : {}),
          ...(user.firstName ? { first_name: user.firstName } : {}),
          ...(user.lastName ? { last_name: user.lastName } : {}),
        },
      });
      identifiedUserId.current = user.id;
    } else if (identifiedUserId.current) {
      posthog?.reset();
      identifiedUserId.current = null;
    }
  }, [isLoaded, isSignedIn, isUserLoaded, user]);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inCallback = (segments[0] as string) === "sso-callback";

    if (!isSignedIn && !inAuthGroup && !inCallback) {
      router.replace("/(auth)/sign-in");
    } else if (isSignedIn && (inAuthGroup || inCallback)) {
      router.replace("/(tabs)");
    }

    if (!hasHiddenSplash.current) {
      hasHiddenSplash.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isSignedIn, isLoaded, segments, router]);

  return null;
}

export default function RootLayout() {
  const [fontLoaded, fontError] = useFonts({
    "sans-bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "sans-extrabold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "sans-light": require("../assets/fonts/PlusJakartaSans-Light.ttf"),
    "sans-medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    "sans-regular": require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "sans-semibold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
  });

  useEffect(() => {
    if (fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontError]);

  if (!fontLoaded && !fontError) {
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <PostHogProvider>
        <ClerkProvider
          publishableKey={publishableKey}
          tokenCache={Platform.OS !== "web" ? tokenCache : undefined}
        >
          <ClerkLoading>
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
          </ClerkLoading>
          <ClerkLoaded>
            <AuthGate />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen
                name="sso-callback"
                options={{ headerShown: false }}
              />
            </Stack>
          </ClerkLoaded>
        </ClerkProvider>
      </PostHogProvider>
    </View>
  );
}
