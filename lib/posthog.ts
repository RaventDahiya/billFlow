import Constants from "expo-constants";
import PostHog from "posthog-react-native";

const extra = Constants.expoConfig?.extra;
const projectToken = extra?.posthogProjectToken as string | undefined;
const host = extra?.posthogHost as string | undefined;

function requirePostHogConfiguration(value: string | undefined, variableName: string) {
  if (!value && __DEV__) {
    throw new Error(
      `${variableName} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${variableName} is configured`,
    );
  }
}

requirePostHogConfiguration(projectToken, "POSTHOG_PROJECT_TOKEN");
requirePostHogConfiguration(host, "POSTHOG_HOST");

export const posthog =
  projectToken && host
    ? new PostHog(projectToken, {
        host,
        captureAppLifecycleEvents: true,
        preloadFeatureFlags: true,
        logs: {
          serviceName: "billflow-mobile",
          environment: __DEV__ ? "development" : "production",
        },
        errorTracking: {
          autocapture: {
            uncaughtExceptions: true,
            unhandledRejections: true,
            console: [],
          },
        },
      })
    : null;
