import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { GlobalAlert } from '@/components/GlobalAlertModal';
import api from "../../../utils/api";

export default function BuilderManagementPanel({ property, onUpdate }: { property: any, onUpdate: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const deleteProperty = async () => {
    GlobalAlert.alert(
      "Delete Property",
      "Are you sure you want to delete this property? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              await api.delete(`/property/builder/${property.id}`);
              GlobalAlert.alert("Success", "Property deleted");
              onUpdate(); // Trigger refresh or go back
            } catch (error: any) {
              GlobalAlert.alert("Error", error.response?.data?.message || "Failed to delete property");
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const updatePrice = () => {
    Alert.prompt(
      "Update Price",
      "Enter the new total price:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update",
          onPress: async (text) => {
            if (!text || isNaN(Number(text))) return GlobalAlert.alert("Error", "Invalid price");
            setIsLoading(true);
            try {
              await api.post(`/property/builder/${property.id}/price-history`, { price: Number(text) });
              GlobalAlert.alert("Success", "Price updated successfully");
              onUpdate();
            } catch (error: any) {
              GlobalAlert.alert("Error", error.response?.data?.message || "Failed to update price");
            } finally {
              setIsLoading(false);
            }
          }
        }
      ],
      "plain-text",
      property.totalPrice.toString()
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Builder Controls</Text>
      
      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
      ) : (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={updatePrice}>
            <Ionicons name="pricetag" size={18} color="#fff" />
            <Text style={styles.btnText}>Price</Text>
          </TouchableOpacity><TouchableOpacity style={[styles.btn, styles.dangerBtn]} onPress={deleteProperty}>
            <Ionicons name="trash" size={18} color="#fff" />
            <Text style={styles.btnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.onSurface,
    marginBottom: 12,
    textAlign: "center"
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
  },
  warningBtn: {
    backgroundColor: "#f59e0b",
  },
  successBtn: {
    backgroundColor: "#10b981",
  },
  dangerBtn: {
    backgroundColor: Colors.error,
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  }
});
