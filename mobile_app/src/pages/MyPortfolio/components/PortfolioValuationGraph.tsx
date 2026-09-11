import { useMemo, useState } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line, G, Text as SvgText } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface PricePoint {
  price: number;
  date?: string;
  createdAt?: string;
}

export interface PortfolioValuationGraphProps {
  priceHistory?: PricePoint[];
  units: number;
  totalUnits: number;
  purchasedAt?: string;
  investedAmount?: number;
  currencySymbol?: string;
}

const formatCurrency = (val: number, currencySymbol: string = "₹") => {
  if (!val) return `${currencySymbol}0`;
  const absVal = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (absVal >= 10000000) return `${sign}${currencySymbol}${Number((absVal / 10000000).toFixed(2))} Cr`;
  if (absVal >= 100000) return `${sign}${currencySymbol}${Number((absVal / 100000).toFixed(2))} L`;
  if (absVal >= 1000) return `${sign}${currencySymbol}${Number((absVal / 1000).toFixed(2))} K`;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(val).replace("₹", currencySymbol);
};

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
};

export default function PortfolioValuationGraph({
  priceHistory = [],
  units,
  totalUnits,
  purchasedAt,
  investedAmount,
  currencySymbol = "₹",
}: PortfolioValuationGraphProps) {
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);

  // Sort history and scale by units
  const scaledHistory = useMemo(() => {
    if (!Array.isArray(priceHistory) || priceHistory.length === 0) return [];
    
    // Sort all available historical points chronologically
    const sorted = [...priceHistory]
      .filter((item) => typeof item.price === "number" && item.price >= 0)
      .sort((a, b) => new Date(a.date || a.createdAt || "").getTime() - new Date(b.date || b.createdAt || "").getTime());
      
    // If purchasedAt is provided, filter out points well before purchase date.
    // We want the most recent point *before* or *at* the purchase date to serve as our starting baseline.
    let relevantPoints = sorted;
    if (purchasedAt) {
      const purchaseTime = new Date(purchasedAt).getTime();
      
      // Find the index of the first point that occurs strictly after the purchase time
      const firstIndexAfterPurchase = sorted.findIndex(
        item => new Date(item.date || item.createdAt || "").getTime() > purchaseTime
      );
      
      if (firstIndexAfterPurchase === -1) {
        // All points happened before or exactly at purchase. Just take the very last one.
        relevantPoints = sorted.length > 0 ? [sorted[sorted.length - 1]] : [];
      } else if (firstIndexAfterPurchase === 0) {
        // All points happened strictly after purchase. 
        relevantPoints = sorted;
      } else {
        // Take the point exactly before the purchase, plus all points after.
        relevantPoints = sorted.slice(firstIndexAfterPurchase - 1);
      }
    }

    const calculatedPoints = relevantPoints.map(item => ({
        ...item,
        valuation: (item.price / (totalUnits || 1)) * units,
    }));
    
    // Inject the exact invested amount at the purchase date as the true starting point
    // This prevents historical `totalUnits` mismatches from making the start point look incorrect.
    if (purchasedAt && investedAmount !== undefined) {
      // Remove any points that are strictly BEFORE the purchase date since we now have the exact purchase point
      const purchaseTime = new Date(purchasedAt).getTime();
      const filtered = calculatedPoints.filter(p => new Date(p.date || p.createdAt || "").getTime() > purchaseTime);
      
      return [
        { price: (investedAmount / units) * (totalUnits || 1), valuation: investedAmount, date: purchasedAt },
        ...filtered
      ];
    }

    return calculatedPoints;
  }, [priceHistory, units, totalUnits, purchasedAt, investedAmount]);

  if (scaledHistory.length < 2) {
    return (
      <View style={styles.placeholderContainer}>
        <Ionicons name="stats-chart-outline" size={24} color="#9CA3AF" />
        <Text style={styles.placeholderText}>
          Graph requires at least 2 price points. Currently, there is only 1 point.
        </Text>
      </View>
    );
  }

  const chartData = useMemo(() => {
    const width = SCREEN_WIDTH - 32 - 16 - 16; // Adjust based on card padding
    const height = 120; // Smaller height for the card
    const padding = { top: 15, right: 15, bottom: 20, left: 40 };

    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const valuations = scaledHistory.map((i) => i.valuation);
    const minValuation = Math.min(...valuations);
    const maxValuation = Math.max(...valuations);
    const range = maxValuation === minValuation ? (maxValuation * 0.1 || 10000) : maxValuation - minValuation;

    const minVal = Math.max(0, minValuation - range * 0.1);
    const maxVal = maxValuation + range * 0.1;
    const effectiveRange = maxVal - minVal;

    const points = scaledHistory.map((item, idx) => {
      const x = padding.left + (idx / (scaledHistory.length - 1)) * plotWidth;
      const y = padding.top + plotHeight - ((item.valuation - minVal) / effectiveRange) * plotHeight;
      const prevVal = idx > 0 ? scaledHistory[idx - 1].valuation : null;
      const diff = prevVal !== null ? item.valuation - prevVal : 0;
      const isDrop = diff < 0;

      return { x, y, valuation: item.valuation, isDrop, idx, date: item.date || item.createdAt };
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

    const yTicks = [0, 0.5, 1].map((ratio) => {
      const val = minVal + ratio * effectiveRange;
      const y = padding.top + plotHeight - ratio * plotHeight;
      return { val, y };
    });

    const startValuation = points[0].valuation;
    const currentValuation = points[points.length - 1].valuation;
    const totalDiff = currentValuation - startValuation;
    const isTotalPositive = totalDiff >= 0;
    const totalDiffPct = startValuation > 0 ? ((totalDiff / startValuation) * 100).toFixed(1) : "0.0";

    return { width, height, padding, points, pathD, areaD, yTicks, totalDiff, isTotalPositive, totalDiffPct };
  }, [scaledHistory]);

  if (!chartData) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Valuation Trend</Text>
        <View style={[styles.badge, chartData.isTotalPositive ? styles.badgeUp : styles.badgeDrop]}>
          <Ionicons name={chartData.isTotalPositive ? "trending-up" : "trending-down"} size={10} color={chartData.isTotalPositive ? "#059669" : "#E11D48"} />
          <Text style={[styles.badgeText, { color: chartData.isTotalPositive ? "#059669" : "#E11D48" }]}>
            {chartData.isTotalPositive ? "+" : ""}{chartData.totalDiffPct}%
          </Text>
        </View>
      </View>
      <View style={styles.chartWrapper}>
        <Svg width={chartData.width} height={chartData.height}>
          <Defs>
            <LinearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Grid Lines */}
          {chartData.yTicks.map((tick, i) => (
            <G key={`ytick-${i}`}>
              <Line
                x1={chartData.padding.left}
                y1={tick.y}
                x2={chartData.width - chartData.padding.right}
                y2={tick.y}
                stroke="#F1F5F9"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <SvgText
                x={chartData.padding.left - 6}
                y={tick.y + 3}
                textAnchor="end"
                fill="#9CA3AF"
                fontSize="9"
              >
                {formatCurrency(tick.val, currencySymbol)}
              </SvgText>
            </G>
          ))}

          {/* X Axis Line */}
          <Line
            x1={chartData.padding.left}
            y1={chartData.height - chartData.padding.bottom}
            x2={chartData.width - chartData.padding.right}
            y2={chartData.height - chartData.padding.bottom}
            stroke="#E2E8F0"
            strokeWidth="1"
          />

          {/* Area & Path */}
          <Path d={chartData.areaD} fill="url(#portfolioGrad)" />
          <Path d={chartData.pathD} fill="none" stroke="#1E3A8A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {chartData.points.map((pt) => {
            const isHovered = hoveredPoint?.idx === pt.idx;
            return (
              <G key={`pt-${pt.idx}`} onPress={() => setHoveredPoint(isHovered ? null : pt)}>
                {/* Invisible Hit Area for easier tapping */}
                <Circle cx={pt.x} cy={pt.y} r="25" fill="transparent" />

                {isHovered && (
                  <Circle cx={pt.x} cy={pt.y} r="8" fill={pt.isDrop ? "#EF4444" : "#1E3A8A"} fillOpacity="0.18" />
                )}
                <Circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5 : 3.5}
                  fill="#FFFFFF"
                  stroke={pt.isDrop ? "#EF4444" : "#1E3A8A"}
                  strokeWidth={isHovered ? "2.5" : "2"}
                />
                {(pt.idx === 0 || pt.idx === chartData.points.length - 1) && !isHovered && (
                  <SvgText
                    x={pt.x}
                    y={chartData.height - 2}
                    textAnchor="end"
                    fill="#9CA3AF"
                    fontSize="8"
                    fontWeight="bold"
                    transform={`rotate(-45, ${pt.x}, ${chartData.height - 2})`}
                  >
                    {formatDate(pt.date)}
                  </SvgText>
                )}
              </G>
            );
          })}
        </Svg>
        
        {/* Tooltip Overlay */}
        {hoveredPoint && (
          <View
            style={[
              styles.tooltipBox,
              {
                left: hoveredPoint.x,
                top: hoveredPoint.y - 10,
                transform: [
                  { translateX: hoveredPoint.x > chartData.width * 0.75 ? -90 : hoveredPoint.x < chartData.width * 0.25 ? 0 : -45 },
                  { translateY: -50 }
                ],
              },
            ]}
          >
            <Text style={styles.tooltipPrice}>
              {formatCurrency(hoveredPoint.valuation, currencySymbol)}
            </Text>
            <Text style={styles.tooltipDate}>{formatDate(hoveredPoint.date)}</Text>
          </View>
        )}
      </View>

      {/* Valuation History Log Table */}
      {scaledHistory.length > 0 && (
        <View style={styles.tableSection}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableTitle}>Valuation History ({scaledHistory.length})</Text>
          </View>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeaderBg}>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Date</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Value</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Change</Text>
            </View>
            {[...scaledHistory].reverse().map((item, idx, arr) => {
              const prevItem = arr[idx + 1];
              const diff = prevItem ? item.valuation - prevItem.valuation : 0;
              const diffPct = prevItem && prevItem.valuation > 0 ? ((diff / prevItem.valuation) * 100).toFixed(1) : null;
              const isDrop = diff < 0;

              return (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCellText, { flex: 1 }]}>{formatDate(item.date || item.createdAt)}</Text>
                  <Text style={[styles.tableCellText, { flex: 1, fontWeight: "bold", color: prevItem ? (isDrop ? "#E11D48" : "#047857") : "#111827" }]}>
                    {formatCurrency(item.valuation, currencySymbol)}
                  </Text>
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    {prevItem ? (
                      <View style={[styles.tableDiffBadge, isDrop ? styles.tableDiffDrop : styles.tableDiffUp]}>
                        <Ionicons name={isDrop ? "trending-down" : "trending-up"} size={10} color={isDrop ? "#BE123C" : "#047857"} />
                        <Text style={[styles.tableDiffText, { color: isDrop ? "#BE123C" : "#047857" }]}>
                          {diff >= 0 ? "+" : ""}{diffPct}%
                        </Text>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 10, color: "#9CA3AF", fontStyle: "italic" }}>Initial</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4B5563",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
    backgroundColor: "#F3F4F6",
  },
  badgeUp: {
    backgroundColor: "#ECFDF5",
  },
  badgeDrop: {
    backgroundColor: "#FFF1F2",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  chartWrapper: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "visible",
    position: "relative",
  },
  tooltipBox: {
    position: "absolute",
    backgroundColor: "#111827",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    minWidth: 90,
    zIndex: 100,
  },
  tooltipPrice: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  tooltipDate: {
    color: "#fff",
    fontSize: 10,
    opacity: 0.8,
    marginTop: 2,
  },
  placeholderContainer: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginVertical: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  placeholderText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 16,
  },
  tableSection: {
    marginTop: 20,
  },
  tableHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  tableTitle: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#9CA3AF",
    letterSpacing: 0.5,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    overflow: "hidden",
  },
  tableHeaderBg: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4B5563",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  tableCellText: {
    fontSize: 12,
    color: "#111827",
  },
  tableDiffBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    gap: 2,
  },
  tableDiffDrop: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FECDD3",
  },
  tableDiffUp: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  tableDiffText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
