import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";

export default function PaymentMethodPage() {
  const router = useRouter();
  
  // Dummy data (No actual data as requested, just enough to test the logic)
  const amountToPay = 250000; // > 100,000 to trigger razorpay disable logic
  const isRazorpayDisabled = amountToPay > 100000;

  const [showWarningModal, setShowWarningModal] = useState(false);

  const [activeTab, setActiveTab] = useState<"razorpay" | "bank">(
    isRazorpayDisabled ? "bank" : "razorpay"
  );

  useEffect(() => {
    if (isRazorpayDisabled && activeTab === "razorpay") {
      setActiveTab("bank");
    }
  }, [isRazorpayDisabled]);

  const handleTabPress = (tab: "razorpay" | "bank") => {
    if (tab === "razorpay" && isRazorpayDisabled) {
      setShowWarningModal(true);
      return;
    }
    setActiveTab(tab);
  };

  const handleUploadProof = () => {
    // Empty logic for now
    // Could also use a custom modal here, but leaving as is for now or just ignoring.
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Make Payment</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Amount Due</Text>
          <Text style={styles.summaryAmount}>
            {/* Simple formatter for the dummy value */}
            ₹{amountToPay.toLocaleString('en-IN')}
          </Text>
          
          <View style={styles.summaryDivider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryRowLabel}>Property Reference</Text>
            <Text style={styles.summaryRowValue}>FOA-XXXX-XXXX</Text>
          </View>
        </View>

        {/* Pill Toggle */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton, 
              activeTab === "razorpay" && styles.tabButtonActive,
              isRazorpayDisabled && styles.tabButtonDisabled
            ]}
            activeOpacity={0.8}
            onPress={() => handleTabPress("razorpay")}
          >
            <Text 
              style={[
                styles.tabText, 
                activeTab === "razorpay" && styles.tabTextActive,
                isRazorpayDisabled && styles.tabTextDisabled
              ]}
            >
              Pay via Razorpay
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "bank" && styles.tabButtonActive]}
            activeOpacity={0.8}
            onPress={() => handleTabPress("bank")}
          >
            <Text style={[styles.tabText, activeTab === "bank" && styles.tabTextActive]}>
              Bank Transfer
            </Text>
          </TouchableOpacity>
        </View>

        {/* View content based on active tab */}
        {activeTab === "razorpay" ? (
          <View style={styles.viewContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.viewTitle}>Secure Online Payment</Text>
            <Text style={styles.viewSubtitle}>
              You will be securely redirected to Razorpay to complete your transaction via Credit Card, Net Banking, or UPI.
            </Text>
          </View>
        ) : (
          <View style={styles.viewContent}>
            <Text style={styles.viewTitleLeft}>Account Details</Text>
            <View style={styles.accountDivider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bank Name</Text>
              <Text style={styles.detailValue}>Silverreal Trust Bank</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Account Name</Text>
              <Text style={styles.detailValue}>Silverreal Estate Escrow</Text>
            </View>
            <View style={styles.detailRowWithCopy}>
              <View>
                <Text style={styles.detailLabel}>Account Number</Text>
                <Text style={styles.detailValue}>8842 1009 5532 9901</Text>
              </View>
              <TouchableOpacity style={styles.copyBtn}>
                <Ionicons name="copy-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.detailRowWithCopy}>
              <View>
                <Text style={styles.detailLabel}>Routing Number (ABA)</Text>
                <Text style={styles.detailValue}>021000021</Text>
              </View>
              <TouchableOpacity style={styles.copyBtn}>
                <Ionicons name="copy-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Upload Proof */}
            <TouchableOpacity 
              style={styles.uploadBox}
              activeOpacity={0.7}
              onPress={handleUploadProof}
            >
              <Ionicons name="cloud-upload-outline" size={32} color={Colors.primary} />
              <Text style={styles.uploadTitle}>Upload Payment Proof</Text>
              <Text style={styles.uploadSubtitle}>PDF, JPG or PNG (Max 5MB)</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={styles.confirmButton}
          activeOpacity={0.8}
          onPress={() => {
            // Placeholder
          }}
        >
          <Text style={styles.confirmButtonText}>Confirm Payment</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.onPrimary} />
        </TouchableOpacity>
      </View>

      {/* Warning Modal */}
      <Modal
        visible={showWarningModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWarningModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="warning" size={32} color={Colors.onPrimary} />
            </View>
            
            <Text style={styles.modalTitle}>Payment Method Unavailable</Text>
            <Text style={styles.modalMessage}>
              Razorpay is not supported for transactions greater than 1 Lakh. Please use Direct Bank Transfer.
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowWarningModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainer,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#0f1e22",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.primary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.surfaceContainer,
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryRowLabel: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  summaryRowValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: Colors.primaryContainer,
  },
  tabButtonDisabled: {
    opacity: 0.5,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  tabTextActive: {
    color: Colors.onPrimaryContainer,
  },
  tabTextDisabled: {
    color: Colors.outline,
  },
  viewContent: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#0f1e22",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.secondaryContainer,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  viewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.onSurface,
    marginBottom: 8,
  },
  viewTitleLeft: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.onSurface,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  viewSubtitle: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
  },
  accountDivider: {
    height: 1,
    width: "100%",
    backgroundColor: Colors.surfaceContainer,
    marginBottom: 16,
  },
  detailRow: {
    width: "100%",
    marginBottom: 16,
  },
  detailRowWithCopy: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  copyBtn: {
    padding: 8,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 20,
  },
  uploadBox: {
    width: "100%",
    marginTop: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLowest,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.onSurface,
    marginTop: 8,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
  },
  bottomAction: {
    backgroundColor: Colors.surfaceContainerLowest,
    padding: 16,
    paddingBottom: 32, // safe area padding
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerHigh,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primaryContainer,
    height: 52,
    borderRadius: 12,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.onPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
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
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.onSurface,
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.onPrimary,
  },
});
