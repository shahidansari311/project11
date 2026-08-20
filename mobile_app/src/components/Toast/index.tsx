import React, { createContext, useContext, useState, useRef } from "react";
import { Animated, Text, StyleSheet, Platform } from "react-native";
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

type ToastType = "success" | "error" | "info";

interface ToastContextData {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextData>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [message, setMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const showToast = (msg: string, type: ToastType = "success") => {
    setMessage(msg);
    setToastType(type);
    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: Platform.OS === 'ios' ? 60 : 50,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();

    // Hide after 3s
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start(() => {
        setMessage("");
      });
    }, 2000);
  };

  const getToastStyles = () => {
    switch (toastType) {
      case "error":
        return {
          backgroundColor: Colors.error,
          color: Colors.onError || "#ffffff",
          icon: "alert-circle" as const,
        };
      case "info":
        return {
          backgroundColor: Colors.secondaryContainer,
          color: Colors.onSecondaryContainer,
          icon: "information-circle" as const,
        };
      case "success":
      default:
        return {
          backgroundColor: Colors.primary,
          color: Colors.onPrimary,
          icon: "checkmark-circle" as const,
        };
    }
  };

  const currentStyle = getToastStyles();

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message !== "" && (
        <Animated.View 
          style={[
            styles.toastContainer, 
            { transform: [{ translateY }], opacity, backgroundColor: currentStyle.backgroundColor }
          ]}
        >
          <Ionicons name={currentStyle.icon} size={20} color={currentStyle.color} />
          <Text style={[styles.toastText, { color: currentStyle.color }]}>{message}</Text>
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
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
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
    marginHorizontal: 24,
    maxWidth: '90%',
  },
  toastText: {
    color: Colors.onPrimary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
    flexShrink: 1,
  }
});
