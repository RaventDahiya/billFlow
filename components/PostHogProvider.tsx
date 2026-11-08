import { type ReactNode } from "react";
import { PostHogProvider as ReactNativePostHogProvider } from "posthog-react-native";

import { posthog } from "@/lib/posthog";

type PostHogProviderProps = {
  children: ReactNode;
};

export function PostHogProvider({ children }: PostHogProviderProps) {
  if (!posthog) {
    return children;
  }

  return (
    <ReactNativePostHogProvider client={posthog}>
      {children}
    </ReactNativePostHogProvider>
  );
}
