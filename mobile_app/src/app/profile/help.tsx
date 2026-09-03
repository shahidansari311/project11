import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FAQS = [
  {
    id: "1",
    question: "How do I invest in a property?",
    answer:
      "To invest in a property, you first need to complete your KYC by uploading your Aadhar and PAN cards. Once verified, you can browse available properties, select the number of units you want to buy, and proceed to sign the agreement and make the payment.",
  },
  {
    id: "2",
    question: "What is the minimum investment amount?",
    answer:
      "The minimum investment amount varies per property and is determined by the property's per-unit price. You can find this information on the property detail page under 'Min. Entry'.",
  },
  {
    id: "3",
    question: "How long does document verification take?",
    answer:
      "Document verification typically takes between 24 to 48 hours. Our team reviews your submitted Aadhar and PAN cards to ensure compliance before approving your account for investments.",
  },
  {
    id: "4",
    question: "Can I cancel my investment?",
    answer:
      "Yes, you can request a cancellation while your investment is still in the 'Pending' status. Once approved, the investment cannot be cancelled from the app, and you must contact support directly.",
  },
];

export default function HelpAndSupportPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleEmailSupport = () => {
    Linking.openURL("mailto:support@silverrealestate.com?subject=App Support Request");
  };

  const handleCallSupport = () => {
    Linking.openURL("tel:+918001234567");
  };

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        
        {/* ── Contact Section ── */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <View style={styles.contactCard}>
          <Text style={styles.contactText}>
            Need immediate assistance? Reach out to our admin support team.
          </Text>
          <View style={styles.contactActions}>
            <TouchableOpacity style={styles.contactBtn} onPress={handleEmailSupport}>
              <Ionicons name="mail" size={20} color={Colors.onPrimary} />
              <Text style={styles.contactBtnText}>Email Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.contactBtn, styles.contactBtnOutline]} onPress={handleCallSupport}>
              <Ionicons name="call" size={20} color={Colors.primary} />
              <Text style={[styles.contactBtnText, { color: Colors.primary }]}>Call Us</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── FAQ Section ── */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {FAQS.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <View key={faq.id} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  activeOpacity={0.7}
                  onPress={() => handleToggle(faq.id)}
                >
                  <Text style={[styles.faqQuestion, isExpanded && { color: Colors.primary }]}>
                    {faq.question}
                  </Text>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={isExpanded ? Colors.primary : Colors.outline}
                  />
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.faqBody}>
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainer,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLowest,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.onSurface,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  contactCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  contactText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 16,
  },
  contactActions: {
    flexDirection: "row",
    gap: 12,
  },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  contactBtnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  contactBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.onPrimary,
  },
  faqList: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    overflow: "hidden",
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainer,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.onSurface,
    paddingRight: 16,
  },
  faqBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  faqAnswer: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    lineHeight: 22,
  },
});
