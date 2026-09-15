"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import KycTable from "./KycTable";
import DocumentVerificationModal from "./DocumentVerificationModal";
import AdminDocumentUploadModal from "./AdminDocumentUploadModal";
import Pagination from "../users/Pagination";
import TableSkeleton from "../users/TableSkeleton";

function KycSkeleton() {
  return (
    <div className="flex flex-col gap-5 w-full h-[calc(100vh-120px)] min-h-[500px]">
      {/* Metric Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs animate-pulse flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <div className="h-3.5 w-20 bg-gray-200 rounded" />
              <div className="h-6 w-14 bg-gray-200 rounded" />
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Table Card Skeleton */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0 flex-1">
        <div className="p-4 md:p-5 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="h-10 w-full max-w-sm bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-10 w-44 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <TableSkeleton rows={6} />
      </div>
    </div>
  );
}

function KycViewContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // URL query params
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 20);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL");

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState("aadhaar");
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Sync URL query params
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

  const fetchKycOverview = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/admin/documents?page=${page}&limit=${limit}`;
      if (debouncedSearch.trim()) {
        url += `&search=${encodeURIComponent(debouncedSearch.trim())}`;
      }
      if (statusFilter && statusFilter !== "ALL") {
        url += `&verificationStatus=${statusFilter}`;
      }

      const res = await api.get(url);
      if (res?.success && res.data) {
        const userList = Array.isArray(res.data.users)
          ? res.data.users
          : Array.isArray(res.data)
          ? res.data
          : [];
        setUsers(userList);
        setPagination(res.data.pagination || null);
      } else {
        setUsers([]);
        setPagination(null);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch KYC document overview");
      setUsers([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchKycOverview();
  }, [fetchKycOverview]);

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  // Filter users by document status
  const filteredUsers = users;

  // Metrics computation
  const metrics = useMemo(() => {
    let pendingCount = 0;
    let verifiedCount = 0;
    let rejectedCount = 0;

    users.forEach((user) => {
      const aadhaar = user.documents?.aadhaar?.status || "NOT_UPLOADED";
      const pan = user.documents?.pan?.status || "NOT_UPLOADED";

      if (aadhaar === "PENDING" || pan === "PENDING") {
        pendingCount++;
      }
      if (aadhaar === "APPROVED" && pan === "APPROVED") {
        verifiedCount++;
      }
      if (aadhaar === "REJECTED" || pan === "REJECTED") {
        rejectedCount++;
      }
    });

    return {
      total: pagination?.total ?? users.length,
      pending: pendingCount,
      verified: verifiedCount,
      rejected: rejectedCount,
    };
  }, [users, pagination]);

  const handleOpenVerify = (user, docType = "aadhaar") => {
    setSelectedUser(user);
    setSelectedDocType(docType.toLowerCase());
    setIsVerifyModalOpen(true);
  };

  const handleOpenUpload = (user, docType = "AADHAAR") => {
    setSelectedUser(user);
    setSelectedDocType(docType.toUpperCase());
    setIsUploadModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-5 w-full h-[calc(100vh-120px)] min-h-[500px]">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Users */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 block mb-1">Total Users</span>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.total}</div>
            <span className="text-[11px] text-gray-400 mt-0.5 block">Registered in system</span>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
            <Icon icon="lucide:users" width="20" height="20" />
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-700 block mb-1">Pending Verification</span>
            <div className="text-xl sm:text-2xl font-bold text-amber-600">{metrics.pending}</div>
            <span className="text-[11px] text-gray-400 mt-0.5 block">Requires admin action</span>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
            <Icon icon="lucide:clock" width="20" height="20" />
          </div>
        </div>

        {/* Fully Verified */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-700 block mb-1">Fully Verified</span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600">{metrics.verified}</div>
            <span className="text-[11px] text-gray-400 mt-0.5 block">Both docs approved</span>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
            <Icon icon="lucide:shield-check" width="20" height="20" />
          </div>
        </div>

        {/* Action Needed */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-700 block mb-1">Rejected Documents</span>
            <div className="text-xl sm:text-2xl font-bold text-rose-600">{metrics.rejected}</div>
            <span className="text-[11px] text-gray-400 mt-0.5 block">Re-upload prompted</span>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 border border-rose-100 shrink-0">
            <Icon icon="lucide:alert-circle" width="20" height="20" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0 flex-1">
        {/* Toolbar with Search + Status Dropdown */}
        <div className="p-3 md:p-5 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Icon icon="lucide:search" width="18" height="18" />
            </div>
            <input
              type="text"
              placeholder="Search user by name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-xs sm:text-sm bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon icon="lucide:x" width="16" height="16" />
              </button>
            )}
          </div>

          {/* Filter Dropdown + Refresh */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-2">
              <label htmlFor="statusFilter" className="text-xs font-semibold text-gray-500 whitespace-nowrap hidden md:inline">
                Status:
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-white text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
              >
                <option value="ALL">All Documents</option>
                <option value="PENDING_VERIFICATION">Pending Verification</option>
                <option value="VERIFIED">Approved / Verified</option>
                <option value="UNVERIFIED">Unverified (In Progress)</option>
                <option value="NOT_UPLOADED">Not Uploaded</option>
              </select>
            </div>

            <button
              type="button"
              onClick={fetchKycOverview}
              title="Refresh list"
              className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors shrink-0 flex items-center gap-1.5 text-xs font-medium"
            >
              <Icon icon="lucide:refresh-cw" width="16" height="16" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* KYC Table Content */}
        <div className="min-h-0 flex-1 flex flex-col">
          {isLoading ? (
            <TableSkeleton rows={limit > 10 ? 8 : 5} />
          ) : (
            <KycTable
              users={filteredUsers}
              onVerify={handleOpenVerify}
              onUpload={handleOpenUpload}
            />
          )}
        </div>

        {/* Pagination Controls */}
        {pagination && (
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={handleLimitChange}
          />
        )}
      </div>

      {/* Document Verification Modal */}
      <DocumentVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => {
          setIsVerifyModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        initialDocType={selectedDocType}
        onSuccess={fetchKycOverview}
        onOpenUploadModal={handleOpenUpload}
      />

      {/* Admin Document Upload on Behalf Modal */}
      <AdminDocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        initialDocType={selectedDocType}
        onSuccess={fetchKycOverview}
      />
    </div>
  );
}

export default function KycView() {
  return (
    <Suspense fallback={<KycSkeleton />}>
      <KycViewContent />
    </Suspense>
  );
}
