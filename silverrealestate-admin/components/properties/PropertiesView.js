"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "../../lib/api";
import PropertyTable from "./PropertyTable";
import DeletePropertyModal from "./DeletePropertyModal";
import AddPriceHistoryModal from "./AddPriceHistoryModal";
import PropertyInvestorsDrawer from "./PropertyInvestorsDrawer";
import Pagination from "../users/Pagination";
import TableSkeleton from "../users/TableSkeleton";

function PaginationSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between py-4 px-4 md:px-6 border-t border-gray-100 gap-4">
      <div className="flex items-center gap-4">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-7 w-16 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-9 w-9 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

function PropertiesSkeleton() {
  return (
    <div className="flex flex-col gap-5 w-full">
      <div>
        <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-80 bg-gray-200 rounded animate-pulse mt-2" />
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-3 md:p-5 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="h-[42px] flex-1 max-w-sm bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-[42px] w-[130px] bg-gray-200 rounded-xl animate-pulse shrink-0" />
        </div>
        <TableSkeleton rows={5} />
        <PaginationSkeleton />
      </div>
    </div>
  );
}

function PropertiesViewContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // URL query sync
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 10);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "ALL");

  // Mobile filter dropdown toggle
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddPriceModalOpen, setIsAddPriceModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedPropertyForInvestors, setSelectedPropertyForInvestors] = useState(null);


  const activeFiltersCount = (statusFilter !== "ALL" ? 1 : 0) + (categoryFilter !== "ALL" ? 1 : 0);

  // Sync to URL
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (debouncedSearch.trim()) {
      params.set("search", debouncedSearch.trim());
    }
    if (statusFilter !== "ALL") {
      params.set("status", statusFilter);
    }
    if (categoryFilter !== "ALL") {
      params.set("category", categoryFilter);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [page, limit, debouncedSearch, statusFilter, categoryFilter, pathname, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/admin/property?page=${page}&limit=${limit}`;
      if (debouncedSearch.trim()) {
        url += `&search=${encodeURIComponent(debouncedSearch.trim())}`;
      }
      if (statusFilter !== "ALL") {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }
      if (categoryFilter !== "ALL") {
        url += `&category=${encodeURIComponent(categoryFilter)}`;
      }

      const res = await api.get(url);
      if (res?.success && res.data) {
        setProperties(res.data.properties || []);
        setPagination(res.data.pagination || null);
      } else {
        toast.error(res?.message || "Failed to fetch properties");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred while fetching properties");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleView = (prop) => {
    router.push(`/property/${prop.id}`);
  };

  const handleEdit = (prop) => {
    router.push(`/property/edit/${prop.id}`);
  };

  const handleDelete = (prop) => {
    setSelectedProperty(prop);
    setIsDeleteModalOpen(true);
  };

  const handleAddPriceHistory = (prop) => {
    setSelectedProperty(prop);
    setIsAddPriceModalOpen(true);
  };

  const clearFilters = () => {
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-5 w-full h-[calc(100vh-120px)] min-h-[500px]">
      {/* Header */}
 
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0 flex-1">
        {/* Toolbar */}
        <div className="p-3 md:p-5 border-b border-gray-100 flex flex-col gap-3">
          {/* Main Top Row: Search + Mobile Filter Button + Desktop Filters + Add Property */}
          <div className="flex items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0 lg:max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Icon icon="lucide:search" className="text-gray-400" width="18" height="18" />
              </div>
              <input
                type="text"
                placeholder="Search by title or location"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-xs sm:text-sm bg-white"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <Icon icon="lucide:x" width="15" height="15" />
                </button>
              )}
            </div>

            {/* Desktop Filters (Category + Status inline) */}
            <div className="hidden md:flex items-center gap-2.5">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="INDUSTRIAL">Industrial</option>
                <option value="LAND">Land</option>
                <option value="OTHERS">Others</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="SOLD">Sold</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="COMING_SOON">Coming Soon</option>
              </select>

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-gray-500 hover:text-red-600 font-medium px-2 py-1 transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Mobile Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowMobileFilters((prev) => !prev)}
              className={`md:hidden h-[42px] px-3 rounded-xl border flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                activeFiltersCount > 0 || showMobileFilters
                  ? "bg-primary/10 border-primary text-primary font-semibold"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
              aria-label="Toggle filters"
            >
              <Icon icon="lucide:sliders-horizontal" width="17" height="17" />
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Add Property Button */}
            <Link
              href="/add-property"
              className="bg-primary text-white hover:bg-primary/90 h-[42px] px-3.5 sm:px-4 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap shrink-0 ml-auto"
            >
              <Icon icon="lucide:plus" width="16" height="16" />
              <span>Add Property</span>
            </Link>
          </div>

          {/* Collapsible Mobile Filter Panel */}
          {showMobileFilters && (
            <div className="md:hidden pt-3 border-t border-gray-100 flex flex-col gap-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold text-gray-600">Filters</span>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-red-600 font-medium hover:underline cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Mobile Category select */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-gray-500">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white text-gray-800 outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="INDUSTRIAL">Industrial</option>
                    <option value="LAND">Land</option>
                    <option value="OTHERS">Others</option>
                  </select>
                </div>

                {/* Mobile Status select */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-gray-500">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white text-gray-800 outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="ALL">All Status</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="SOLD">Sold</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="COMING_SOON">Coming Soon</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table Content */}
        <div className="min-h-0 flex-1">
          {isLoading ? (
            <TableSkeleton rows={limit > 10 ? 8 : 5} />
          ) : (
            <PropertyTable
              properties={properties}
              onView={handleView}
              onEdit={handleEdit}
              onAddPriceHistory={handleAddPriceHistory}
              onDelete={handleDelete}
              onOpenInvestors={(prop) => setSelectedPropertyForInvestors(prop)}
            />
          )}
        </div>

        {/* Pagination */}
        {isLoading ? (
          <PaginationSkeleton />
        ) : (
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={handleLimitChange}
            entityName="properties"
          />
        )}
      </div>

      {/* Property Investors Drawer (Verified Buyers & Bookings) */}
      <PropertyInvestorsDrawer
        isOpen={!!selectedPropertyForInvestors}
        onClose={() => setSelectedPropertyForInvestors(null)}
        property={selectedPropertyForInvestors}
      />

      {/* Add Price History Modal */}
      <AddPriceHistoryModal
        isOpen={isAddPriceModalOpen}
        onClose={() => setIsAddPriceModalOpen(false)}
        property={selectedProperty}
        onSuccess={fetchProperties}
      />

      {/* Delete Confirmation Modal */}
      <DeletePropertyModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        property={selectedProperty}
        onSuccess={fetchProperties}
      />
    </div>
  );
}

export default function PropertiesView() {
  return (
    <Suspense fallback={<PropertiesSkeleton />}>
      <PropertiesViewContent />
    </Suspense>
  );
}
