import React, { useEffect, useState, useCallback } from "react";
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
import { LineChart } from "react-native-gifted-charts";
import Skeleton from "@/components/ui/Skeleton";
import ActionModal from "@/components/ActionModal";

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
          <Skeleton width="100%" height="100%" borderRadius={0} />
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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

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

  // Process chart data if price history exists
  const chartData = property?.priceHistory?.map(ph => ({
    value: ph.price * investment.units,
    label: new Date(ph.date).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
  })) || [{ value: investment.totalAmount, label: "Current" }];

  const minInvestedValue = Math.min(...chartData.map(d => d.value));
  const yAxisOffset = Math.max(0, Math.floor(minInvestedValue * 0.85));

  const formatYLabel = (val: string) => {
    const num = Number(val);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return `₹${num}`;
  };

  const currentPrice = property?.perUnitPrice || investment.unitPriceAtTime;
  const priceDiff = currentPrice - investment.unitPriceAtTime;
  const isPositive = priceDiff >= 0;

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
          <Image source={{ uri: img }} style={styles.heroImage} />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle} numberOfLines={1}>
              {investment.property?.title ?? "Property"}
            </Text>
            <Text style={styles.heroLocation}>
              <Ionicons name="location-outline" size={14} color="#fff" />{" "}
              {investment.property?.location ?? "—"}
            </Text>
          </View>
        </View>

        {/* Snapshot */}
        <View style={styles.snapshotCard}>
          <Text style={styles.sectionTitle}>Snapshot</Text>
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
          <Text style={styles.sectionTitle}>Portfolio Value Trend</Text>
          {property?.priceHistory && property.priceHistory.length > 1 ? (
             <LineChart
               data={chartData}
               width={width - 110}
               height={200}
               spacing={55}
               initialSpacing={15}
               color1={Colors.primary}
               textColor1={Colors.onSurface}
               dataPointsColor1={Colors.primary}
               dataPointsRadius1={4}
               textFontSize={10}
               hideRules
               yAxisColor={Colors.outlineVariant}
               xAxisColor={Colors.outlineVariant}
               yAxisTextStyle={{ color: Colors.outline, fontSize: 10 }}
               xAxisLabelTextStyle={{ color: Colors.outline, fontSize: 10, width: 40 }}
               isAnimated
               thickness={3}
               curved
               areaChart
               startFillColor={Colors.primary}
               startOpacity={0.3}
               endFillColor={Colors.primary}
               endOpacity={0.05}
               yAxisOffset={yAxisOffset}
               formatYLabel={formatYLabel}
               yAxisLabelWidth={45}
               pointerConfig={{
                 pointerStripUptoDataPoint: true,
                 pointerStripColor: Colors.primary,
                 pointerStripWidth: 2,
                 strokeDashArray: [2, 5],
                 pointerColor: Colors.primary,
                 radius: 4,
                 pointerLabelWidth: 100,
                 pointerLabelHeight: 40,
                 activatePointersOnLongPress: false,
                 autoAdjustPointerLabelPosition: true,
                 pointerLabelComponent: (items: any) => {
                   return (
                     <View
                       style={{
                         height: 40,
                         width: 100,
                         backgroundColor: Colors.surfaceContainerHighest,
                         borderRadius: 8,
                         justifyContent: 'center',
                         alignItems: 'center',
                       }}>
                       <Text style={{color: Colors.onSurface, fontSize: 12, fontWeight: '700'}}>
                         {formatCurrency(items[0].value)}
                       </Text>
                     </View>
                   );
                 },
               }}
             />
          ) : (
            <View style={styles.noDataBox}>
              <Ionicons name="bar-chart-outline" size={32} color={Colors.outlineVariant} />
              <Text style={styles.noDataText}>Not enough data to show trend</Text>
            </View>
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
    height: 180,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: Colors.surfaceContainer,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    padding: 16,
    paddingTop: 40,
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },
  heroLocation: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    fontWeight: "500",
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
  snapshotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  snapshotItem: {
    width: "45%",
  },
  snapshotLabel: {
    fontSize: 11,
    color: Colors.outline,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  snapshotValue: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.onSurface,
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
  }
});
