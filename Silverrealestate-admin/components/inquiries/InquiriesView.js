"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import InquiryTable from "./InquiryTable";
import InquiryDetailModal from "./InquiryDetailModal";
import DeleteInquiryModal from "./DeleteInquiryModal";
import TableSkeleton from "../users/TableSkeleton";
import Pagination from "../users/Pagination";

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-5 w-full">
      <div>
        <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-72 bg-gray-200 rounded animate-pulse mt-2" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="h-10 flex-1 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-10 w-40 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <TableSkeleton rows={5} />
      </div>
    </div>
  );
}

function InquiriesViewContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [inquiries, setInquiries] = useState([]);
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, resolved: 0 });
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Read initial query params
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 10);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL");

  // Modals state
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Sync URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (debouncedSearch.trim()) {
      params.set("search", debouncedSearch.trim());
    }
    if (statusFilter && statusFilter !== "ALL") {
      params.set("status", statusFilter);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [page, limit, debouncedSearch, statusFilter, pathname, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchInquiries = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/admin/inquiries?page=${page}&limit=${limit}`;
      if (debouncedSearch.trim()) {
        url += `&search=${encodeURIComponent(debouncedSearch.trim())}`;
      }
      if (statusFilter && statusFilter !== "ALL") {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }

      const res = await api.get(url);
      if (res?.success) {
        setInquiries(res.data?.inquiries || []);
        setPagination(res.data?.pagination || null);
        if (res.data?.stats) {
          setStats(res.data.stats);
        }
      } else {
        setInquiries([]);
      }
    } catch (err) {
      console.error("Error fetching inquiries:", err);
      toast.error(err.message || "Failed to load inquiries");
      setInquiries([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleStatusChange = async (inquiryId, newStatus) => {
    try {
      const res = await api.patch(`/admin/inquiries/${inquiryId}/status`, {
        status: newStatus,
      });
      if (res?.success) {
        toast.success("Status updated successfully");
        if (selectedInquiry && selectedInquiry.id === inquiryId) {
          setSelectedInquiry((prev) => ({ ...prev, status: newStatus }));
        }
        fetchInquiries();
      }
    } catch (err) {
      toast.error(err.message || "Failed to update status");
      throw err;
    }
  };

  const handleDelete = async (inquiryId) => {
    try {
      const res = await api.delete(`/admin/inquiries/${inquiryId}`);
      if (res?.success) {
        toast.success("Inquiry deleted successfully");
        fetchInquiries();
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete inquiry");
      throw err;
    }
  };

  const handleView = (inquiry) => {
    setSelectedInquiry(inquiry);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (inquiry) => {
    setSelectedInquiry(inquiry);
    setIsDeleteOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Direct Inquiries</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage contact form messages and inquiries submitted via the landing page.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchInquiries()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
        >
          <Icon icon="lucide:refresh-cw" className={`w-4 h-4 ${isLoading ? "animate-spin text-primary" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => {
            setStatusFilter("ALL");
            setPage(1);
          }}
          className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer ${
            statusFilter === "ALL"
              ? "border-primary ring-2 ring-primary/10 shadow-sm"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Inquiries</span>
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
              <Icon icon="lucide:inbox" className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total || 0}</div>
        </div>

        <div
          onClick={() => {
            setStatusFilter("NEW");
            setPage(1);
          }}
          className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer ${
            statusFilter === "NEW"
              ? "border-blue-500 ring-2 ring-blue-500/10 shadow-sm"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">New</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Icon icon="lucide:bell" className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.new || 0}</div>
        </div>

        <div
          onClick={() => {
            setStatusFilter("CONTACTED");
            setPage(1);
          }}
          className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer ${
            statusFilter === "CONTACTED"
              ? "border-amber-500 ring-2 ring-amber-500/10 shadow-sm"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Contacted</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Icon icon="lucide:phone-call" className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.contacted || 0}</div>
        </div>

        <div
          onClick={() => {
            setStatusFilter("RESOLVED");
            setPage(1);
          }}
          className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer ${
            statusFilter === "RESOLVED"
              ? "border-emerald-500 ring-2 ring-emerald-500/10 shadow-sm"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Resolved</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Icon icon="lucide:check-circle" className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.resolved || 0}</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-3 bg-white">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Icon
              icon="lucide:search"
              className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, topic, message..."
              className="w-full pl-10 pr-9 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs md:text-sm text-gray-900 focus:outline-none focus:border-primary focus:bg-white transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Icon icon="lucide:x" className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl w-full md:w-auto overflow-x-auto">
            {["ALL", "NEW", "CONTACTED", "RESOLVED"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === status
                    ? "bg-white text-gray-900 shadow-2xs font-bold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {status.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Table / Loading State */}
        {isLoading ? (
          <TableSkeleton rows={limit || 5} />
        ) : (
          <InquiryTable
            inquiries={inquiries}
            onView={handleView}
            onStatusChange={handleStatusChange}
            onDelete={handleOpenDelete}
          />
        )}

        {/* Pagination */}
        <Pagination
          pagination={pagination}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          entityName="inquiries"
        />
      </div>

      {/* Detail Modal */}
      <InquiryDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedInquiry(null);
        }}
        inquiry={selectedInquiry}
        onStatusChange={handleStatusChange}
      />

      {/* Delete Modal */}
      <DeleteInquiryModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedInquiry(null);
        }}
        inquiry={selectedInquiry}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default function InquiriesView() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <InquiriesViewContent />
    </Suspense>
  );
}
