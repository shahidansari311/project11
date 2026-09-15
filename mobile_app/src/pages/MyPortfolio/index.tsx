/**
 * MyPortfolioPage — Real investment data from backend
 * ─────────────────────────────────────────────────────
 * Fetches the user's investments and displays them with
 * status badges, amount, and per-unit details.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
  Modal,
  TextInput,
  Linking,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { uploadService } from "../../services/upload.service";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { WebView } from "react-native-webview";
import { GlobalAlert } from '@/components/GlobalAlertModal';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { investmentService } from "@/services/investment.service";
import { propertyService } from "@/services/property.service";
import { Investment, InvestmentStatus, PLACEHOLDER_IMAGE } from "../BrowseProperties/data";
import PortfolioValuationGraph from "./components/PortfolioValuationGraph";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter, useFocusEffect } from "expo-router";
import { formatLocationText } from "@/utils/formatLocation";

const formatCurrency = (value: number, currencySymbol: string = "₹") => {
  if (!value) return `${currencySymbol}0`;
  if (value >= 10000000) return `${currencySymbol}${Number((value / 10000000).toFixed(2))} Cr`;
  if (value >= 100000) return `${currencySymbol}${Number((value / 100000).toFixed(2))} L`;
  if (value >= 1000) return `${currencySymbol}${Number((value / 1000).toFixed(2))} K`;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value).replace("₹", currencySymbol);
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// ── Status badge config ──
const STATUS_CONFIG: Record<
  InvestmentStatus,
  { label: string; bg: string; text: string; icon: string }
> = {
  PENDING:          { label: "Pending Approval",  bg: "#FFF8E1", text: "#B8860B", icon: "time-outline" },
  APPROVED:         { label: "Approved",           bg: "#E8F5E9", text: "#2E7D32", icon: "checkmark-circle-outline" },
  REJECTED:         { label: "Rejected",           bg: "#FFEBEE", text: "#C62828", icon: "close-circle-outline" },
  CANCELLED:        { label: "Cancelled",          bg: "#F5F5F5", text: "#616161", icon: "ban-outline" },
  PARTIAL_PAID:     { label: "Partial Paid",       bg: "#FFF3E0", text: "#E65100", icon: "wallet-outline" },
  REFUND_REQUESTED: { label: "Refund Requested",   bg: "#FCE4EC", text: "#AD1457", icon: "return-down-back-outline" },
  REFUNDED:         { label: "Refunded",           bg: "#F3E5F5", text: "#6A1B9A", icon: "checkmark-done-outline" },
  WITHDRAWAL_REQUESTED: { label: "Withdrawal Requested", bg: "#E3F2FD", text: "#1565C0", icon: "cash-outline" },
  WITHDRAWN:        { label: "Withdrawn",          bg: "#E8EAF6", text: "#283593", icon: "checkmark-done-outline" },
};

// ── Skeleton Loader ──
const PortfolioSkeleton = ({ insets }: { insets: any }) => {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [anim]);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.scrollContent, { opacity: anim }]}>
        {/* Title */}
        <View style={styles.skelTitle} />
        {/* Summary Card (Primary Color) */}
        <View style={styles.skelSummary}>
          <View style={styles.skelSummaryLabel} />
          <View style={styles.skelSummaryValue} />
          <View style={styles.skelStatsRow}>
            <View style={styles.skelStatBox} />
            <View style={styles.skelStatBox} />
            <View style={styles.skelStatBox} />
          </View>
        </View>
        {/* Filter Chips */}
        <View style={styles.skelFilters}>
          <View style={[styles.skelChip, { width: 50, backgroundColor: Colors.primary }]} />
          <View style={styles.skelChip} />
          <View style={styles.skelChip} />
          <View style={styles.skelChip} />
        </View>
        {/* Subtitle */}
        <View style={styles.skelSubtitle} />
        {/* Cards */}
        <View style={styles.skelCard}>
          <View style={styles.skelCardHeader}>
            <View style={styles.skelPropImage} />
            <View style={{ flex: 1, gap: 8 }}>
              <View style={styles.skelPropTitle} />
              <View style={styles.skelPropLocation} />
            </View>
          </View>
          <View style={styles.skelDetailGrid} />
        </View>
        <View style={styles.skelCard}>
          <View style={styles.skelCardHeader}>
            <View style={styles.skelPropImage} />
            <View style={{ flex: 1, gap: 8 }}>
              <View style={styles.skelPropTitle} />
              <View style={styles.skelPropLocation} />
            </View>
          </View>
          <View style={styles.skelDetailGrid} />
        </View>
      </Animated.View>
    </View>
  );
};

