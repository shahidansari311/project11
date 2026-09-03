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

import React, { useState, useCallback, useRef } from "react";
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

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
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
  const isAvailable    = investmentInfo?.status === "AVAILABLE";

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
    if (!isAvailable) return;

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
    if (units < 1 || units > remainingUnits) {
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
  // Only show a status text when we have info AND it's blocking investment
  const statusLabel = () => {
    if (isLoading)    return null;          // show spinner instead
    if (!investmentInfo) return null;       // wait for data
    if (!isAvailable) return investmentInfo.status.replace("_", " ");
    if (remainingUnits <= 0) return "Sold Out";
    return null;
  };

  const isSoldOut = isAvailable && remainingUnits <= 0;

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
              <Text style={styles.investBtnText}>
                {isExpanded ? "Close" : "Invest Now"}
              </Text>
              <View style={styles.investBtnIcon}>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "arrow-forward"}
                  size={13}
                  color="#fff"
                />
              </View>
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
                <Ionicons name="remove" size={18} color={units <= 1 ? Colors.outlineVariant : Colors.primary} />
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
                  color={units >= remainingUnits ? Colors.outlineVariant : Colors.primary}
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
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },

  // ── CTA row ──
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  priceBlock: { flex: 1 },
  priceLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.6,
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.onPrimary,
    letterSpacing: -0.3,
  },
  priceSubtext: {
    fontSize: 10,
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
  },
  investBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.onPrimary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  investBtnActive: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  investBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  investBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.primary,
  },
  investBtnIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Success Banner ──
  successBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  successText: {
    fontSize: 13,
    color: Colors.onPrimary,
    lineHeight: 20,
    fontWeight: "500",
  },

  // ── Expanded Panel ──
  expandedPanel: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  panelDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 16,
  },

  // ── Progress bar ──
  progressSection: { marginBottom: 18 },
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
    color: Colors.onPrimary,
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
    backgroundColor: Colors.onPrimary,
    borderRadius: 3,
  },
  progressSubtext: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
  },

  // ── Unit Stepper ──
  unitSelector: { marginBottom: 16 },
  selectorLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperInput: {
    flex: 1,
    height: 48,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    color: Colors.onPrimary,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  quickPicks: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  quickPickChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  quickPickChipActive: {
    backgroundColor: Colors.onPrimary,
    borderColor: Colors.onPrimary,
  },
  quickPickText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
  },
  quickPickTextActive: {
    color: Colors.primary,
  },

  // ── Summary card ──
  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    gap: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingTop: 8,
    marginTop: 4,
  },
  summaryKey: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
  },
  summaryVal: {
    fontSize: 13,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
  summaryTotalKey: {
    fontSize: 14,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
  summaryTotalVal: {
    fontSize: 18,
    color: Colors.onPrimary,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  // ── Pay Now button ──
  payNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.onPrimary,
    borderRadius: 20,
    paddingVertical: 14,
    marginBottom: 10,
  },
  payNowBtnDisabled: { opacity: 0.6 },
  payNowText: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: -0.2,
  },
  disclaimer: {
    fontSize: 10,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    lineHeight: 14,
  },
});
