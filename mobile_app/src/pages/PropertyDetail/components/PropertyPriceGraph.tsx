import { useMemo, useState, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, Pressable, PanResponder } from "react-native";
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line, G, Text as SvgText } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface PricePoint {
  id?: string | number;
  price: number | string;
  date?: string;
  createdAt?: string;
  remark?: string;
}

export interface PriceTrendChartProps {
  priceHistory?: PricePoint[];
  currentPrice?: number | null;
  currencySymbol?: string;
  onAddPricePoint?: () => void;
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

const formatDate = (dateStr: string | undefined, format: "short" | "long" = "short") => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "N/A";
  
  if (format === "short") {
    return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
  }
  let hours = d.getHours();
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${d.toLocaleString("default", { month: "long" })} ${d.getDate()}, ${d.getFullYear()} ${hours}:${minutes} ${ampm}`;
};

export default function PropertyPriceGraph({
  priceHistory = [],
  currentPrice,
  currencySymbol = "₹",
  onAddPricePoint,
}: PriceTrendChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);

  // 1. Sort and format history
  const sortedHistory = useMemo(() => {
    if (!Array.isArray(priceHistory) || priceHistory.length === 0) return [];
    
    return [...priceHistory]
      .map((item) => {
        let parsedPrice = item.price;
        if (typeof parsedPrice === "string") {
          parsedPrice = parseFloat(parsedPrice.replace(/[^0-9.-]+/g, ""));
        }
        return {
          ...item,
          parsedPrice: isNaN(parsedPrice as number) ? 0 : (parsedPrice as number),
        };
      })
      .filter((item) => item.parsedPrice >= 0)
      .sort((a, b) => new Date(a.date || a.createdAt || "").getTime() - new Date(b.date || b.createdAt || "").getTime());
  }, [priceHistory]);

  // 2. Calculate Stats
  const stats = useMemo(() => {
    const curP = currentPrice || (sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1].parsedPrice : 0);
    if (sortedHistory.length === 0) {
      return {
        startPrice: curP,
        latestPrice: curP,
        highestPrice: curP,
        lowestPrice: curP,
        totalChange: 0,
        percentageChange: "0.00",
        isPositive: true,
      };
    }
    const prices = sortedHistory.map((i) => i.parsedPrice);
    const startPrice = prices[0];
    const latestPrice = prices[prices.length - 1];
    const highestPrice = Math.max(...prices);
    const lowestPrice = Math.min(...prices);
    const totalChange = latestPrice - startPrice;
    const percentageChange = startPrice > 0 ? ((totalChange / startPrice) * 100).toFixed(2) : "0.00";
    const isPositive = totalChange >= 0;

    return { startPrice, latestPrice, highestPrice, lowestPrice, totalChange, percentageChange, isPositive };
  }, [sortedHistory, currentPrice]);

  // 3. SVG Chart logic
  const chartData = useMemo(() => {
    if (sortedHistory.length < 2) return null;

    const width = SCREEN_WIDTH - 32 - 16 - 16; // Container padding + margin
    const height = 240;
    const padding = { top: 70, right: 20, bottom: 40, left: 60 };

    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const prices = sortedHistory.map((i) => i.parsedPrice);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const priceRange = maxP === minP ? (maxP * 0.1 || 100000) : maxP - minP;

    // Buffer range
    const minVal = Math.max(0, minP - priceRange * 0.08);
    const maxVal = maxP + priceRange * 0.08;
    const effectiveRange = maxVal - minVal;

    const points = sortedHistory.map((item, idx) => {
      const x = padding.left + (idx / (sortedHistory.length - 1)) * plotWidth;
      const price = item.parsedPrice;
      const y = padding.top + plotHeight - ((price - minVal) / effectiveRange) * plotHeight;
      const prevPrice = idx > 0 ? sortedHistory[idx - 1].parsedPrice : null;
      const diff = prevPrice !== null ? price - prevPrice : 0;
      const isDrop = diff < 0;

      return { x, y, price, diff, isDrop, idx, date: item.date || item.createdAt, id: item.id || idx, raw: item };
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

    const yTicks = [0, 0.33, 0.66, 1].map((ratio) => {
      const val = minVal + ratio * effectiveRange;
      const y = padding.top + plotHeight - ratio * plotHeight;
      return { val, y };
    });

    return { width, height, padding, points, pathD, areaD, yTicks, plotWidth, plotHeight };
  }, [sortedHistory]);

  const panResponder = useRef(
    PanResponder.create({
      // Only intercept if clearly horizontal — lets vertical scroll pass through
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) + 5;
      },
      onPanResponderGrant: (evt) => handleTouch(evt),
      onPanResponderMove: (evt) => handleTouch(evt),
      onPanResponderRelease: () => setHoveredPoint(null),
      onPanResponderTerminate: () => setHoveredPoint(null),
    })
  ).current;

  const handleTouch = (evt: any) => {
    if (!chartData) return;
    const { locationX } = evt.nativeEvent;
    let closest = chartData.points[0];
    let minD = Math.abs(locationX - closest.x);
    for (let i = 1; i < chartData.points.length; i++) {
      const d = Math.abs(locationX - chartData.points[i].x);
      if (d < minD) {
        minD = d;
        closest = chartData.points[i];
      }
    }
    if (minD < chartData.plotWidth / chartData.points.length + 20) {
      setHoveredPoint(closest);
    } else {
      setHoveredPoint(null);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <Ionicons name="trending-up" size={18} color={Colors.primary} />
          </View>
          <Text style={styles.headerTitle}>Price Trend & Valuation</Text>
        </View>
        <Text style={styles.headerSubtitle}>Historical price trajectory over time</Text>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Current</Text>
          <Text style={styles.metricValue}>{formatCurrency(stats.latestPrice, currencySymbol)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Initial</Text>
          <Text style={styles.metricValue}>{formatCurrency(stats.startPrice, currencySymbol)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Peak</Text>
          <Text style={[styles.metricValue, { color: "#059669" }]}>{formatCurrency(stats.highestPrice, currencySymbol)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Growth</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <Text style={[styles.metricValue, { color: stats.isPositive ? "#059669" : "#E11D48" }]}>
              {stats.isPositive ? "+" : ""}{stats.percentageChange}%
            </Text>
            <Ionicons name={stats.isPositive ? "trending-up" : "trending-down"} size={12} color={stats.isPositive ? "#059669" : "#E11D48"} />
          </View>
        </View>
      </View>

      {/* Chart Visualization */}
      {sortedHistory.length >= 2 && chartData ? (
        <View style={{ marginTop: 16 }}>
          <View style={styles.chartWrapper} {...panResponder.panHandlers}>
            <Svg width={chartData.width} height={chartData.height}>
              <Defs>
                <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.25" />
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
                    stroke="#E2E8F0"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <SvgText
                    x={chartData.padding.left - 6}
                    y={tick.y + 4}
                    textAnchor="end"
                    fill="#9CA3AF"
                    fontSize="9"
                    fontFamily="monospace"
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
              <Path d={chartData.areaD} fill="url(#grad)" />
              <Path d={chartData.pathD} fill="none" stroke="#1E3A8A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

              {/* Data Points */}
              {chartData.points.map((pt) => {
                const isHovered = hoveredPoint?.id === pt.id;
                return (
                  <G key={pt.id} onPress={() => setHoveredPoint(isHovered ? null : pt)}>
                    {/* Invisible Hit Area for easier tapping */}
                    <Circle cx={pt.x} cy={pt.y} r="25" fill="transparent" />
                    
                    {isHovered && (
                      <Circle cx={pt.x} cy={pt.y} r="9" fill={pt.isDrop ? "#EF4444" : "#1E3A8A"} fillOpacity="0.18" />
                    )}
                    <Circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 4}
                      fill="#FFFFFF"
                      stroke={pt.isDrop ? "#EF4444" : "#1E3A8A"}
                      strokeWidth={isHovered ? "3" : "2"}
                    />
                    <SvgText
                      x={pt.x}
                      y={chartData.height - 5}
                      textAnchor="end"
                      fill={isHovered ? Colors.primary : "#9CA3AF"}
                      fontSize="9"
                      fontWeight={isHovered ? "bold" : "normal"}
                      transform={`rotate(-45, ${pt.x}, ${chartData.height - 5})`}
                    >
                      {formatDate(pt.date, "short")}
                    </SvgText>
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
                      { translateX: hoveredPoint.x > chartData.width * 0.75 ? -130 : hoveredPoint.x < chartData.width * 0.25 ? 0 : -65 },
                      { translateY: -70 }
                    ],
                  },
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={[styles.tooltipPrice, { color: hoveredPoint.isDrop ? "#F87171" : "#34D399" }]}>
                    {formatCurrency(hoveredPoint.price, currencySymbol)}
                  </Text>
                  {hoveredPoint.diff !== 0 && (
                    <View style={[styles.diffBadge, hoveredPoint.isDrop ? styles.diffBadgeDrop : styles.diffBadgeUp]}>
                      <Ionicons name={hoveredPoint.isDrop ? "trending-down" : "trending-up"} size={10} color={hoveredPoint.isDrop ? "#FCA5A5" : "#6EE7B7"} />
                      <Text style={[styles.diffText, { color: hoveredPoint.isDrop ? "#FCA5A5" : "#6EE7B7" }]}>
                        {hoveredPoint.diff > 0 ? "+" : ""}{formatCurrency(hoveredPoint.diff, currencySymbol)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.tooltipDate}>{formatDate(hoveredPoint.date, "long")}</Text>
              </View>
            )}
          </View>
          <Text style={styles.tooltipHint}>* Slide over data points to inspect detailed records</Text>
        </View>
      ) : sortedHistory.length === 1 ? (
        <View style={styles.emptyChart}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="analytics" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.emptyChartTitle}>Single price point recorded</Text>
          <Text style={styles.emptyChartText}>The trend line appears once a different price is recorded.</Text>
        </View>
      ) : (
        <View style={styles.emptyChart}>
          <View style={[styles.emptyIconWrap, { backgroundColor: "#F3F4F6" }]}>
            <Ionicons name="trending-up" size={24} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyChartTitle}>No price history entries</Text>
          <Text style={styles.emptyChartText}>Valuation changes will appear here over time.</Text>
        </View>
      )}

      {/* History Log Table */}
      {sortedHistory.length > 0 && (
        <View style={styles.tableSection}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableTitle}>Recorded Price Logs ({sortedHistory.length})</Text>
          </View>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeaderBg}>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Date</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Price</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Change</Text>
            </View>
            {[...sortedHistory].reverse().map((item, idx, arr) => {
              const prevItem = arr[idx + 1];
              const diff = prevItem ? item.parsedPrice - prevItem.parsedPrice : 0;
              const diffPct = prevItem && prevItem.parsedPrice > 0 ? ((diff / prevItem.parsedPrice) * 100).toFixed(1) : null;
              const isDrop = diff < 0;

              return (
                <View key={item.id || idx} style={styles.tableRow}>
                  <Text style={[styles.tableCellText, { flex: 1 }]}>{formatDate(item.date || item.createdAt, "short")}</Text>
                  <Text style={[styles.tableCellText, { flex: 1, fontWeight: "bold", color: prevItem ? (isDrop ? "#E11D48" : "#047857") : "#111827" }]}>
                    {formatCurrency(item.parsedPrice, currencySymbol)}
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginHorizontal: 16,
  },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 12,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${Colors.primary}1A`,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 6,
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#111827",
  },
  chartWrapper: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "visible",
    position: "relative",
  },
  tooltipHint: {
    fontSize: 10,
    color: "#9CA3AF",
    textAlign: "right",
    fontStyle: "italic",
    marginTop: 6,
  },
  tooltipBox: {
    position: "absolute",
    backgroundColor: "#111827",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    minWidth: 120,
    zIndex: 100,
  },
  tooltipPrice: {
    fontSize: 14,
    fontWeight: "bold",
  },
  tooltipDate: {
    fontSize: 10,
    color: "#D1D5DB",
    marginTop: 4,
  },
  diffBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    gap: 2,
  },
  diffBadgeDrop: {
    backgroundColor: "rgba(244, 63, 94, 0.2)",
    borderColor: "rgba(244, 63, 94, 0.3)",
  },
  diffBadgeUp: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  diffText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  emptyChart: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 8,
  },
  emptyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}1A`,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyChartTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#374151",
  },
  emptyChartText: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
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