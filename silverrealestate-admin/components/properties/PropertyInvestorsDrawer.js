"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { formatLocation } from "../../lib/locationUtils";
import { getInvestmentStatusBadge, formatStatus } from "../../lib/formatUtils";
import InvestmentDetailModal from "../investments/InvestmentDetailModal";
import InvestmentApproveModal from "../investments/InvestmentApproveModal";
import InvestmentRejectModal from "../investments/InvestmentRejectModal";

function UserAvatar({ user }) {
  const [imgFailed, setImgFailed] = useState(false);
  const imgUrl = user?.profileImage || user?.profileUrl || user?.image || user?.avatar;

  if (imgUrl && !imgFailed) {
    return (
      <img
        src={imgUrl}
        alt={user?.fullName || "User"}
        onError={() => setImgFailed(true)}
        className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
      {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
    </div>
  );
}

function formatCurrency(val) {
  if (val === null || val === undefined || isNaN(val)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PropertyInvestorsDrawer({
  isOpen,
  onClose,
  property,
}) {
  const [investments, setInvestments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL"); // "ALL" | "APPROVED" | "PENDING"
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Global property-level investment metrics (unaffected by tab/search filters)
  const [globalStats, setGlobalStats] = useState({
    totalInvestors: 0,
    verifiedBuyers: 0,
    totalApprovedAmount: 0,
    pendingOrders: 0,
  });

  // Modals for investment actions
  const [selectedInvestmentForDetail, setSelectedInvestmentForDetail] = useState(null);
  const [selectedInvestmentForApprove, setSelectedInvestmentForApprove] = useState(null);
  const [selectedInvestmentForReject, setSelectedInvestmentForReject] = useState(null);

  const propertyId = property?.id || property?.propertyId;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch global property metrics independent of current active tab or search filters
  const fetchGlobalStats = useCallback(async (propId) => {
    if (!propId) return;
    try {
      const res = await api.get(`/admin/investments/property/${propId}?limit=1000`);
      if (res?.success && res.data) {
        if (res.data.summary) {
          setGlobalStats({
            totalInvestors: res.data.summary.totalInvestors ?? res.data.summary.total ?? 0,
            verifiedBuyers: res.data.summary.verifiedBuyers ?? res.data.summary.approvedCount ?? 0,
            totalApprovedAmount: res.data.summary.totalApprovedAmount ?? res.data.summary.totalAmount ?? 0,
            pendingOrders: res.data.summary.pendingOrders ?? res.data.summary.pendingCount ?? 0,
          });
          return;
        }

        const allList = Array.isArray(res.data.investments)
          ? res.data.investments
          : Array.isArray(res.data)
          ? res.data
          : [];

        const approved = allList.filter((inv) => inv.status === "APPROVED");
        const pending = allList.filter((inv) => inv.status === "PENDING");
        const totalAmt = approved.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
        const total = res.data.pagination?.total ?? allList.length;

        setGlobalStats({
          totalInvestors: total,
          verifiedBuyers: approved.length,
          totalApprovedAmount: totalAmt,
          pendingOrders: pending.length,
        });
      }
    } catch (err) {
      console.error("Failed to fetch global stats for property investments", err);
    }
  }, []);

  const fetchInvestors = useCallback(
    async (pageNum = 1, append = false) => {
      if (!propertyId) return;
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      try {
        let url = `/admin/investments/property/${propertyId}?page=${pageNum}&limit=20`;
        if (activeTab !== "ALL") {
          url += `&status=${activeTab}`;
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
          setInvestments((prev) => (append ? [...prev, ...list] : list));

          const pagination = res.data.pagination;
          const hasMore = pagination
            ? Boolean(pagination.hasNext || (pagination.page && pagination.totalPages && pagination.page < pagination.totalPages))
            : list.length >= 20;
          setHasNext(hasMore);
          setPage(pageNum);
        } else {
          if (!append) setInvestments([]);
          setHasNext(false);
        }
      } catch (error) {
        toast.error(error.message || "Failed to load investors for this property");
        if (!append) setInvestments([]);
        setHasNext(false);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [propertyId, activeTab, debouncedSearch]
  );

  useEffect(() => {
    if (isOpen && propertyId) {
      fetchGlobalStats(propertyId);
    } else if (!isOpen) {
      setGlobalStats({
        totalInvestors: 0,
        verifiedBuyers: 0,
        totalApprovedAmount: 0,
        pendingOrders: 0,
      });
    }
  }, [isOpen, propertyId, fetchGlobalStats]);

  useEffect(() => {
    if (isOpen && propertyId) {
      setPage(1);
      setHasNext(false);
      fetchInvestors(1, false);
    } else {
      setInvestments([]);
      setIsLoading(false);
      setIsLoadingMore(false);
      setPage(1);
      setHasNext(false);
      if (!isOpen) {
        setActiveTab("ALL");
        setSearchQuery("");
        setDebouncedSearch("");
      }
    }
  }, [isOpen, propertyId, activeTab, debouncedSearch, fetchInvestors]);

  // Handle scroll on drawer body for infinite pagination
  const handleDrawerBodyScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      if (hasNext && !isLoading && !isLoadingMore && propertyId) {
        fetchInvestors(page + 1, true);
      }
    }
  };

  const handleRefresh = () => {
    setPage(1);
    fetchInvestors(1, false);
    if (propertyId) {
      fetchGlobalStats(propertyId);
    }
  };

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Direct investments list from backend
  const filteredInvestments = investments;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl z-10 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-start justify-between gap-3 bg-white">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
              <Icon icon="lucide:users" width="20" height="20" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                Property Investors
              </h2>
              <p className="text-xs text-gray-500 truncate mt-0.5 font-medium">
                {property?.title || "Property Details"}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5 truncate">
                <Icon icon="lucide:map-pin" width="12" height="12" className="shrink-0" />
                <span className="truncate">{formatLocation(property?.location)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              title="Refresh Investors"
            >
              <Icon icon="lucide:refresh-cw" width="16" height="16" className={isLoading ? "animate-spin text-primary" : ""} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              title="Close Drawer"
            >
              <Icon icon="lucide:x" width="18" height="18" />
            </button>
          </div>
        </div>

        {/* Executive KPI Summary Ribbon (Global stats unaffected by filter changes) */}
        <div className="p-4 bg-slate-50/80 border-b border-gray-100 grid grid-cols-3 gap-2.5 sm:gap-3">
          <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Total Investors
            </span>
            <span className="text-base sm:text-lg font-bold text-gray-900 mt-0.5">
              {globalStats.totalInvestors}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-2xs flex flex-col">
            <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <Icon icon="lucide:check-circle-2" width="11" height="11" />
              <span>Verified Buyers</span>
            </span>
            <span className="text-base sm:text-lg font-bold text-emerald-700 mt-0.5">
              {globalStats.verifiedBuyers}
            </span>
            <span className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
              {formatCurrency(globalStats.totalApprovedAmount)}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-2xs flex flex-col">
            <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
              <Icon icon="lucide:clock" width="11" height="11" />
              <span>Pending Orders</span>
            </span>
            <span className="text-base sm:text-lg font-bold text-amber-700 mt-0.5">
              {globalStats.pendingOrders}
            </span>
            <span className="text-[10px] text-gray-400 truncate mt-0.5">
              Awaiting Approval
            </span>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col gap-3 bg-white">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`flex-1 min-w-[90px] py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "ALL"
                  ? "bg-white text-gray-900 shadow-2xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <span>All</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("APPROVED")}
              className={`flex-1 min-w-[110px] py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "APPROVED"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <Icon icon="lucide:badge-check" width="13" height="13" />
              <span>Verified Only</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("PENDING")}
              className={`flex-1 min-w-[100px] py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "PENDING"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "text-amber-700 hover:bg-amber-50"
              }`}
            >
              <Icon icon="lucide:clock" width="13" height="13" />
              <span>Pending</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
              <Icon icon="lucide:search" width="15" height="15" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search investor by name, phone, or email..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary text-xs font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <Icon icon="lucide:x" width="14" height="14" />
              </button>
            )}
          </div>
        </div>

        {/* Investors List Content */}
        <div
          onScroll={handleDrawerBodyScroll}
          className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-slate-50/40"
        >
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-2xs animate-pulse flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                    <div className="space-y-2">
                      <div className="h-3.5 w-32 bg-gray-200 rounded" />
                      <div className="h-2.5 w-24 bg-gray-100 rounded" />
                    </div>
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredInvestments.length === 0 ? (
            <div className="py-14 text-center flex flex-col items-center justify-center text-gray-400">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-3 text-gray-300 border border-gray-100 shadow-2xs">
                <Icon icon="lucide:user-x" width="24" height="24" />
              </div>
              <p className="text-sm font-bold text-gray-800">No Investors Found</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                No investments have been placed on this property yet.
              </p>
            </div>
          ) : (
            <>
              {filteredInvestments.map((inv) => {
                const isApproved = inv.status === "APPROVED";
                const isPending = inv.status === "PENDING";
                const userObj = inv.user;

                return (
                  <div
                    key={inv.id}
                    className={`p-4 bg-white rounded-2xl border transition-all hover:shadow-md flex flex-col gap-3 group ${
                      isApproved
                        ? "border-emerald-100/90 hover:border-emerald-200"
                        : isPending
                        ? "border-amber-100/90 hover:border-amber-200"
                        : "border-gray-200"
                    }`}
                  >
                    {/* Top Row: User Info & Verification Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar user={userObj} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                              {userObj?.fullName || "Unnamed Investor"}
                            </span>
                            {userObj?.isVerified && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800" title="User is KYC Verified">
                                <Icon icon="lucide:badge-check" width="11" height="11" />
                                <span>KYC</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5 truncate">
                            {userObj?.phone && <span>{userObj.phone}</span>}
                            {userObj?.phone && userObj?.email && <span>&bull;</span>}
                            {userObj?.email && <span className="truncate">{userObj.email}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        {(() => {
                          const badge = getInvestmentStatusBadge(inv.status);
                          return (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs ${badge.className}`}
                            >
                              <Icon icon={badge.icon} width="13" height="13" />
                              <span>{badge.label}</span>
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Middle Row: Investment Breakdown */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">Units Booked</span>
                        <span className="font-bold text-gray-900 mt-0.5 block">
                          {inv.units} {inv.units === 1 ? "unit" : "units"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">Unit Price</span>
                        <span className="font-semibold text-gray-700 mt-0.5 block">
                          {formatCurrency(inv.unitPriceAtTime)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">Total Investment</span>
                        <span className="font-bold text-primary text-sm mt-0.5 block">
                          {formatCurrency(inv.totalAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Fixed-Term & Valuation Indicator */}
                    {(inv.currentValuation || inv.remainingTermString || inv.isMatured) && (
                      <div className="flex items-center justify-between px-2.5 py-1.5 bg-indigo-50/50 rounded-xl border border-indigo-100/70 text-[11px]">
                        <span className="text-indigo-950 font-medium flex items-center gap-1">
                          <Icon icon="lucide:trending-up" width="12" height="12" className="text-indigo-600" />
                          <span>Promised Return: <strong>{formatCurrency(inv.currentValuation || inv.totalAmount)}</strong></span>
                        </span>
                        <span className={`font-semibold ${inv.isMatured ? "text-emerald-700" : "text-indigo-700"}`}>
                          {inv.isMatured ? "Matured" : inv.remainingTermString || "Lock-in Active"}
                        </span>
                      </div>
                    )}

                    {/* Bottom Row: Actions */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100/80">
                      <span className="text-[11px] text-gray-400">
                        Date: {formatDate(inv.createdAt)}
                      </span>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectedInvestmentForApprove(inv)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                              title="Verify Payment & Approve"
                            >
                              <Icon icon="lucide:check" width="12" height="12" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedInvestmentForReject(inv)}
                              className="px-2 py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {userObj?.id && (
                          <Link
                            href={`/users/${userObj.id}`}
                            className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                            title="View Investor Profile"
                          >
                            <Icon icon="lucide:user" width="12" height="12" />
                            <span>Profile</span>
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedInvestmentForDetail(inv)}
                          className="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                          title="View Full Investment Details"
                        >
                          <Icon icon="lucide:chevron-right" width="16" height="16" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Infinite Scroll Loader Indicator */}
              {isLoadingMore && (
                <div className="py-3 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                  <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin text-primary" />
                  <span>Loading more investors...</span>
                </div>
              )}

              {!hasNext && investments.length > 20 && (
                <div className="py-2 text-center text-[11px] text-gray-400">
                  All {investments.length} investors loaded
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <InvestmentDetailModal
        isOpen={!!selectedInvestmentForDetail}
        onClose={() => setSelectedInvestmentForDetail(null)}
        investment={selectedInvestmentForDetail}
        onApprove={() => {
          setSelectedInvestmentForDetail(null);
          handleRefresh();
        }}
        onReject={() => {
          setSelectedInvestmentForDetail(null);
          handleRefresh();
        }}
      />

      {/* Approve Modal */}
      <InvestmentApproveModal
        isOpen={!!selectedInvestmentForApprove}
        onClose={() => setSelectedInvestmentForApprove(null)}
        investment={selectedInvestmentForApprove}
        onSuccess={() => {
          setSelectedInvestmentForApprove(null);
          handleRefresh();
        }}
      />

      {/* Reject Modal */}
      <InvestmentRejectModal
        isOpen={!!selectedInvestmentForReject}
        onClose={() => setSelectedInvestmentForReject(null)}
        investment={selectedInvestmentForReject}
        onSuccess={() => {
          setSelectedInvestmentForReject(null);
          handleRefresh();
        }}
      />
    </div>
  );
}
