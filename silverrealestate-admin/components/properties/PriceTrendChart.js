"use client";

import { useState, useMemo } from "react";
import { Icon } from "@iconify/react";

export default function PriceTrendChart({
  priceHistory = [],
  currentPrice = null,
  onAddPricePoint,
  onEditPricePoint,
  onDeletePricePoint,
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateString, format = "short") => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "N/A";

    if (format === "short") {
      return d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return d.toLocaleDateString("en-IN", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Sort price history ascending by date
  const sortedHistory = useMemo(() => {
    if (!Array.isArray(priceHistory) || priceHistory.length === 0) {
      return [];
    }
    return [...priceHistory].sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
  }, [priceHistory]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (sortedHistory.length === 0) {
      return {
        startPrice: currentPrice,
        latestPrice: currentPrice,
        highestPrice: currentPrice,
        lowestPrice: currentPrice,
        totalChange: 0,
        percentageChange: 0,
        isPositive: true,
      };
    }

    const prices = sortedHistory.map((item) => Number(item.price) || 0);
    const startPrice = prices[0];
    const latestPrice = prices[prices.length - 1];
    const highestPrice = Math.max(...prices);
    const lowestPrice = Math.min(...prices);
    const totalChange = latestPrice - startPrice;
    const percentageChange = startPrice > 0 ? ((totalChange / startPrice) * 100).toFixed(2) : 0;
    const isPositive = totalChange >= 0;

    return {
      startPrice,
      latestPrice,
      highestPrice,
      lowestPrice,
      totalChange,
      percentageChange,
      isPositive,
    };
  }, [sortedHistory, currentPrice]);

  // Calculate SVG chart coordinates
  const chartData = useMemo(() => {
    if (sortedHistory.length < 2) return null;

    const width = 640;
    const height = 220;
    const padding = { top: 30, right: 35, bottom: 40, left: 65 };

    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const prices = sortedHistory.map((item) => Number(item.price) || 0);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const priceRange = maxP === minP ? maxP * 0.1 || 100000 : maxP - minP;

    // Buffer range for aesthetics
    const minVal = Math.max(0, minP - priceRange * 0.08);
    const maxVal = maxP + priceRange * 0.08;
    const effectiveRange = maxVal - minVal;

    const points = sortedHistory.map((item, idx) => {
      const x = padding.left + (idx / (sortedHistory.length - 1)) * plotWidth;
      const price = Number(item.price) || 0;
      const y = padding.top + plotHeight - ((price - minVal) / effectiveRange) * plotHeight;
      const prevPrice = idx > 0 ? Number(sortedHistory[idx - 1].price) || 0 : null;
      const diff = prevPrice !== null ? price - prevPrice : 0;
      const isDrop = diff < 0;

      return {
        x,
        y,
        price,
        diff,
        isDrop,
        idx,
        totalPoints: sortedHistory.length,
        date: item.date || item.createdAt,
        id: item.id || idx,
        raw: item,
      };
    });

    // Build smooth SVG path
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    // Closed path for gradient fill
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

    // 4 Y-axis horizontal ticks
    const yTicks = [0, 0.33, 0.66, 1].map((ratio) => {
      const val = minVal + ratio * effectiveRange;
      const y = padding.top + plotHeight - ratio * plotHeight;
      return { val, y };
    });

    return {
      width,
      height,
      padding,
      points,
      pathD,
      areaD,
      yTicks,
      plotWidth,
      plotHeight,
    };
  }, [sortedHistory]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 md:p-6 flex flex-col gap-6">
      {/* Card Header & Key Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icon icon="lucide:trending-up" width="18" height="18" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Price Trend & Valuation History</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Historical price trajectory recorded over time
          </p>
        </div>

        <button
          type="button"
          onClick={onAddPricePoint}
          className="bg-primary hover:bg-primary/90 text-white font-medium text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Icon icon="lucide:plus-circle" width="16" height="16" />
          <span>Add Price Point</span>
        </button>
      </div>

      {/* Highlights Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col gap-1">
          <span className="text-[11px] font-medium text-gray-500">Current Valuation</span>
          <span className="text-sm font-bold text-gray-900 truncate">
            {formatCurrency(stats.latestPrice)}
          </span>
        </div>

        <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col gap-1">
          <span className="text-[11px] font-medium text-gray-500">Initial Price</span>
          <span className="text-sm font-bold text-gray-900 truncate">
            {formatCurrency(stats.startPrice)}
          </span>
        </div>

        <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col gap-1">
          <span className="text-[11px] font-medium text-gray-500">All-Time Peak</span>
          <span className="text-sm font-bold text-emerald-600 truncate">
            {formatCurrency(stats.highestPrice)}
          </span>
        </div>

        <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col gap-1">
          <span className="text-[11px] font-medium text-gray-500">Total Appreciation</span>
          <div className="flex items-center gap-1">
            <span
              className={`text-sm font-bold flex items-center ${
                stats.isPositive ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {stats.isPositive ? "+" : ""}
              {stats.percentageChange}%
            </span>
            <Icon
              icon={stats.isPositive ? "lucide:trending-up" : "lucide:trending-down"}
              width="14"
              height="14"
              className={stats.isPositive ? "text-emerald-600" : "text-rose-600"}
            />
          </div>
        </div>
      </div>

      {/* Chart Visualization */}
      {sortedHistory.length >= 2 && chartData ? (
        <div className="flex flex-col gap-2">
          {/* Note: overflow-visible ensures tooltip at the right edge never gets clipped */}
          <div className="relative w-full overflow-visible bg-slate-50/70 rounded-xl border border-gray-100 p-2 md:p-3">
            <svg
              viewBox={`0 0 ${chartData.width} ${chartData.height}`}
              className="w-full h-48 sm:h-60 overflow-visible select-none"
            >
              <defs>
                <linearGradient id="priceAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.0" />
                </linearGradient>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#1E3A8A" floodOpacity="0.2" />
                </filter>
              </defs>

              {/* Grid Lines & Y-Axis Labels */}
              {chartData.yTicks.map((tick, i) => (
                <g key={`tick-${i}`}>
                  <line
                    x1={chartData.padding.left}
                    y1={tick.y}
                    x2={chartData.width - chartData.padding.right}
                    y2={tick.y}
                    stroke="#E2E8F0"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={chartData.padding.left - 8}
                    y={tick.y + 4}
                    textAnchor="end"
                    className="text-[10px] fill-gray-400 font-medium font-mono"
                  >
                    {tick.val >= 10000000
                      ? `₹${(tick.val / 10000000).toFixed(2)}Cr`
                      : tick.val >= 100000
                      ? `₹${(tick.val / 100000).toFixed(1)}L`
                      : `₹${Math.round(tick.val)}`}
                  </text>
                </g>
              ))}

              {/* Gradient Area Fill */}
              <path d={chartData.areaD} fill="url(#priceAreaGrad)" />

              {/* Trend Line */}
              <path
                d={chartData.pathD}
                fill="none"
                stroke="#1E3A8A"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#shadow)"
              />

              {/* Data Points */}
              {chartData.points.map((pt) => {
                const isHovered = hoveredPoint?.id === pt.id;
                return (
                  <g
                    key={pt.id}
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer group"
                  >
                    {/* Invisible larger hover trigger area */}
                    <circle cx={pt.x} cy={pt.y} r="16" fill="transparent" />

                    {/* Outer glow ring on hover */}
                    {isHovered && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="9"
                        fill={pt.isDrop ? "#EF4444" : "#1E3A8A"}
                        fillOpacity="0.18"
                      />
                    )}

                    {/* Main point */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 4}
                      fill="#FFFFFF"
                      stroke={pt.isDrop ? "#EF4444" : "#1E3A8A"}
                      strokeWidth={isHovered ? "3" : "2"}
                      className="transition-all duration-150"
                    />

                    {/* Date on X Axis */}
                    <text
                      x={pt.x}
                      y={chartData.height - 12}
                      textAnchor="middle"
                      className={`text-[9px] font-medium transition-colors ${
                        isHovered ? "fill-primary font-bold" : "fill-gray-400"
                      }`}
                    >
                      {formatDate(pt.date, "short")}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Smart Positioned Hover Tooltip (Never cuts off on left or right edges) */}
            {hoveredPoint && (
              (() => {
                const ratio = hoveredPoint.x / chartData.width;
                // Position adjustment based on horizontal ratio:
                let transformStyle = "-translate-x-1/2 -translate-y-[120%]";
                let arrowStyle = "left-1/2 -translate-x-1/2";

                if (ratio > 0.75) {
                  // Near right edge -> align tooltip body towards left so it stays inside view
                  transformStyle = "-translate-x-[85%] -translate-y-[120%]";
                  arrowStyle = "right-6";
                } else if (ratio < 0.25) {
                  // Near left edge -> align tooltip body towards right
                  transformStyle = "-translate-x-[15%] -translate-y-[120%]";
                  arrowStyle = "left-6";
                }

                return (
                  <div
                    style={{
                      left: `${ratio * 100}%`,
                      top: `${(hoveredPoint.y / chartData.height) * 100}%`,
                    }}
                    className={`absolute z-30 pointer-events-none bg-gray-900 text-white px-3 py-2 rounded-xl shadow-2xl text-xs whitespace-nowrap animate-in fade-in zoom-in-95 duration-100 ${transformStyle}`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold text-sm ${
                          hoveredPoint.isDrop ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        {formatCurrency(hoveredPoint.price)}
                      </span>
                      {hoveredPoint.diff !== 0 && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                            hoveredPoint.isDrop
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          <Icon
                            icon={hoveredPoint.isDrop ? "lucide:trending-down" : "lucide:trending-up"}
                            width="11"
                            height="11"
                          />
                          <span>{hoveredPoint.diff > 0 ? "+" : ""}{formatCurrency(hoveredPoint.diff)}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-300 mt-0.5">
                      {formatDate(hoveredPoint.date, "long")}
                    </div>
                    <div className={`absolute -bottom-1 w-2.5 h-2.5 bg-gray-900 rotate-45 ${arrowStyle}`} />
                  </div>
                );
              })()
            )}
          </div>
          <p className="text-[11px] text-gray-400 text-right italic">
            * Hover over data points to inspect detailed price records
          </p>
        </div>
      ) : sortedHistory.length === 1 ? (
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Icon icon="lucide:line-chart" width="20" height="20" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-800 block">Single price point recorded</span>
            <p className="text-[11px] text-gray-500 max-w-sm">
              Add at least one more price history entry to visualize the trend line chart over time.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddPricePoint}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 mt-1 cursor-pointer"
          >
            <Icon icon="lucide:plus" width="14" height="14" />
            Add another price point
          </button>
        </div>
      ) : (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
            <Icon icon="lucide:trending-up" width="24" height="24" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-700">No price history entries recorded yet</h3>
            <p className="text-[11px] text-gray-400 max-w-xs mt-0.5">
              Track valuation changes by logging new price points over time.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddPricePoint}
            className="bg-primary text-white text-xs font-medium px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Icon icon="lucide:plus" width="14" height="14" />
            Add First Price Point
          </button>
        </div>
      )}

      {/* History Log Table / Timeline */}
      {sortedHistory.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Recorded Price Logs ({sortedHistory.length})
            </h3>
            {sortedHistory.length > 10 && (
              <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                <Icon icon="lucide:arrow-down-up" width="12" height="12" />
                <span>Showing 10 max &bull; Scroll for more</span>
              </span>
            )}
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="max-h-[390px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/95 sticky top-0 z-10 backdrop-blur-xs border-b border-gray-200 text-gray-600 font-semibold shadow-2xs">
                  <tr>
                    <th className="px-3.5 py-2.5">Date</th>
                    <th className="px-3.5 py-2.5">Valuation / Price</th>
                    <th className="px-3.5 py-2.5">Change</th>
                    <th className="px-3.5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {sortedHistory.map((item, idx) => {
                    const prev = idx > 0 ? sortedHistory[idx - 1] : null;
                    const currentP = Number(item.price) || 0;
                    const diff = prev ? currentP - (Number(prev.price) || 0) : 0;
                    const diffPct = prev && Number(prev.price) > 0 ? ((diff / Number(prev.price)) * 100).toFixed(1) : null;
                    const isDrop = diff < 0;
                    const isLastOnlyPoint = sortedHistory.length === 1;

                    return (
                      <tr key={item.id || idx} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-3.5 py-2.5 font-medium text-gray-900">
                          {formatDate(item.date || item.createdAt, "short")}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span
                            className={`font-bold ${
                              prev === null
                                ? "text-gray-900"
                                : isDrop
                                ? "text-rose-600"
                                : "text-emerald-700"
                            }`}
                          >
                            {formatCurrency(item.price)}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5">
                          {prev ? (
                            <span
                              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-semibold ${
                                isDrop
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              <Icon
                                icon={isDrop ? "lucide:trending-down" : "lucide:trending-up"}
                                width="11"
                                height="11"
                              />
                              {diff >= 0 ? "+" : ""}
                              {diffPct}%
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[10px] italic">Initial Baseline</span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => onEditPricePoint && onEditPricePoint(item)}
                              title="Edit this price point"
                              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                            >
                              <Icon icon="lucide:pencil" width="14" height="14" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              disabled={isLastOnlyPoint}
                              onClick={() => onDeletePricePoint && onDeletePricePoint(item)}
                              title={
                                isLastOnlyPoint
                                  ? "Cannot delete the only price history point"
                                  : "Delete this price point"
                              }
                              className={`p-1.5 rounded-lg transition-colors ${
                                isLastOnlyPoint
                                  ? "text-gray-200 cursor-not-allowed"
                                  : "text-gray-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              }`}
                            >
                              <Icon icon="lucide:trash-2" width="14" height="14" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
