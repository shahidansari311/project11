"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "../../lib/api";
import Pagination from "../users/Pagination";
import InvestmentRejectModal from "./InvestmentRejectModal";
import InvestmentApproveModal from "./InvestmentApproveModal";
import InvestmentDetailModal from "./InvestmentDetailModal";
import InvestmentRefundModal from "./InvestmentRefundModal";
import InvestmentProofModal from "./InvestmentProofModal";
import InvestmentInvoicesModal from "./InvestmentInvoicesModal";
import BuyOnBehalfModal from "./BuyOnBehalfModal";
import DocumentViewerModal from "../common/DocumentViewerModal";
import { formatLocation } from "../../lib/locationUtils";
import {
  formatStatus,
  getInvestmentStatusBadge,
  formatCurrency,
  formatDate,
  getUserKycBadge,
  normalizePaymentProofs,
  getPaymentProofMeta,
} from "../../lib/formatUtils";

function getStatusBadge(status) {
  return getInvestmentStatusBadge(status);
}

function InvestmentsTableSkeleton({ rows = 6 }) {
  return (
    <div className="overflow-auto h-full custom-scrollbar">
      <table className="w-full text-sm text-left min-w-[1050px]">
        <thead className="border-b border-gray-200 bg-gray-50 sticky top-0 z-10 shadow-2xs">
          <tr className="bg-gray-50">
            <th className="px-4 md:px-6 py-3.5"><div className="h-3.5 w-24 bg-gray-200 rounded animate-pulse" /></th>
            <th className="px-4 md:px-6 py-3.5"><div className="h-3.5 w-20 bg-gray-200 rounded animate-pulse" /></th>
            <th className="px-4 md:px-6 py-3.5 text-center"><div className="h-3.5 w-12 bg-gray-200 rounded animate-pulse mx-auto" /></th>
            <th className="px-4 md:px-6 py-3.5"><div className="h-3.5 w-20 bg-gray-200 rounded animate-pulse" /></th>
            <th className="px-4 md:px-6 py-3.5 text-center"><div className="h-3.5 w-16 bg-gray-200 rounded animate-pulse mx-auto" /></th>
            <th className="px-4 md:px-6 py-3.5 text-center"><div className="h-3.5 w-20 bg-gray-200 rounded animate-pulse mx-auto" /></th>
            <th className="px-4 md:px-6 py-3.5"><div className="h-3.5 w-24 bg-gray-200 rounded animate-pulse" /></th>
            <th className="px-4 md:px-6 py-3.5 text-right"><div className="h-3.5 w-14 bg-gray-200 rounded animate-pulse ml-auto" /></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="animate-pulse border-b border-gray-50">
              {/* User Avatar + Name */}
              <td className="px-4 md:px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                  <div className="space-y-1.5 min-w-0">
                    <div className="h-3.5 w-28 bg-gray-200 rounded" />
                    <div className="h-2.5 w-20 bg-gray-100 rounded" />
                  </div>
                </div>
              </td>

              {/* Property */}
              <td className="px-4 md:px-6 py-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="h-3.5 w-32 bg-gray-200 rounded" />
                  <div className="h-2.5 w-24 bg-gray-100 rounded" />
                </div>
              </td>

              {/* Units */}
              <td className="px-4 md:px-6 py-4 text-center">
                <div className="h-5 w-14 bg-gray-200 rounded-md mx-auto" />
              </td>

              {/* Total Amount */}
              <td className="px-4 md:px-6 py-4">
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </td>

              {/* Status */}
              <td className="px-4 md:px-6 py-4 text-center">
                <div className="h-5 w-20 bg-gray-200 rounded-md mx-auto" />
              </td>

              {/* Documents */}
              <td className="px-4 md:px-6 py-4 text-center">
                <div className="h-5 w-24 bg-gray-200 rounded-md mx-auto" />
              </td>

              {/* Submitted Date */}
              <td className="px-4 md:px-6 py-4">
                <div className="h-3.5 w-20 bg-gray-200 rounded" />
              </td>

              {/* Actions */}
              <td className="px-4 md:px-6 py-4 text-right">
                <div className="h-6 w-16 bg-gray-200 rounded-lg ml-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InvestmentsPageSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-full min-w-0 pb-16 animate-pulse">
      {/* KPI Stats Ribbon Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between"
          >
            <div className="space-y-2">
              <div className="h-3 w-24 bg-gray-200 rounded" />
              <div className="h-6 w-28 bg-gray-200 rounded-md" />
              <div className="h-2.5 w-20 bg-gray-100 rounded" />
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-xl shrink-0" />
          </div>
        ))}
      </div>

      {/* Main Table Card Skeleton */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col w-full">
        {/* Filter Tabs Skeleton */}
        <div className="px-4 pt-3 border-b border-gray-100 flex items-center gap-4 bg-gray-50/40">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-7 w-24 bg-gray-200 rounded-lg mb-2.5" />
          ))}
        </div>

        {/* Toolbar Search & Actions Skeleton */}
        <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
          <div className="h-9 w-full sm:max-w-sm bg-gray-200 rounded-xl" />
          <div className="flex items-center gap-2 self-end sm:self-center">
            <div className="h-7 w-20 bg-gray-200 rounded-xl" />
            <div className="h-7 w-20 bg-gray-200 rounded-xl" />
          </div>
        </div>

        {/* Table Skeleton */}
        <InvestmentsTableSkeleton rows={6} />
      </div>
    </div>
  );
}

function InvestmentsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [stats, setStats] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters from query params
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 20);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");

  // Modal states
  const [selectedInvestmentForDetail, setSelectedInvestmentForDetail] = useState(null);
  const [selectedInvestmentForApprove, setSelectedInvestmentForApprove] = useState(null);
  const [selectedInvestmentForReject, setSelectedInvestmentForReject] = useState(null);
  const [selectedInvestmentForRefund, setSelectedInvestmentForRefund] = useState(null);
  const [selectedInvestmentForProof, setSelectedInvestmentForProof] = useState(null);
  const [selectedInvestmentForInvoices, setSelectedInvestmentForInvoices] = useState(null);
  const [isBuyOnBehalfOpen, setIsBuyOnBehalfOpen] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [viewingDoc, setViewingDoc] = useState(null);

  // Row Action Dropdown Menu State
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const menuRef = useRef(null);
  const buttonRefs = useRef({});

  const closeMenu = useCallback(() => setOpenMenuId(null), []);

  useEffect(() => {
    if (!openMenuId) return;
    function handleClickOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !buttonRefs.current[openMenuId]?.contains(event.target)
      ) {
        closeMenu();
      }
    }
    function handleScroll() {
      closeMenu();
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [openMenuId, closeMenu]);

  const toggleMenu = (invId) => {
    if (openMenuId === invId) {
      closeMenu();
      return;
    }
    const btn = buttonRefs.current[invId];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < 230 && rect.top > 230;

      setMenuPos({
        top: openUpwards ? undefined : `${rect.bottom + 4}px`,
        bottom: openUpwards ? `${window.innerHeight - rect.top + 4}px` : undefined,
        right: `${Math.max(16, window.innerWidth - rect.right)}px`,
      });
    }
    setOpenMenuId(invId);
  };

  // Load showStats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("investments_show_stats");
    if (saved !== null) {
      setShowStats(saved === "true");
    }
  }, []);

  const handleToggleStats = () => {
    setShowStats((prev) => {
      const next = !prev;
      localStorage.setItem("investments_show_stats", String(next));
      return next;
    });
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  // Sync URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [page, limit, statusFilter, debouncedSearch, pathname, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch stats from GET /admin/investments/stats
  const fetchStats = useCallback(async () => {
    try {
      const statsRes = await api.get("/admin/investments/stats");
      if (statsRes?.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch investments list
  const fetchInvestments = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/admin/investments?page=${page}&limit=${limit}`;
      if (statusFilter !== "ALL") {
        url += `&status=${statusFilter}`;
      }
      if (debouncedSearch.trim()) {
        url += `&search=${encodeURIComponent(debouncedSearch.trim())}`;
      }

      const res = await api.get(url);
      if (res?.success && res.data) {
        const list = Array.isArray(res.data.investments)
          ? res.data.investments
          : Array.isArray(res.data)
          ? res.data
          : [];
        setInvestments(list);
        const rawPagination = res.data.pagination;
        const totalCount = rawPagination?.total ?? res.data.total ?? list.length;
        const totalPages = rawPagination?.totalPages || rawPagination?.pages || Math.ceil(totalCount / limit) || 1;
        setPagination({
          page: rawPagination?.page || page,
          limit: rawPagination?.limit || limit,
          total: totalCount,
          totalPages: totalPages,
          pages: totalPages,
          hasNext: rawPagination?.hasNext !== undefined ? rawPagination.hasNext : page < totalPages,
          hasPrev: rawPagination?.hasPrev !== undefined ? rawPagination.hasPrev : page > 1,
        });

        // Sync count to stats for current active tab if not searching
        if (!debouncedSearch.trim()) {
          setStats((prev) => {
            if (!prev) return prev;
            const updated = { ...prev };
            if (statusFilter === "ALL") updated.totalInvestments = totalCount;
            if (statusFilter === "PENDING") updated.pendingInvestments = totalCount;
            if (statusFilter === "PARTIAL_PAID") updated.partialPaidInvestments = totalCount;
            if (statusFilter === "REFUND_REQUESTED") updated.refundRequestedInvestments = totalCount;
            if (statusFilter === "APPROVED") updated.approvedInvestments = totalCount;
            if (statusFilter === "REFUNDED") updated.refundedInvestments = totalCount;
            if (statusFilter === "REJECTED") updated.rejectedInvestments = totalCount;
            if (statusFilter === "CANCELLED") updated.cancelledInvestments = totalCount;
            return updated;
          });
        }
      } else {
        setInvestments([]);
        setPagination(null);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load investments");
      setInvestments([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchStats();
    fetchInvestments();
  }, [fetchStats, fetchInvestments]);

  const getTabCount = (key) => {
    if (!stats) return undefined;
    switch (key) {
      case "ALL":
        return stats.totalInvestments ?? stats.total ?? 0;
      case "PENDING":
        return stats.pendingInvestments ?? stats.pending ?? 0;
      case "PARTIAL_PAID":
        return stats.partialPaidInvestments ?? stats.partialPaid ?? stats.partial_paid ?? stats.PARTIAL_PAID ?? 0;
      case "REFUND_REQUESTED":
        return stats.refundRequestedInvestments ?? stats.refundRequested ?? stats.refund_requested ?? stats.refundRequests ?? stats.REFUND_REQUESTED ?? 0;
      case "APPROVED":
        return stats.approvedInvestments ?? stats.approved ?? 0;
      case "REFUNDED":
        return stats.refundedInvestments ?? stats.refunded ?? stats.REFUNDED ?? 0;
      case "REJECTED":
        return stats.rejectedInvestments ?? stats.rejected ?? 0;
      case "CANCELLED":
        return stats.cancelledInvestments ?? stats.cancelled ?? 0;
      default:
        return 0;
    }
  };

  const statusTabs = [
    { key: "ALL", label: "All Investments", count: getTabCount("ALL") },
    { key: "PENDING", label: "Pending Verification", count: getTabCount("PENDING"), color: "text-amber-600 bg-amber-50" },
    { key: "PARTIAL_PAID", label: "Partially Paid", count: getTabCount("PARTIAL_PAID"), color: "text-amber-700 bg-amber-100" },
    { key: "REFUND_REQUESTED", label: "Refund Requests", count: getTabCount("REFUND_REQUESTED"), color: "text-purple-700 bg-purple-50" },
    { key: "APPROVED", label: "Approved", count: getTabCount("APPROVED"), color: "text-emerald-600 bg-emerald-50" },
    { key: "REFUNDED", label: "Refunded", count: getTabCount("REFUNDED"), color: "text-slate-600 bg-slate-100" },
    { key: "REJECTED", label: "Rejected", count: getTabCount("REJECTED"), color: "text-red-600 bg-red-50" },
    { key: "CANCELLED", label: "Cancelled", count: getTabCount("CANCELLED"), color: "text-gray-600 bg-gray-100" },
  ];

  return (
    <div className="flex flex-col gap-4 w-full h-[calc(100vh-120px)] min-h-[500px]">
      {/* KPI Stats Ribbon (Collapsible) */}
      {showStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 animate-in fade-in duration-150 shrink-0">
          {/* Total Revenue / Approved Capital */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 block mb-1">Total Revenue</span>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600">
                {formatCurrency(stats?.totalRevenue ?? stats?.totalValueApproved ?? 0)}
              </div>
              <span className="text-[11px] text-gray-400 mt-0.5 block">
                {stats?.approvedInvestments !== undefined ? `${stats.approvedInvestments} approved investments` : "Cumulative capital invested"}
              </span>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
              <Icon icon="lucide:banknote" width="20" height="20" />
            </div>
          </div>

          {/* Pending Verification */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-700 block mb-1">Pending Approval</span>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-amber-600">
                {stats?.pendingInvestments || 0}
              </div>
              <span className="text-[11px] text-gray-400 mt-0.5 block">
                {stats?.totalValuePending ? `${formatCurrency(stats.totalValuePending)} awaiting review` : "Awaiting payment verification"}
              </span>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
              <Icon icon="lucide:clock" width="20" height="20" />
            </div>
          </div>

          {/* Total Bookings */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-700 block mb-1">Total Investments</span>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                {stats?.totalInvestments || 0}
              </div>
              <span className="text-[11px] text-gray-400 mt-0.5 block">Across all listings</span>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
              <Icon icon="lucide:receipt" width="20" height="20" />
            </div>
          </div>

          {/* Rejected / Cancelled */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-700 block mb-1">Rejected / Cancelled</span>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-700">
                {(stats?.rejectedInvestments || 0) + (stats?.cancelledInvestments || 0)}
              </div>
              <span className="text-[11px] text-gray-400 mt-0.5 block">
                {stats?.rejectedInvestments || 0} rejected &bull; {stats?.cancelledInvestments || 0} cancelled
              </span>
            </div>
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 border border-gray-200 shrink-0">
              <Icon icon="lucide:x-circle" width="20" height="20" />
            </div>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0 flex-1 w-full">
        {/* Filter Tabs Header */}
        <div className="px-5 pt-3 border-b border-gray-100 flex items-center gap-2 overflow-x-auto custom-scrollbar bg-white shrink-0">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? "bg-primary text-white" : tab.color || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Actions Toolbar */}
        <div className="p-3 sm:px-5 sm:py-3.5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white shrink-0">
          {/* Search bar */}
          <div className="relative flex-1 min-w-0 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Icon icon="lucide:search" width="16" height="16" />
            </div>
            <input
              type="text"
              placeholder="Search by investor name, email, phone or property..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-xs sm:text-sm bg-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <Icon icon="lucide:x" width="14" height="14" />
              </button>
            )}
          </div>

          {/* Right Toolbar Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            {/* Rows info / current filter indicator */}
            <div className="text-xs text-gray-500 hidden md:block">
              Showing <span className="font-bold text-gray-800">{investments.length}</span> investments
            </div>

            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              {/* Toggle Stats Ribbon */}
              <button
                type="button"
                onClick={handleToggleStats}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                  showStats
                    ? "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                    : "bg-primary text-white border-primary hover:bg-primary/90"
                }`}
                title={showStats ? "Hide Stats Cards" : "Show Stats Cards"}
              >
                <Icon
                  icon={showStats ? "lucide:eye-off" : "lucide:eye"}
                  width="13"
                  height="13"
                  className={showStats ? "text-gray-500" : "text-white"}
                />
                <span className="whitespace-nowrap">{showStats ? "Hide Stats" : "Show Stats"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  fetchStats();
                  fetchInvestments();
                }}
                className="px-3 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Refresh table data"
              >
                <Icon icon="lucide:refresh-cw" width="13" height="13" />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBuyOnBehalfOpen(true)}
                className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="Assign investment on behalf of user for cash payment"
              >
                <Icon icon="lucide:shopping-bag" width="14" height="14" />
                <span>Buy on Behalf</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table Content with Inner Scroll */}
        <div className="min-h-0 flex-1 overflow-auto custom-scrollbar">
          {isLoading ? (
            <InvestmentsTableSkeleton />
          ) : investments.length === 0 ? (
            <div className="h-full py-16 px-4 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gray-50 text-gray-300 flex items-center justify-center mb-1">
                <Icon icon="lucide:hand-coins" width="32" height="32" />
              </div>
              <div>
                <h3 className="type-h5 text-gray-900 mb-1">No investments found</h3>
                <p className="type-body-sm text-gray-500 max-w-sm mx-auto">
                  {statusFilter !== "ALL"
                    ? `There are no investments currently marked as ${formatStatus(statusFilter)}.`
                    : "User fractional investment bookings will appear here."}
                </p>
              </div>
              {statusFilter !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className="text-xs text-primary font-semibold hover:underline mt-1 cursor-pointer"
                >
                  Clear status filter
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm text-left min-w-[1050px]">
              <thead className="border-b border-gray-200 bg-gray-50/80 sticky top-0 z-10 shadow-2xs">
                <tr className="bg-gray-50/90 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3.5">Investor / User</th>
                  <th className="px-4 py-3.5">Property</th>
                  <th className="px-3 py-3.5 text-center whitespace-nowrap w-20">Units</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Total Amount</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Status</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Documents</th>
                  <th className="px-4 py-3.5 whitespace-nowrap w-32">Submitted Date</th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {investments.map((inv) => {
                  const badge = getStatusBadge(inv.status);
                  const isPending = inv.status === "PENDING";
                  const kycBadge = getUserKycBadge(inv.user);

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvestmentForDetail(inv)}
                      className="border-b border-gray-50 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* User Column */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-primary/20">
                            {inv.user?.fullName ? inv.user.fullName.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <span className="font-semibold text-gray-900 group-hover:text-primary transition-colors block truncate max-w-[170px] text-xs sm:text-sm">
                              {inv.user?.fullName || "Unnamed User"}
                            </span>
                            <span className="text-[11px] text-gray-400 block truncate max-w-[170px]">
                              {inv.user?.phone || inv.user?.email || "No contact"}
                            </span>
                            <div className="pt-0.5">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold border whitespace-nowrap shrink-0 ${kycBadge.className}`}>
                                <Icon icon={kycBadge.icon} width="10" height="10" />
                                <span>{kycBadge.label}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Property Column */}
                      <td className="px-4 py-3.5">
                        <div className="min-w-0 max-w-[210px]">
                          <span className="font-semibold text-gray-900 block truncate text-xs sm:text-sm group-hover:text-primary transition-colors">
                            {inv.property?.title || "Property"}
                          </span>
                          <span className="text-[11px] text-gray-400 block truncate mt-0.5" title={formatLocation(inv.property?.location)}>
                            {formatLocation(inv.property?.location)}
                          </span>
                        </div>
                      </td>

                      {/* Units Column */}
                      <td className="px-3 py-3.5 text-center w-20">
                        <span className="inline-flex px-2 py-0.5 rounded-md bg-gray-100 font-bold text-gray-800 text-xs whitespace-nowrap">
                          {inv.units} {inv.units === 1 ? "unit" : "units"}
                        </span>
                        <span className="block text-[10px] text-gray-400 mt-0.5 tabular-nums truncate max-w-[120px] mx-auto whitespace-nowrap" title={`@${formatCurrency(inv.unitPriceAtTime)}`}>
                          @{formatCurrency(inv.unitPriceAtTime)}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-gray-900 text-sm block tabular-nums whitespace-nowrap">
                          {formatCurrency(inv.totalAmount)}
                        </span>

                        {/* Partial Payment Breakdown */}
                        {(inv.status === "PARTIAL_PAID" || (inv.paidAmount > 0 && inv.paidAmount < inv.totalAmount)) && (
                          <div className="mt-1 space-y-0.5 max-w-[160px]">
                            <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium tabular-nums whitespace-nowrap gap-2">
                              <span className="text-emerald-700 font-semibold">
                                Paid: {formatCurrency(inv.paidAmount || 0)}
                              </span>
                              <span className="text-amber-700 font-semibold">
                                Due: {formatCurrency(Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0)))}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.round(((inv.paidAmount || 0) / (inv.totalAmount || 1)) * 100))}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border whitespace-nowrap shrink-0 ${badge.className}`}>
                            <Icon icon={badge.icon} width="12" height="12" />
                            <span>{badge.label}</span>
                          </span>

                          {/* Maturity / Fixed-Term Indicator */}
                          {inv.isMatured ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 whitespace-nowrap shrink-0"
                              title={`Promised Valuation: ${formatCurrency(inv.currentValuation || inv.totalAmount)}`}
                            >
                              <Icon icon="lucide:check-circle-2" width="10" height="10" />
                              <span>Matured</span>
                            </span>
                          ) : inv.remainingTermString ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 whitespace-nowrap shrink-0"
                              title={inv.remainingTermString}
                            >
                              <Icon icon="lucide:lock" width="9" height="9" />
                              <span>{inv.remainingTermString}</span>
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Documents Column */}
                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        {(() => {
                          const proofs = normalizePaymentProofs(inv);
                          const hasInvoices = (inv.paymentHistory && inv.paymentHistory.length > 0) || (inv.invoices && inv.invoices.length > 0);

                          return (
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              {/* Payment Proofs Button (Opens dedicated Proof Modal) */}
                              {proofs.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedInvestmentForProof(inv);
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                                  title="View Payment Proof in dedicated modal"
                                >
                                  <Icon icon="lucide:receipt" width="11" height="11" />
                                  <span>{proofs.length > 1 ? `${proofs.length} Proofs` : "Proof"}</span>
                                  <Icon icon="lucide:eye" width="9" height="9" />
                                </button>
                              ) : null}

                              {/* Invoices Button (Opens dedicated Invoices Modal) */}
                              {hasInvoices && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedInvestmentForInvoices(inv);
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                                  title="View Invoices in dedicated modal"
                                >
                                  <Icon icon="lucide:file-spreadsheet" width="11" height="11" />
                                  <span>{inv.paymentHistory?.length > 1 ? `${inv.paymentHistory.length} Invoices` : "Invoice"}</span>
                                  <Icon icon="lucide:eye" width="9" height="9" />
                                </button>
                              )}

                              {/* Agreement */}
                              {inv.agreementUrl ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingDoc({
                                      url: inv.agreementUrl,
                                      title: "Signed Investment Agreement",
                                      subtitle: `Investor: ${inv.user?.fullName || "User"} • ${inv.property?.title || "Property"}`
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                                  title="View Signed Agreement PDF"
                                >
                                  <Icon icon="lucide:file-text" width="10" height="10" />
                                  <span>Agreement</span>
                                  <Icon icon="lucide:eye" width="9" height="9" />
                                </button>
                              ) : inv.status === "APPROVED" ? (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 whitespace-nowrap shrink-0"
                                  title="Agreement not signed yet by user"
                                >
                                  <Icon icon="lucide:clock" width="9" height="9" />
                                  <span>Unsigned</span>
                                </span>
                              ) : null}

                              {/* Refund Proof Receipt */}
                              {inv.refundProofUrl && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingDoc({
                                      url: inv.refundProofUrl,
                                      title: "Refund Transfer Receipt",
                                      subtitle: `Investor: ${inv.user?.fullName || "User"} • ${inv.property?.title || "Property"}`
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                                  title="View Refund Transfer Receipt"
                                >
                                  <Icon icon="lucide:file-check-2" width="10" height="10" />
                                  <span>Refund Receipt</span>
                                </button>
                              )}

                              {/* Bank Details Pill */}
                              {inv.refundBankDetails && (inv.status === "REFUND_REQUESTED" || inv.status === "WITHDRAWAL_REQUESTED" || inv.status === "PARTIAL_PAID" || inv.status === "REFUNDED") && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedInvestmentForDetail(inv);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                                  title="View Bank Details in Modal"
                                >
                                  <Icon icon="lucide:building-2" width="10" height="10" />
                                  <span>Bank Details</span>
                                </button>
                              )}

                              {/* Empty fallback */}
                              {proofs.length === 0 && !hasInvoices && !inv.agreementUrl && !inv.refundProofUrl && !inv.refundBankDetails && inv.status !== "APPROVED" && (
                                <span className="text-gray-400 text-xs">—</span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs w-32">
                        {formatDate(inv.date || inv.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap w-24" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => setSelectedInvestmentForApprove(inv)}
                              title="Confirm Payment & Approve"
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
                            >
                              <Icon icon="lucide:check" width="13" height="13" />
                              <span>Approve</span>
                            </button>
                          )}

                          {inv.status === "PARTIAL_PAID" && (
                            <button
                              type="button"
                              onClick={() => setSelectedInvestmentForApprove(inv)}
                              title="Receive Remaining Balance"
                              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
                            >
                              <Icon icon="lucide:plus-circle" width="13" height="13" />
                              <span>Accept Next</span>
                            </button>
                          )}

                          {inv.status === "REFUND_REQUESTED" && (
                            <button
                              type="button"
                              onClick={() => setSelectedInvestmentForRefund(inv)}
                              title="Process Refund Request"
                              className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
                            >
                              <Icon icon="lucide:rotate-ccw" width="13" height="13" />
                              <span>Refund</span>
                            </button>
                          )}

                          <button
                            type="button"
                            ref={(el) => {
                              buttonRefs.current[inv.id] = el;
                            }}
                            onClick={() => toggleMenu(inv.id)}
                            title="Actions & Documents"
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center shrink-0 ${
                              openMenuId === inv.id
                                ? "bg-primary text-white shadow-2xs"
                                : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            <Icon icon="lucide:more-vertical" width="16" height="16" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {isLoading ? (
          <div className="flex flex-col sm:flex-row items-center justify-between py-3 px-3 sm:px-6 border-t border-gray-100 gap-2.5 sm:gap-4 shrink-0 bg-white animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-4 w-28 bg-gray-200 rounded" />
              <div className="h-7 w-20 bg-gray-100 rounded-lg" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gray-100 rounded-lg" />
              <div className="h-8 w-8 bg-gray-200 rounded-lg" />
              <div className="h-8 w-8 bg-gray-100 rounded-lg" />
            </div>
          </div>
        ) : (
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={handleLimitChange}
            entityName="investments"
          />
        )}
      </div>

      {/* Action Dropdown Menu Portal */}
      {openMenuId && (() => {
        const inv = investments.find((i) => i.id === openMenuId);
        if (!inv) return null;

        const hasProof = Boolean(inv.paymentProofUrl && inv.paymentProofUrl !== "admin_cash");
        const hasAgreement = Boolean(inv.agreementUrl);
        const hasRefundProof = Boolean(inv.refundProofUrl);
        const isPending = inv.status === "PENDING";
        const isPartialPaid = inv.status === "PARTIAL_PAID";
        const isRefundRequested = inv.status === "REFUND_REQUESTED";
        const isWithdrawalRequested = inv.status === "WITHDRAWAL_REQUESTED";

        return (
          <div
            ref={menuRef}
            className="fixed w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-gray-900/10 border border-gray-100 p-1.5 z-[100] animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5 flex flex-col gap-0.5 text-xs"
            style={{
              top: menuPos.top,
              bottom: menuPos.bottom,
              right: menuPos.right,
            }}
          >
            {/* View Details */}
            <button
              type="button"
              onClick={() => {
                closeMenu();
                setSelectedInvestmentForDetail(inv);
              }}
              className="w-full px-2.5 py-2 text-left rounded-xl hover:bg-gray-100 text-gray-700 font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Icon icon="lucide:eye" width="15" height="15" className="text-gray-400" />
              <span>View Full Details</span>
            </button>

            {/* View Signed Agreement */}
            {hasAgreement ? (
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  setViewingDoc({
                    url: inv.agreementUrl,
                    title: "Signed Investment Agreement",
                    subtitle: `Investor: ${inv.user?.fullName || "User"} • ${inv.property?.title || "Property"}`,
                  });
                }}
                className="w-full px-2.5 py-2 text-left rounded-xl hover:bg-emerald-50 text-emerald-800 font-medium flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Icon icon="lucide:file-signature" width="15" height="15" className="text-emerald-600" />
                <span>View Signed Agreement</span>
              </button>
            ) : inv.status === "APPROVED" ? (
              <div className="px-2.5 py-1.5 text-[11px] text-amber-700 bg-amber-50/70 rounded-xl flex items-center gap-1.5">
                <Icon icon="lucide:clock" width="13" height="13" className="text-amber-600 shrink-0" />
                <span>Agreement signature pending</span>
              </div>
            ) : null}

            {/* View Payment Proof */}
            <button
              type="button"
              onClick={() => {
                closeMenu();
                setSelectedInvestmentForProof(inv);
              }}
              className="w-full px-2.5 py-2 text-left rounded-xl hover:bg-blue-50 text-blue-800 font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Icon icon="lucide:receipt" width="15" height="15" className="text-blue-600" />
              <span>View Payment Proof</span>
            </button>

            {/* View Invoices & Payment History */}
            <button
              type="button"
              onClick={() => {
                closeMenu();
                setSelectedInvestmentForInvoices(inv);
              }}
              className="w-full px-2.5 py-2 text-left rounded-xl hover:bg-emerald-50 text-emerald-800 font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Icon icon="lucide:file-spreadsheet" width="15" height="15" className="text-emerald-600" />
              <span>View Invoices & History</span>
            </button>

            {/* View Refund Proof */}
            {hasRefundProof && (
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  setViewingDoc({
                    url: inv.refundProofUrl,
                    title: "Refund Transfer Receipt",
                    subtitle: `Investor: ${inv.user?.fullName || "User"} • ${inv.property?.title || "Property"}`,
                  });
                }}
                className="w-full px-2.5 py-2 text-left rounded-xl hover:bg-purple-50 text-purple-800 font-medium flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Icon icon="lucide:file-check-2" width="15" height="15" className="text-purple-600" />
                <span>View Refund Proof</span>
              </button>
            )}

            {inv.paymentProofUrl === "admin_cash" && (
              <div className="px-2.5 py-1.5 text-[11px] text-purple-700 bg-purple-50/70 rounded-xl flex items-center gap-1.5">
                <Icon icon="lucide:banknote" width="13" height="13" className="text-purple-600 shrink-0" />
                <span>Direct Cash Payment</span>
              </div>
            )}

            {/* Quick Actions based on Status */}
            {isPending && (
              <>
                <div className="h-px bg-gray-100 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    setSelectedInvestmentForApprove(inv);
                  }}
                  className="w-full px-2.5 py-2 text-left rounded-xl hover:bg-emerald-50 text-emerald-700 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Icon icon="lucide:check-circle-2" width="15" height="15" className="text-emerald-600" />
                  <span>Approve / Partial</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    setSelectedInvestmentForReject(inv);
                  }}
                  className="w-full px-2.5 py-2 text-left rounded-xl hover:bg-red-50 text-red-600 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Icon icon="lucide:x-circle" width="15" height="15" className="text-red-500" />
                  <span>Reject Investment</span>
                </button>
              </>
            )}

            {isPartialPaid && (
              <>
                <div className="h-px bg-gray-100 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    setSelectedInvestmentForApprove(inv);
                  }}
                  className="w-full px-2.5 py-2 text-left rounded-xl hover:bg-amber-50 text-amber-800 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Icon icon="lucide:plus-circle" width="15" height="15" className="text-amber-600" />
                  <span>Receive Next Payment</span>
                </button>
              </>
            )}

            {isRefundRequested && (
              <>
                <div className="h-px bg-gray-100 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    setSelectedInvestmentForRefund(inv);
                  }}
                  className="w-full px-2.5 py-2 text-left rounded-xl hover:bg-purple-50 text-purple-700 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Icon icon="lucide:rotate-ccw" width="15" height="15" className="text-purple-600" />
                  <span>Process Refund</span>
                </button>
              </>
            )}
          </div>
        );
      })()}

      {/* Detail Modal */}
      <InvestmentDetailModal
        isOpen={Boolean(selectedInvestmentForDetail)}
        onClose={() => setSelectedInvestmentForDetail(null)}
        investment={selectedInvestmentForDetail}
        onApprove={(inv) => {
          setSelectedInvestmentForDetail(null);
          setSelectedInvestmentForApprove(inv);
        }}
        onReject={(inv) => {
          setSelectedInvestmentForDetail(null);
          setSelectedInvestmentForReject(inv);
        }}
        onRefund={(inv) => {
          setSelectedInvestmentForDetail(null);
          setSelectedInvestmentForRefund(inv);
        }}
      />

      {/* Approve / Partial Payment Modal */}
      <InvestmentApproveModal
        isOpen={Boolean(selectedInvestmentForApprove)}
        onClose={() => setSelectedInvestmentForApprove(null)}
        investment={selectedInvestmentForApprove}
        onSuccess={() => {
          fetchStats();
          fetchInvestments();
        }}
      />

      {/* Reject Modal */}
      <InvestmentRejectModal
        isOpen={Boolean(selectedInvestmentForReject)}
        onClose={() => setSelectedInvestmentForReject(null)}
        investment={selectedInvestmentForReject}
        onSuccess={() => {
          fetchStats();
          fetchInvestments();
        }}
      />

      {/* Refund Process Modal */}
      <InvestmentRefundModal
        isOpen={Boolean(selectedInvestmentForRefund)}
        onClose={() => setSelectedInvestmentForRefund(null)}
        investment={selectedInvestmentForRefund}
        onSuccess={() => {
          fetchStats();
          fetchInvestments();
        }}
      />

      {/* Dedicated Payment Proof Modal */}
      <InvestmentProofModal
        isOpen={Boolean(selectedInvestmentForProof)}
        onClose={() => setSelectedInvestmentForProof(null)}
        investment={selectedInvestmentForProof}
        onApprove={(inv) => {
          setSelectedInvestmentForProof(null);
          setSelectedInvestmentForApprove(inv);
        }}
      />

      {/* Dedicated Invoices & Payment History Modal */}
      <InvestmentInvoicesModal
        isOpen={Boolean(selectedInvestmentForInvoices)}
        onClose={() => setSelectedInvestmentForInvoices(null)}
        investment={selectedInvestmentForInvoices}
      />

      {/* Buy On Behalf Modal */}
      <BuyOnBehalfModal
        isOpen={isBuyOnBehalfOpen}
        onClose={() => setIsBuyOnBehalfOpen(false)}
        onSuccess={() => {
          fetchStats();
          fetchInvestments();
        }}
      />

      {/* In-App Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={Boolean(viewingDoc)}
        onClose={() => setViewingDoc(null)}
        url={viewingDoc?.url}
        title={viewingDoc?.title}
        subtitle={viewingDoc?.subtitle}
      />
    </div>
  );
}

export default function InvestmentsView() {
  return (
    <Suspense fallback={<InvestmentsPageSkeleton />}>
      <InvestmentsContent />
    </Suspense>
  );
}
