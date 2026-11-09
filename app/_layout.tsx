import { ClerkProvider, ClerkLoaded, ClerkLoading, useAuth, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import {
  Stack,
  useRouter,
  useSegments,
  SplashScreen,
  usePathname,
  useGlobalSearchParams,
} from "expo-router";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import "@/global.css";
import { useFonts } from "expo-font";
import { useEffect, useRef } from "react";
import { Platform, View, ActivityIndicator } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { colors } from "@/constants/theme";

// Complete any pending auth session
WebBrowser.maybeCompleteAuthSession();

// Keep the native splash visible until we explicitly hide it
SplashScreen.preventAutoHideAsync().catch(() => {});

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? "";

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add your key to .env.\nRun: 1) clerk auth login  2) clerk link  3) clerk env pull — then restart the dev server."
  );
}

/**
 * Automatically captures screen views in PostHog based on Expo Router route changes.
 */
function PostHogScreenTracker() {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (pathname && posthog) {
      posthog.screen(pathname, params);
    }
  }, [pathname, params, posthog]);

  return null;
}

/**
 * Handles auth-based routing at the root level AND controls when the
 * splash screen is dismissed.
 */
function AuthGate() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const posthog = usePostHog();
  const segments = useSegments();
  const router = useRouter();
  const hasHiddenSplash = useRef(false);

  useEffect(() => {
    if (!isLoaded || !posthog) return;

    if (isSignedIn && user?.id) {
      posthog.identify(user.id, {
        email:
          user.primaryEmailAddress?.emailAddress ||
          user.emailAddresses[0]?.emailAddress ||
          "",
        name: user.fullName || user.firstName || "",
      });
    } else if (!isSignedIn) {
      posthog.reset();
    }
  }, [isSignedIn, isLoaded, user, posthog]);

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
    <PostHogProvider
      apiKey={posthogApiKey}
      options={{
        host: "https://us.i.posthog.com",
        flushAt: 1,
        flushInterval: 0,
      }}
      autocapture
      debug={__DEV__}
    >
      <PostHogScreenTracker />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
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
              <Stack.Screen name="sso-callback" options={{ headerShown: false }} />
            </Stack>
          </ClerkLoaded>
        </ClerkProvider>
      </View>
    </PostHogProvider>
  );
}
