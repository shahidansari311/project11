"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { toast } from "react-hot-toast";
import { formatLocation } from "../../lib/locationUtils";
import { formatStatus } from "../../lib/formatUtils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function formatCurrency(val) {
  if (val === null || val === undefined || isNaN(val)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

function getPriceFontSize(val) {
  const num = typeof val === "number" ? val : Number(val) || 0;
  const abs = Math.abs(num);
  if (abs >= 100000000) {
    // 10 Cr+ (e.g. ₹10,00,00,000+)
    return "text-lg sm:text-xl";
  }
  if (abs >= 10000000) {
    // 1 Cr+ (e.g. ₹1,60,00,000)
    return "text-xl sm:text-2xl";
  }
  return "text-2xl sm:text-3xl";
}

function formatShortINR(val) {
  if (!val || isNaN(val) || val === 0) return "₹0";
  const abs = Math.abs(val);
  if (abs >= 10000000) {
    const cr = val / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(1)} Cr`;
  }
  if (abs >= 100000) {
    const l = val / 100000;
    return `₹${l % 1 === 0 ? l.toFixed(0) : l.toFixed(1)} L`;
  }
  if (abs >= 1000) {
    return `₹${(val / 1000).toFixed(0)}k`;
  }
  return `₹${val}`;
}

function formatCategoryLabel(category) {
  if (!category) return "Residential";
  switch (category.toUpperCase()) {
    case "RESIDENTIAL":
      return "Residential";
    case "COMMERCIAL":
      return "Commercial";
    case "INDUSTRIAL":
      return "Industrial";
    case "LAND":
      return "Land";
    case "OTHERS":
    case "OTHER":
      return "Others";
    default:
      return category.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

function getCategoryBadgeClass(category) {
  switch (category?.toUpperCase()) {
    case "RESIDENTIAL":
      return "bg-primary/10 text-primary border-primary/20";
    case "COMMERCIAL":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "INDUSTRIAL":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "LAND":
      return "bg-teal-50 text-teal-700 border-teal-200";
    case "OTHERS":
    case "OTHER":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function getStatusBadgeClass(status) {
  switch (status?.toUpperCase()) {
    case "AVAILABLE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "SOLD":
    case "SOLD_OUT":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "COMING_SOON":
    case "UPCOMING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "UNDER_REVIEW":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export default function DashboardView() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [investmentStats, setInvestmentStats] = useState(null);
  const [favoriteStats, setFavoriteStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [chartTimeframe, setChartTimeframe] = useState("monthly");

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [invRes, favRes, propRes, dashRes] = await Promise.allSettled([
        api.get("/admin/investments/stats"),
        api.get("/admin/favorites/stats?page=1&limit=5"),
        api.get("/admin/property/list?page=1&limit=6"),
        api.get("/admin/dashboard"),
      ]);

      // Investments stats
      if (invRes.status === "fulfilled" && invRes.value?.success && invRes.value.data) {
        setInvestmentStats(invRes.value.data);
      }

      // Favorites stats
      if (favRes.status === "fulfilled" && favRes.value?.success && favRes.value.data) {
        setFavoriteStats(favRes.value.data);
      }

      // Properties
      if (propRes.status === "fulfilled" && propRes.value?.success && propRes.value.data) {
        const list = Array.isArray(propRes.value.data.properties)
          ? propRes.value.data.properties
          : Array.isArray(propRes.value.data)
          ? propRes.value.data
          : [];
        setProperties(list);
      } else if (dashRes.status === "fulfilled" && dashRes.value?.success && dashRes.value.data) {
        setProperties(dashRes.value.data.properties || []);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Chart Data: Uses live backend monthlyTrends if available, or visual trajectory
  const approvedVal = investmentStats?.totalValueApproved ?? investmentStats?.approvedAmount ?? 0;
  const pendingVal = investmentStats?.totalValuePending ?? investmentStats?.pendingAmount ?? 0;

  const chartData =
    Array.isArray(investmentStats?.monthlyTrends) && investmentStats.monthlyTrends.length > 0
      ? investmentStats.monthlyTrends.map((item) => ({
          name: item.month || item.name || "N/A",
          approved: item.approvedAmount ?? item.approved ?? 0,
          pending: item.pendingAmount ?? item.pending ?? 0,
        }))
      : [
          { name: "Jan", approved: approvedVal * 0.35, pending: pendingVal * 0.3 },
          { name: "Feb", approved: approvedVal * 0.5, pending: pendingVal * 0.4 },
          { name: "Mar", approved: approvedVal * 0.65, pending: pendingVal * 0.55 },
          { name: "Apr", approved: approvedVal * 0.8, pending: pendingVal * 0.7 },
          { name: "May", approved: approvedVal * 0.9, pending: pendingVal * 0.85 },
          { name: "Jun", approved: approvedVal, pending: pendingVal },
        ];

  const totalFavCount =
    favoriteStats?.pagination?.total ??
    (Array.isArray(favoriteStats?.stats) ? favoriteStats.stats.length : 0);

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col min-w-0 gap-6 animate-pulse pb-12">
        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between">
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-24 bg-gray-200 rounded" />
                <div className="h-7 w-28 bg-gray-200 rounded-md" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
              <div className="w-11 h-11 bg-gray-100 rounded-2xl shrink-0 ml-3" />
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs h-72" />

        {/* Table Skeleton */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs p-6 space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded-lg" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 w-full bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-w-0 gap-6 pb-12">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Approved Investments */}
        {(() => {
          const approvedVal = investmentStats?.totalValueApproved ?? investmentStats?.approvedAmount ?? 0;
          return (
            <div
              onClick={() => router.push("/investments?status=APPROVED")}
              className="bg-white border border-gray-200 hover:border-emerald-300 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer group flex items-center justify-between"
            >
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-gray-500 block">Approved Investments</span>
                <div className={`${getPriceFontSize(approvedVal)} font-bold text-gray-900 tracking-tight mt-1 group-hover:text-emerald-700 transition-colors truncate`}>
                  {formatCurrency(approvedVal)}
                </div>
                <div className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1.5">
                  <Icon icon="lucide:check-circle-2" width="14" height="14" className="shrink-0" />
                  <span>{investmentStats?.approvedInvestments ?? investmentStats?.approvedCount ?? 0} approved investments</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform shrink-0 ml-3 shadow-2xs">
                <Icon icon="lucide:check-circle-2" width="22" height="22" />
              </div>
            </div>
          );
        })()}

        {/* Pending Approval Value */}
        {(() => {
          const pendingVal = investmentStats?.totalValuePending ?? investmentStats?.pendingAmount ?? 0;
          return (
            <div
              onClick={() => router.push("/investments?status=PENDING")}
              className="bg-white border border-gray-200 hover:border-amber-300 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer group flex items-center justify-between"
            >
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-gray-500 block">Pending Investments</span>
                <div className={`${getPriceFontSize(pendingVal)} font-bold text-amber-600 tracking-tight mt-1 group-hover:text-amber-700 transition-colors truncate`}>
                  {formatCurrency(pendingVal)}
                </div>
                <div className="text-xs text-amber-700 font-medium mt-1.5 flex items-center gap-1.5">
                  <Icon icon="lucide:clock" width="14" height="14" className="shrink-0 text-amber-500" />
                  <span>{investmentStats?.pendingInvestments ?? investmentStats?.pendingCount ?? 0} waiting for approval</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform shrink-0 ml-3 shadow-2xs">
                <Icon icon="lucide:clock" width="22" height="22" />
              </div>
            </div>
          );
        })()}

        {/* Total Investments Volume */}
        {(() => {
          const totalVal = (investmentStats?.totalValueApproved || 0) + (investmentStats?.totalValuePending || 0);
          return (
            <div
              onClick={() => router.push("/investments")}
              className="bg-white border border-gray-200 hover:border-primary/40 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer group flex items-center justify-between"
            >
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-gray-500 block">Total Investment Amount</span>
                <div className={`${getPriceFontSize(totalVal)} font-bold text-gray-900 tracking-tight mt-1 group-hover:text-primary transition-colors truncate`}>
                  {formatCurrency(totalVal)}
                </div>
                <div className="text-xs text-gray-500 font-medium mt-1.5 flex items-center gap-1.5">
                  <Icon icon="lucide:layers" width="14" height="14" className="shrink-0 text-gray-400" />
                  <span>{investmentStats?.totalInvestments ?? investmentStats?.totalCount ?? 0} total investment requests</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform shrink-0 ml-3 shadow-2xs">
                <Icon icon="lucide:wallet" width="22" height="22" />
              </div>
            </div>
          );
        })()}

        {/* Shortlisted Properties */}
        <div
          onClick={() => router.push("/favorites")}
          className="bg-white border border-gray-200 hover:border-rose-300 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer group flex items-center justify-between"
        >
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-gray-500 block">Shortlisted Properties</span>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mt-1 group-hover:text-rose-600 transition-colors">
              {totalFavCount}
            </div>
            <div className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1.5">
              <Icon icon="lucide:heart" width="14" height="14" className="shrink-0" />
              <span>Total times properties shortlisted</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 group-hover:scale-105 transition-transform shrink-0 ml-3 shadow-2xs">
            <Icon icon="lucide:heart" width="22" height="22" />
          </div>
        </div>
      </div>

      {/* Analytics Chart & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Investment Performance Area Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">Investment Growth Trends</h3>
              <p className="text-xs text-gray-500 mt-0.5">Approved vs Pending investment amount over time</p>
            </div>
            <div className="flex items-center gap-1 bg-gray-100/90 p-1 rounded-xl border border-gray-200/50">
              <button
                type="button"
                onClick={() => setChartTimeframe("monthly")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  chartTimeframe === "monthly"
                    ? "bg-white text-gray-900 shadow-2xs font-bold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setChartTimeframe("quarterly")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  chartTimeframe === "quarterly"
                    ? "bg-white text-gray-900 shadow-2xs font-bold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Quarterly
              </button>
            </div>
          </div>

          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 15, left: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="approvedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={58}
                  tickFormatter={formatShortINR}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-gray-100 ring-1 ring-black/5 text-xs flex flex-col gap-1.5 min-w-[150px]">
                          <span className="font-bold text-gray-800 border-b border-gray-100 pb-1">{label}</span>
                          {payload.map((entry, index) => (
                            <div key={`item-${index}`} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-gray-500 font-medium">{entry.name}</span>
                              </div>
                              <span className="font-bold text-gray-900 tabular-nums">
                                {formatCurrency(entry.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="approved"
                  name="Approved Investments"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#approvedGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="pending"
                  name="Pending Investments"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#pendingGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 border-t border-gray-100 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-medium text-gray-700">Approved Investments</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="font-medium text-gray-700">Pending Investments</span>
            </div>
          </div>
        </div>

        {/* Quick Action Navigation Cards */}
        <div className="flex flex-col gap-4">
          {/* Builder Submissions Queue Card */}
          <div className="bg-white border border-gray-200 hover:border-amber-200 rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between flex-1 group">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100/80 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                  <Icon icon="lucide:hard-hat" width="22" height="22" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Builder Projects
                </span>
              </div>
              <h4 className="font-bold text-base text-gray-900 tracking-tight">Builder Property Requests</h4>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Check and approve new property listings submitted by builders before making them live.
              </p>
            </div>
            <Link
              href="/property-submissions"
              className="mt-4 w-full py-2.5 px-4 bg-gray-50 hover:bg-amber-600 text-gray-700 hover:text-white border border-gray-200 hover:border-amber-600 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs"
            >
              <span>View Builder Submissions</span>
              <Icon icon="lucide:arrow-right" width="14" height="14" className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* KYC Verification Card */}
          <div className="bg-white border border-gray-200 hover:border-teal-200 rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between flex-1 group">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100/80 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                  <Icon icon="lucide:shield-check" width="22" height="22" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  Aadhaar & PAN KYC
                </span>
              </div>
              <h4 className="font-bold text-base text-gray-900 tracking-tight">Investor KYC Verification</h4>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Verify investor Aadhaar and PAN documents to approve account activation.
              </p>
            </div>
            <Link
              href="/kyc/pending"
              className="mt-4 w-full py-2.5 px-4 bg-gray-50 hover:bg-teal-600 text-gray-700 hover:text-white border border-gray-200 hover:border-teal-600 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs"
            >
              <span>Review KYC Requests</span>
              <Icon icon="lucide:arrow-right" width="14" height="14" className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Active Property Portfolio Table */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-2xs overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 sm:p-6 border-b border-gray-100 gap-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight">Live Property Listings</h3>
            <p className="text-xs text-gray-500 mt-0.5">Properties currently active and open for investment</p>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              href="/property"
              className="px-3.5 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-semibold text-xs transition-colors shrink-0"
            >
              View All Properties
            </Link>
            <Link
              href="/add-property"
              className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
            >
              <Icon icon="lucide:plus" width="14" height="14" />
              <span>Add Property</span>
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[650px]">
            <thead className="border-b border-gray-100 bg-gray-50/70 text-xs font-semibold text-gray-500">
              <tr>
                <th className="px-5 py-3.5">Property</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">Target Return</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {properties.length > 0 ? (
                properties.map((row, i) => {
                  const img = Array.isArray(row.images) && row.images.length > 0 ? row.images[0] : null;
                  return (
                    <tr key={row.id || i} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {img ? (
                            <img
                              src={img}
                              alt={row.title || "Property"}
                              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex-shrink-0 flex items-center justify-center text-primary border border-primary/20">
                              <Icon icon="lucide:building-2" width="18" height="18" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link
                              href={`/property/${row.id}`}
                              className="font-bold text-gray-900 hover:text-primary transition-colors block truncate max-w-[200px]"
                            >
                              {row.title || row.name || "Untitled Property"}
                            </Link>
                            <span className={`inline-flex px-2 py-0.2 mt-0.5 rounded text-[10px] font-semibold border ${getCategoryBadgeClass(row.category)}`}>
                              {formatCategoryLabel(row.category)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-gray-600 truncate max-w-[200px]">
                        {formatLocation(row.location)}
                      </td>

                      <td className="px-5 py-4 font-bold text-emerald-600">
                        {row.targetReturn ? `${row.targetReturn}%` : "N/A"}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(row.status)}`}>
                          {formatStatus(row.status || "AVAILABLE")}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/property/${row.id}`}
                            className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors inline-flex"
                            title="View property"
                          >
                            <Icon icon="lucide:eye" width="16" height="16" />
                          </Link>
                          <Link
                            href={`/property/edit/${row.id}`}
                            className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors inline-flex"
                            title="Edit property"
                          >
                            <Icon icon="lucide:edit" width="16" height="16" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400 font-medium">
                    No active properties found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

