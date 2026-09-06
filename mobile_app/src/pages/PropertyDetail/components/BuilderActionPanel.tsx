import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import api from "../../../utils/api";
import { Property } from "../../BrowseProperties/data";
import EditMediaModal from "./EditMediaModal";
import { updatePriceSchema } from "@/utils/validationSchemas";


const formatCurrency = (value: number, currencySymbol: string = "₹") => {
  if (!value) return `${currencySymbol}0`;
  if (value >= 10000000) return `${currencySymbol}${Number((value / 10000000).toFixed(2))} Cr`;
  if (value >= 100000) return `${currencySymbol}${Number((value / 100000).toFixed(2))} L`;
  if (value >= 1000) return `${currencySymbol}${Number((value / 1000).toFixed(2))} K`;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value).replace("₹", currencySymbol);
};

interface BuilderActionPanelProps {
  property: Property;
  onUpdate: () => void;
}

export default function BuilderActionPanel({ property, onUpdate }: BuilderActionPanelProps) {
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [newPrice, setNewPrice] = useState(String(property.totalPrice));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [priceError, setPriceError] = useState("");

  const handleOpenPriceModal = () => {
    setNewPrice(String(property.totalPrice));
    setPriceError("");
    setIsPriceModalOpen(true);
  };

  const handleUpdatePrice = async () => {
    const priceNum = Number(newPrice);
    const result = updatePriceSchema.safeParse(priceNum);
    if (!result.success) {
      setPriceError(result.error.issues[0].message);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api.post(`/builder/property/builder/${property.id}/price-history`, { price: priceNum });
      Alert.alert("Success", "Property valuation has been updated successfully.");
      setIsPriceModalOpen(false);
      onUpdate();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to update price. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <View style={styles.container}>
      <View style={styles.ctaRow}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>CURRENT VALUATION</Text>
          <Text style={styles.priceAmount}>{formatCurrency(property.totalPrice)}</Text>
          <Text style={styles.priceSubtext}>Status: {property.status.replace("_", " ")}</Text>
        </View>

        <View style={styles.actionsBlock}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.8}
            onPress={() => setIsMediaModalOpen(true)}
          >
            <Ionicons name="images" size={18} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.updateBtn}
            activeOpacity={0.85}
            onPress={handleOpenPriceModal}
          >
            <Text style={styles.updateBtnText}>Update Price</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* PRICE UPDATE MODAL */}
      <Modal visible={isPriceModalOpen} transparent animationType="slide" onRequestClose={() => setIsPriceModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Valuation</Text>
              <TouchableOpacity onPress={() => setIsPriceModalOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.onSurface} />
              </TouchableOpacity>
            </View>
          
          <Text style={styles.inputLabel}>ENTER NEW TOTAL VALUATION (INR ₹)</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.priceInput, priceError ? { color: Colors.error } : null]}
              value={newPrice}
              onChangeText={(val) => {
                setNewPrice(val);
                if (priceError) setPriceError("");
              }}
              keyboardType="numeric"
              placeholder="e.g. 50000000"
              placeholderTextColor="rgba(255,255,255,0.4)"
              selectTextOnFocus
            />
          </View>
          {priceError ? <Text style={{ color: Colors.error, fontSize: 12, marginTop: 8 }}>{priceError}</Text> : null}

            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleUpdatePrice}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Confirm New Price</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.disclaimer}>
              Updating the price will record a new entry in the property's price history and affect all new fractional units immediately.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* EDIT MEDIA MODAL */}
      <EditMediaModal 
        visible={isMediaModalOpen} 
        onClose={() => setIsMediaModalOpen(false)} 
        property={property} 
        onUpdate={onUpdate} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  priceBlock: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.6,
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  priceSubtext: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  actionsBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  updateBtn: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  updateBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.onSurface,
  },
  closeBtn: {
    padding: 4,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputRow: {
    marginBottom: 12,
  },
  priceInput: {
    height: 48,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    color: Colors.onSurface,
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  disclaimer: {
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 14,
  },
});
