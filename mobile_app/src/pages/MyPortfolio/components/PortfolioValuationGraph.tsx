import { useMemo } from "react";
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
  currencySymbol?: string;
}

const formatCurrency = (val: number, currencySymbol: string = "₹") => {
  if (val === null || val === undefined || isNaN(val)) return "N/A";
  if (val === 0) return `${currencySymbol}0`;
  const absVal = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (absVal >= 10000000) return `${sign}${currencySymbol}${(absVal / 10000000).toFixed(2)}Cr`;
  if (absVal >= 100000) return `${sign}${currencySymbol}${(absVal / 100000).toFixed(1)}L`;
  if (absVal >= 1000) return `${sign}${currencySymbol}${(absVal / 1000).toFixed(1)}k`;
  return `${sign}${currencySymbol}${absVal.toFixed(0)}`;
};

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
};

export default function PortfolioValuationGraph({
  priceHistory = [],
  units,
  currencySymbol = "₹",
}: PortfolioValuationGraphProps) {
  // Sort history and scale by units
  const scaledHistory = useMemo(() => {
    if (!Array.isArray(priceHistory) || priceHistory.length === 0) return [];
    
    return [...priceHistory]
      .filter((item) => typeof item.price === "number" && item.price >= 0)
      .sort((a, b) => new Date(a.date || a.createdAt || "").getTime() - new Date(b.date || b.createdAt || "").getTime())
      .map(item => ({
        ...item,
        valuation: item.price * units,
      }));
  }, [priceHistory, units]);

  if (scaledHistory.length < 2) {
    return null; // Don't show chart on portfolio card if less than 2 points
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

          {/* Area & Path */}
          <Path d={chartData.areaD} fill="url(#portfolioGrad)" />
          <Path d={chartData.pathD} fill="none" stroke="#1E3A8A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {chartData.points.map((pt) => (
            <G key={`pt-${pt.idx}`}>
              <Circle
                cx={pt.x}
                cy={pt.y}
                r={3.5}
                fill="#FFFFFF"
                stroke={pt.isDrop ? "#EF4444" : "#1E3A8A"}
                strokeWidth="2"
              />
              {/* Only show date labels for first and last to save space */}
              {(pt.idx === 0 || pt.idx === chartData.points.length - 1) && (
                <SvgText
                  x={pt.x}
                  y={chartData.height - 6}
                  textAnchor={pt.idx === 0 ? "start" : "end"}
                  fill="#9CA3AF"
                  fontSize="8"
                  fontWeight="bold"
                >
                  {formatDate(pt.date)}
                </SvgText>
              )}
            </G>
          ))}
        </Svg>
      </View>
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
    overflow: "hidden",
  },
});
