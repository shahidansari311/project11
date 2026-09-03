/**
 * MyPortfolioPage — Real investment data from backend
 * ─────────────────────────────────────────────────────
 * Fetches the user's investments and displays them with
 * status badges, amount, and per-unit details.
 */

import React, { useEffect, useState, useCallback } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { investmentService } from "@/services/investment.service";
import { Investment, InvestmentStatus, PLACEHOLDER_IMAGE } from "../BrowseProperties/data";

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

// ── Status badge config ──
const STATUS_CONFIG: Record<
  InvestmentStatus,
  { label: string; bg: string; text: string; icon: string }
> = {
  PENDING:   { label: "Pending Approval", bg: "#FFF8E1", text: "#B8860B", icon: "time-outline" },
  APPROVED:  { label: "Approved",         bg: "#E8F5E9", text: "#2E7D32", icon: "checkmark-circle-outline" },
  REJECTED:  { label: "Rejected",         bg: "#FFEBEE", text: "#C62828", icon: "close-circle-outline" },
  CANCELLED: { label: "Cancelled",        bg: "#F5F5F5", text: "#616161", icon: "ban-outline" },
};

// ── Skeleton Loader ──
const PortfolioSkeleton = ({ insets }: { insets: any }) => {
  const anim = React.useRef(new Animated.Value(0.4)).current;

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
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Animated.View style={[styles.scrollContent, { opacity: anim }]}>
        {/* Title */}
        <View style={styles.skelTitle} />
        {/* Summary Card */}
        <View style={styles.skelSummary} />
        {/* Filter Chips */}
        <View style={styles.skelFilters}>
          <View style={styles.skelChip} />
          <View style={styles.skelChip} />
          <View style={styles.skelChip} />
          <View style={styles.skelChip} />
        </View>
        {/* Subtitle */}
        <View style={styles.skelSubtitle} />
        {/* Cards */}
        <View style={styles.skelCard} />
        <View style={styles.skelCard} />
        <View style={styles.skelCard} />
      </Animated.View>
    </View>
  );
};

export default function MyPortfolioPage() {
  const insets = useSafeAreaInsets();

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<InvestmentStatus | "ALL">("ALL");

  const loadInvestments = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await investmentService.getMyInvestments({ limit: 100 });
      if (res?.data?.investments) {
        setInvestments(res.data.investments);
      }
    } catch (err: any) {
      // Silently fail on background refresh
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInvestments();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadInvestments(true);
  };

  const handleCancel = (investment: Investment) => {
    Alert.alert(
      "Cancel Investment",
      `Cancel your investment of ${formatCurrency(investment.totalAmount)} for ${investment.units} unit${investment.units > 1 ? "s" : ""}?\n\nUnits will be released back immediately.`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel Investment",
          style: "destructive",
          onPress: async () => {
            setCancellingId(investment.id);
            try {
              await investmentService.cancelInvestment(investment.id);
              setInvestments((prev) =>
                prev.map((inv) =>
                  inv.id === investment.id ? { ...inv, status: "CANCELLED" } : inv
                )
              );
            } catch (err: any) {
              Alert.alert(
                "Error",
                err?.response?.data?.message || "Failed to cancel investment."
              );
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
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

  const FILTERS: Array<InvestmentStatus | "ALL"> = ["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"];

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
              <Text style={[styles.statValue, { color: "#B8860B" }]}>
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
            const cfg = STATUS_CONFIG[inv.status];
            const img = inv.property?.images?.[0] ?? PLACEHOLDER_IMAGE;
            const isCancelling = cancellingId === inv.id;

            return (
              <View key={inv.id} style={styles.investmentCard}>
                {/* Property image + title */}
                <View style={styles.cardHeader}>
                  <Image source={{ uri: img }} style={styles.propImage} />
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.propTitle} numberOfLines={1}>
                      {inv.property?.title ?? "Property"}
                    </Text>
                    <Text style={styles.propLocation} numberOfLines={1}>
                      <Ionicons name="location-outline" size={11} color={Colors.outline} />
                      {" "}{inv.property?.location ?? "—"}
                    </Text>
                    {/* Status badge */}
                    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                      <Ionicons name={cfg.icon as any} size={11} color={cfg.text} />
                      <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
                    </View>
                  </View>
                </View>

                {/* Investment details */}
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

                {/* Date + admin remark */}
                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>{formatDate(inv.createdAt)}</Text>
                  {inv.adminRemark && (
                    <Text style={styles.remarkText}>
                      Admin note: {inv.adminRemark}
                    </Text>
                  )}
                </View>

                {/* Cancel button (PENDING only) */}
                {inv.status === "PENDING" && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancel(inv)}
                    disabled={isCancelling}
                    activeOpacity={0.8}
                  >
                    {isCancelling ? (
                      <ActivityIndicator size="small" color={Colors.error} />
                    ) : (
                      <>
                        <Ionicons name="close" size={13} color={Colors.error} />
                        <Text style={styles.cancelText}>Cancel Investment</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
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
    paddingBottom: 40,
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

  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 12,
    paddingVertical: 8,
    backgroundColor: Colors.errorContainer,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.error,
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
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 24,
    marginBottom: 16,
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
    height: 180,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 20,
    marginBottom: 12,
  },
});
