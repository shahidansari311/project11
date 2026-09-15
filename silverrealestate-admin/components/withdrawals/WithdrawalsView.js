"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "../../lib/api";
import Pagination from "../users/Pagination";
import InvestmentWithdrawalModal from "../investments/InvestmentWithdrawalModal";
import InvestmentDetailModal from "../investments/InvestmentDetailModal";
import DocumentViewerModal from "../common/DocumentViewerModal";
import { formatLocation } from "../../lib/locationUtils";
import {
  formatStatus,
  getInvestmentStatusBadge,
  formatCurrency,
  formatDate,
  getUserKycBadge,
} from "../../lib/formatUtils";

function WithdrawalsTableSkeleton({ rows = 5 }) {
  return (
    <div className="overflow-auto h-full custom-scrollbar">
      <table className="w-full text-sm text-left min-w-[1050px]">
        <thead className="border-b border-gray-200 bg-gray-50 sticky top-0 z-10 shadow-2xs">
          <tr className="bg-gray-50">
            <th className="px-5 py-3.5"><div className="h-3.5 w-24 bg-gray-200 rounded animate-pulse" /></th>
            <th className="px-5 py-3.5"><div className="h-3.5 w-28 bg-gray-200 rounded animate-pulse" /></th>
            <th className="px-5 py-3.5"><div className="h-3.5 w-24 bg-gray-200 rounded animate-pulse" /></th>
            <th className="px-5 py-3.5"><div className="h-3.5 w-28 bg-gray-200 rounded animate-pulse" /></th>
            <th className="px-5 py-3.5"><div className="h-3.5 w-32 bg-gray-200 rounded animate-pulse" /></th>
            <th className="px-5 py-3.5"><div className="h-3.5 w-20 bg-gray-200 rounded animate-pulse" /></th>
            <th className="px-5 py-3.5 text-right"><div className="h-3.5 w-16 bg-gray-200 rounded animate-pulse ml-auto" /></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="animate-pulse border-b border-gray-50">
              <td className="px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-24 bg-gray-200 rounded" />
                    <div className="h-2.5 w-16 bg-gray-100 rounded" />
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 bg-gray-200 rounded" />
                  <div className="h-2.5 w-20 bg-gray-100 rounded" />
                </div>
              </td>
              <td className="px-5 py-4"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
              <td className="px-5 py-4"><div className="h-5 w-24 bg-gray-200 rounded" /></td>
              <td className="px-5 py-4"><div className="h-4 w-32 bg-gray-200 rounded" /></td>
              <td className="px-5 py-4"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
              <td className="px-5 py-4 text-right"><div className="h-7 w-20 bg-gray-200 rounded-lg ml-auto" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WithdrawalsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [withdrawals, setWithdrawals] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Tab State: "WITHDRAWAL_REQUESTED" (Pending) | "WITHDRAWN" (Completed)
  const initialStatus = searchParams.get("status") || "WITHDRAWAL_REQUESTED";
  const [statusTab, setStatusTab] = useState(
    initialStatus === "WITHDRAWN" ? "WITHDRAWN" : "WITHDRAWAL_REQUESTED"
  );

  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 20);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");

  // Stats across tabs
  const [stats, setStats] = useState({
    pendingCount: 0,
    pendingTotalAmount: 0,
    withdrawnCount: 0,
    withdrawnTotalAmount: 0,
  });

  // Modal States
  const [selectedInvestmentForWithdrawal, setSelectedInvestmentForWithdrawal] = useState(null);
  const [selectedInvestmentForDetail, setSelectedInvestmentForDetail] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [showStats, setShowStats] = useState(true);

  // Load showStats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("withdrawals_show_stats");
    if (saved !== null) {
      setShowStats(saved === "true");
    }
  }, []);

  const handleToggleStats = () => {
    setShowStats((prev) => {
      const next = !prev;
      localStorage.setItem("withdrawals_show_stats", String(next));
      return next;
    });
  };

  const handleCopy = (e, text, fieldName) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Sync URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("status", statusTab);
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [page, limit, statusTab, debouncedSearch, pathname, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch summary counts for both tabs from /admin/investments/stats
  const fetchCounts = useCallback(async () => {
    try {
      const statsRes = await api.get("/admin/investments/stats");
      if (statsRes?.success && statsRes.data) {
        const d = statsRes.data;
        setStats((prev) => ({
          ...prev,
          pendingCount: d.withdrawalRequestedInvestments ?? d.withdrawalRequested ?? 0,
          withdrawnCount: d.withdrawnInvestments ?? d.withdrawn ?? 0,
        }));
      }
    } catch {
      // non-blocking
    }
  }, []);

  // Fetch withdrawals list for the active status tab
  const fetchWithdrawals = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/admin/investments?page=${page}&limit=${limit}&status=${statusTab}`;
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
        setWithdrawals(list);

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

        // Update active tab stats in case counts changed
        const totalPayoutVal = list.reduce(
          (acc, inv) =>
            acc +
            (Number(inv.currentValuation) ||
              (Number(inv.totalAmount || inv.paidAmount || 0) + Number(inv.promisedReturnAmount || 0)) ||
              Number(inv.totalAmount || inv.paidAmount || 0) ||
              0),
          0
        );

        setStats((prev) => ({
          ...prev,
          ...(statusTab === "WITHDRAWAL_REQUESTED"
            ? { pendingCount: totalCount, pendingTotalAmount: totalPayoutVal }
            : { withdrawnCount: totalCount, withdrawnTotalAmount: totalPayoutVal }),
        }));
      } else {
        setWithdrawals([]);
        setPagination(null);
      }
    } catch (error) {
      toast.error(error.message || `Failed to load ${statusTab === "WITHDRAWN" ? "completed withdrawals" : "withdrawal requests"}`);
      setWithdrawals([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, statusTab, debouncedSearch]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleTabChange = (newTab) => {
    if (newTab === statusTab) return;
    setStatusTab(newTab);
    setPage(1);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const isPendingTab = statusTab === "WITHDRAWAL_REQUESTED";

  const tabs = [
    {
      key: "WITHDRAWAL_REQUESTED",
      label: "Pending Withdrawal Requests",
      count: stats.pendingCount,
      color: "bg-amber-50 text-amber-700",
      activeColor: "border-primary text-primary",
    },
    {
      key: "WITHDRAWN",
      label: "Past Completed Withdrawals",
      count: stats.withdrawnCount,
      color: "bg-emerald-50 text-emerald-700",
      activeColor: "border-primary text-primary",
    },
  ];

  return (
    <div className="flex flex-col gap-4 w-full h-[calc(100vh-120px)] min-h-[500px]">
      {/* KPI Stats Ribbon (Collapsible) */}
      {showStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 shrink-0 animate-in fade-in duration-150">
          {/* Card 1: Pending Requests */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-700 block mb-1">
                Pending Withdrawal Requests
              </span>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats.pendingCount}
              </div>
              <span className="text-[11px] text-gray-400 mt-0.5 block">
                {formatCurrency(stats.pendingTotalAmount)} awaiting payout transfer
              </span>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
              <Icon icon="lucide:clock" width="20" height="20" />
            </div>
          </div>

          {/* Card 2: Completed Past Withdrawals */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 block mb-1">
                Completed Withdrawals
              </span>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats.withdrawnCount}
              </div>
              <span className="text-[11px] text-gray-400 mt-0.5 block">
                {formatCurrency(stats.withdrawnTotalAmount)} successfully paid out
              </span>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
              <Icon icon="lucide:check-circle-2" width="20" height="20" />
            </div>
          </div>

          {/* Card 3: Total Withdrawal Volume */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between sm:col-span-2 lg:col-span-1">
            <div>
              <span className="text-xs font-semibold text-primary block mb-1">
                Total Payout Volume
              </span>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {formatCurrency(stats.pendingTotalAmount + stats.withdrawnTotalAmount)}
              </div>
              <span className="text-[11px] text-gray-400 mt-0.5 block">
                {stats.pendingCount + stats.withdrawnCount} total withdrawal transactions
              </span>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
              <Icon icon="lucide:banknote" width="20" height="20" />
            </div>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0 flex-1 w-full">
        {/* Navigation Tabs Bar */}
        <div className="px-5 pt-3 border-b border-gray-100 flex items-center gap-2 overflow-x-auto custom-scrollbar bg-white shrink-0">
          {tabs.map((tab) => {
            const isActive = statusTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? "bg-primary text-white" : tab.color
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar Search & Refresh */}
        <div className="p-3 sm:px-5 sm:py-3.5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white shrink-0">
          {/* Search bar */}
          <div className="relative flex-1 min-w-0 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Icon icon="lucide:search" width="16" height="16" />
            </div>
            <input
              type="text"
              placeholder="Search by investor name, email, phone or property title..."
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
            <div className="text-xs text-gray-500 hidden md:block">
              Showing <span className="font-bold text-gray-800">{withdrawals.length}</span> {isPendingTab ? "pending requests" : "completed payouts"}
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
                  fetchWithdrawals();
                  fetchCounts();
                }}
                className="px-3 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Refresh records"
              >
                <Icon icon="lucide:refresh-cw" width="13" height="13" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="min-h-0 flex-1 overflow-auto custom-scrollbar">
          {isLoading ? (
            <WithdrawalsTableSkeleton />
          ) : withdrawals.length === 0 ? (
            <div className="h-full py-16 px-4 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-1">
                <Icon icon="lucide:banknote" width="32" height="32" />
              </div>
              <div>
                <h3 className="type-h5 text-gray-900 mb-1">
                  {isPendingTab
                    ? "No pending withdrawal requests found"
                    : "No completed withdrawals found"}
                </h3>
                <p className="type-body-sm text-gray-500 max-w-sm mx-auto">
                  {search
                    ? "No records matching your search query."
                    : isPendingTab
                    ? "When investors request payouts for their matured investments, they will appear here."
                    : "Processed payouts and attached bank payment receipts will be recorded here."}
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm text-left min-w-[1100px]">
              <thead className="border-b border-gray-200 bg-gray-50/80 sticky top-0 z-10 shadow-2xs">
                <tr className="bg-gray-50/90 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3.5">Investor</th>
                  <th className="px-4 py-3.5">Property & Term</th>
                  <th className="px-4 py-3.5 text-center">Initial Invested</th>
                  <th className="px-4 py-3.5">{isPendingTab ? "Promised Payout" : "Paid Out Valuation"}</th>
                  <th className="px-4 py-3.5">Destination Bank Account</th>
                  {!isPendingTab && <th className="px-4 py-3.5 text-center">Bank Receipt</th>}
                  <th className="px-4 py-3.5">{isPendingTab ? "Request Date" : "Payout Date"}</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {withdrawals.map((inv) => {
                  const kycBadge = getUserKycBadge(inv.user);
                  const bank = inv.refundBankDetails || {};
                  const initialAmt = inv.totalAmount || inv.paidAmount || 0;
                  const payoutValuation =
                    inv.currentValuation ??
                    (inv.promisedReturnAmount
                      ? Number(initialAmt) + Number(inv.promisedReturnAmount)
                      : initialAmt);

                  const hasReturnProfit = inv.promisedReturnAmount !== undefined && inv.promisedReturnAmount !== null && Number(inv.promisedReturnAmount) > 0;
                  const hasReceipt = Boolean(inv.refundProofUrl);

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvestmentForDetail(inv)}
                      className="border-b border-gray-50 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Investor Column */}
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
                        <div className="min-w-0 max-w-[210px] space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-gray-900 truncate text-xs sm:text-sm group-hover:text-primary transition-colors">
                              {inv.property?.title || "Property"}
                            </span>
                            {inv.property?.category && (
                              <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded uppercase">
                                {inv.property.category}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-400 block truncate" title={formatLocation(inv.property?.location)}>
                            {formatLocation(inv.property?.location)}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            {inv.property?.termPeriodYears && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                <Icon icon="lucide:lock" width="9" height="9" />
                                <span>{inv.property.termPeriodYears}Y Term</span>
                              </span>
                            )}
                            {inv.isMatured ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                <Icon icon="lucide:check-circle-2" width="9" height="9" />
                                <span>Matured</span>
                              </span>
                            ) : inv.remainingTermString ? (
                              <span className="text-[10px] text-gray-500 font-medium truncate">
                                {inv.remainingTermString}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Initial Investment */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-bold text-gray-900 text-xs block tabular-nums">
                          {formatCurrency(initialAmt)}
                        </span>
                        <span className="inline-flex px-1.5 py-0.2 rounded bg-gray-100 text-[10px] font-semibold text-gray-600 mt-0.5">
                          {inv.units} {inv.units === 1 ? "unit" : "units"}
                        </span>
                      </td>

                      {/* Total Payout Valuation */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-gray-900 text-sm block tabular-nums">
                            {formatCurrency(payoutValuation)}
                          </span>
                          {hasReturnProfit ? (
                            <span className="text-[10px] text-emerald-700 font-semibold block">
                              +{formatCurrency(inv.promisedReturnAmount)} ({inv.targetReturnAtTime ?? inv.property?.targetReturn ?? 0}%)
                            </span>
                          ) : (inv.targetReturnAtTime !== undefined && inv.targetReturnAtTime !== null && Number(inv.targetReturnAtTime) > 0) ? (
                            <span className="text-[10px] text-emerald-700 font-semibold block">
                              {inv.targetReturnAtTime}% Return
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Destination Bank Details */}
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        {bank.accountNumber || bank.bankName ? (
                          <div className="p-2.5 bg-gray-50/80 border border-gray-200/80 rounded-xl text-xs space-y-1 max-w-[210px]">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-gray-900 truncate text-[11px]">
                                {bank.bankName || "Bank Account"}
                              </span>
                              <span className="text-[10px] text-gray-500 truncate max-w-[90px]">
                                {bank.accountName || inv.user?.fullName || ""}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono font-semibold text-gray-800 text-[11px] truncate">
                                A/C: {bank.accountNumber || "N/A"}
                              </span>
                              {bank.accountNumber && (
                                <button
                                  type="button"
                                  onClick={(e) => handleCopy(e, bank.accountNumber, "Account Number")}
                                  className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer shrink-0"
                                >
                                  {copiedField === "Account Number" ? "Copied" : "Copy"}
                                </button>
                              )}
                            </div>

                            {bank.ifscCode && (
                              <div className="flex items-center justify-between gap-1 text-[10px] text-gray-400">
                                <span className="font-mono uppercase truncate">IFSC: {bank.ifscCode}</span>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopy(e, bank.ifscCode, "IFSC Code")}
                                  className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer shrink-0"
                                >
                                  {copiedField === "IFSC Code" ? "Copied" : "Copy"}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No bank info on file</span>
                        )}
                      </td>

                      {/* Bank Transfer Receipt Column (For Completed Tab) */}
                      {!isPendingTab && (
                        <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          {hasReceipt ? (
                            <button
                              type="button"
                              onClick={() =>
                                setViewingDoc({
                                  url: inv.refundProofUrl,
                                  title: "Bank Transfer Payout Receipt",
                                  subtitle: `Payout for ${inv.user?.fullName || "Investor"} • ${inv.property?.title || "Property"}`,
                                })
                              }
                              className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            >
                              <Icon icon="lucide:file-text" width="13" height="13" className="text-primary" />
                              <span>View Receipt</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-gray-400">On file</span>
                          )}
                        </td>
                      )}

                      {/* Date */}
                      <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(isPendingTab ? (inv.date || inv.createdAt) : (inv.updatedAt || inv.date || inv.createdAt))}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isPendingTab ? (
                            <button
                              type="button"
                              onClick={() => setSelectedInvestmentForWithdrawal(inv)}
                              className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                            >
                              <Icon icon="lucide:banknote" width="14" height="14" />
                              <span>Process Payout</span>
                            </button>
                          ) : hasReceipt ? (
                            <button
                              type="button"
                              onClick={() =>
                                setViewingDoc({
                                  url: inv.refundProofUrl,
                                  title: "Bank Transfer Payout Receipt",
                                  subtitle: `Payout for ${inv.user?.fullName || "Investor"} • ${inv.property?.title || "Property"}`,
                                })
                              }
                              className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              title="View Receipt"
                            >
                              <Icon icon="lucide:file-text" width="16" height="16" />
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => setSelectedInvestmentForDetail(inv)}
                            className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Icon icon="lucide:eye" width="16" height="16" />
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
        {!isLoading && pagination && (
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={handleLimitChange}
            entityName={isPendingTab ? "withdrawal requests" : "completed withdrawals"}
          />
        )}
      </div>

      {/* Dedicated Withdrawal Payout Modal */}
      <InvestmentWithdrawalModal
        isOpen={Boolean(selectedInvestmentForWithdrawal)}
        onClose={() => setSelectedInvestmentForWithdrawal(null)}
        investment={selectedInvestmentForWithdrawal}
        onSuccess={() => {
          fetchWithdrawals();
          fetchCounts();
        }}
      />

      {/* Detail Modal */}
      <InvestmentDetailModal
        isOpen={Boolean(selectedInvestmentForDetail)}
        onClose={() => setSelectedInvestmentForDetail(null)}
        investment={selectedInvestmentForDetail}
        onWithdrawal={(inv) => {
          setSelectedInvestmentForDetail(null);
          setSelectedInvestmentForWithdrawal(inv);
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

export default function WithdrawalsView() {
  return (
    <Suspense fallback={<WithdrawalsTableSkeleton rows={6} />}>
      <WithdrawalsContent />
    </Suspense>
  );
}

