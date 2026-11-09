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
import { useSignUp, useSSO } from "@clerk/expo";
import * as Linking from "expo-linking";
import { clsx } from "clsx";
import { usePostHog } from "posthog-react-native";
import { colors } from "@/constants/theme";

export default function SignUpScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const { signUp, errors, fetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSSOSubmitting, setIsSSOSubmitting] = useState(false);

  const handleSignUp = async () => {
    if (!emailAddress.trim() || !password) {
      setFormError("Please enter your email and password.");
      return;
    }

    try {
      setFormError(null);
      setIsSubmitting(true);
      posthog?.capture("user_sign_up_initiated", { method: "password" });

      const { error } = await signUp.password({
        emailAddress: emailAddress.trim(),
        password,
      });

      if (error) {
        setFormError(error.message);
        posthog?.capture("user_sign_up_failed", {
          method: "password",
          error: error.message,
        });
        return;
      }

      if (signUp.status === "complete") {
        posthog?.capture("user_sign_up_completed", { method: "password" });
        await signUp.finalize();
        router.replace("/(tabs)");
        return;
      }

      // Check if email verification is needed
      if (
        signUp.unverifiedFields.includes("email_address") ||
        signUp.status === "missing_requirements"
      ) {
        const { error: sendError } = await signUp.verifications.sendEmailCode();
        if (sendError) {
          setFormError(sendError.message);
          posthog?.capture("user_sign_up_failed", {
            method: "password",
            error: sendError.message,
          });
          return;
        }
        posthog?.capture("verification_code_sent");
        setPendingVerification(true);
      }
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.message ??
        err?.message ??
        "An error occurred during sign up.";
      setFormError(msg);
      posthog?.capture("user_sign_up_failed", {
        method: "password",
        error: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      setFormError("Please enter the verification code.");
      return;
    }

    try {
      setFormError(null);
      setIsSubmitting(true);

      const { error } = await signUp.verifications.verifyEmailCode({
        code: code.trim(),
      });

      if (error) {
        setFormError(error.message);
        posthog?.capture("verification_failed", { error: error.message });
        return;
      }

      if (signUp.status === "complete") {
        posthog?.capture("user_sign_up_completed", { method: "password" });
        await signUp.finalize();
        router.replace("/(tabs)");
      } else {
        setFormError(`Verification status: ${signUp.status}`);
      }
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.message ??
        err?.message ??
        "Verification failed. Please try again.";
      setFormError(msg);
      posthog?.capture("verification_failed", { error: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setFormError(null);
      setResendMessage(null);
      const { error } = await signUp.verifications.sendEmailCode();
      if (error) {
        setFormError(error.message);
      } else {
        posthog?.capture("verification_code_resent");
        setResendMessage("A new verification code has been sent.");
      }
    } catch (err: any) {
      setFormError(err?.message ?? "Failed to resend code.");
    }
  };

  const handleGoogleSignUp = useCallback(async () => {
    try {
      setFormError(null);
      setIsSSOSubmitting(true);
      posthog?.capture("user_sign_up_initiated", { method: "google_oauth" });
      const redirectUrl = Linking.createURL("sso-callback");
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl,
      });

      if (createdSessionId && setActive) {
        posthog?.capture("user_sign_up_completed", { method: "google_oauth" });
        await setActive({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        err?.message ??
        "Failed to continue with Google.";
      setFormError(msg);
      posthog?.capture("user_sign_up_failed", {
        method: "google_oauth",
        error: msg,
      });
    } finally {
      setIsSSOSubmitting(false);
    }
  }, [startSSOFlow, router, posthog]);

  const isLoading = isSubmitting || fetchStatus === "fetching";
  const emailFieldError = errors?.fields?.emailAddress?.message;
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

            <Text className="auth-title">
              {pendingVerification ? "Verify your email" : "Create account"}
            </Text>
            <Text className="auth-subtitle">
              {pendingVerification
                ? `Enter the 6-digit verification code sent to ${emailAddress}`
                : "Sign up to start tracking and optimizing your recurring subscriptions"}
            </Text>
          </View>

          {/* Form Card */}
          <View className="auth-card">
            {generalError ? (
              <View className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3">
                <Text className="auth-error">{generalError}</Text>
              </View>
            ) : null}

            {resendMessage ? (
              <View className="mb-4 rounded-xl border border-success/20 bg-success/10 p-3">
                <Text className="text-xs font-sans-medium text-success">
                  {resendMessage}
                </Text>
              </View>
            ) : null}

            {pendingVerification ? (
              <View className="auth-form">
                {/* Code Field */}
                <View className="auth-field">
                  <Text className="auth-label">Verification Code</Text>
                  <TextInput
                    className="auth-input"
                    value={code}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="number-pad"
                    autoComplete="one-time-code"
                    onChangeText={(text) => {
                      setCode(text);
                      if (formError) setFormError(null);
                    }}
                    editable={!isLoading}
                  />
                  <Text className="auth-helper">
                    {"Check your spam folder if you don't see it in your inbox."}
                  </Text>
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  className={clsx(
                    "auth-button",
                    isLoading && "auth-button-disabled"
                  )}
                  onPress={handleVerify}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text className="auth-button-text">Verify Email</Text>
                  )}
                </TouchableOpacity>

                {/* Resend Code Button */}
                <TouchableOpacity
                  className="auth-secondary-button"
                  onPress={handleResendCode}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text className="auth-secondary-button-text">
                    Resend Code
                  </Text>
                </TouchableOpacity>

                {/* Back to sign up button */}
                <TouchableOpacity
                  onPress={() => {
                    setPendingVerification(false);
                    setCode("");
                    setFormError(null);
                    setResendMessage(null);
                  }}
                  className="mt-2 items-center py-2"
                >
                  <Text className="text-sm font-sans-medium text-muted-foreground">
                    ← Change email address
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
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
                    placeholder="Create a strong password"
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
                  onPress={handleSignUp}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text className="auth-button-text">Create Account</Text>
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
                  onPress={handleGoogleSignUp}
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
            )}
          </View>

          {/* Switch to Sign In */}
          {!pendingVerification && (
            <View className="auth-link-row">
              <Text className="auth-link-copy">Already have an account?</Text>
              <Link href="/(auth)/sign-in" className="auth-link">
                Sign in
              </Link>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
