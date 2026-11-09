import "@/global.css";

import { FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNsafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import images from "@/constants/images";
import {
  HOME_BALANCE,
  HOME_USER,
  UPCOMING_SUBSCRIPTIONS,
} from "@/constants/data";
import { icons } from "@/constants/icons";
import { formatCurrency } from "@/lib/utils";
import dayjs from "dayjs";
import React, { useState } from "react";
import ListHeading from "@/components/ListHeading";
import UpComingSubscriptionCard from "@/components/UpComingSubscriptionCard";
import SubscriptionCard from "@/components/SubscriptionCard";
import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";
import { useSubscriptions } from "@/lib/subscriptions";
import { useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";

const SafeAreaView = styled(RNsafeAreaView);

/**
 * Home screen component displaying balance, upcoming subscriptions, and active subscriptions.
 */
export default function App() {
  const router = useRouter();
  const { user } = useUser();
  const posthog = usePostHog();
  const [subscriptions, addSubscription] = useSubscriptions();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);

  /**
   * Opens the create subscription modal and tracks the event.
   */
  const handleOpenCreateModal = () => {
    posthog?.capture("create_subscription_modal_opened", {
      source: "home_header",
    });
    setIsModalVisible(true);
  };

  /**
   * Navigates to the subscriptions tab and logs the interaction.
   */
  const handleViewAll = () => {
    posthog?.capture("view_all_subscriptions_clicked", {
      total_count: subscriptions.length,
    });
    router.push("/(tabs)/subscription");
  };

  /**
   * Toggles the expansion state of a subscription card and logs analytics when expanded.
   */
  const handleToggleCard = (item: Subscription) => {
    const isExpanding = expandedSubscriptionId !== item.id;
    setExpandedSubscriptionId((current) =>
      current === item.id ? null : item.id
    );
    if (isExpanding) {
      posthog?.capture("subscription_card_expanded", {
        subscription_id: item.id,
        subscription_name: item.name,
        category: item.category ?? "",
        billing: item.billing,
        source: "home_screen",
      });
    }
  };

  /**
   * Adds a newly created subscription to the global subscription store.
   */
  const handleAddSubscription = (newSubscription: Subscription) => {
    addSubscription(newSubscription);
  };

  const userName =
    user?.firstName ||
    user?.fullName ||
    user?.emailAddresses[0]?.emailAddress?.split("@")[0] ||
    HOME_USER.name;

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <FlatList
        ListHeaderComponent={
          <>
            <View className="home-header">
              <View className="home-user">
                {user?.imageUrl ? (
                  <Image
                    source={{ uri: user.imageUrl }}
                    className="home-avatar"
                  />
                ) : (
                  <Image source={images.avatar} className="home-avatar" />
                )}
                <Text className="home-user-name">{userName}</Text>
              </View>
              <Pressable
                onPress={handleOpenCreateModal}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Image source={icons.add} className="home-add-icon" />
              </Pressable>
            </View>

            <View className="home-balance-card">
              <Text className="home-balance-label">Total Balance</Text>
              <View className="home-balance-row">
                <Text className="home-balance-amount">
                  {formatCurrency(HOME_BALANCE.amount)}
                </Text>
                <Text className="home-balance-date">
                  {dayjs(HOME_BALANCE.nextRenewalDate).format("MM/DD")}
                </Text>
              </View>
            </View>

            <View className="mb-5">
              <ListHeading title="Upcoming" />
              <FlatList
                data={UPCOMING_SUBSCRIPTIONS}
                renderItem={({ item }) => (
                  <UpComingSubscriptionCard {...item} />
                )}
                keyExtractor={(item) => item.name}
                horizontal
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={
                  <Text className="home-empty-state">
                    No upcoming subscription
                  </Text>
                }
              />
            </View>

            <ListHeading
              title="All Subscriptions"
              onViewAll={handleViewAll}
            />
          </>
        }
        data={subscriptions}
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
        ListEmptyComponent={
          <Text className="home-empty-state">No subscriptions yet...</Text>
        }
        contentContainerClassName="pb-30"
      />
      <CreateSubscriptionModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleAddSubscription}
      />
    </SafeAreaView>
  );
}
