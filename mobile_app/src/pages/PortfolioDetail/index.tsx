import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Linking,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { uploadService } from "@/services/upload.service";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";
import { GlobalAlert } from '@/components/GlobalAlertModal';
import { useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { investmentService } from "@/services/investment.service";
import { propertyService } from "@/services/property.service";
import { Investment, Property, PLACEHOLDER_IMAGE } from "../BrowseProperties/data";
import PortfolioValuationGraph from "../MyPortfolio/components/PortfolioValuationGraph";
import Skeleton from "@/components/ui/Skeleton";
import ActionModal from "@/components/ActionModal";
import { formatLocationText } from "@/utils/formatLocation";
import ImageCarousel from "@/components/ui/ImageCarousel";

const { width } = Dimensions.get("window");

const PortfolioDetailSkeleton = ({ insets }: { insets: any }) => {
  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width={160} height={24} borderRadius={6} />
        <View style={styles.headerPlaceholder} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero Card Skeleton */}
        <View style={styles.heroCard}>
          <Skeleton width="100%" height={220} borderRadius={0} />
          <View style={styles.heroDetailsBlock}>
            <Skeleton width="70%" height={24} borderRadius={4} style={{ marginBottom: 8 }} />
            <Skeleton width="40%" height={16} borderRadius={4} style={{ marginBottom: 16 }} />
            <View style={styles.specsRow}>
              <Skeleton width={80} height={24} borderRadius={12} />
              <Skeleton width={80} height={24} borderRadius={12} />
              <Skeleton width={60} height={24} borderRadius={12} />
            </View>
          </View>
        </View>

        {/* Snapshot Skeleton */}
        <View style={styles.snapshotCard}>
          <Skeleton width={100} height={20} borderRadius={4} style={{ marginBottom: 16 }} />
          <View style={styles.snapshotGrid}>
            <View style={styles.snapshotItem}>
              <Skeleton width={80} height={12} borderRadius={4} style={{ marginBottom: 6 }} />
              <Skeleton width={60} height={24} borderRadius={4} />
            </View>
            <View style={styles.snapshotItem}>
              <Skeleton width={80} height={12} borderRadius={4} style={{ marginBottom: 6 }} />
              <Skeleton width={80} height={24} borderRadius={4} />
            </View>
            <View style={styles.snapshotItem}>
              <Skeleton width={80} height={12} borderRadius={4} style={{ marginBottom: 6 }} />
              <Skeleton width={80} height={24} borderRadius={4} />
            </View>
            <View style={styles.snapshotItem}>
              <Skeleton width={80} height={12} borderRadius={4} style={{ marginBottom: 6 }} />
              <Skeleton width={100} height={24} borderRadius={4} />
            </View>
          </View>
        </View>

        {/* Chart Skeleton */}
        <View style={styles.chartCard}>
          <Skeleton width={140} height={20} borderRadius={4} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={200} borderRadius={12} />
        </View>
        
        {/* Docs Skeleton */}
        <View style={styles.docsCard}>
          <Skeleton width={100} height={20} borderRadius={4} style={{ marginBottom: 16 }} />
          <View style={[styles.docRow, { backgroundColor: Colors.surfaceContainerHighest }]}>
            <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width={180} height={16} borderRadius={4} />
              <Skeleton width={120} height={12} borderRadius={4} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

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

export default function PortfolioDetailPage({ id }: { id: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userProfile } = useAuth();

  const [investment, setInvestment] = useState<Investment | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [refundDetails, setRefundDetails] = useState({ accountName: "", bankName: "", accountNumber: "", ifscCode: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    iconName?: keyof typeof Ionicons.glyphMap;
    primaryBtn: string;
    secondaryBtn?: string;
    onPrimary: () => void;
  }>({ visible: false, title: "", message: "", primaryBtn: "", onPrimary: () => {} });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [showPayRemaining, setShowPayRemaining] = useState(false);
  const [showRequestRefund, setShowRequestRefund] = useState(false);
  const [refundBankDetails, setRefundBankDetails] = useState({ accountName: "", bankName: "", accountNumber: "", ifscCode: "" });
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [activePayTab, setActivePayTab] = useState<"razorpay" | "bank">("razorpay");

  const openPayModal = () => { 
    setPaymentProofUrl(""); 
    
    // Check Razorpay limit (if remaining > 1,00,000, disable Razorpay and force bank)
    const remaining = investment ? investment.totalAmount - (investment.paidAmount || 0) : 0;
    setActivePayTab(remaining > 100000 ? "bank" : "razorpay");
    
    setShowPayRemaining(true); 
  };

  // KYC Check
  const aadharDoc = userProfile?.documents?.find(d => d.documentType === "AADHAAR");
  const panDoc = userProfile?.documents?.find(d => d.documentType === "PAN");
  const hasAadhar = aadharDoc?.status === "APPROVED";
  const hasPan = panDoc?.status === "APPROVED";
  const isKycVerified = hasAadhar && hasPan;

  let pendingMessage = "Verify Aadhar & PAN to download";
  if (!hasAadhar && hasPan) {
    pendingMessage = "Verify Aadhar to download";
  } else if (hasAadhar && !hasPan) {
    pendingMessage = "Verify PAN to download";
  }

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setIsLoading(true);
    try {
      const invRes = await investmentService.getMyInvestmentById(id);
      if (invRes?.data) {
        setInvestment(invRes.data);
        
        // Load full property to get history etc.
        const propRes = await propertyService.getPropertyById(invRes.data.propertyId);
        if (propRes?.data) {
          setProperty(propRes.data);
        }
      }
    } catch (error) {
      console.error("Failed to load investment details", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData(true);
  }, [loadData]);

  if (isLoading && !isRefreshing) {
    return <PortfolioDetailSkeleton insets={insets} />;
  }

  if (!investment) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: Colors.onSurface }}>Investment not found</Text>
      </View>
    );
  }

  const img = investment.property?.images?.[0] ?? PLACEHOLDER_IMAGE;

  const currentPrice = property?.perUnitPrice || investment.unitPriceAtTime;
  const isPositive = currentPrice >= investment.unitPriceAtTime;

  const handleDownloadAgreement = () => {
    if (investment.status === "PENDING") {
      setModalConfig({
        visible: true,
        title: "Payment Pending",
        message: "Your investment is currently pending admin approval. You can download the agreement once it is approved.",
        iconName: "time",
        primaryBtn: "Okay",
        onPrimary: () => setModalConfig(prev => ({ ...prev, visible: false })),
      });
      return;
    }

    if (!isKycVerified) {
      setModalConfig({
        visible: true,
        title: "Verification Pending",
        message: "You must upload and verify your Aadhar and PAN cards to download the final agreement.",
        iconName: "alert-circle",
        primaryBtn: "Upload Now",
        secondaryBtn: "Cancel",
        onPrimary: () => {
          setModalConfig(prev => ({ ...prev, visible: false }));
          router.push("/(tabs)/profile" as any);
        }
      });
      return;
    }
    
    // Implement real download logic here
    setModalConfig({
      visible: true,
      title: "Downloading",
      message: "Your agreement is being downloaded.",
      iconName: "download",
      primaryBtn: "Okay",
      onPrimary: () => setModalConfig(prev => ({ ...prev, visible: false })),
    });
  };

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
    if (activePayTab === "bank" && !paymentProofUrl) {
      GlobalAlert.alert("Required", "Please upload a payment proof document.");
      return;
    }
    setIsSubmitting(true);
    try {
      const proofToSubmit = activePayTab === "razorpay" ? "razorpay_direct_payment" : paymentProofUrl;
      await investmentService.payRemainingInvestment(investment!.id, proofToSubmit);
      GlobalAlert.alert("Success", activePayTab === "razorpay" ? "Payment processed via Razorpay." : "Payment proof submitted for review.");
      setShowPayRemaining(false);
      setPaymentProofUrl("");
      loadData(true);
    } catch (error: any) {
      GlobalAlert.alert("Error", error.response?.data?.message || "Failed to submit payment proof.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRefund = async () => {
    const { accountName, bankName, accountNumber, ifscCode } = refundBankDetails;
    if (!accountName || !bankName || !accountNumber || !ifscCode) {
      GlobalAlert.alert("Required", "Please fill all bank details.");
      return;
    }
    setIsSubmitting(true);
    try {
      await investmentService.requestRefund(investment!.id, refundBankDetails);
      GlobalAlert.alert("Success", "Refund request submitted. Our team will process it shortly.");
      setShowRequestRefund(false);
      loadData(true);
    } catch (error: any) {
      GlobalAlert.alert("Error", error.response?.data?.message || "Failed to request refund.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Investment Details</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <ImageCarousel
            images={property?.images || investment.property?.images || [PLACEHOLDER_IMAGE]}
            youtubeVideoUrl={property?.youtubeVideoUrl || investment.property?.youtubeVideoUrl}
            width={width - 32}
            height={220}
            showArrowControls={false}
          />
          <View style={styles.heroDetailsBlock}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {investment.property?.title ?? "Property"}
                </Text>
                <Text style={styles.heroLocation}>
                  <Ionicons name="location-outline" size={14} color={Colors.outline} />{" "}
                  {formatLocationText(investment.property?.location)}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.viewPropBtn, { paddingHorizontal: 12, paddingVertical: 8 }]}
                onPress={() => router.push(`/property/${investment.propertyId}` as any)}
              >
                <Text style={styles.viewPropBtnText}>View Property</Text>
                <Ionicons name="arrow-forward" size={14} color="#059669" />
              </TouchableOpacity>
            </View>

            {/* Specs Row */}
            {(property?.specs || investment.property?.specs) && (
              <View style={styles.specsRow}>
                {(() => {
                  const specs = property?.specs || investment.property?.specs;
                  return (
                    <>
                      {specs?.propertyType && (
                        <View style={styles.specBadge}>
                          <Ionicons name="business" size={12} color={Colors.primary} />
                          <Text style={styles.specText}>{specs.propertyType}</Text>
                        </View>
                      )}
                      {specs?.size && (
                        <View style={styles.specBadge}>
                          <Ionicons name="resize" size={12} color={Colors.primary} />
                          <Text style={styles.specText}>{specs.size}</Text>
                        </View>
                      )}
                      {specs?.bedrooms !== undefined && (
                        <View style={styles.specBadge}>
                          <Ionicons name="bed" size={12} color={Colors.primary} />
                          <Text style={styles.specText}>{specs.bedrooms} Bed</Text>
                        </View>
                      )}
                      {property?.status && (
                        <View style={styles.specBadge}>
                          <Ionicons name="pricetag" size={12} color={Colors.primary} />
                          <Text style={styles.specText}>{property.status.replace("_", " ")}</Text>
                        </View>
                      )}
                    </>
                  );
                })()}
              </View>
            )}

            {/* Extended Property Details */}
            <View style={styles.propDetailsGrid}>
              <View style={styles.propDetailCell}>
                <Text style={styles.propDetailLabel}>Total Units</Text>
                <Text style={styles.propDetailValue}>{property?.totalUnits || investment.property?.totalUnits || 'N/A'}</Text>
              </View>
              <View style={styles.propDetailCell}>
                <Text style={styles.propDetailLabel}>Property Value</Text>
                <Text style={styles.propDetailValue}>
                  {(property?.totalPrice || (investment.property as any)?.totalPrice) 
                    ? formatCurrency(property?.totalPrice || (investment.property as any)?.totalPrice) 
                    : 'N/A'}
                </Text>
              </View>
              <View style={styles.propDetailCell}>
                <Text style={styles.propDetailLabel}>My Ownership</Text>
                <Text style={styles.propDetailValue}>
                  {investment.status === 'REJECTED' || investment.status === 'REFUNDED' 
                    ? '0%' 
                    : (property?.totalUnits || investment.property?.totalUnits)
                      ? ((investment.units / (property?.totalUnits || investment.property?.totalUnits)) * 100).toFixed(2) + '%'
                      : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {investment.status === "REJECTED" || investment.status === "REFUNDED" || investment.status === "WITHDRAWN" ? (
          <View style={[styles.rejectedCard, (investment.status === "REFUNDED" || investment.status === "WITHDRAWN") && { backgroundColor: '#F3E5F5', borderColor: '#CE93D8' }]}>
            <View style={[styles.rejectedHeader, { backgroundColor: (investment.status === "REFUNDED" || investment.status === "WITHDRAWN") ? "#F3E5F5" : undefined }]}>
              <Ionicons name={(investment.status === "REFUNDED" || investment.status === "WITHDRAWN") ? "checkmark-done-circle" : "close-circle"} size={24} color={(investment.status === "REFUNDED" || investment.status === "WITHDRAWN") ? "#6A1B9A" : Colors.error} />
              <Text style={[styles.rejectedTitle, { color: (investment.status === "REFUNDED" || investment.status === "WITHDRAWN") ? "#6A1B9A" : Colors.error }]}>
                {investment.status === "REFUNDED" ? "Refund Completed" : investment.status === "WITHDRAWN" ? "Maturity Payout Complete" : "Investment Rejected"}
              </Text>
            </View>
            <Text style={[styles.rejectedReason, (investment.status === "REFUNDED" || investment.status === "WITHDRAWN") && { color: "#4A148C", marginBottom: 16 }]}>
              {investment.status === "REFUNDED" 
                ? `${formatCurrency(investment.paidAmount || 0)} has been processed from the admin side and will be credited to your account in 3-5 business days.`
                : investment.status === "WITHDRAWN"
                ? `Maturity payout of ${formatCurrency(investment.currentValuation || 0)} has been processed from the admin side and will be credited to your account in 3-5 business days.`
                : (investment.adminRemark || "Your investment request was rejected by the admin.")}
            </Text>

            {(investment.status === "REFUNDED" || investment.status === "WITHDRAWN") && investment.refundBankDetails && (
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 14, color: "#6A1B9A", fontWeight: "700", marginBottom: 4 }}>Destination Account</Text>
                
                <View style={{ gap: 12 }}>
                  {/* Read-only Input style for Account Name */}
                  <View style={{ backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: "#E1BEE7" }}>
                    <Text style={{ fontSize: 11, color: Colors.outline, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Account Name</Text>
                    <Text style={{ fontSize: 15, color: "#4A148C", fontWeight: "600" }}>{investment.refundBankDetails.accountName}</Text>
                  </View>

                  {/* Read-only Input style for Bank Name */}
                  <View style={{ backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: "#E1BEE7" }}>
                    <Text style={{ fontSize: 11, color: Colors.outline, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Bank Name</Text>
                    <Text style={{ fontSize: 15, color: "#4A148C", fontWeight: "600" }}>{investment.refundBankDetails.bankName}</Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: 12 }}>
                    {/* Read-only Input style for Account No */}
                    <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: "#E1BEE7" }}>
                      <Text style={{ fontSize: 11, color: Colors.outline, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Account No.</Text>
                      <Text style={{ fontSize: 15, color: "#4A148C", fontWeight: "600" }}>{investment.refundBankDetails.accountNumber}</Text>
                    </View>

                    {/* Read-only Input style for IFSC */}
                    <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: "#E1BEE7" }}>
                      <Text style={{ fontSize: 11, color: Colors.outline, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>IFSC Code</Text>
                      <Text style={{ fontSize: 15, color: "#4A148C", fontWeight: "600" }}>{investment.refundBankDetails.ifscCode}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
            
            {(investment.status === "REFUNDED" || investment.status === "WITHDRAWN") && investment.refundProofUrl ? (
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#CE93D8", marginTop: 12, alignSelf: "flex-start", shadowColor: "#CE93D8", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
                onPress={() => setPreviewUrl(investment.refundProofUrl)}
              >
                <Ionicons name="document-text-outline" size={18} color="#6A1B9A" />
                <Text style={{ fontSize: 14, color: "#6A1B9A", marginLeft: 8, fontWeight: "600" }}>{investment.status === "WITHDRAWN" ? "View Payout Proof" : "View Refund Proof"}</Text>
                <Ionicons name="open-outline" size={14} color="#6A1B9A" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            ) : (investment.status === "REFUNDED" || investment.status === "WITHDRAWN") && (
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F3E5F5", padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "#E1BEE7", marginTop: 12, alignSelf: "flex-start" }}>
                 <Ionicons name="alert-circle-outline" size={16} color="#8E24AA" />
                 <Text style={{ fontSize: 13, color: "#8E24AA", marginLeft: 6, fontStyle: "italic" }}>Proof document pending</Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {investment.status === "PARTIAL_PAID" && (() => {
              const paid = investment.paidAmount || 0;
              const remaining = investment.totalAmount - paid;
              const progress = Math.min(paid / investment.totalAmount, 1);
              return (
                <View style={[styles.partialBox, { marginHorizontal: 16, marginBottom: 16 }]}>
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
                      onPress={() => setShowPayRemaining(true)}
                    >
                      <Ionicons name="card-outline" size={14} color="#fff" />
                      <Text style={styles.payBtnText}>Pay Remaining</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.refundBtn}
                      activeOpacity={0.8}
                      onPress={() => setShowRequestRefund(true)}
                    >
                      <Ionicons name="return-down-back-outline" size={14} color="#AD1457" />
                      <Text style={styles.refundBtnText}>Request Refund</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })()}

            {(investment.status === "REFUND_REQUESTED" || investment.status === "WITHDRAWAL_REQUESTED") && (
              <View style={[styles.kycWarningBox, { backgroundColor: Colors.errorContainer, marginBottom: 16, marginHorizontal: 16, alignItems: 'flex-start' }]}>
                <Ionicons name="time" size={20} color={Colors.error} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.kycWarningText, { color: Colors.onErrorContainer, fontSize: 14, fontWeight: '700' }]}>
                    {investment.status === "WITHDRAWAL_REQUESTED" ? "Withdrawal Request Processing" : "Refund Request Processing"}
                  </Text>
                  <Text style={{ color: Colors.onErrorContainer, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
                    {investment.status === "WITHDRAWAL_REQUESTED" 
                      ? `Your maturity payout of ${formatCurrency(investment.currentValuation || 0)} is being processed. It will be credited to your submitted bank account shortly.`
                      : `Your refund for ${formatCurrency(investment.paidAmount || 0)} is being processed.`
                    }
                  </Text>
                  
                  {investment.refundBankDetails && (
                    <View style={{ marginTop: 12, padding: 12, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,0,0,0.1)' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.onErrorContainer, marginBottom: 8 }}>Payout Destination</Text>
                      <Text style={{ fontSize: 12, color: Colors.onErrorContainer }}>Bank: {investment.refundBankDetails.bankName}</Text>
                      <Text style={{ fontSize: 12, color: Colors.onErrorContainer }}>A/C No: {investment.refundBankDetails.accountNumber}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Payment History */}
            <View style={styles.snapshotCard}>
              <View style={styles.snapshotHeader}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Payment History</Text>
              </View>
              <View style={{ marginTop: 12, gap: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="document-text-outline" size={18} color={Colors.outline} />
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: "500", color: Colors.onSurface }}>Investment Initiated</Text>
                      <Text style={{ fontSize: 11, color: Colors.outline }}>{formatDate(investment.createdAt)}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.onSurface }}>{formatCurrency(investment.totalAmount)}</Text>
                </View>
                
                {investment.paidAmount > 0 && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#2E7D32" />
                      <View>
                        <Text style={{ fontSize: 13, fontWeight: "500", color: "#2E7D32" }}>Payment Received</Text>
                        <Text style={{ fontSize: 11, color: Colors.outline }}>{formatDate(investment.updatedAt)}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#2E7D32" }}>{formatCurrency(investment.paidAmount)}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Snapshot */}
            <View style={styles.snapshotCard}>
              <View style={styles.snapshotHeader}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Snapshot</Text>
              </View>
              
              <View style={styles.snapshotGrid}>
                {/* Always visible: Total Value, Paid Amount, Remaining */}
                <View style={[styles.snapshotItem, { width: '48%' }]}>
                  <Text style={styles.snapshotLabel}>Total Value</Text>
                  <Text style={styles.snapshotValue}>{formatCurrency(investment.totalAmount)}</Text>
                </View>
                
                <View style={[styles.snapshotItem, { width: '48%' }]}>
                  <Text style={styles.snapshotLabel}>Paid Amount</Text>
                  <Text style={styles.snapshotValue}>
                    {formatCurrency(investment.paidAmount || (investment.status === 'APPROVED' ? investment.totalAmount : 0))}
                  </Text>
                </View>
                
                <View style={[styles.snapshotItem, { width: '100%' }]}>
                  <Text style={styles.snapshotLabel}>Remaining Amount</Text>
                  <Text style={[styles.snapshotValue, { color: (investment.totalAmount - (investment.paidAmount || 0)) > 0 ? Colors.error : "#2E7D32" }]}>
                    {formatCurrency(Math.max(0, investment.totalAmount - (investment.paidAmount || (investment.status === 'APPROVED' ? investment.totalAmount : 0))))}
                  </Text>
                </View>

                {/* Only visible when fully approved and verified (agreement signed) */}
                {investment.status === 'APPROVED' && investment.agreementUrl && (
                  <>
                    <View style={[styles.snapshotItem, { width: '48%', backgroundColor: "#F3E5F5", borderColor: "#E1BEE7" }]}>
                      <Text style={[styles.snapshotLabel, { color: "#6A1B9A" }]}>Promised Return</Text>
                      <Text style={[styles.snapshotValue, { color: "#4A148C" }]}>
                        {formatCurrency(investment.currentValuation || 0)}
                      </Text>
                    </View>
                    
                    <View style={[styles.snapshotItem, { width: '48%' }]}>
                      <Text style={styles.snapshotLabel}>Current Mkt Value</Text>
                      <Text style={[styles.snapshotValue, { color: isPositive ? "#2E7D32" : Colors.error }]}>
                        {formatCurrency(investment.units * currentPrice)}
                      </Text>
                    </View>

                    {investment.remainingTermString && (
                      <View style={[styles.snapshotItem, { width: '100%' }]}>
                        <Text style={styles.snapshotLabel}>Maturity Timeline</Text>
                        <Text style={styles.snapshotValue}>
                          {investment.isMatured ? 'Matured - Ready for Withdrawal' : investment.remainingTermString + " Left"}
                        </Text>
                      </View>
                    )}
                    
                    {/* Withdrawal Button embedded in snapshot */}
                    <View style={{ width: '100%', marginTop: 8 }}>
                      <TouchableOpacity 
                        style={[
                          styles.submitBtn, 
                          { backgroundColor: investment.isMatured ? '#E65100' : '#E0E0E0' }
                        ]} 
                        disabled={!investment.isMatured}
                        onPress={() => {
                          setRefundDetails({ accountName: "", bankName: "", accountNumber: "", ifscCode: "" });
                          setShowWithdrawalModal(true);
                        }}
                      >
                        <Text style={[styles.submitBtnText, !investment.isMatured && { color: '#9E9E9E' }]}>
                          {investment.isMatured ? 'Request Withdrawal' : 'Withdrawal Locked Until Maturity'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>

        {/* Graph */}
        <View style={styles.chartCard}>
          {property?.priceHistory && property.priceHistory.length >= 2 ? (
            <PortfolioValuationGraph 
              priceHistory={property.priceHistory as any} 
              units={investment.units} 
              totalUnits={property.totalUnits}
              purchasedAt={investment.createdAt}
            />
          ) : (
            <>
              <Text style={styles.sectionTitle}>Portfolio Value Trend</Text>
              <View style={styles.noDataBox}>
                <Ionicons name="bar-chart-outline" size={32} color={Colors.outlineVariant} />
                <Text style={styles.noDataText}>Not enough data to show trend</Text>
              </View>
            </>
          )}
        </View>

        {/* Documents */}
        <View style={styles.docsCard}>
          <Text style={styles.sectionTitle}>Documents</Text>
          
          {investment.status === "APPROVED" && !investment.agreementUrl ? (
            <TouchableOpacity 
              style={[styles.docRow, { backgroundColor: Colors.errorContainer, borderColor: Colors.error, borderWidth: 1 }]}
              activeOpacity={0.7}
              onPress={() => {
                if (!isKycVerified) {
                  GlobalAlert.alert("KYC Required", "Please verify your Aadhar and PAN card before signing the agreement.");
                  return;
                }
                router.push({ 
                  pathname: "/(tabs)/browse/ViewSignAgreement", 
                  params: { investmentId: investment.id, propertyId: investment.propertyId } 
                });
              }}
            >
              <View style={[styles.docIconBox, { backgroundColor: Colors.error }]}>
                <Ionicons name="create" size={20} color={Colors.onError} />
              </View>
              <View style={styles.docInfo}>
                <Text style={[styles.docTitle, { color: Colors.onErrorContainer }]}>Signature Required</Text>
                <Text style={{ fontSize: 12, color: Colors.error }}>Tap to sign your agreement</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.error} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.docRow, (!isKycVerified || investment.status === "PENDING" || !investment.agreementUrl) && styles.docRowDisabled]}
              activeOpacity={0.7}
              onPress={handleDownloadAgreement}
            >
              <View style={styles.docIconBox}>
                <Ionicons name="document-text" size={20} color={isKycVerified && investment.status !== "PENDING" && investment.agreementUrl ? Colors.primary : Colors.outline} />
              </View>
              <View style={styles.docInfo}>
                <Text style={[styles.docTitle, (!isKycVerified || investment.status === "PENDING" || !investment.agreementUrl) && { color: Colors.outline }]}>Fractional Ownership Agreement</Text>
                <Text style={styles.docSubtitle}>{investment.agreementUrl ? `Signed on ${formatDate(investment.createdAt)}` : 'Not Generated'}</Text>
              </View>
              <Ionicons name="download-outline" size={20} color={isKycVerified && investment.status !== "PENDING" && investment.agreementUrl ? Colors.primary : Colors.outline} />
            </TouchableOpacity>
          )}

          {investment.paymentProofs && investment.paymentProofs.length > 0 && (
            <View style={{ marginTop: 12 }}>
              {investment.paymentProofs.map((proofUrl, index) => {
                const isRazorpay = proofUrl === "razorpay_direct_payment" || proofUrl === "admin_cash";
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.docRow, { marginTop: 8 }]}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (!isRazorpay && proofUrl.startsWith("http")) {
                        setPreviewUrl(proofUrl);
                      }
                    }}
                  >
                    <View style={styles.docIconBox}>
                      <Ionicons name={isRazorpay ? (proofUrl === "admin_cash" ? "cash-outline" : "shield-checkmark") : "receipt"} size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.docInfo}>
                      <Text style={styles.docTitle}>{proofUrl === "admin_cash" ? "Cash Payment (Admin)" : isRazorpay ? "Razorpay Payment" : `Payment Proof ${index + 1}`}</Text>
                      <Text style={styles.docSubtitle}>{isRazorpay ? "Verified" : (investment.status === "APPROVED" || investment.status === "PARTIAL_PAID" ? "Verified by Admin" : "Uploaded")}</Text>
                    </View>
                    {!isRazorpay && <Ionicons name="eye-outline" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {investment.paymentHistory && investment.paymentHistory.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.sectionSubtitle}>Approved Payments & Invoices</Text>
              {investment.paymentHistory.map((payment, index) => (
                <TouchableOpacity
                  key={`payment-${index}`}
                  style={[styles.docRow, { marginTop: 8 }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (payment.invoiceUrl) {
                      Linking.openURL(payment.invoiceUrl);
                    }
                  }}
                >
                  <View style={styles.docIconBox}>
                    <Ionicons name="cash" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.docInfo}>
                    <Text style={styles.docTitle}>₹{payment.amount.toLocaleString('en-IN')}</Text>
                    <Text style={styles.docSubtitle}>{formatDate(payment.date)}</Text>
                  </View>
                  {payment.invoiceUrl && (
                    <Ionicons name="download-outline" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {investment.status === "PENDING" ? (
            <View style={styles.kycWarningBox}>
              <Ionicons name="time" size={16} color="#B8860B" />
              <Text style={styles.kycWarningText}>Payment pending admin approval</Text>
            </View>
          ) : !isKycVerified && (
            <View style={styles.kycWarningBox}>
              <Ionicons name="warning" size={16} color="#B8860B" />
              <Text style={styles.kycWarningText}>{pendingMessage}</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
                <Text style={styles.kycWarningLink}>Verify Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <ActionModal
        visible={modalConfig.visible}
        title={modalConfig.title}
        message={modalConfig.message}
        iconName={modalConfig.iconName}
        primaryButtonText={modalConfig.primaryBtn}
        secondaryButtonText={modalConfig.secondaryBtn}
        onPrimaryAction={modalConfig.onPrimary}
        onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
      />

      {/* Pay Remaining Modal */}
      <Modal visible={showPayRemaining} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pay Remaining Balance</Text>
            {(() => {
              const remaining = investment.totalAmount - (investment.paidAmount || 0);
              const isRazorpayDisabled = remaining > 100000;
              return (
                <View style={{width: "100%"}}>
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
                     <Text style={{color: "red", fontSize: 12, marginBottom: 10}}>Razorpay is disabled for amounts > ₹1,00,000. Use Bank Transfer.</Text>
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

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPayRemaining(false)} disabled={isSubmitting}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handlePayRemaining} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Proof</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Request Refund Modal */}
      <Modal visible={showRequestRefund} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Refund</Text>
            <Text style={styles.modalSubtitle}>Please enter your bank details to receive your ₹{investment.paidAmount} refund.</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Account Name</Text>
              <TextInput
                style={styles.input}
                value={refundBankDetails.accountName}
                onChangeText={(t) => setRefundBankDetails(p => ({ ...p, accountName: t }))}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Bank Name</Text>
              <TextInput
                style={styles.input}
                value={refundBankDetails.bankName}
                onChangeText={(t) => setRefundBankDetails(p => ({ ...p, bankName: t }))}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Account Number</Text>
              <TextInput
                style={styles.input}
                value={refundBankDetails.accountNumber}
                onChangeText={(t) => setRefundBankDetails(p => ({ ...p, accountNumber: t }))}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>IFSC Code</Text>
              <TextInput
                style={styles.input}
                value={refundBankDetails.ifscCode}
                onChangeText={(t) => setRefundBankDetails(p => ({ ...p, ifscCode: t }))}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowRequestRefund(false)} disabled={isSubmitting}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleRequestRefund} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Request Refund</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Document Preview Modal */}
      <Modal visible={!!previewUrl} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 20, paddingTop: insets.top + 10 }}>
            <TouchableOpacity onPress={() => setPreviewUrl(null)}>
              <Ionicons name="close-circle" size={36} color="#fff" />
            </TouchableOpacity>
          </View>
          {previewUrl && (
            previewUrl.toLowerCase().endsWith('.pdf') ? (
              <WebView source={{ uri: previewUrl }} style={{ flex: 1, backgroundColor: 'transparent' }} />
            ) : (
              <Image source={{ uri: previewUrl }} style={{ flex: 1 }} resizeMode="contain" />
            )
          )}
        </View>
      </Modal>

      {/* Request Withdrawal Modal */}
      <Modal visible={showWithdrawalModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Withdrawal</Text>
            <Text style={styles.modalSubtitle}>
              Enter your bank details to receive your maturity payout of {formatCurrency(investment?.currentValuation || 0)}.
            </Text>
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
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowWithdrawalModal(false)} disabled={isSubmitting}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: "#059669" }]} 
                disabled={isSubmitting}
                onPress={async () => {
                  if (!refundDetails.accountName || !refundDetails.bankName || !refundDetails.accountNumber || !refundDetails.ifscCode) {
                    GlobalAlert.alert("Error", "Please fill all bank details");
                    return;
                  }
                  setIsSubmitting(true);
                  try {
                    await investmentService.requestWithdrawal(investment.id, refundDetails);
                    GlobalAlert.alert("Success", "Withdrawal requested successfully.");
                    setShowWithdrawalModal(false);
                    loadData(true);
                  } catch (err: any) {
                    GlobalAlert.alert("Error", err?.response?.data?.message || "Failed to request withdrawal");
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceContainerHighest,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  heroCard: {
    margin: 16,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  heroDetailsBlock: {
    padding: 16,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.onSurface,
    marginBottom: 4,
  },
  heroLocation: {
    fontSize: 13,
    color: Colors.outline,
    fontWeight: "500",
    marginBottom: 12,
  },
  specsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerHighest,
    paddingTop: 12,
  },
  specBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  specText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.onSurfaceVariant,
  },
  propDetailsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerHighest,
  },
  propDetailCell: {
    flex: 1,
    alignItems: "center",
  },
  propDetailLabel: {
    fontSize: 10,
    color: Colors.outline,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  propDetailValue: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  snapshotCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.onSurface,
    marginBottom: 16,
  },
  snapshotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  viewPropBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  viewPropBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#059669",
  },
  snapshotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  snapshotItem: {
    width: "48%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  snapshotLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  snapshotValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    overflow: "hidden",
  },
  noDataBox: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 12,
  },
  noDataText: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.outline,
  },
  docsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainer,
    padding: 12,
    borderRadius: 12,
  },
  docRowDisabled: {
    opacity: 0.6,
  },
  docIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.onSurface,
    marginBottom: 2,
  },
  docSubtitle: {
    fontSize: 11,
    color: Colors.outline,
  },
  kycWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  kycWarningText: {
    fontSize: 12,
    color: '#B8860B',
    flex: 1,
  },
  kycWarningLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  rejectedCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  rejectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  rejectedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.error,
    marginLeft: 8,
  },
  rejectedReason: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.onSurface,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.outline,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.outline,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.onSurface,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  submitBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: "center",
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
  
  // Partial Payment Styles
  partialBox: {
    backgroundColor: "#FFF3E0",
    borderWidth: 1,
    borderColor: "#FFB74D",
    borderRadius: 12,
    padding: 12,
  },
  partialTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E65100",
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#FFE0B2",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
  },
  partialMeta: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  partialActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  payBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#2E7D32",
    paddingVertical: 10,
    borderRadius: 8,
  },
  payBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  refundBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FCE4EC",
    borderWidth: 1,
    borderColor: "#F06292",
    paddingVertical: 10,
    borderRadius: 8,
  },
  refundBtnText: {
    color: "#AD1457",
    fontSize: 13,
    fontWeight: "600",
  },
});