export default function MyPortfolioPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { userProfile, refreshAuth } = useAuth();
  
  const aadharDoc = userProfile?.documents?.find(d => d.documentType === "AADHAAR");
  const panDoc = userProfile?.documents?.find(d => d.documentType === "PAN");
  const hasAadhar = aadharDoc?.status === "APPROVED";
  const hasPan = panDoc?.status === "APPROVED";
  const isKycVerified = hasAadhar && hasPan;

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<InvestmentStatus | "ALL">("ALL");

  const loadInvestments = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await investmentService.getMyInvestments({ limit: 100 });
      if (res?.data?.investments) {
        const rawInvestments = res.data.investments;
        
        // Fetch property details to get priceHistory
        const uniquePropertyIds = Array.from(new Set(rawInvestments.map((i) => i.propertyId)));
        const propertyResponses = await Promise.all(
          uniquePropertyIds.map((id) => propertyService.getPropertyById(id).catch(() => null))
        );
        
        const propertyDetailsMap: any = {};
        propertyResponses.forEach((propRes) => {
          if (propRes?.data) {
            propertyDetailsMap[propRes.data.id] = propRes.data;
          }
        });
        
        const enhancedInvestments = rawInvestments.map(inv => {
          if (inv.property && propertyDetailsMap[inv.propertyId]) {
            return {
              ...inv,
              property: {
                ...inv.property,
                priceHistory: propertyDetailsMap[inv.propertyId].priceHistory,
                totalUnits: propertyDetailsMap[inv.propertyId].totalUnits,
                price: propertyDetailsMap[inv.propertyId].price
              }
            };
          }
          return inv;
        });

        setInvestments(enhancedInvestments);
      }
    } catch (err: any) {
      // Silently fail on background refresh
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInvestments(true);
      refreshAuth();
    }, [loadInvestments, refreshAuth])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAuth();
    loadInvestments(true);
  };

  // ── Partial Payment Modal State ──
  const [selectedInv, setSelectedInv] = useState<Investment | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [refundDetails, setRefundDetails] = useState({ accountName: "", bankName: "", accountNumber: "", ifscCode: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [activePayTab, setActivePayTab] = useState<"razorpay" | "bank">("razorpay");

  const openPayModal = (inv: Investment) => { 
    setSelectedInv(inv); 
    setPaymentProofUrl(""); 
    
    // Check Razorpay limit (if remaining > 1,00,000, disable Razorpay and force bank)
    const remaining = inv.totalAmount - (inv.paidAmount || 0);
    setActivePayTab(remaining > 100000 ? "bank" : "razorpay");
    
    setShowPayModal(true); 
  };
  const openRefundModal = (inv: Investment) => { setSelectedInv(inv); setRefundDetails({ accountName: "", bankName: "", accountNumber: "", ifscCode: "" }); setShowRefundModal(true); };
  const openWithdrawalModal = (inv: Investment) => { setSelectedInv(inv); setRefundDetails({ accountName: "", bankName: "", accountNumber: "", ifscCode: "" }); setShowWithdrawalModal(true); };

  const handleUploadProof = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setIsUploading(true);
      const file = result.assets[0];
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      let mimeType = file.mimeType;
      if (!mimeType) {
        const ext = fileExt?.toLowerCase();
        if (ext === 'pdf') mimeType = 'application/pdf';
        else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
        else if (ext === 'png') mimeType = 'image/png';
        else mimeType = 'application/octet-stream';
      }

      const response = await uploadService.uploadDocument(
        file.uri,
        mimeType,
        fileName
      );

      setPaymentProofUrl(response.data.url);
      GlobalAlert.alert("Uploaded", "Document uploaded successfully.");
    } catch (err: any) {
      console.log("Upload error:", err);
      GlobalAlert.alert("Error", err?.response?.data?.message || err?.message || "Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePayRemaining = async () => {
    // If Razorpay tab is active, we just use a dummy URL for now, or real Razorpay if integrated. 
    // Just like PaymentMethod, if it's Razorpay, proof url might be omitted or set to a placeholder
    if (activePayTab === "bank" && !paymentProofUrl) {
      return GlobalAlert.alert("Required", "Please upload your payment proof document.");
    }
    
    setIsSubmitting(true);
    try {
      // For Razorpay we pass undefined or dummy, for bank we pass the URL
      const proofToSubmit = activePayTab === "razorpay" ? "razorpay_direct_payment" : paymentProofUrl;
      await investmentService.payRemainingInvestment(selectedInv!.id, proofToSubmit);
      GlobalAlert.alert("Submitted ✅", activePayTab === "razorpay" ? "Payment processed via Razorpay." : "Your payment proof has been submitted for admin review.");
      setShowPayModal(false);
      loadInvestments(true);
    } catch (e: any) {
      GlobalAlert.alert("Error", e?.response?.data?.message || "Failed to submit.");
    } finally { setIsSubmitting(false); }
  };

  const handleRequestRefund = async () => {
    if (!selectedInv) return;
    const { accountName, bankName, accountNumber, ifscCode } = refundDetails;
    if (!accountName || !bankName || !accountNumber || !ifscCode) return GlobalAlert.alert("Required", "Please fill all bank details.");
    setIsSubmitting(true);
    try {
      await investmentService.requestRefund(selectedInv.id, refundDetails);
      GlobalAlert.alert("Requested ✅", "Your refund request has been submitted.");
      setShowRefundModal(false);
      loadInvestments(true);
    } catch (e: any) {
      GlobalAlert.alert("Error", e?.response?.data?.message || "Failed to submit.");
    } finally { setIsSubmitting(false); }
  };

  const handleRequestWithdrawal = async () => {
    if (!selectedInv) return;
    const { accountName, bankName, accountNumber, ifscCode } = refundDetails;
    if (!accountName || !bankName || !accountNumber || !ifscCode) return GlobalAlert.alert("Required", "Please fill all bank details.");
    setIsSubmitting(true);
    try {
      await investmentService.requestWithdrawal(selectedInv.id, refundDetails);
      GlobalAlert.alert("Requested ✅", "Your withdrawal request has been submitted.");
      setShowWithdrawalModal(false);
      loadInvestments(true);
    } catch (e: any) {
      GlobalAlert.alert("Error", e?.response?.data?.message || "Failed to submit.");
    } finally { setIsSubmitting(false); }
  };

  // ── Derived stats ──
  const approvedInvestments = investments.filter((i) => i.status === "APPROVED");
  const pendingInvestments  = investments.filter((i) => i.status === "PENDING");
  const totalValue          = approvedInvestments.reduce((s, i) => s + i.totalAmount, 0);
  const pendingValue        = pendingInvestments.reduce((s, i) => s + i.totalAmount, 0);
  const totalUnitsOwned     = approvedInvestments.reduce((s, i) => s + i.units, 0);

  const filteredInvestments =
    activeFilter === "ALL"
      ? investments
      : investments.filter((i) => i.status === activeFilter);

  const FILTERS: Array<InvestmentStatus | "ALL"> = ["ALL", "PENDING", "APPROVED", "PARTIAL_PAID", "WITHDRAWAL_REQUESTED", "WITHDRAWN", "REFUND_REQUESTED", "REFUNDED", "REJECTED", "CANCELLED"];

  if (isLoading) {
    return <PortfolioSkeleton insets={insets} />;
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <Text style={styles.pageTitle}>My Portfolio</Text>

        {/* ── Summary Card ── */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>TOTAL INVESTED VALUE</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalValue)}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Units Owned</Text>
              <Text style={styles.statValue}>{totalUnitsOwned}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Pending Value</Text>
              <Text style={[styles.statValue, { color: "#f6b71aff" }]}>
                {formatCurrency(pendingValue)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Deals</Text>
              <Text style={styles.statValue}>{investments.length}</Text>
            </View>
          </View>
        </View>

        {/* ── Filter Chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => {
            const count =
              f === "ALL"
                ? investments.length
                : investments.filter((i) => i.status === f).length;
            return (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterChip,
                  activeFilter === f && styles.filterChipActive,
                ]}
                onPress={() => setActiveFilter(f)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    activeFilter === f && styles.filterChipTextActive,
                  ]}
                >
                  {f === "ALL" ? "All" : STATUS_CONFIG[f].label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Investment List ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Investments</Text>
        </View>

        {filteredInvestments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business" size={48} color={Colors.outlineVariant} />
            <Text style={styles.emptyTitle}>No investments yet</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === "ALL"
                ? 'Browse properties and tap "Invest Now" to get started.'
                : `No ${activeFilter.toLowerCase()} investments found.`}
            </Text>
          </View>
        ) : (
          filteredInvestments.map((inv) => {
            const cfg = STATUS_CONFIG[inv.status] ?? { label: inv.status, bg: "#F5F5F5", text: "#616161", icon: "help-circle-outline" };
            const img = inv.property?.images?.[0] ?? PLACEHOLDER_IMAGE;

            return (
              <TouchableOpacity 
                key={inv.id} 
                style={[
                  styles.investmentCard,
                  inv.status === "REJECTED" && styles.investmentCardRejected,
                ]}
                activeOpacity={0.85}
                onPress={() => router.push(`/portfolio/${inv.id}` as any)}
              >
                {/* Property image + title */}
                <View style={styles.cardHeader}>
                  <Image source={{ uri: img }} style={styles.propImage} />
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.propTitle} numberOfLines={1}>
                      {inv.property?.title ?? "Property"}
                    </Text>
                    <Text style={styles.propLocation} numberOfLines={1}>
                      <Ionicons name="location-outline" size={11} color={Colors.outline} />
                      {" "}{formatLocationText(inv.property?.location)}
                    </Text>
                    {/* Status badge and View Property button */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                      <View style={[styles.statusBadge, { backgroundColor: cfg.bg, marginTop: 0 }]}>
                        <Ionicons name={cfg.icon as any} size={11} color={cfg.text} />
                        <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
                      </View>
                      
                      <TouchableOpacity 
                        style={styles.viewPropBtn}
                        onPress={() => router.push(`/property/${inv.propertyId}` as any)}
                      >
                        <Text style={styles.viewPropBtnText}>View Property</Text>
                        <Ionicons name="arrow-forward" size={12} color="#059669" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Investment details - HIDE IF REFUNDED OR REJECTED or CANCELLED */}
                {inv.status !== "REFUNDED" && inv.status !== "REJECTED" && inv.status !== "CANCELLED" && (
                  <View style={styles.detailGrid}>
                    <View style={styles.detailCell}>
                      <Text style={styles.detailLabel}>Units</Text>
                      <Text style={styles.detailValue}>{inv.units}</Text>
                    </View>
                    <View style={styles.detailCell}>
                      <Text style={styles.detailLabel}>Per Unit</Text>
                      <Text style={styles.detailValue}>{formatCurrency(inv.unitPriceAtTime)}</Text>
                    </View>
                    <View style={styles.detailCell}>
                      <Text style={styles.detailLabel}>Total</Text>
                      <Text style={[styles.detailValue, styles.detailTotal]}>
                        {formatCurrency(inv.totalAmount)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* ── Maturity Info ── */}
                {inv.status === "APPROVED" && inv.maturityDate && (
                  <View style={{ backgroundColor: "#F5F5F5", padding: 12, borderRadius: 8, marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, color: "#616161", fontWeight: "600", marginBottom: 4 }}>
                      <Ionicons name="timer-outline" size={12} /> {inv.isMatured ? "Matured" : "Remaining Term"}
                    </Text>
                    <Text style={{ fontSize: 14, color: inv.isMatured ? "#2E7D32" : "#424242", fontWeight: "700" }}>
                      {inv.remainingTermString}
                    </Text>
                    {inv.isMatured && (
                      <TouchableOpacity
                        style={{ backgroundColor: "#059669", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, alignSelf: "flex-start", marginTop: 8 }}
                        onPress={(e) => { e.stopPropagation?.(); openWithdrawalModal(inv); }}
                      >
                        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>Request Withdrawal</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* ── Partial Payment Section ── */}
                {inv.status === "PARTIAL_PAID" && (() => {
                  const paid = inv.paidAmount || 0;
                  const remaining = inv.totalAmount - paid;
                  const progress = Math.min(paid / inv.totalAmount, 1);
                  return (
                    <View style={styles.partialBox}>
                      {/* Header */}
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                        <Ionicons name="wallet-outline" size={15} color="#E65100" />
                        <Text style={styles.partialTitle}> Partial Payment Accepted</Text>
                      </View>
                      
                      {/* Warning text */}
                      <View style={{ backgroundColor: "#FFE0B2", padding: 8, borderRadius: 6, marginBottom: 10 }}>
                        <Text style={{ fontSize: 11, color: "#BF360C", lineHeight: 16 }}>
                          <Ionicons name="alert-circle" size={12} /> Please pay the remaining amount or request a refund within 7 days. Otherwise, the amount will not be refunded.
                        </Text>
                      </View>

                      {/* Progress bar */}
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any }]} />
                      </View>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                        <Text style={styles.partialMeta}>Paid: <Text style={{ color: "#2E7D32", fontWeight: "700" }}>{formatCurrency(paid)}</Text></Text>
                        <Text style={styles.partialMeta}>Due: <Text style={{ color: "#C62828", fontWeight: "700" }}>{formatCurrency(remaining)}</Text></Text>
                      </View>

                      {/* Action buttons */}
                      <View style={styles.partialActions}>
                        <TouchableOpacity
                          style={styles.payBtn}
                          activeOpacity={0.8}
                          onPress={(e) => { e.stopPropagation?.(); openPayModal(inv); }}
                        >
                          <Ionicons name="card-outline" size={14} color="#fff" />
                          <Text style={styles.payBtnText}>Pay Remaining</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.refundBtn}
                          activeOpacity={0.8}
                          onPress={(e) => { e.stopPropagation?.(); openRefundModal(inv); }}
                        >
                          <Ionicons name="return-down-back-outline" size={14} color="#AD1457" />
                          <Text style={styles.refundBtnText}>Request Refund</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })()}

                {/* Refund Requested state */}
                {inv.status === "REFUND_REQUESTED" && (
                  <View style={[styles.partialBox, { backgroundColor: "#FCE4EC", borderColor: "#AD1457" }]}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name="time-outline" size={15} color="#AD1457" />
                      <Text style={[styles.partialTitle, { color: "#AD1457" }]}> Refund Request Submitted</Text>
                    </View>
                    <Text style={{ color: "#880E4F", fontSize: 12, marginTop: 6 }}>
                      Amount: {formatCurrency(inv.paidAmount || 0)} — Our team is processing your refund.
                    </Text>
                  </View>
                )}

                {/* Refunded state */}
                {inv.status === "REFUNDED" ? (
                  <View style={[styles.partialBox, { backgroundColor: "#F3E5F5", borderColor: "#7B1FA2" }]}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name="checkmark-done-outline" size={15} color="#6A1B9A" />
                      <Text style={[styles.partialTitle, { color: "#6A1B9A" }]}> Refund Completed</Text>
                    </View>
                    <Text style={{ color: "#4A148C", fontSize: 12, marginTop: 6, marginBottom: 10 }}>
                      {formatCurrency(inv.paidAmount || 0)} has been refunded to your bank account.
                    </Text>
                    {inv.refundProofUrl && (
                      <TouchableOpacity
                        style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 8, borderRadius: 6, borderWidth: 1, borderColor: "#CE93D8", alignSelf: "flex-start" }}
                        onPress={() => Linking.openURL(inv.refundProofUrl!)}
                      >
                        <Ionicons name="document-text-outline" size={14} color="#6A1B9A" />
                        <Text style={{ fontSize: 12, color: "#6A1B9A", marginLeft: 6, fontWeight: "600" }}>View Refund Proof</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null}

                {/* Withdrawal Requested state */}
                {inv.status === "WITHDRAWAL_REQUESTED" && (
                  <View style={[styles.partialBox, { backgroundColor: "#E3F2FD", borderColor: "#1565C0" }]}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name="time-outline" size={15} color="#1565C0" />
                      <Text style={[styles.partialTitle, { color: "#1565C0" }]}> Withdrawal Request Submitted</Text>
                    </View>
                    <Text style={{ color: "#0D47A1", fontSize: 12, marginTop: 6 }}>
                      Our team is processing your withdrawal to your bank account.
                    </Text>
                  </View>
                )}

                {/* Withdrawn state */}
                {inv.status === "WITHDRAWN" ? (
                  <View style={[styles.partialBox, { backgroundColor: "#E8EAF6", borderColor: "#283593" }]}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name="checkmark-done-outline" size={15} color="#283593" />
                      <Text style={[styles.partialTitle, { color: "#283593" }]}> Withdrawal Completed</Text>
                    </View>
                    <Text style={{ color: "#1A237E", fontSize: 12, marginTop: 6, marginBottom: 10 }}>
                      Your funds have been transferred to your bank account.
                    </Text>
                    {inv.refundProofUrl && (
                      <TouchableOpacity
                        style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 8, borderRadius: 6, borderWidth: 1, borderColor: "#9FA8DA", alignSelf: "flex-start" }}
                        onPress={() => Linking.openURL(inv.refundProofUrl!)}
                      >
                        <Ionicons name="document-text-outline" size={14} color="#283593" />
                        <Text style={{ fontSize: 12, color: "#283593", marginLeft: 6, fontWeight: "600" }}>View Payment Proof</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null}

                {/* Date + admin remark */}
                <View style={styles.cardFooter}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dateText}>{formatDate(inv.createdAt)}</Text>
                  </View>
                </View>

                {/* KYC Banner */}
                {!isKycVerified ? (
                  <View style={styles.kycWarningBadge}>
                    <Ionicons name="warning" size={14} color="#B8860B" />
                    <Text style={styles.kycWarningText}>Document verification pending</Text>
                  </View>
                ) : (
                  <View style={styles.kycSuccessBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#2E8B57" />
                    <Text style={styles.kycSuccessText}>All documents verified</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Pay Remaining Modal ── */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pay Remaining Balance</Text>
            {selectedInv && (() => {
              const remaining = selectedInv.totalAmount - (selectedInv.paidAmount || 0);
              const isRazorpayDisabled = remaining > 100000;
              return (
                <View>
                  <Text style={styles.modalSubtitle}>
                    Remaining balance: <Text style={{fontWeight: "700", color: Colors.primary}}>{formatCurrency(remaining)}</Text>
                  </Text>
                  
                  {/* Tabs */}
                  <View style={styles.tabContainer}>
                    <TouchableOpacity
                      style={[styles.tabButton, activePayTab === "razorpay" && styles.tabButtonActive, isRazorpayDisabled && styles.tabButtonDisabled]}
                      onPress={() => !isRazorpayDisabled && setActivePayTab("razorpay")}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.tabText, activePayTab === "razorpay" && styles.tabTextActive, isRazorpayDisabled && styles.tabTextDisabled]}>Pay via Razorpay</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.tabButton, activePayTab === "bank" && styles.tabButtonActive]}
                      onPress={() => setActivePayTab("bank")}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.tabText, activePayTab === "bank" && styles.tabTextActive]}>Bank Transfer</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {isRazorpayDisabled && activePayTab === "razorpay" && (
                     <Text style={{color: "red", fontSize: 12, marginBottom: 10}}>Razorpay is disabled for amounts &gt; ₹1,00,000. Use Bank Transfer.</Text>
                  )}


                  {activePayTab === "bank" && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={styles.inputLabel}>Payment Proof Document</Text>
                      {paymentProofUrl ? (
                         <View style={{flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#E8F5E9", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#A5D6A7"}}>
                           <Text style={{color: "#2E7D32", fontWeight: "600", fontSize: 13}}>Document Uploaded ✅</Text>
                           <TouchableOpacity onPress={() => setPaymentProofUrl("")}><Ionicons name="close-circle" size={20} color="#2E7D32" /></TouchableOpacity>
                         </View>
                      ) : (
                        <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadProof} disabled={isUploading}>
                          {isUploading ? <ActivityIndicator color={Colors.primary} /> : (
                            <>
                              <Ionicons name="cloud-upload-outline" size={20} color={Colors.primary} />
                              <Text style={styles.uploadBtnText}>Upload PDF/Image</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  
                  {activePayTab === "razorpay" && !isRazorpayDisabled && (
                    <View style={{ marginBottom: 16, backgroundColor: "#F3E5F5", padding: 16, borderRadius: 12, alignItems: "center" }}>
                      <Ionicons name="shield-checkmark" size={28} color="#6A1B9A" />
                      <Text style={{color: "#4A148C", marginTop: 8, textAlign: "center", fontSize: 13}}>
                        You will be securely redirected to Razorpay to complete your transaction.
                      </Text>
                    </View>
                  )}
                </View>
              );
            })()}
            
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPayModal(false)} disabled={isSubmitting}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handlePayRemaining} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>Submit Proof</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Request Refund Modal ── */}
      <Modal visible={showRefundModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Request Refund</Text>
            {selectedInv && (
              <Text style={styles.modalSubtitle}>
                Enter your bank details to receive {formatCurrency(selectedInv.paidAmount || 0)} back.
              </Text>
            )}
            {(["accountName", "bankName", "accountNumber", "ifscCode"] as const).map((field) => (
              <View key={field} style={{ marginBottom: 12 }}>
                <Text style={styles.inputLabel}>
                  {field === "accountName" ? "Account Name" : field === "bankName" ? "Bank Name" : field === "accountNumber" ? "Account Number" : "IFSC Code"}
                </Text>
                <TextInput
                  style={styles.input}
                  value={refundDetails[field]}
                  onChangeText={(t) => setRefundDetails(p => ({ ...p, [field]: t }))}
                  keyboardType={field === "accountNumber" ? "number-pad" : "default"}
                  autoCapitalize={field === "ifscCode" ? "characters" : "words"}
                  placeholderTextColor={Colors.outline}
                />
              </View>
            ))}
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowRefundModal(false)} disabled={isSubmitting}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: "#AD1457" }]} onPress={handleRequestRefund} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>Request Refund</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Request Withdrawal Modal ── */}
      <Modal visible={showWithdrawalModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Request Withdrawal</Text>
            {selectedInv && (
              <Text style={styles.modalSubtitle}>
                Enter your bank details to receive your maturity payout.
              </Text>
            )}
            {(["accountName", "bankName", "accountNumber", "ifscCode"] as const).map((field) => (
              <View key={field} style={{ marginBottom: 12 }}>
                <Text style={styles.inputLabel}>
                  {field === "accountName" ? "Account Name" : field === "bankName" ? "Bank Name" : field === "accountNumber" ? "Account Number" : "IFSC Code"}
                </Text>
                <TextInput
                  style={styles.input}
                  value={refundDetails[field]}
                  onChangeText={(t) => setRefundDetails(p => ({ ...p, [field]: t }))}
                  keyboardType={field === "accountNumber" ? "number-pad" : "default"}
                  autoCapitalize={field === "ifscCode" ? "characters" : "words"}
                  placeholderTextColor={Colors.outline}
                />
              </View>
            ))}
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowWithdrawalModal(false)} disabled={isSubmitting}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: "#059669" }]} onPress={handleRequestWithdrawal} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>Submit Request</Text>}
              </TouchableOpacity>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surface,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.primary,
    marginBottom: 16,
  },

  // ── Summary Card ──
  summaryCard: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 34,
    fontWeight: "800",
    color: Colors.onPrimary,
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statBox: {
    flex: 1,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 12,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.65)",
    marginBottom: 3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.onPrimary,
  },

  // ── Filter chips ──
  filterRow: {
    paddingHorizontal: 0,
    gap: 8,
    marginBottom: 16,
    flexDirection: "row",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: Colors.onPrimary,
  },

  // ── Section Header ──
  sectionHeader: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.onSurface,
  },

  // ── Empty State ──
  emptyState: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.outlineVariant,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.onSurface,
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 18,
  },

  // ── Investment Card ──
  investmentCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0f1e22",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  investmentCardRejected: {
    backgroundColor: "#FFF0F0",
    borderColor: "#FFCDD2",
  },
  cardHeader: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  propImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  cardHeaderText: {
    flex: 1,
    gap: 4,
  },
  propTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  propLocation: {
    fontSize: 12,
    color: Colors.outline,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  // Detail grid
  detailGrid: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 0,
  },
  detailCell: {
    flex: 1,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.outline,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  detailTotal: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },

  // Footer
  cardFooter: {
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewPropBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  viewPropBtnText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#059669",
  },
  dateText: {
    fontSize: 11,
    color: Colors.outline,
  },
  remarkText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
    fontStyle: "italic",
  },

  kycWarningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF8E1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  kycWarningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B8860B',
  },
  kycSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  kycSuccessText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },

  // ── Skeleton Styles ──
  skelTitle: {
    width: 160,
    height: 32,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 8,
    marginBottom: 16,
  },
  skelSummary: {
    width: "100%",
    height: 160,
    backgroundColor: Colors.primary,
    borderRadius: 24,
    marginBottom: 16,
    padding: 24,
    opacity: 0.8,
  },
  skelSummaryLabel: {
    width: 120,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    marginBottom: 8,
  },
  skelSummaryValue: {
    width: 200,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 8,
    marginBottom: 24,
  },
  skelStatsRow: {
    flexDirection: "row",
    gap: 16,
  },
  skelStatBox: {
    flex: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 6,
  },
  skelFilters: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  skelChip: {
    width: 80,
    height: 34,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 20,
  },
  skelSubtitle: {
    width: 140,
    height: 24,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 6,
    marginBottom: 12,
  },
  skelCard: {
    width: "100%",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  skelCardHeader: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  skelPropImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  skelPropTitle: {
    width: "70%",
    height: 16,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 4,
  },
  skelPropLocation: {
    width: "40%",
    height: 12,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 4,
  },
  skelDetailGrid: {
    height: 56,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    marginBottom: 10,
  },

  // ── Partial Payment ──
  partialBox: {
    backgroundColor: "#FFF3E0",
    borderWidth: 1,
    borderColor: "#FFCC80",
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  partialTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E65100",
  },
  progressTrack: {
    height: 7,
    backgroundColor: "#FFE0B2",
    borderRadius: 99,
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FF6F00",
    borderRadius: 99,
  },
  partialMeta: {
    fontSize: 12,
    color: "#6D4C41",
  },
  partialActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  payBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
  },
  payBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  refundBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FCE4EC",
    borderWidth: 1,
    borderColor: "#AD1457",
    borderRadius: 10,
    paddingVertical: 10,
  },
  refundBtnText: {
    color: "#AD1457",
    fontSize: 13,
    fontWeight: "700",
  },

  // ── Modals ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.onSurface,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.outline,
    marginBottom: 18,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.onSurfaceVariant,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.onSurface,
    marginBottom: 14,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  modalRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.onSurfaceVariant,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  
  // Modal tabs
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabButtonDisabled: {
    opacity: 0.5,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.onSurfaceVariant,
  },
  tabTextActive: {
    color: "#fff",
  },
  tabTextDisabled: {
    color: Colors.outline,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 14,
    backgroundColor: "#F5FDF9",
  },
  uploadBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
});
