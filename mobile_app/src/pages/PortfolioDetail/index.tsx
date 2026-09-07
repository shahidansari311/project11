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
  RefreshControl
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
    maximumFractionDigits: 0,
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
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    iconName?: any;
    primaryBtn?: string;
    secondaryBtn?: string;
    onPrimary?: () => void;
  }>({
    visible: false,
    title: "",
    message: "",
  });

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
    });
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
                  {(property?.totalUnits || investment.property?.totalUnits)
                    ? ((investment.units / (property?.totalUnits || investment.property?.totalUnits)) * 100).toFixed(2) + '%'
                    : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {investment.status === "REJECTED" ? (
          <View style={styles.rejectedCard}>
            <View style={styles.rejectedHeader}>
              <Ionicons name="close-circle" size={24} color={Colors.error} />
              <Text style={styles.rejectedTitle}>Investment Rejected</Text>
            </View>
            <Text style={styles.rejectedReason}>
              {investment.adminRemark || "Your investment request was rejected by the admin."}
            </Text>
          </View>
        ) : (
          <>
            {/* Snapshot */}
            <View style={styles.snapshotCard}>
              <View style={styles.snapshotHeader}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Snapshot</Text>
              </View>
          <View style={styles.snapshotGrid}>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Units Owned</Text>
              <Text style={styles.snapshotValue}>{investment.units}</Text>
            </View>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Invested At</Text>
              <Text style={styles.snapshotValue}>{formatCurrency(investment.unitPriceAtTime)}</Text>
            </View>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Total Invested</Text>
              <Text style={styles.snapshotValue}>{formatCurrency(investment.totalAmount)}</Text>
            </View>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Current Value</Text>
              <Text style={[styles.snapshotValue, { color: isPositive ? "#2E7D32" : Colors.error }]}>
                {formatCurrency(investment.units * currentPrice)}
              </Text>
            </View>
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
          
          <TouchableOpacity 
            style={[styles.docRow, (!isKycVerified || investment.status === "PENDING") && styles.docRowDisabled]}
            activeOpacity={0.7}
            onPress={handleDownloadAgreement}
          >
            <View style={styles.docIconBox}>
              <Ionicons name="document-text" size={20} color={isKycVerified && investment.status !== "PENDING" ? Colors.primary : Colors.outline} />
            </View>
            <View style={styles.docInfo}>
              <Text style={[styles.docTitle, (!isKycVerified || investment.status === "PENDING") && { color: Colors.outline }]}>Fractional Ownership Agreement</Text>
              <Text style={styles.docSubtitle}>Signed on {formatDate(investment.createdAt)}</Text>
            </View>
            <Ionicons name="download-outline" size={20} color={isKycVerified && investment.status !== "PENDING" ? Colors.primary : Colors.outline} />
          </TouchableOpacity>

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
  }
});
