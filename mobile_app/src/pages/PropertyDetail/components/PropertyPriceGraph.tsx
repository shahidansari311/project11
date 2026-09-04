import React, { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions, Pressable } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { Ionicons } from "@expo/vector-icons";

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

// --- Design tokens -----------------------------------------------------
// "Estate Navy": a palette built for a property-price surface rather than
// a generic dashboard. Navy carries the line/brand weight, amber marks
// the live/current point, and green/brick (not neon) carry direction.
const COLORS = {
  navy: "#16324F",
  navySoft: "rgba(22, 50, 79, 0.10)",
  amber: "#C99A3A",
  amberSoft: "rgba(201, 154, 58, 0.14)",
  positive: "#1F8A5F",
  positiveSoft: "rgba(31, 138, 95, 0.12)",
  negative: "#C1442E",
  negativeSoft: "rgba(193, 68, 46, 0.12)",
  ink: "#1A1D29",
  slate: "#6B7280",
  slateLight: "#9CA3AF",
  hairline: "#EDEFF2",
  card: "#F3F5F7",
  tooltipBg: "#16324F",
};

export default function PropertyPriceGraph({
  priceHistory = [],
  currentPrice,
  currencySymbol = "₹",
  onAddPricePoint,
}: PriceTrendChartProps) {
  const validHistory = useMemo(() => {
    return priceHistory
      .map((item) => {
        let parsedPrice = item.price;
        if (typeof parsedPrice === "string") {
          parsedPrice = parseFloat(parsedPrice.replace(/[^0-9.-]+/g, ""));
        }
        return { ...item, parsedPrice: isNaN(parsedPrice as number) ? 0 : (parsedPrice as number) };
      })
      .filter((item) => item.parsedPrice >= 0);
  }, [priceHistory]);

  const formatPrice = (val: number) => {
    if (val === 0) return `${currencySymbol}0`;
    const absVal = Math.abs(val);
    const sign = val < 0 ? "-" : "";
    if (absVal >= 10000000) return `${sign}${currencySymbol}${(absVal / 10000000).toFixed(1)}Cr`;
    if (absVal >= 100000) return `${sign}${currencySymbol}${(absVal / 100000).toFixed(1)}L`;
    if (absVal >= 1000) return `${sign}${currencySymbol}${(absVal / 1000).toFixed(1)}k`;
    return `${sign}${currencySymbol}${absVal.toFixed(0)}`;
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "";
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return "";
    return `${dateObj.getDate()} ${dateObj.toLocaleString("default", { month: "short" })} ${dateObj.getFullYear()}`;
  };

  const formatTime = (dateStr: string | undefined) => {
    if (!dateStr) return "";
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return "";
    let hours = dateObj.getHours();
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = dateObj.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes} ${ampm}`;
  };

  // --- Header row (shared across all states) ---
  const Header = () => (
    <View style={styles.headerRow}>
      <View>
        <Text style={styles.headerTitle}>Price trend</Text>
        <Text style={styles.headerSubtitle}>
          {validHistory.length} recorded {validHistory.length === 1 ? "price" : "prices"}
        </Text>
      </View>
      {onAddPricePoint && (
        <Pressable
          onPress={onAddPricePoint}
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
          hitSlop={8}
        >
          <Ionicons name="add" size={16} color={COLORS.navy} />
          <Text style={styles.addButtonText}>Add price</Text>
        </Pressable>
      )}
    </View>
  );

  if (validHistory.length === 0) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="trending-up-outline" size={20} color={COLORS.slateLight} />
          </View>
          <Text style={styles.emptyTitle}>No price history yet</Text>
          <Text style={styles.emptySubtext}>Add a price to start tracking how this listing moves over time</Text>
        </View>
      </View>
    );
  }

  if (validHistory.length === 1) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.emptyState}>
          <Text style={styles.singlePrice}>{formatPrice(validHistory[0].parsedPrice)}</Text>
          <Text style={styles.emptySubtext}>Recorded on {formatDate(validHistory[0].date || validHistory[0].createdAt) || "an unknown date"}</Text>
          <Text style={[styles.emptySubtext, { marginTop: 2 }]}>The trend line appears once a second price is added</Text>
        </View>
      </View>
    );
  }

  const prices = validHistory.map((item) => item.parsedPrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const displayPrice = currentPrice ?? validHistory[validHistory.length - 1].parsedPrice;

  // Calculate dynamic padding to give space below the graph line and above it
  const priceRange = maxPrice - minPrice;
  // Shift all values up so they physically hover above the bottom SVG boundary
  const shiftAmount = priceRange === 0 ? (minPrice === 0 ? 100 : minPrice * 0.5) : priceRange * 0.25;
  const topPadding = priceRange === 0 ? (minPrice === 0 ? 100 : minPrice * 0.2) : priceRange * 0.2;
  
  const maxValue = maxPrice + shiftAmount + topPadding;

  const chartData = validHistory.map((item, index) => {
    const isLast = index === validHistory.length - 1;
    const label = formatDate(item.date || item.createdAt);

    return {
      value: item.parsedPrice + shiftAmount, // Artificial boost for drawing
      realValue: item.parsedPrice,           // Real value for tooltip
      label: index % Math.ceil(validHistory.length / 4) === 0 || isLast ? label : "",
      customDataPoint: () => <View style={[styles.dataPoint, isLast && styles.lastDataPoint]} />,
      dateStr: label,
      timeStr: formatTime(item.date || item.createdAt),
    };
  });

  const chartWidth = SCREEN_WIDTH - 115;
  const calculatedSpacing =
    chartData.length > 1 ? (chartWidth - 24) / (chartData.length - 1) : 0;

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.priceRow}>
        <Text style={styles.currentPrice}>{formatPrice(displayPrice)}</Text>
      </View>

      <View style={styles.chartWrapper}>
        <LineChart
          data={chartData}
          width={chartWidth}
          yAxisLabelWidth={45}
          height={170}
          thickness={2.5}
          color={COLORS.navy}
          curved
          curvature={0.1}
          areaChart
          startFillColor={COLORS.navy}
          startOpacity={0.14}
          endFillColor={COLORS.navy}
          endOpacity={0.0}
          initialSpacing={16}
          endSpacing={30}
          spacing={calculatedSpacing}
          yAxisColor="transparent"
          xAxisColor="transparent"
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={[styles.axisText, { width: 60, marginLeft: -10, transform: [{ rotate: '-60deg' }] }]}
          xAxisLabelsVerticalShift={40}
          xAxisLabelsHeight={50}
          rulesType="dashed"
          rulesColor={COLORS.hairline}
          maxValue={maxValue}
          noOfSections={4}
          formatYLabel={(label: string) => {
            const num = Number(label.replace(/,/g, "")) - shiftAmount;
            if (num < 0) return ""; // Hide negative placeholder lines at the bottom
            return formatPrice(num);
          }}
          hideDataPoints={false}
          pointerConfig={{
            pointerStripHeight: 150,
            pointerStripColor: COLORS.hairline,
            pointerStripWidth: 2,
            pointerColor: "transparent",
            radius: 6,
            pointerLabelWidth: 168,
            pointerLabelHeight: 80,
            activatePointersOnLongPress: false,
            persistPointer: true,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: any) => {
              if (!items || !items.length) return null;
              const item = items[0];
              const val = item.realValue;
              const dateStr = item.dateStr;
              const timeStr = item.timeStr;

              return (
                <View style={styles.tooltipWrapper}>
                  <View style={styles.tooltipContainer}>
                    <View style={styles.tooltipTopRow}>
                      <Text style={styles.tooltipPrice}>
                        {formatPrice(val)}
                      </Text>
                    </View>
                    <Text style={styles.tooltipDate}>
                      {dateStr} · {timeStr}
                    </Text>
                  </View>
                  <View style={styles.tooltipTriangle} />
                </View>
              );
            },
          }}
        />
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Low</Text>
          <Text style={styles.footerValue}>{formatPrice(minPrice)}</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>High</Text>
          <Text style={styles.footerValue}>{formatPrice(maxPrice)}</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>First recorded</Text>
          <Text style={styles.footerValue}>
            {formatDate(validHistory[0].date || validHistory[0].createdAt)}
          </Text>
        </View>
      </View>

      <View style={styles.tableContainer}>
        <Text style={styles.tableTitle}>History Log</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderCell}>Date</Text>
          <Text style={[styles.tableHeaderCell, { textAlign: "right" }]}>Price</Text>
        </View>
        {[...validHistory].reverse().map((item, index, arr) => {
          const prevItem = arr[index + 1];
          const diff = prevItem ? item.parsedPrice - prevItem.parsedPrice : null;
          const isPositive = diff !== null && diff > 0;
          const isNegative = diff !== null && diff < 0;
          const diffColor = isPositive ? COLORS.positive : isNegative ? COLORS.negative : COLORS.slateLight;

          return (
            <View key={item.id || index} style={styles.tableRow}>
              <View>
                <Text style={styles.tableCellDate}>
                  {formatDate(item.date || item.createdAt)}
                </Text>
                {!!item.remark && (
                  <Text style={styles.tableCellRemark}>{item.remark}</Text>
                )}
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.tableCellPrice}>
                  {formatPrice(item.parsedPrice)}
                </Text>
                {diff !== null && diff !== 0 && (
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2, gap: 2 }}>
                    <Ionicons 
                      name={isPositive ? "arrow-up" : "arrow-down"} 
                      size={10} 
                      color={diffColor} 
                    />
                    <Text style={[styles.tableCellDiff, { color: diffColor }]}>
                      {isPositive ? "+" : "-"}{formatPrice(Math.abs(diff))}
                    </Text>
                  </View>
                )}
                {diff === 0 && (
                  <Text style={[styles.tableCellDiff, { color: diffColor, marginTop: 2 }]}>
                    No change
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    shadowColor: "#0F1B2B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 1,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.ink,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.slate,
    marginTop: 2,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.navySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 3,
  },
  addButtonPressed: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.navy,
  },

  // Current price + trend
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 6,
    gap: 10,
    flexWrap: "wrap",
  },
  currentPrice: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.ink,
    letterSpacing: -0.5,
  },
  trendChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
  },
  trendChipText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Chart
  chartWrapper: {
    alignItems: "center",
    marginTop: 8,
  },
  axisText: {
    color: COLORS.slateLight,
    fontSize: 10,
  },
  dataPoint: {
    width: 10,
    height: 10,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: COLORS.navy,
    borderRadius: 5,
  },
  lastDataPoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderColor: COLORS.amber,
    borderWidth: 3,
  },

  // Empty / single-point states
  emptyState: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.ink,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: COLORS.slate,
    textAlign: "center",
    lineHeight: 17,
    maxWidth: 240,
  },
  singlePrice: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.ink,
    marginBottom: 6,
  },

  // Footer
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
  },
  footerItem: {
    flex: 1,
  },
  footerDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.hairline,
    marginHorizontal: 10,
  },
  footerLabel: {
    fontSize: 10,
    color: COLORS.slate,
    marginBottom: 2,
  },
  footerValue: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.ink,
  },

  // Tooltip
  tooltipWrapper: {
    alignItems: "center",
    width: 168,
  },
  tooltipContainer: {
    backgroundColor: COLORS.tooltipBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  tooltipTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  tooltipPrice: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  diffBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diffText: {
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 2,
    color: "#fff",
  },
  tooltipDate: {
    color: "#C7D0DB",
    fontSize: 10,
    fontWeight: "500",
  },
  tooltipTriangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: COLORS.tooltipBg,
  },

  // Table
  tableContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
  },
  tableTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.ink,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.slate,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F9FA",
  },
  tableCellDate: {
    fontSize: 13,
    color: COLORS.ink,
    fontWeight: "600",
  },
  tableCellRemark: {
    fontSize: 11,
    color: COLORS.slateLight,
    marginTop: 2,
  },
  tableCellPrice: {
    fontSize: 13,
    color: COLORS.ink,
    fontWeight: "700",
  },
  tableCellDiff: {
    fontSize: 11,
    fontWeight: "600",
  },
});