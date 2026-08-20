import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";

export default function PropertyDetailSkeleton({ onBack }: { onBack: () => void }) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.skeletonBlock, { width: "100%", height: 320, opacity }]} />
      <View style={[styles.slidingCard, { marginTop: -28 }]}>
        <View style={styles.cardHandle} />
        <View style={{ padding: 20 }}>
          <Animated.View style={[styles.skeletonBlock, { width: "80%", height: 28, marginBottom: 12, opacity }]} />
          <Animated.View style={[styles.skeletonBlock, { width: "50%", height: 18, marginBottom: 20, opacity }]} />
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
            <Animated.View style={[styles.skeletonBlock, { flex: 1, height: 80, borderRadius: 16, opacity }]} />
            <Animated.View style={[styles.skeletonBlock, { flex: 1, height: 80, borderRadius: 16, opacity }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  skeletonBlock: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12,
  },
  slidingCard: {
    marginTop: -24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: Colors.surface,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: "center",
    marginBottom: 14,
  },
});
