import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Colors } from "@/constants/colors";

export type DocumentType = "AADHAAR" | "PAN";

interface DocumentTypeSelectorProps {
  value: DocumentType;
  onChange: (type: DocumentType) => void;
}

export default function DocumentTypeSelector({ value, onChange }: DocumentTypeSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Document Type</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, value === "AADHAAR" && styles.toggleButtonActive]}
          onPress={() => onChange("AADHAAR")}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, value === "AADHAAR" && styles.toggleTextActive]}>
            Aadhar Card
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleButton, value === "PAN" && styles.toggleButtonActive]}
          onPress={() => onChange("PAN")}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, value === "PAN" && styles.toggleTextActive]}>
            PAN Card
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.onSurfaceVariant,
    marginBottom: 8,
    marginLeft: 4,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.onSurfaceVariant,
  },
  toggleTextActive: {
    color: Colors.surfaceContainerLowest,
  },
});
