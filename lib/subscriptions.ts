import { useSyncExternalStore } from "react";
import { HOME_SUBSCRIPTIONS } from "@/constants/data";

let currentSubscriptions: Subscription[] = [...HOME_SUBSCRIPTIONS];
const listeners = new Set<() => void>();

export const getSubscriptions = (): Subscription[] => {
  return currentSubscriptions;
};

export const addSubscription = (newSub: Subscription): Subscription[] => {
  if (currentSubscriptions.some((sub) => sub.id === newSub.id)) {
    return currentSubscriptions;
  }

  currentSubscriptions = [newSub, ...currentSubscriptions];

  if (!HOME_SUBSCRIPTIONS.some((sub) => sub.id === newSub.id)) {
    HOME_SUBSCRIPTIONS.unshift(newSub);
  }

  listeners.forEach((listener) => listener());
  return currentSubscriptions;
};

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

