import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Colors } from "@/constants/colors";

export default function PropertySkeleton() {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.imageSkeleton, { opacity }]} />
      <View style={styles.content}>
        <Animated.View style={[styles.textSkeleton, { width: '60%', height: 24, opacity }]} />
        <Animated.View style={[styles.textSkeleton, { width: '40%', height: 16, marginTop: 8, opacity }]} />
        <View style={styles.divider} />
        <View style={styles.statsRow}>
          <Animated.View style={[styles.textSkeleton, { width: '30%', height: 40, opacity }]} />
          <Animated.View style={[styles.textSkeleton, { width: '40%', height: 40, opacity }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#0f1e22",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
    marginHorizontal: 16,
  },
  imageSkeleton: {
    height: 192,
    width: "100%",
    backgroundColor: Colors.surfaceContainerHighest,
  },
  content: {
    padding: 16,
  },
  textSkeleton: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    marginVertical: 14,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
