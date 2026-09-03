// import React, { useRef, useEffect } from "react";
// import { View, Text, Animated, StyleSheet } from "react-native";
// import { Colors } from "@/constants/colors";

// export default function BouncingDots({ label }: { label: string }) {
//   const dot1 = useRef(new Animated.Value(0)).current;
//   const dot2 = useRef(new Animated.Value(0)).current;
//   const dot3 = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     const makeBounce = (dot: Animated.Value, delay: number) =>
//       Animated.loop(
//         Animated.sequence([
//           Animated.delay(delay),
//           Animated.timing(dot, { toValue: -7, duration: 280, easing: (t) => t * t * (3 - 2 * t), useNativeDriver: true }),
//           Animated.timing(dot, { toValue: 0,  duration: 280, easing: (t) => t * t * (3 - 2 * t), useNativeDriver: true }),
//           Animated.delay(Math.max(0, 900 - delay - 560)),
//         ])
//       );

//     const a1 = makeBounce(dot1, 0);
//     const a2 = makeBounce(dot2, 150);
//     const a3 = makeBounce(dot3, 300);
//     a1.start(); a2.start(); a3.start();

//     return () => { a1.stop(); a2.stop(); a3.stop(); };
//   }, [dot1, dot2, dot3]);

//   return (
//     <View style={styles.loadingRow}>
//       <Text style={styles.primaryButtonText}>{label}</Text>
//       <View style={styles.dotsRow}>
//         {[dot1, dot2, dot3].map((dot, i) => (
//           <Animated.View key={i} style={[styles.bounceDot, { transform: [{ translateY: dot }] }]} />
//         ))}
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
//   dotsRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
//   bounceDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.onPrimary },
//   primaryButtonText: { fontSize: 14, fontWeight: "600", color: Colors.onPrimary },
// });


import React, { useRef, useEffect } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";

interface BouncingDotsProps {
  label: string;
}

export default function BouncingDots({ label }: BouncingDotsProps) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeBounce = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -7, duration: 280, easing: (t) => t * t * (3 - 2 * t), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 280, easing: (t) => t * t * (3 - 2 * t), useNativeDriver: true }),
          Animated.delay(Math.max(0, 900 - delay - 560)),
        ])
      );

    const a1 = makeBounce(dot1, 0);
    const a2 = makeBounce(dot2, 150);
    const a3 = makeBounce(dot3, 300);
    a1.start(); a2.start(); a3.start();

    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.loadingRow}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.dotsRow}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[styles.bounceDot, { transform: [{ translateY: dot }] }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  label: { fontSize: 14, fontWeight: "600", color: Colors.onPrimary },
  dotsRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  bounceDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.onPrimary },
});