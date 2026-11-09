import "@/global.css";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView as RNsafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import { clsx } from "clsx";

import SubscriptionCard from "@/components/SubscriptionCard";
import { colors } from "@/constants/theme";
import { formatCurrency } from "@/lib/utils";
import { useSubscriptions } from "@/lib/subscriptions";
import { usePostHog } from "posthog-react-native";

const SafeAreaView = styled(RNsafeAreaView);

/**
 * Screen displaying the user's subscriptions list with search, category filtering, and monthly cost aggregation.
 */
export default function SubscriptionsScreen() {
  const posthog = usePostHog();
  const [subscriptions] = useSubscriptions();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derive unique categories from dataset
  const categories = useMemo(() => {
    const unique = new Set<string>();
    subscriptions.forEach((sub) => {
      if (sub.category) {
        unique.add(sub.category);
      }
    });
    return ["All", ...Array.from(unique)];
  }, [subscriptions]);

  // Filter subscriptions based on search query and category
  const filteredSubscriptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return subscriptions.filter((sub) => {
      const matchesCategory =
        selectedCategory === "All" ||
        sub.category?.toLowerCase() === selectedCategory.toLowerCase();

      if (!matchesCategory) return false;

      if (!query) return true;

      const nameMatch = sub.name.toLowerCase().includes(query);
      const categoryMatch = sub.category?.toLowerCase().includes(query);
      const planMatch = sub.plan?.toLowerCase().includes(query);
      const billingMatch = sub.billing?.toLowerCase().includes(query);
      const statusMatch = sub.status?.toLowerCase().includes(query);
      const paymentMatch = sub.paymentMethod?.toLowerCase().includes(query);

      return Boolean(
        nameMatch ||
          categoryMatch ||
          planMatch ||
          billingMatch ||
          statusMatch ||
          paymentMatch
      );
    });
  }, [subscriptions, searchQuery, selectedCategory]);

  // Compute total monthly equivalent for filtered items
  const totalCost = useMemo(() => {
    return filteredSubscriptions.reduce((sum, item) => {
      const price = item.price || 0;
      // If yearly, approximate monthly cost
      const monthlyAmount = item.billing === "Yearly" ? price / 12 : price;
      return sum + monthlyAmount;
    }, 0);
  }, [filteredSubscriptions]);

  const filteredCountRef = useRef(filteredSubscriptions.length);
  filteredCountRef.current = filteredSubscriptions.length;

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Resets active search query and category filters to default state.
   */
  const handleClearFilters = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    posthog?.capture("subscription_filters_cleared", {
      had_search: Boolean(searchQuery),
      previous_category: selectedCategory,
    });
    setSearchQuery("");
    setSelectedCategory("All");
  };

  /**
   * Filters displayed subscriptions by the selected category and logs the event.
   */
  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    posthog?.capture("subscription_category_filtered", { category: cat });
  };

  /**
   * Updates the search query filter state and logs search events for longer queries.
   */
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmedLength = text.trim().length;
    if (trimmedLength >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        posthog?.capture("subscriptions_searched", {
          query_length: trimmedLength,
          result_count: filteredCountRef.current,
        });
      }, 300);
    }
  };

  /**
   * Toggles the expanded details view of a subscription card and tracks the interaction.
   */
  const handleToggleCard = (item: Subscription) => {
    const isExpanding = expandedSubscriptionId !== item.id;
    setExpandedSubscriptionId((current) => (current === item.id ? null : item.id));
    if (isExpanding) {
      posthog?.capture("subscription_card_expanded", {
        subscription_id: item.id,
        subscription_name: item.name,
        category: item.category ?? "",
        billing: item.billing,
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <FlatList
        ListHeaderComponent={
          <>
            {/* Header */}
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-3xl font-sans-bold text-primary">
                  Subscriptions
                </Text>
                <Text className="mt-1 text-sm font-sans-medium text-muted-foreground">
                  {filteredSubscriptions.length}{" "}
                  {filteredSubscriptions.length === 1
                    ? "subscription"
                    : "subscriptions"}{" "}
                  • {formatCurrency(totalCost)}/mo
                </Text>
              </View>

              {(searchQuery.length > 0 || selectedCategory !== "All") && (
                <TouchableOpacity
                  onPress={handleClearFilters}
                  className="rounded-full border border-black/15 bg-card px-3 py-1.5"
                  activeOpacity={0.7}
                >
                  <Text className="text-xs font-sans-semibold text-primary">
                    Reset
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Search Input Bar */}
            <View className="mb-4 flex-row items-center rounded-2xl border border-border bg-card px-3.5 py-3">
              <Ionicons
                name="search"
                size={20}
                color={colors.mutedForeground}
              />
              <TextInput
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder="Search by name, category, or plan..."
                placeholderTextColor={colors.mutedForeground}
                className="ml-2.5 flex-1 font-sans-medium text-base text-primary"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                clearButtonMode="never"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel="Clear search text"
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Category Filter Chips */}
            <View className="mb-5">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="flex-row gap-2 py-1"
              >
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => handleSelectCategory(cat)}
                      className={clsx(
                        "category-chip",
                        isActive && "category-chip-active"
                      )}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={clsx(
                          "category-chip-text",
                          isActive && "category-chip-text-active"
                        )}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </>
        }
        data={filteredSubscriptions}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() => handleToggleCard(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View className="h-4" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 96 }}
        contentContainerClassName="pb-30"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          <View className="items-center justify-center py-16 px-4">
            <View className="mb-4 size-16 items-center justify-center rounded-full border border-border bg-card">
              <Ionicons
                name="search-outline"
                size={28}
                color={colors.mutedForeground}
              />
            </View>
            <Text className="text-center text-xl font-sans-bold text-primary">
              No subscriptions found
            </Text>
            <Text className="mt-1 max-w-[280px] text-center text-sm font-sans-medium text-muted-foreground">
              {searchQuery
                ? `No results match "${searchQuery}". Try a different search term or category.`
                : "No subscriptions found in this category."}
            </Text>
            {(searchQuery.length > 0 || selectedCategory !== "All") && (
              <TouchableOpacity
                onPress={handleClearFilters}
                className="mt-5 rounded-full border border-accent/40 bg-accent/10 px-5 py-2.5"
                activeOpacity={0.7}
              >
                <Text className="text-sm font-sans-semibold text-accent">
                  Clear search & filters
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}
