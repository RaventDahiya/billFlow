import { View, Text, TouchableOpacity } from "react-native";
import React from "react";

const ListHeading = ({ title, onPress, onViewAll }: ListHeadingProps) => {
  return (
    <View className="list-head">
      <Text className="list-title">{title}</Text>

      <TouchableOpacity
        className="list-action"
        onPress={onViewAll || onPress}
        activeOpacity={0.7}
      >
        <Text className="list-action-text">View All</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ListHeading;
