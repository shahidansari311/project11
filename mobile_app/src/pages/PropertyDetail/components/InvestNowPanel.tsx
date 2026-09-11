/**
 * InvestNowPanel
 * ─────────────────────────────────────────────────────────────────────────────
 * Expandable accordion-style panel shown inside the PropertyDetail page.
 * When user taps "Invest Now", this expands inline to show:
 *  - Unit slider / stepper
 *  - Live investment amount calculation
 *  - Available units progress bar
 *  - "Pay Now" button → POST to API → stores PENDING in DB
 *
 * Animation: smooth height expand with spring easing.
 */

import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { InvestmentInfo } from "../../BrowseProperties/data";
import { investmentService } from "../../../services/investment.service";
import { investUnitsSchema } from "@/utils/validationSchemas";

// Enable LayoutAnimation on Android

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN").format(value);

interface InvestNowPanelProps {
  propertyId: string;
  investmentInfo: InvestmentInfo | null;
  isLoading: boolean;
  onRequireLogin: () => void;
  isGuest: boolean;
  onSuccess?: () => void;
}

export default function InvestNowPanel({
  propertyId,
  investmentInfo,
  isLoading,
  onRequireLogin,
  isGuest,
  onSuccess,
}: InvestNowPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [units, setUnits] = useState(1);
  const [inputText, setInputText] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const remainingUnits = investmentInfo?.remainingUnits ?? 0;
  const perUnitPrice   = investmentInfo?.perUnitPrice ?? 0;
  const totalUnits     = investmentInfo?.totalUnits ?? 0;
  const purchasedUnits = investmentInfo?.purchasedUnits ?? 0;

  // Sold out if backend says so OR if no units remain
  const isSoldOut   = investmentInfo?.status === "SOLD" || (!!investmentInfo && remainingUnits <= 0);
  const isAvailable = investmentInfo?.status === "AVAILABLE" && !isSoldOut;

  const investAmount = units * perUnitPrice;
  const occupancyPct = totalUnits > 0 ? (purchasedUnits / totalUnits) * 100 : 0;

  const clampUnits = (val: number) => {
    const max = Math.max(1, remainingUnits);
    return Math.min(Math.max(1, val), max);
  };

  const handleToggle = () => {
    if (isGuest) {
      onRequireLogin();
      return;
    }
    if (!isAvailable || isSoldOut) return;

    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        320,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );
    setIsExpanded((prev) => !prev);
    setSuccessMessage(null);
  };

  const handleDecrement = () => {
    const next = clampUnits(units - 1);
    setUnits(next);
    setInputText(String(next));
  };

  const handleIncrement = () => {
    const next = clampUnits(units + 1);
    setUnits(next);
    setInputText(String(next));
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed)) {
      setUnits(clampUnits(parsed));
    }
  };

  const handleInputBlur = () => {
    const clamped = clampUnits(units);
    setUnits(clamped);
    setInputText(String(clamped));
  };

  const router = require("expo-router").useRouter();

  const handlePayNow = async () => {
    if (isGuest) {
      onRequireLogin();
      return;
    }
    if (isSoldOut || remainingUnits <= 0) {
      Alert.alert("Sold Out", "All units for this property have been purchased.");
      return;
    }
    const result = investUnitsSchema.safeParse(units);
    if (!result.success || units > remainingUnits) {
      Alert.alert("Invalid units", `Please select between 1 and ${remainingUnits} units.`);
      return;
    }

    // Instead of calling API immediately, route to agreement page
    router.push({
      pathname: "/agreement",
      params: {
        propertyId,
        units: String(units),
        amount: String(investAmount),
      },
    });
  };

  // ── Status pill label ──
  const statusLabel = () => {
    if (isLoading)    return null;
    if (!investmentInfo) return null;
    if (isSoldOut) return "Sold Out";
    if (!isAvailable) return investmentInfo.status.replace(/_/g, " ");
    return null;
  };

  return (
    <View style={styles.container}>
      {/* ── Main CTA row ── */}
      <View style={styles.ctaRow}>
        {/* Left: price info */}
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>MIN. ENTRY</Text>
          <Text style={styles.priceAmount}>
            {isLoading ? "Loading…" : formatCurrency(perUnitPrice)}
          </Text>
          {!isLoading && investmentInfo && (
            <Text style={styles.priceSubtext}>
              per unit · {formatNumber(remainingUnits)} of {formatNumber(totalUnits)} available
            </Text>
          )}
        </View>

        {/* Right: Invest Now button */}
        <TouchableOpacity
          style={[
            styles.investBtn,
            (!isAvailable || isSoldOut) && !isLoading && styles.investBtnDisabled,
            isExpanded && styles.investBtnActive,
          ]}
          activeOpacity={0.85}
          onPress={handleToggle}
          disabled={(!isAvailable || isSoldOut || isLoading) && !isGuest}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : statusLabel() ? (
            <Text style={styles.investBtnText}>{statusLabel()}</Text>
          ) : (
            <>
              {!isExpanded && (
                <Text style={styles.investBtnText}>Invest Now</Text>
              )}
              {!isExpanded ? (
                <View style={styles.investBtnIcon}>
                  <Ionicons name="arrow-forward" size={14} color="#ffffff" />
                </View>
              ) : (
                <Ionicons name="close" size={20} color={Colors.primary} />
              )}
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Success Banner ── */}
      {successMessage && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}

      {/* ── Expanded Invest Panel ── */}
      {isExpanded && investmentInfo && (
        <View style={styles.expandedPanel}>
          {/* Divider */}
          <View style={styles.panelDivider} />

          {/* Unit progress bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>
                <Text style={styles.progressHighlight}>{formatNumber(purchasedUnits)}</Text>
                {" "}units invested
              </Text>
              <Text style={styles.progressLabel}>
                <Text style={styles.progressHighlight}>{Math.round(occupancyPct)}%</Text>
                {" "}filled
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, occupancyPct)}%` as any },
                ]}
              />
            </View>
            <Text style={styles.progressSubtext}>
              {formatNumber(remainingUnits)} units remaining out of {formatNumber(totalUnits)}
            </Text>
          </View>

          {/* ── Unit Selector ── */}
          <View style={styles.unitSelector}>
            <Text style={styles.selectorLabel}>SELECT UNITS</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={[styles.stepperBtn, units <= 1 && styles.stepperBtnDisabled]}
                onPress={handleDecrement}
                disabled={units <= 1}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={18} color={units <= 1 ? "rgba(255,255,255,0.4)" : "#ffffff"} />
              </TouchableOpacity>

              <TextInput
                style={styles.stepperInput}
                value={inputText}
                onChangeText={handleInputChange}
                onBlur={handleInputBlur}
                keyboardType="number-pad"
                maxLength={6}
                selectTextOnFocus
              />

              <TouchableOpacity
                style={[styles.stepperBtn, units >= remainingUnits && styles.stepperBtnDisabled]}
                onPress={handleIncrement}
                disabled={units >= remainingUnits}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="add"
                  size={18}
                  color={units >= remainingUnits ? "rgba(255,255,255,0.4)" : "#ffffff"}
                />
              </TouchableOpacity>
            </View>

            {/* Max units quick picks */}
            <View style={styles.quickPicks}>
              {[1, 5, 10, 25].filter((q) => q <= remainingUnits).map((qty) => (
                <TouchableOpacity
                  key={qty}
                  style={[styles.quickPickChip, units === qty && styles.quickPickChipActive]}
                  onPress={() => {
                    setUnits(qty);
                    setInputText(String(qty));
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.quickPickText,
                      units === qty && styles.quickPickTextActive,
                    ]}
                  >
                    {qty}
                  </Text>
                </TouchableOpacity>
              ))}
              {remainingUnits > 25 && (
                <TouchableOpacity
                  style={[styles.quickPickChip, units === remainingUnits && styles.quickPickChipActive]}
                  onPress={() => {
                    setUnits(remainingUnits);
                    setInputText(String(remainingUnits));
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickPickText, units === remainingUnits && styles.quickPickTextActive]}>
                    Max
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── Investment Summary Card ── */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Units selected</Text>
              <Text style={styles.summaryVal}>{formatNumber(units)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Per unit price</Text>
              <Text style={styles.summaryVal}>{formatCurrency(perUnitPrice)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotalRow]}>
              <Text style={styles.summaryTotalKey}>You are investing</Text>
              <Text style={styles.summaryTotalVal}>{formatCurrency(investAmount)}</Text>
            </View>
          </View>

          {/* ── Pay Now button ── */}
          <TouchableOpacity
            style={[styles.payNowBtn, isSubmitting && styles.payNowBtnDisabled]}
            activeOpacity={0.85}
            onPress={handlePayNow}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.payNowText}>
                  Pay {formatCurrency(investAmount)} · {units} unit{units > 1 ? "s" : ""}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Your payment will be held pending admin approval. Units are reserved immediately.
          </Text>
        </View>
      )}
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

  // ── CTA row ──
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  priceBlock: { flex: 1 },
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
  investBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  investBtnActive: {
    backgroundColor: "#ffffff",
    width: 36,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0,
  },
  investBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  investBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.primary,
  },
  investBtnIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Success Banner ──
  successBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.primaryContainer,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  successText: {
    fontSize: 13,
    color: Colors.onPrimaryContainer,
    lineHeight: 20,
    fontWeight: "500",
  },

  // ── Expanded Panel ──
  expandedPanel: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  panelDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginBottom: 12,
  },

  // ── Progress bar ──
  progressSection: { marginBottom: 12 },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  progressHighlight: {
    color: "#ffffff",
    fontWeight: "700",
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 3,
  },
  progressSubtext: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
  },

  // ── Unit Stepper ──
  unitSelector: { marginBottom: 12 },
  selectorLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 10,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperInput: {
    width: 70,
    height: 36,
    padding: 0,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  quickPicks: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  quickPickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  quickPickChipActive: {
    backgroundColor: "#ffffff",
    borderColor: "#ffffff",
  },
  quickPickText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  quickPickTextActive: {
    color: Colors.primary,
    fontWeight: "800",
  },

  // ── Summary card ──
  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    gap: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingTop: 6,
    marginTop: 4,
  },
  summaryKey: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  summaryVal: {
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "700",
  },
  summaryTotalKey: {
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "700",
  },
  summaryTotalVal: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  // ── Pay Now button ──
  payNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 10,
    marginBottom: 8,
  },
  payNowBtnDisabled: { opacity: 0.6 },
  payNowText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: -0.2,
  },
  disclaimer: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 14,
  },
});
