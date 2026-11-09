import { useSyncExternalStore } from "react";
import { HOME_SUBSCRIPTIONS } from "@/constants/data";

let currentSubscriptions: Subscription[] = [...HOME_SUBSCRIPTIONS];
const listeners = new Set<() => void>();

/**
 * Retrieves the current list of subscriptions.
 */
export const getSubscriptions = (): Subscription[] => {
  return currentSubscriptions;
};

/**
 * Adds a new subscription to the in-memory store and notifies subscribers.
 */
export const addSubscription = (newSub: Subscription): Subscription[] => {
  if (currentSubscriptions.some((sub) => sub.id === newSub.id)) {
    return currentSubscriptions;
  }

  currentSubscriptions = [newSub, ...currentSubscriptions];

  listeners.forEach((listener) => listener());
  return currentSubscriptions;
};

/**
 * React hook to subscribe to and update the global subscription state.
 */
export const useSubscriptions = (): [
  Subscription[],
  (newSub: Subscription) => void
] => {
  const subscriptions = useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => {
        listeners.delete(onStoreChange);
      };
    },
    getSubscriptions,
    getSubscriptions
  );

  return [subscriptions, addSubscription];
};

