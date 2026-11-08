import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { useSignIn, useSSO } from "@clerk/expo";
import * as Linking from "expo-linking";
import clsx from "clsx";
import { colors } from "@/constants/theme";

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, errors, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSSOSubmitting, setIsSSOSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (!emailAddress.trim() || !password) {
      setFormError("Please enter your email and password.");
      return;
    }

    try {
      setFormError(null);
      setIsSubmitting(true);

      const { error } = await signIn.password({
        emailAddress: emailAddress.trim(),
        password,
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize();
        router.replace("/(tabs)");
      } else {
        setFormError(`Sign in requires additional steps: ${signIn.status}`);
      }
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.message ??
        err?.message ??
        "An error occurred during sign in.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setFormError(null);
      setIsSSOSubmitting(true);
      const redirectUrl = Linking.createURL("sso-callback");
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl,
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        err?.message ??
        "Failed to sign in with Google.";
      setFormError(msg);
    } finally {
      setIsSSOSubmitting(false);
    }
  }, [startSSOFlow, router]);

  const isLoading = isSubmitting || fetchStatus === "fetching";
  const emailFieldError = errors?.fields?.identifier?.message;
  const passwordFieldError = errors?.fields?.password?.message;
  const generalError = formError || errors?.global?.[0]?.message;

  return (
    <SafeAreaView
      className="auth-safe-area"
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="auth-screen"
      >
        <ScrollView
          className="auth-scroll"
          contentContainerClassName="auth-content"
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Header */}
          <View className="auth-brand-block">
            <View className="auth-logo-wrap">
              <View className="auth-logo-mark">
                <Text className="auth-logo-mark-text">B</Text>
              </View>
              <View>
                <Text className="auth-wordmark">BillFlow</Text>
                <Text className="auth-wordmark-sub">Subscription Tracker</Text>
              </View>
            </View>

            <Text className="auth-title">Welcome back</Text>
            <Text className="auth-subtitle">
              Sign in to manage and track all your recurring subscriptions
            </Text>
          </View>

          {/* Form Card */}
          <View className="auth-card">
            {generalError ? (
              <View className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3">
                <Text className="auth-error">{generalError}</Text>
              </View>
            ) : null}

            <View className="auth-form">
              {/* Email Field */}
              <View className="auth-field">
                <Text className="auth-label">Email address</Text>
                <TextInput
                  className={clsx(
                    "auth-input",
                    emailFieldError && "auth-input-error"
                  )}
                  value={emailAddress}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  onChangeText={(text) => {
                    setEmailAddress(text);
                    if (formError) setFormError(null);
                  }}
                  editable={!isLoading}
                />
                {emailFieldError ? (
                  <Text className="auth-error">{emailFieldError}</Text>
                ) : null}
              </View>

              {/* Password Field */}
              <View className="auth-field">
                <Text className="auth-label">Password</Text>
                <TextInput
                  className={clsx(
                    "auth-input",
                    passwordFieldError && "auth-input-error"
                  )}
                  value={password}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry
                  autoCapitalize="none"
                  onChangeText={(text) => {
                    setPassword(text);
                    if (formError) setFormError(null);
                  }}
                  editable={!isLoading}
                />
                {passwordFieldError ? (
                  <Text className="auth-error">{passwordFieldError}</Text>
                ) : null}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                className={clsx(
                  "auth-button",
                  isLoading && "auth-button-disabled"
                )}
                onPress={handleSignIn}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text className="auth-button-text">Sign In</Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View className="auth-divider-row">
                <View className="auth-divider-line" />
                <Text className="auth-divider-text">or continue with</Text>
                <View className="auth-divider-line" />
              </View>

              {/* Google SSO Button */}
              <TouchableOpacity
                className="auth-secondary-button"
                onPress={handleGoogleSignIn}
                disabled={isSSOSubmitting || isLoading}
                activeOpacity={0.8}
              >
                {isSSOSubmitting ? (
                  <ActivityIndicator color={colors.accent} size="small" />
                ) : (
                  <Text className="auth-secondary-button-text">
                    Continue with Google
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Switch to Sign Up */}
          <View className="auth-link-row">
            <Text className="auth-link-copy">{"Don't have an account?"}</Text>
            <Link href="/(auth)/sign-up" className="auth-link">
              Sign up
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
