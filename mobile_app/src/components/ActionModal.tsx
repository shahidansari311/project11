import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

interface ActionModalProps {
  visible: boolean;
  title: string;
  message: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  onClose: () => void;
}

export default function ActionModal({
  visible,
  title,
  message,
  iconName = "information-circle",
  primaryButtonText = "Okay",
  secondaryButtonText,
  onPrimaryAction,
  onSecondaryAction,
  onClose,
}: ActionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name={iconName} size={32} color={Colors.onPrimary} />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            {secondaryButtonText && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onSecondaryAction || onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>{secondaryButtonText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onPrimaryAction || onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryText}>{primaryButtonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.onSurface,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  primaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.onPrimary,
  },
});
