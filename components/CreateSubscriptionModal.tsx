import { SUBSCRIPTION_CATEGORIES } from "@/constants/data";
import { icons } from "@/constants/icons";
import { colors } from "@/constants/theme";
import { addSubscription } from "@/lib/subscriptions";
import { clsx } from "clsx";
import dayjs from "dayjs";
import { usePostHog } from "posthog-react-native";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export const CATEGORIES = SUBSCRIPTION_CATEGORIES;

export type Category = (typeof CATEGORIES)[number];
export type Frequency = "Monthly" | "Yearly";

export const CATEGORY_COLORS: Record<Category, string> = {
    Entertainment: "#fbd0d0",
    "AI Tools": "#d2f0ec",
    "Developer Tools": "#e8def8",
    Design: "#ffd6cc",
    Productivity: "#f5e6d3",
    "Cloud Storage": "#cce2ff",
};

/**
 * Modal dialog for creating and saving a new subscription with category, price, and billing frequency.
 */
export default function CreateSubscriptionModal({
    visible,
    onClose,
    onSubmit,
    onCreate,
    onAddSubscription,
}: CreateSubscriptionModalProps) {
    const posthog = usePostHog();
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [frequency, setFrequency] = useState<Frequency>("Monthly");
    const [category, setCategory] = useState<Category>("Entertainment");

    const trimmedPrice = price.trim();
    const isPriceNumeric = /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(trimmedPrice);
    const parsedPrice = isPriceNumeric ? parseFloat(trimmedPrice) : NaN;
    const isValid =
        name.trim().length > 0 && !isNaN(parsedPrice) && parsedPrice > 0;

    /**
     * Resets modal form fields to their default initial values.
     */
    const resetForm = () => {
        setName("");
        setPrice("");
        setFrequency("Monthly");
        setCategory("Entertainment");
    };

    /**
     * Closes the modal, logs dismissal analytics, and resets form fields.
     */
    const handleClose = () => {
        posthog?.capture("create_subscription_modal_closed", {
            had_name: Boolean(name.trim()),
            had_price: Boolean(price.trim()),
        });
        resetForm();
        onClose();
    };

    /**
     * Validates form inputs, creates the new subscription, and triggers callbacks and analytics.
     */
    const handleSubmit = () => {
        if (!isValid) return;

        const now = dayjs();
        const renewalDate =
            frequency === "Yearly"
                ? now.add(1, "year").toISOString()
                : now.add(1, "month").toISOString();

        const sanitizedName = name.trim();
        const idSlug =
            sanitizedName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "") || "sub";

        const newSubscription: Subscription = {
            id: `${idSlug}-${Date.now()}`,
            name: sanitizedName,
            price: parsedPrice,
            frequency,
            category,
            status: "active",
            startDate: now.toISOString(),
            renewalDate,
            icon: icons.wallet,
            billing: frequency,
            color: CATEGORY_COLORS[category] || "#efe5d9",
            currency: "USD",
        };

        addSubscription(newSubscription);
        onSubmit?.(newSubscription);
        onCreate?.(newSubscription);
        onAddSubscription?.(newSubscription);

        posthog?.capture("subscription_created", {
            subscription_id: newSubscription.id,
            subscription_name: newSubscription.name,
            subscription_price: newSubscription.price,
            subscription_frequency: frequency,
            subscription_category: category,
        });

        resetForm();
        onClose();
    };

    return (
        <Modal
            animationType="slide"
            transparent
            visible={visible}
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
            >
                <View className="modal-overlay">
                    <Pressable
                        className="flex-1"
                        onPress={handleClose}
                        accessibilityRole="button"
                        accessibilityLabel="Dismiss modal"
                    />
                    <View className="modal-container">
                        {/* Header */}
                        <View className="modal-header">
                            <Text className="modal-title">New Subscription</Text>
                            <TouchableOpacity
                                className="modal-close"
                                onPress={handleClose}
                                activeOpacity={0.7}
                                accessibilityRole="button"
                                accessibilityLabel="Close"
                            >
                                <Text className="modal-close-text">✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Body */}
                        <ScrollView
                            contentContainerClassName="modal-body"
                            contentContainerStyle={{ paddingBottom: 32 }}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            {/* Name Field */}
                            <View className="auth-field">
                                <Text className="auth-label">Name</Text>
                                <TextInput
                                    className="auth-input"
                                    placeholder="e.g. Netflix, Spotify"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                />
                            </View>

                            {/* Price Field */}
                            <View className="auth-field">
                                <Text className="auth-label">Price</Text>
                                <TextInput
                                    className="auth-input"
                                    placeholder="0.00"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={price}
                                    onChangeText={setPrice}
                                    keyboardType="decimal-pad"
                                />
                            </View>

                            {/* Frequency Field */}
                            <View className="auth-field">
                                <Text className="auth-label">Frequency</Text>
                                <View className="picker-row">
                                    <TouchableOpacity
                                        className={clsx(
                                            "picker-option",
                                            frequency === "Monthly" && "picker-option-active"
                                        )}
                                        onPress={() => setFrequency("Monthly")}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            className={clsx(
                                                "picker-option-text",
                                                frequency === "Monthly" && "picker-option-text-active"
                                            )}
                                        >
                                            Monthly
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        className={clsx(
                                            "picker-option",
                                            frequency === "Yearly" && "picker-option-active"
                                        )}
                                        onPress={() => setFrequency("Yearly")}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            className={clsx(
                                                "picker-option-text",
                                                frequency === "Yearly" && "picker-option-text-active"
                                            )}
                                        >
                                            Yearly
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Category Field */}
                            <View className="auth-field">
                                <Text className="auth-label">Category</Text>
                                <View className="category-scroll">
                                    {CATEGORIES.map((cat) => {
                                        const isSelected = category === cat;
                                        return (
                                            <TouchableOpacity
                                                key={cat}
                                                className={clsx(
                                                    "category-chip",
                                                    isSelected && "category-chip-active"
                                                )}
                                                onPress={() => setCategory(cat)}
                                                activeOpacity={0.7}
                                            >
                                                <Text
                                                    className={clsx(
                                                        "category-chip-text",
                                                        isSelected && "category-chip-text-active"
                                                    )}
                                                >
                                                    {cat}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                className={clsx(
                                    "auth-button",
                                    !isValid && "auth-button-disabled"
                                )}
                                disabled={!isValid}
                                onPress={handleSubmit}
                                activeOpacity={0.8}
                            >
                                <Text className="auth-button-text">Add Subscription</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
