"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "../../lib/api";
import SubmissionVerificationModal from "./SubmissionVerificationModal";
import Pagination from "../users/Pagination";
import TableSkeleton from "../users/TableSkeleton";
import { formatLocation } from "../../lib/locationUtils";
import { formatStatus } from "../../lib/formatUtils";

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

function getSubmissionStatusBadge(status) {
  const norm = (status || "").toUpperCase().trim();
  switch (norm) {
    case "PENDING_APPROVAL":
    case "PENDING":
      return {
        label: "Pending Approval",
        className: "bg-amber-50 text-amber-700 border-amber-200 shadow-2xs",
        icon: "lucide:clock",
      };
    case "AVAILABLE":
    case "APPROVED":
      return {
        label: "Approved",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs",
        icon: "lucide:check-circle-2",
      };
    case "REJECTED":
      return {
        label: "Rejected",
        className: "bg-red-50 text-red-700 border-red-200 shadow-2xs",
        icon: "lucide:x-circle",
      };
    case "DRAFT":
      return {
        label: "Draft",
        className: "bg-gray-100 text-gray-700 border-gray-200",
        icon: "lucide:file-text",
      };
    default:
      return {
        label: formatStatus(status),
        className: "bg-gray-100 text-gray-700 border-gray-200",
        icon: "lucide:help-circle",
      };
  }
}

function SubmissionsSkeleton() {
  return (
    <div className="flex flex-col gap-5 w-full h-[calc(100vh-120px)] min-h-[500px] animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-3.5 w-24 bg-gray-200 rounded" />
              <div className="h-6 w-16 bg-gray-200 rounded" />
            </div>
            <div className="w-11 h-11 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="h-10 w-full max-w-sm bg-gray-100 rounded-xl" />
          <div className="h-10 w-36 bg-gray-200 rounded-xl" />
        </div>
        <TableSkeleton rows={6} />
      </div>
    </div>
  );
}

function BuilderSubmissionsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Global counts for top ribbon cards
  const [globalStats, setGlobalStats] = useState({
    pending: 0,
    available: 0,
    rejected: 0,
    total: 0,
    builders: 0,
    isLoading: true,
  });

  // URL query params
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 20);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL");
  const [builderIdFilter, setBuilderIdFilter] = useState(searchParams.get("builderId") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");

  // Selected property for verification modal
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [showStats, setShowStats] = useState(true);

  // Sync state when URL searchParams change
  useEffect(() => {
    const urlStatus = searchParams.get("status") || "ALL";
    if (urlStatus !== statusFilter) {
      setStatusFilter(urlStatus);
    }
    const urlBuilderId = searchParams.get("builderId") || "";
    if (urlBuilderId !== builderIdFilter) {
      setBuilderIdFilter(urlBuilderId);
    }
    const urlSearch = searchParams.get("search") || "";
    if (urlSearch !== search) {
      setSearch(urlSearch);
      setDebouncedSearch(urlSearch);
    }
    const urlPage = Number(searchParams.get("page")) || 1;
    if (urlPage !== page) {
      setPage(urlPage);
    }
  }, [searchParams]);

  // Load showStats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("submissions_show_stats");
    if (saved !== null) {
      setShowStats(saved === "true");
    }
  }, []);

  const handleToggleStats = () => {
    setShowStats((prev) => {
      const next = !prev;
      localStorage.setItem("submissions_show_stats", String(next));
      return next;
    });
  };

  // Dropdown menu state
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const buttonRefs = useRef({});

  const toggleMenu = (id) => {
    if (activeMenuId === id) {
      setActiveMenuId(null);
    } else {
      const button = buttonRefs.current[id];
      if (button) {
        const rect = button.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpwards = spaceBelow < 220 && rect.top > 220;
        setMenuPosition({
          top: openUpwards ? undefined : rect.bottom + 4,
          bottom: openUpwards ? (window.innerHeight - rect.top + 4) : undefined,
          right: Math.max(16, window.innerWidth - rect.right),
        });
      }
      setActiveMenuId(id);
    }
  };

  // Close dropdown on scroll or resize
  useEffect(() => {
    const handleScrollOrResize = () => {
      if (activeMenuId) setActiveMenuId(null);
    };
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [activeMenuId]);

  // Sync URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (statusFilter) {
      params.set("status", statusFilter);
    }
    if (builderIdFilter) {
      params.set("builderId", builderIdFilter);
    }
    if (debouncedSearch.trim()) {
      params.set("search", debouncedSearch.trim());
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [page, limit, statusFilter, builderIdFilter, debouncedSearch, pathname, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchGlobalStats = useCallback(async () => {
    try {
      const [pendingRes, availableRes, rejectedRes, totalRes, buildersRes] = await Promise.allSettled([
        api.get("/admin/property/builder-submissions?page=1&limit=1&status=PENDING_APPROVAL"),
        api.get("/admin/property/builder-submissions?page=1&limit=1&status=AVAILABLE"),
        api.get("/admin/property/builder-submissions?page=1&limit=1&status=REJECTED"),
        api.get("/admin/property/builder-submissions?page=1&limit=1"),
        api.get("/admin/builders?page=1&limit=1"),
      ]);

      let pendingCount = 0;
      if (pendingRes.status === "fulfilled" && pendingRes.value?.success && pendingRes.value.data) {
        pendingCount =
          pendingRes.value.data.pagination?.total ??
          (Array.isArray(pendingRes.value.data.properties) ? pendingRes.value.data.properties.length : 0);
      }

      let availableCount = 0;
      if (availableRes.status === "fulfilled" && availableRes.value?.success && availableRes.value.data) {
        availableCount =
          availableRes.value.data.pagination?.total ??
          (Array.isArray(availableRes.value.data.properties) ? availableRes.value.data.properties.length : 0);
      }

      let rejectedCount = 0;
      if (rejectedRes.status === "fulfilled" && rejectedRes.value?.success && rejectedRes.value.data) {
        rejectedCount =
          rejectedRes.value.data.pagination?.total ??
          (Array.isArray(rejectedRes.value.data.properties) ? rejectedRes.value.data.properties.length : 0);
      }

      let totalCount = 0;
      if (totalRes.status === "fulfilled" && totalRes.value?.success && totalRes.value.data) {
        totalCount =
          totalRes.value.data.pagination?.total ??
          (Array.isArray(totalRes.value.data.properties) ? totalRes.value.data.properties.length : 0);
      }

      let buildersCount = 0;
      if (buildersRes.status === "fulfilled" && buildersRes.value?.success && buildersRes.value.data) {
        buildersCount =
          buildersRes.value.data.pagination?.total ??
          (Array.isArray(buildersRes.value.data.users || buildersRes.value.data.builders)
            ? (buildersRes.value.data.users || buildersRes.value.data.builders).length
            : 0);
      }

      setGlobalStats({
        pending: pendingCount,
        available: availableCount,
        rejected: rejectedCount,
        total: totalCount,
        builders: buildersCount,
        isLoading: false,
      });
    } catch {
      setGlobalStats((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/admin/property/builder-submissions?page=${page}&limit=${limit}`;
      if (statusFilter && statusFilter !== "ALL") {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }
      if (builderIdFilter) {
        url += `&builderId=${encodeURIComponent(builderIdFilter)}`;
      }
      if (debouncedSearch.trim()) {
        url += `&search=${encodeURIComponent(debouncedSearch.trim())}`;
      }

      const res = await api.get(url);
      if (res?.success && res.data) {
        const list = Array.isArray(res.data.properties)
          ? res.data.properties
          : Array.isArray(res.data)
          ? res.data
          : [];
        setProperties(list);
        setPagination(res.data.pagination || null);
      } else {
        setProperties([]);
        setPagination(null);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load builder submissions");
      setProperties([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, statusFilter, builderIdFilter, debouncedSearch]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  useEffect(() => {
    fetchGlobalStats();
  }, [fetchGlobalStats]);

  const handleRefreshAll = () => {
    fetchSubmissions();
    fetchGlobalStats();
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleOpenVerification = (prop) => {
    setSelectedProperty(prop);
    setIsVerificationModalOpen(true);
  };

  const handleQuickVerify = async (prop, status, e) => {
    e.stopPropagation();
    try {
      const res = await api.patch(`/admin/property/${prop.id}/verification`, {
        status: status,
      });
      if (res?.success) {
        toast.success(
          status === "AVAILABLE"
            ? `"${prop.title}" approved and published as Available!`
            : `"${prop.title}" rejected.`
        );
        fetchSubmissions();
        fetchGlobalStats();
      } else {
        toast.error(res?.message || "Failed to update property status");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred");
    }
  };

  const statusTabs = [
    { key: "PENDING_APPROVAL", label: "Pending Approval", icon: "lucide:clock", count: globalStats.pending, color: "text-amber-700 bg-amber-100" },
    { key: "AVAILABLE", label: "Approved / Available", icon: "lucide:check-circle-2", count: globalStats.available, color: "text-emerald-700 bg-emerald-100" },
    { key: "REJECTED", label: "Rejected", icon: "lucide:x-circle", count: globalStats.rejected, color: "text-red-700 bg-red-100" },
    { key: "ALL", label: "All Submissions", icon: "lucide:list", count: globalStats.total, color: "text-gray-700 bg-gray-100" },
  ];

  return (
    <div className="flex flex-col gap-5 w-full h-[calc(100vh-120px)] min-h-[500px]">
      {/* Metric Cards Ribbon */}
      {showStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Pending Approval (Verification Queue) */}
          <div
            onClick={() => {
              setStatusFilter("PENDING_APPROVAL");
              setPage(1);
            }}
            className="bg-white border border-gray-200 hover:border-amber-400/80 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Verification Queue</span>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mt-0.5 group-hover:text-amber-600 transition-colors">
                {globalStats.isLoading ? "..." : globalStats.pending}
              </div>
              <div className="text-xs text-amber-700 font-medium mt-1 flex items-center gap-1">
                <Icon icon="lucide:clock" width="13" height="13" className="text-amber-500" />
                <span>Awaiting admin review</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform shrink-0 ml-3 shadow-2xs">
              <Icon icon="lucide:clock" width="22" height="22" />
            </div>
          </div>

          {/* Total Submissions */}
          <div
            onClick={() => {
              setStatusFilter("ALL");
              setPage(1);
            }}
            className="bg-white border border-gray-200 hover:border-primary/50 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Submissions</span>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mt-0.5 group-hover:text-primary transition-colors">
                {globalStats.isLoading ? "..." : globalStats.total}
              </div>
              <div className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1">
                <Icon icon="lucide:building-2" width="13" height="13" className="text-gray-400" />
                <span>Submitted by builders</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform shrink-0 ml-3 shadow-2xs">
              <Icon icon="lucide:layers" width="22" height="22" />
            </div>
          </div>

          {/* Registered Builders */}
          <div
            onClick={() => router.push("/builders")}
            className="bg-white border border-gray-200 hover:border-purple-300 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Registered Builders</span>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mt-0.5 group-hover:text-purple-700 transition-colors">
                {globalStats.isLoading ? "..." : globalStats.builders}
              </div>
              <div className="text-xs text-primary font-semibold mt-1 flex items-center gap-1 group-hover:underline">
                <span>View Builders Directory</span>
                <Icon icon="lucide:arrow-right" width="12" height="12" />
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100 group-hover:scale-105 transition-transform shrink-0 ml-3 shadow-2xs">
              <Icon icon="lucide:hard-hat" width="22" height="22" />
            </div>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0 flex-1">
        {/* Status Tabs Header */}
        <div className="px-4 pt-3 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/40">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
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
                  className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Icon icon={tab.icon} width="14" height="14" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && !globalStats.isLoading && (
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

          <div className="flex items-center gap-2 shrink-0 mb-2">
            <button
              type="button"
              onClick={handleToggleStats}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                showStats
                  ? "bg-gray-50 text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 shadow-2xs"
                  : "bg-primary text-white hover:bg-primary/90 shadow-2xs"
              }`}
              title={showStats ? "Hide summary stats cards to maximize table space" : "Show summary stats cards"}
            >
              <Icon
                icon={showStats ? "lucide:eye-off" : "lucide:bar-chart-2"}
                width="14"
                height="14"
                className={showStats ? "text-gray-500" : "text-white"}
              />
              <span className="whitespace-nowrap">{showStats ? "Hide Stats" : "Show Stats"}</span>
            </button>

            <button
              type="button"
              onClick={handleRefreshAll}
              title="Refresh queue"
              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors shrink-0 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            >
              <Icon icon="lucide:refresh-cw" width="14" height="14" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
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
              placeholder="Search by property title or location..."
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

          {/* Active Builder Filter Chip */}
          {builderIdFilter && (
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <Icon icon="lucide:hard-hat" width="14" height="14" className="text-amber-600 shrink-0" />
              <span className="truncate max-w-[200px]">
                Builder: <span className="font-mono text-[11px]">{builderIdFilter}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setBuilderIdFilter("");
                  setPage(1);
                }}
                className="p-0.5 hover:bg-amber-100 text-amber-700 rounded-md transition-colors ml-1 cursor-pointer"
                title="Clear builder filter"
              >
                <Icon icon="lucide:x" width="13" height="13" />
              </button>
            </div>
          )}

          <div className="text-xs text-gray-500 hidden md:block">
            Showing <span className="font-bold text-gray-800">{properties.length}</span> submissions
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-auto h-full flex-1 custom-scrollbar">
          <table className="w-full text-sm text-left min-w-[950px]">
            <thead className="border-b border-gray-200 bg-gray-50 sticky top-0 z-10 shadow-2xs">
              <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-4 md:px-5 py-3.5">Property</th>
                <th className="px-4 md:px-5 py-3.5">Submitted By (Builder)</th>
                <th className="px-4 md:px-5 py-3.5">Pricing & Units</th>
                <th className="px-4 md:px-5 py-3.5">Category</th>
                <th className="px-4 md:px-5 py-3.5 text-center">Status</th>
                <th className="px-4 md:px-5 py-3.5 whitespace-nowrap">Submitted Date</th>
                <th className="px-4 md:px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading ? (
                Array.from({ length: limit > 10 ? 8 : 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 md:px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-200 shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-4 w-40 bg-gray-200 rounded" />
                          <div className="h-3 w-28 bg-gray-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-5 py-4">
                      <div className="space-y-1.5">
                        <div className="h-4 w-28 bg-gray-200 rounded" />
                        <div className="h-3 w-20 bg-gray-100 rounded" />
                      </div>
                    </td>
                    <td className="px-4 md:px-5 py-4">
                      <div className="h-4 w-24 bg-gray-200 rounded" />
                    </td>
                    <td className="px-4 md:px-5 py-4">
                      <div className="h-5 w-20 bg-gray-200 rounded-md" />
                    </td>
                    <td className="px-4 md:px-5 py-4 text-center">
                      <div className="h-5 w-24 bg-gray-200 rounded-full mx-auto" />
                    </td>
                    <td className="px-4 md:px-5 py-4">
                      <div className="h-3.5 w-20 bg-gray-200 rounded" />
                    </td>
                    <td className="px-4 md:px-5 py-4 text-right">
                      <div className="h-7 w-12 bg-gray-200 rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))
              ) : properties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 px-4 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-400">
                        <Icon icon="lucide:check-circle" width="32" height="32" />
                      </div>
                      <h3 className="type-h5 text-gray-900 font-semibold mb-1">No Submissions Found</h3>
                      <p className="type-body-sm text-gray-500 max-w-sm mx-auto">
                        {builderIdFilter
                          ? "No submissions found for the selected builder."
                          : statusFilter === "PENDING_APPROVAL"
                          ? "The builder submission queue is clear. No properties waiting for verification."
                          : `No properties found in the ${formatStatus(statusFilter)} status.`}
                      </p>
                      {builderIdFilter && (
                        <button
                          type="button"
                          onClick={() => {
                            setBuilderIdFilter("");
                            setPage(1);
                          }}
                          className="mt-2 text-xs text-primary font-semibold hover:underline cursor-pointer"
                        >
                          Clear builder filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                properties.map((prop) => {
                  const isPending = prop.status === "PENDING_APPROVAL" || prop.status === "PENDING";
                  const isAvailable = prop.status === "AVAILABLE";
                  const isRejected = prop.status === "REJECTED";
                  const thumb = prop.images?.[0];
                  const builder = prop.builder || {};
                  const builderName = builder.fullName || prop.builderName || "Builder";
                  const builderPhone = builder.phone;
                  const builderEmail = builder.email;
                  const builderAvatar = builder.profileUrl;

                  return (
                    <tr
                      key={prop.id}
                      onClick={() => handleOpenVerification(prop)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group border-b border-gray-50"
                    >
                      {/* Property (Thumbnail + Title + Location) */}
                      <td className="px-4 md:px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {thumb ? (
                              <img src={thumb} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Icon icon="lucide:building-2" className="text-gray-400" width="20" height="20" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-gray-900 group-hover:text-primary transition-colors type-body-sm block truncate">
                                {prop.title || "Untitled Property"}
                              </span>
                              {prop.youtubeVideoUrl && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded shrink-0" title="Video walkthrough attached">
                                  <Icon icon="lucide:video" width="10" height="10" />
                                  <span>Video</span>
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                              <Icon icon="lucide:map-pin" className="shrink-0 text-gray-400" width="12" height="12" />
                              <span className="truncate">{formatLocation(prop.location)}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Submitted By (Builder Profile) */}
                      <td className="px-4 md:px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2.5 min-w-0 max-w-[200px]">
                          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                            {builderAvatar ? (
                              <img src={builderAvatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              builderName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-gray-900 block truncate text-xs">
                                {builderName}
                              </span>
                              {(builder.id || prop.builderId) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBuilderIdFilter(builder.id || prop.builderId);
                                    setPage(1);
                                  }}
                                  title="Filter submissions by this builder"
                                  className="text-gray-400 hover:text-amber-600 transition-colors p-0.5 cursor-pointer shrink-0"
                                >
                                  <Icon icon="lucide:filter" width="11" height="11" />
                                </button>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-400 block truncate">
                              {builderPhone || builderEmail || (prop.builderId ? `ID: ${prop.builderId.slice(0, 8)}...` : "—")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Pricing & Units */}
                      <td className="px-4 md:px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-bold text-xs whitespace-nowrap tabular-nums">
                            {formatCurrency(prop.totalPrice || prop.price)}
                          </span>
                          <span className="text-[11px] text-gray-500 whitespace-nowrap">
                            {prop.totalUnits || prop.totalSize || "N/A"} Total Units
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 md:px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getCategoryBadgeClass(prop.category)}`}>
                          {formatCategoryLabel(prop.category)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 md:px-5 py-4 whitespace-nowrap text-center">
                        {(() => {
                          const badge = getSubmissionStatusBadge(prop.status);
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${badge.className}`}
                            >
                              <Icon
                                icon={badge.icon}
                                width="13"
                                height="13"
                                className="shrink-0"
                              />
                              <span className="whitespace-nowrap font-semibold">{badge.label}</span>
                            </span>
                          );
                        })()}
                      </td>

                      {/* Submitted Date */}
                      <td className="px-4 md:px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(prop.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 md:px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          ref={(el) => {
                            buttonRefs.current[prop.id] = el;
                          }}
                          type="button"
                          onClick={() => toggleMenu(prop.id)}
                          className={`p-1.5 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer ${
                            activeMenuId === prop.id
                              ? "bg-primary text-white shadow-2xs"
                              : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                          }`}
                          title="Verification Actions"
                        >
                          <Icon icon="lucide:more-vertical" width="18" height="18" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={handleLimitChange}
            entityName="submissions"
          />
        )}
      </div>

      {/* Backdrop for closing dropdown */}
      {activeMenuId && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setActiveMenuId(null)}
        />
      )}

      {/* Floating Action Dropdown Menu */}
      {activeMenuId && (() => {
        const activeProp = properties.find((p) => p.id === activeMenuId);
        if (!activeProp) return null;
        const builder = activeProp.builder || {};
        const builderId = builder.id || activeProp.builderId;
        const builderName = builder.fullName || activeProp.builderName || "Builder";

        return (
          <div
            style={{
              position: "fixed",
              top: menuPosition.top,
              bottom: menuPosition.bottom,
              right: menuPosition.right,
            }}
            className="w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-gray-900/10 border border-gray-100 p-1.5 z-[100] animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5 flex flex-col gap-0.5 text-xs"
          >
            {/* View Details */}
            <button
              type="button"
              onClick={() => {
                handleOpenVerification(activeProp);
                setActiveMenuId(null);
              }}
              className="w-full p-2 text-left text-xs font-semibold text-gray-700 hover:text-primary hover:bg-primary/5 rounded-xl flex items-center gap-2.5 transition-all group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center transition-colors shrink-0">
                <Icon icon="lucide:eye" width="15" height="15" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block leading-tight font-medium text-gray-800 group-hover:text-primary">View & Verify Details</span>
                <span className="block text-[10px] text-gray-400 font-normal">Inspect documents & photos</span>
              </div>
            </button>

            {/* Quick Approve */}
            {activeProp.status !== "AVAILABLE" && (
              <button
                type="button"
                onClick={(e) => {
                  setActiveMenuId(null);
                  handleQuickVerify(activeProp, "AVAILABLE", e);
                }}
                className="w-full p-2 text-left text-xs font-semibold text-gray-700 hover:text-emerald-700 hover:bg-emerald-50/80 rounded-xl flex items-center gap-2.5 transition-all group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
                  <Icon icon="lucide:check-circle-2" width="15" height="15" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block leading-tight font-medium text-gray-800 group-hover:text-emerald-700">Approve Property</span>
                  <span className="block text-[10px] text-gray-400 group-hover:text-emerald-600/70 font-normal">Publish to live marketplace</span>
                </div>
              </button>
            )}

            {/* Reject */}
            {activeProp.status !== "REJECTED" && (
              <button
                type="button"
                onClick={() => {
                  setActiveMenuId(null);
                  handleOpenVerification(activeProp);
                }}
                className="w-full p-2 text-left text-xs font-semibold text-gray-700 hover:text-red-600 hover:bg-red-50/80 rounded-xl flex items-center gap-2.5 transition-all group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 group-hover:bg-red-100 group-hover:text-red-700 flex items-center justify-center transition-colors shrink-0">
                  <Icon icon="lucide:x-circle" width="15" height="15" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block leading-tight font-medium text-gray-800 group-hover:text-red-600">Reject Submission</span>
                  <span className="block text-[10px] text-gray-400 group-hover:text-red-500/70 font-normal">Send remarks to builder</span>
                </div>
              </button>
            )}

            {/* Filter by this Builder */}
            {builderId && (
              <>
                <div className="h-px bg-gray-100 my-0.5 mx-1" />

                <button
                  type="button"
                  onClick={() => {
                    setBuilderIdFilter(builderId);
                    setPage(1);
                    setActiveMenuId(null);
                  }}
                  className="w-full p-2 text-left text-xs font-medium text-gray-700 hover:text-amber-800 hover:bg-amber-50 rounded-xl flex items-center gap-2.5 transition-all group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 group-hover:text-amber-700 flex items-center justify-center transition-colors shrink-0">
                    <Icon icon="lucide:filter" width="14" height="14" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block leading-tight font-medium text-gray-800 group-hover:text-amber-800">Filter by {builderName}</span>
                    <span className="block text-[10px] text-gray-400 font-normal">Show only this builder&apos;s submissions</span>
                  </div>
                </button>
              </>
            )}

          </div>
        );
      })()}

      {/* Verification Detail Modal */}
      <SubmissionVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => {
          setIsVerificationModalOpen(false);
          setSelectedProperty(null);
        }}
        property={selectedProperty}
        onSuccess={() => {
          fetchSubmissions();
          fetchGlobalStats();
        }}
      />
    </div>
  );
}

export default function BuilderSubmissionsView() {
  return (
    <Suspense fallback={<SubmissionsSkeleton />}>
      <BuilderSubmissionsContent />
    </Suspense>
  );
}
