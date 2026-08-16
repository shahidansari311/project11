import React, { createContext, useContext, useState, useRef } from "react";
import { Animated, Text, StyleSheet, Platform } from "react-native";
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

interface ToastContextData {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextData>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [message, setMessage] = useState("");
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const showToast = (msg: string) => {
    setMessage(msg);
    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: Platform.OS === 'ios' ? 60 : 50,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();

    // Hide after 3s
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        setMessage("");
      });
    }, 2000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message !== "" && (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY }], opacity }]}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.onPrimary} />
          <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  toastText: {
    color: Colors.onPrimary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2
  }
});
