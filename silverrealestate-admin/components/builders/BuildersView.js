"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import BuilderTable from "./BuilderTable";
import BuilderModal from "./BuilderModal";
import BuilderDetailModal from "./BuilderDetailModal";
import BuilderEditModal from "./BuilderEditModal";
import DeleteBuilderModal from "./DeleteBuilderModal";
import Pagination from "../users/Pagination";
import TableSkeleton from "../users/TableSkeleton";

function BuildersSkeleton() {
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

function BuildersViewContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [builders, setBuilders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Live KPI stats for top cards
  const [stats, setStats] = useState({
    totalBuilders: 0,
    totalProperties: 0,
    pendingSubmissions: 0,
    isLoading: true,
  });

  // URL query sync
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 20);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBuilderIdForDetail, setSelectedBuilderIdForDetail] = useState(null);
  const [selectedBuilderForEdit, setSelectedBuilderForEdit] = useState(null);
  const [selectedBuilderForDelete, setSelectedBuilderForDelete] = useState(null);
  const [showStats, setShowStats] = useState(true);

  // Load showStats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("builders_show_stats");
    if (saved !== null) {
      setShowStats(saved === "true");
    }
  }, []);

  const handleToggleStats = () => {
    setShowStats((prev) => {
      const next = !prev;
      localStorage.setItem("builders_show_stats", String(next));
      return next;
    });
  };

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (debouncedSearch.trim()) {
      params.set("search", debouncedSearch.trim());
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [page, limit, debouncedSearch, pathname, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch KPI Stats
  const fetchStats = useCallback(async () => {
    try {
      const [buildersRes, propertiesRes, pendingRes] = await Promise.allSettled([
        api.get("/admin/builders?page=1&limit=1"),
        api.get("/admin/property/builder-submissions?page=1&limit=1"),
        api.get("/admin/property/builder-submissions?page=1&limit=1&status=PENDING_APPROVAL"),
      ]);

      let buildersCount = 0;
      if (buildersRes.status === "fulfilled" && buildersRes.value?.success && buildersRes.value.data) {
        buildersCount =
          buildersRes.value.data.pagination?.total ??
          (Array.isArray(buildersRes.value.data.users || buildersRes.value.data.builders)
            ? (buildersRes.value.data.users || buildersRes.value.data.builders).length
            : 0);
      }

      let propertiesCount = 0;
      if (propertiesRes.status === "fulfilled" && propertiesRes.value?.success && propertiesRes.value.data) {
        propertiesCount =
          propertiesRes.value.data.pagination?.total ??
          (Array.isArray(propertiesRes.value.data.properties) ? propertiesRes.value.data.properties.length : 0);
      }

      let pendingCount = 0;
      if (pendingRes.status === "fulfilled" && pendingRes.value?.success && pendingRes.value.data) {
        pendingCount =
          pendingRes.value.data.pagination?.total ??
          (Array.isArray(pendingRes.value.data.properties) ? pendingRes.value.data.properties.length : 0);
      }

      setStats({
        totalBuilders: buildersCount,
        totalProperties: propertiesCount,
        pendingSubmissions: pendingCount,
        isLoading: false,
      });
    } catch {
      setStats((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Fetch builders from GET /admin/builders
  const fetchBuilders = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/admin/builders?page=${page}&limit=${limit}`;
      if (debouncedSearch.trim()) {
        url += `&search=${encodeURIComponent(debouncedSearch.trim())}`;
      }

      const res = await api.get(url);
      if (res?.success && res.data) {
        const list = Array.isArray(res.data.users)
          ? res.data.users
          : Array.isArray(res.data.builders)
          ? res.data.builders
          : Array.isArray(res.data)
          ? res.data
          : [];
        setBuilders(list);
        setPagination(res.data.pagination || null);
      } else {
        setBuilders([]);
        setPagination(null);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch builders list");
      setBuilders([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchBuilders();
  }, [fetchBuilders]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleViewSubmissions = (builder) => {
    if (builder?.id) {
      router.push(`/property-submissions?builderId=${encodeURIComponent(builder.id)}&status=ALL`);
    } else {
      router.push("/property-submissions?status=ALL");
    }
  };

  const totalBuilders = pagination?.total ?? (stats.totalBuilders || builders.length);

  return (
    <div className="flex flex-col gap-5 w-full h-[calc(100vh-120px)] min-h-[500px]">
      {/* Metric Cards Ribbon */}
      {showStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Builders */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 block mb-1">Total Builders</span>
              <div className="text-2xl font-bold text-gray-900">
                {stats.isLoading ? (
                  <span className="text-gray-300 text-base">...</span>
                ) : (
                  totalBuilders
                )}
              </div>
              <span className="text-[11px] text-gray-400 mt-0.5 block">Registered builder partners</span>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100 shrink-0 shadow-2xs">
              <Icon icon="lucide:hard-hat" width="22" height="22" />
            </div>
          </div>

          {/* Builder Properties Submitted */}
          <div
            onClick={() => router.push("/property-submissions?status=ALL")}
            className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors group"
          >
            <div>
              <span className="text-xs font-semibold text-gray-500 block mb-1">Builder Properties</span>
              <div className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                {stats.isLoading ? (
                  <span className="text-gray-300 text-base">...</span>
                ) : (
                  stats.totalProperties
                )}
              </div>
              <span className="text-[11px] text-gray-400 group-hover:text-primary mt-0.5 flex items-center gap-1 transition-colors">
                <span>View all submissions</span>
                <Icon icon="lucide:arrow-right" width="12" height="12" />
              </span>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
              <Icon icon="lucide:building-2" width="22" height="22" />
            </div>
          </div>

          {/* Submissions Pending Verification */}
          <div
            onClick={() => router.push("/property-submissions?status=PENDING_APPROVAL")}
            className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors group"
          >
            <div>
              <span className="text-xs font-semibold text-amber-700 block mb-1">Pending Approval</span>
              <div className="text-2xl font-bold text-amber-600">
                {stats.isLoading ? (
                  <span className="text-gray-300 text-base">...</span>
                ) : (
                  stats.pendingSubmissions
                )}
              </div>
              <span className="text-[11px] text-gray-400 group-hover:text-amber-700 mt-0.5 flex items-center gap-1 transition-colors">
                <span>Verification queue</span>
                <Icon icon="lucide:arrow-right" width="12" height="12" />
              </span>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-200 shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Icon icon="lucide:clock" width="22" height="22" />
            </div>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0 flex-1">
        {/* Toolbar */}
        <div className="p-3 md:p-5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Icon icon="lucide:search" width="18" height="18" />
            </div>
            <input
              type="text"
              placeholder="Search builders by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-xs sm:text-sm bg-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <Icon icon="lucide:x" width="16" height="16" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={handleToggleStats}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
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
              onClick={() => {
                fetchBuilders();
                fetchStats();
              }}
              title="Refresh list"
              className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors shrink-0 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            >
              <Icon icon="lucide:refresh-cw" width="16" height="16" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors shadow-2xs shrink-0 cursor-pointer"
            >
              <Icon icon="lucide:plus" width="16" height="16" />
              <span>Create Builder</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="min-h-0 flex-1 flex flex-col">
          {isLoading ? (
            <TableSkeleton rows={limit > 10 ? 8 : 5} />
          ) : (
            <BuilderTable
              builders={builders}
              onView={(b) => setSelectedBuilderIdForDetail(b.id)}
              onEdit={(b) => setSelectedBuilderForEdit(b)}
              onDelete={(b) => setSelectedBuilderForDelete(b)}
              onViewSubmissions={handleViewSubmissions}
            />
          )}
        </div>

        {/* Pagination */}
        {pagination && (
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={handleLimitChange}
            entityName="builders"
          />
        )}
      </div>

      {/* Create Builder Modal */}
      <BuilderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchBuilders();
          fetchStats();
        }}
      />

      {/* Builder Details & Uploaded Properties Modal */}
      <BuilderDetailModal
        isOpen={Boolean(selectedBuilderIdForDetail)}
        onClose={() => setSelectedBuilderIdForDetail(null)}
        builderId={selectedBuilderIdForDetail}
        onEdit={(b) => setSelectedBuilderForEdit(b)}
        onDelete={(b) => setSelectedBuilderForDelete(b)}
      />

      {/* Edit Builder Modal */}
      <BuilderEditModal
        isOpen={Boolean(selectedBuilderForEdit)}
        onClose={() => setSelectedBuilderForEdit(null)}
        builder={selectedBuilderForEdit}
        onSuccess={() => {
          fetchBuilders();
          fetchStats();
        }}
      />

      {/* Delete Builder Modal */}
      <DeleteBuilderModal
        isOpen={Boolean(selectedBuilderForDelete)}
        onClose={() => setSelectedBuilderForDelete(null)}
        builder={selectedBuilderForDelete}
        onSuccess={() => {
          fetchBuilders();
          fetchStats();
        }}
      />
    </div>
  );
}

export default function BuildersView() {
  return (
    <Suspense fallback={<BuildersSkeleton />}>
      <BuildersViewContent />
    </Suspense>
  );
}
