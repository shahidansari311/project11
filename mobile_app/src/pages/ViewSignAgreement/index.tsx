import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

export default function ViewSignAgreementPage() {
  const router = useRouter();
  const [isChecked, setIsChecked] = useState(false);

  const insets = useSafeAreaInsets();
  const params = require("expo-router").useLocalSearchParams();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign Agreement</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Document Preview Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={24} color={Colors.primary} />
            <View style={styles.cardHeaderTexts}>
              <Text style={styles.cardTitle}>Fractional Ownership Agreement</Text>
              <Text style={styles.cardSubtitle}>Ref: FOA-XXXX-XXXX</Text>
            </View>
          </View>
          
          <ScrollView style={styles.documentBody} nestedScrollEnabled={true}>
            <Text style={styles.docHeading}>1. Parties to the Agreement</Text>
            <Text style={styles.docText}>
              This Fractional Ownership Agreement (the "Agreement") is entered into as of the date of electronic signature, by and between Silverreal Estate Management LLC ("Manager") and the undersigned investor ("Investor").
            </Text>
            
            <Text style={styles.docHeading}>2. Investment Terms</Text>
            <Text style={styles.docText}>
              The Investor agrees to purchase fractional shares in the property identified in Schedule A, subject to the terms and conditions set forth herein.
            </Text>

            <Text style={styles.docHeading}>3. Management and Operations</Text>
            <Text style={styles.docText}>
              The Manager shall have exclusive authority to manage, operate, and maintain the property.
            </Text>

            <Text style={styles.docHeading}>4. Transferability</Text>
            <Text style={styles.docText}>
              Fractional shares may be transferred or sold subject to a right of first refusal.
            </Text>

            <Text style={styles.docHeading}>5. Dispute Resolution</Text>
            <Text style={styles.docText}>
              Any disputes arising under this Agreement shall be resolved through binding arbitration.
            </Text>
          </ScrollView>
        </View>

        {/* Signature Section */}
        <View style={styles.card}>
          <Text style={styles.signatureTitle}>Digital Signature</Text>
          <Text style={styles.signatureSubtitle}>
            By signing below, you agree to the terms outlined in the document above.
          </Text>
          
          <View style={styles.signaturePad}>
            <Text style={styles.signaturePlaceholderText}>Draw your signature here</Text>
            <Text style={styles.signatureX}>X</Text>
            <View style={styles.signatureLine} />
          </View>

          <TouchableOpacity 
            style={styles.checkboxRow}
            onPress={() => setIsChecked(!isChecked)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
              {isChecked && <Ionicons name="checkmark" size={14} color={Colors.onPrimary} />}
            </View>
            <Text style={styles.checkboxLabel}>
              I acknowledge that this digital signature is legally binding.
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[styles.signButton, !isChecked && styles.signButtonDisabled]}
          activeOpacity={0.8}
          disabled={!isChecked}
          onPress={() => {
            // Push to payment screen with params
            router.push({
              pathname: "/payment",
              params: {
                propertyId: params.propertyId,
                units: params.units,
                amount: params.amount,
              },
            });
          }}
        >
          <Ionicons name="pencil" size={18} color={isChecked ? Colors.onPrimary : Colors.outline} />
          <Text style={[styles.signButtonText, !isChecked && styles.signButtonTextDisabled]}>
            Sign & Continue
          </Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>Powered by Silverreal SecureSign</Text>
      </View>
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
    gap: 24,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#0f1e22",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainer,
    paddingBottom: 16,
    marginBottom: 16,
  },
  cardHeaderTexts: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  documentBody: {
    height: 250,
  },
  docHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.onSurface,
    marginTop: 12,
    marginBottom: 4,
  },
  docText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.onSurfaceVariant,
  },
  signatureTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.onSurface,
    marginBottom: 8,
  },
  signatureSubtitle: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginBottom: 16,
  },
  signaturePad: {
    height: 120,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLowest,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  signaturePlaceholderText: {
    fontSize: 14,
    color: Colors.outlineVariant,
    opacity: 0.5,
  },
  signatureX: {
    position: "absolute",
    left: 16,
    bottom: 16,
    fontSize: 16,
    color: Colors.outlineVariant,
    fontWeight: "600",
  },
  signatureLine: {
    position: "absolute",
    left: 36,
    bottom: 16,
    right: 16,
    height: 1,
    backgroundColor: Colors.outlineVariant,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.outline,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primaryContainer,
  },
  checkboxLabel: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  bottomAction: {
    backgroundColor: Colors.surfaceContainerLowest,
    padding: 16,
    paddingBottom: 32, // safe area padding
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerHigh,
  },
  signButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primaryContainer,
    height: 52,
    borderRadius: 12,
  },
  signButtonDisabled: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  signButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.onPrimary,
  },
  signButtonTextDisabled: {
    color: Colors.outline,
  },
  footerText: {
    textAlign: "center",
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 12,
  },
});
