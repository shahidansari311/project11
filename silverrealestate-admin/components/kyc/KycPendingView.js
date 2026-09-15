"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import KycTabs from "./KycTabs";
import DocumentVerificationModal from "./DocumentVerificationModal";
import AdminDocumentUploadModal from "./AdminDocumentUploadModal";
import Pagination from "../users/Pagination";
import TableSkeleton from "../users/TableSkeleton";

function UserAvatar({ user }) {
  const [imgFailed, setImgFailed] = useState(false);
  const imgUrl = user?.profileImage || user?.profileUrl || user?.image || user?.avatar;

  if (imgUrl && !imgFailed) {
    return (
      <img
        src={imgUrl}
        alt={user?.fullName || "User"}
        onError={() => setImgFailed(true)}
        className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-200"
      />
    );
  }

  return (
    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
      {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
    </div>
  );
}

function KycPendingContent() {
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

  // Modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState("aadhaar");
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("kyc_show_stats");
    if (saved !== null) {
      setShowStats(saved === "true");
    }
  }, []);

  const handleToggleStats = () => {
    setShowStats((prev) => {
      const next = !prev;
      localStorage.setItem("kyc_show_stats", String(next));
      return next;
    });
  };

  // Sync URL query params
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

  // Fetch pending verification documents API (verificationStatus=PENDING_VERIFICATION)
  const fetchPendingQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/admin/documents?verificationStatus=PENDING_VERIFICATION&page=${page}&limit=${limit}`;
      if (debouncedSearch.trim()) {
        url += `&search=${encodeURIComponent(debouncedSearch.trim())}`;
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
      toast.error(error.message || "Failed to fetch pending verification queue");
      setUsers([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchPendingQueue();
  }, [fetchPendingQueue]);

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

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

  const formatDocStatus = (s) => {
    if (!s || s === "NOT_UPLOADED") return "Not Uploaded";
    switch (s.toUpperCase()) {
      case "APPROVED":
      case "VERIFIED":
        return "Approved";
      case "PENDING":
      case "PENDING_VERIFICATION":
        return "Pending";
      case "UNDER_REVIEW":
        return "Under Review";
      case "REJECTED":
        return "Rejected";
      default:
        return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  const getDocStatusBadgeClass = (s) => {
    switch (s?.toUpperCase()) {
      case "APPROVED":
      case "VERIFIED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "PENDING":
      case "PENDING_VERIFICATION":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "UNDER_REVIEW":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "REJECTED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full h-[calc(100vh-120px)] min-h-[500px]">
      {/* Top Tab Bar with Equal Spacing & Stats Toggle */}
      <KycTabs showStats={showStats} onToggleStats={handleToggleStats} />

      {/* Metric Highlight (Collapsible) */}
      {showStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 animate-in fade-in duration-150">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-2xs flex items-center justify-between bg-gradient-to-r from-amber-50/50 to-white">
            <div>
              <span className="text-xs font-semibold text-amber-800 block mb-1">Pending Approvals</span>
              <div className="text-2xl font-bold text-amber-600">{pagination?.total ?? users.length}</div>
              <span className="text-[11px] text-gray-500 mt-0.5 block">Users awaiting document verification</span>
            </div>
            <div className="w-12 h-12 bg-amber-100/80 rounded-2xl flex items-center justify-center text-amber-700 border border-amber-200 shrink-0">
              <Icon icon="lucide:clock" width="22" height="22" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-700 block mb-1">Required Documents</span>
              <div className="text-lg font-bold text-gray-900">Aadhaar &amp; PAN Card</div>
              <span className="text-[11px] text-gray-500 mt-0.5 block">Review uploaded front &amp; back copies</span>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
              <Icon icon="lucide:file-search" width="20" height="20" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 block mb-1">Admin Action</span>
              <div className="text-lg font-bold text-emerald-700">Approve or Reject</div>
              <span className="text-[11px] text-gray-500 mt-0.5 block">Submit decision with admin remark</span>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
              <Icon icon="lucide:shield-check" width="20" height="20" />
            </div>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0 flex-1 w-full">
        {/* Toolbar */}
        <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <div className="relative flex-1 min-w-0 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Icon icon="lucide:search" width="18" height="18" />
            </div>
            <input
              type="text"
              placeholder="Search pending users by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2 sm:py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-xs sm:text-sm bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <Icon icon="lucide:x" width="16" height="16" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={fetchPendingQueue}
            title="Refresh queue"
            className="p-2 sm:px-3 sm:py-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors shrink-0 flex items-center gap-1.5 text-xs font-medium bg-white"
          >
            <Icon icon="lucide:refresh-cw" width="16" height="16" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto overflow-y-auto h-full flex-1 custom-scrollbar w-full">
          {isLoading ? (
            <TableSkeleton rows={limit > 10 ? 8 : 5} />
          ) : users.length === 0 ? (
            <div className="py-20 px-4 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-3 text-emerald-600">
                <Icon icon="lucide:check-circle-2" width="32" height="32" />
              </div>
              <h3 className="type-h5 text-gray-900 font-semibold mb-1">Queue is Clear!</h3>
              <p className="type-body-sm text-gray-500 max-w-sm mx-auto">
                There are no pending documents waiting for admin verification right now.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm text-left min-w-[720px]">
              <thead className="border-b border-gray-200 bg-gray-50 sticky top-0 z-10 shadow-2xs">
                <tr className="bg-gray-50">
                  <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50">User Details</th>
                  <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50 text-center">Aadhaar Document</th>
                  <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50 text-center">PAN Document</th>
                  <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50">Uploaded Date</th>
                  <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50 text-right">Verification</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const aadhaar = user.documents?.aadhaar;
                  const pan = user.documents?.pan;

                  const hasAadhaar = aadhaar?.status && aadhaar.status !== "NOT_UPLOADED";
                  const hasPan = pan?.status && pan.status !== "NOT_UPLOADED";

                  return (
                    <tr
                      key={user.id}
                      onClick={() => handleOpenVerify(user, hasAadhaar ? "aadhaar" : "pan")}
                      className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors cursor-pointer group"
                    >
                      {/* User Info */}
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} />
                          <div className="min-w-0">
                            <Link
                              href={`/users/${user.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold text-gray-900 group-hover:text-primary transition-colors type-body-sm block truncate max-w-xs"
                            >
                              {user.fullName || "Unnamed User"}
                            </Link>
                            <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5 truncate max-w-xs">
                              {user.phone && <span>{user.phone}</span>}
                              {user.email && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className="truncate">{user.email}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Aadhaar Badge */}
                      <td className="px-4 md:px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {hasAadhaar ? (
                          <button
                            type="button"
                            onClick={() => handleOpenVerify(user, "aadhaar")}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border transition-all hover:scale-105 cursor-pointer ${getDocStatusBadgeClass(
                              aadhaar.status
                            )}`}
                          >
                            <Icon icon="lucide:id-card" width="13" height="13" />
                            <span>{formatDocStatus(aadhaar.status)}</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                            <Icon icon="lucide:file-x" width="13" height="13" className="text-gray-400" />
                            <span>Not Uploaded</span>
                          </span>
                        )}
                      </td>

                      {/* PAN Badge */}
                      <td className="px-4 md:px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {hasPan ? (
                          <button
                            type="button"
                            onClick={() => handleOpenVerify(user, "pan")}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border transition-all hover:scale-105 cursor-pointer ${getDocStatusBadgeClass(
                              pan.status
                            )}`}
                          >
                            <Icon icon="lucide:credit-card" width="13" height="13" />
                            <span>{formatDocStatus(pan.status)}</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                            <Icon icon="lucide:file-x" width="13" height="13" className="text-gray-400" />
                            <span>Not Uploaded</span>
                          </span>
                        )}
                      </td>

                      {/* Upload Date */}
                      <td className="px-4 md:px-6 py-4 text-xs text-gray-600 whitespace-nowrap">
                        {formatDate(aadhaar?.createdAt || pan?.createdAt || user.createdAt)}
                      </td>

                      {/* Verify Action Button */}
                      <td className="px-4 md:px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenVerify(user, hasAadhaar ? "aadhaar" : "pan")}
                          className="px-3.5 py-1.5 bg-primary text-white hover:bg-primary/90 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs ml-auto whitespace-nowrap"
                        >
                          <Icon icon="lucide:shield-check" width="15" height="15" />
                          <span>Review & Verify</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination && (
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={handleLimitChange}
          />
        )}
      </div>

      {/* Verification Modal */}
      <DocumentVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => {
          setIsVerifyModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        initialDocType={selectedDocType}
        onSuccess={fetchPendingQueue}
        onOpenUploadModal={handleOpenUpload}
      />

      {/* Admin Upload Modal */}
      <AdminDocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        initialDocType={selectedDocType}
        onSuccess={fetchPendingQueue}
      />
    </div>
  );
}

export default function KycPendingView() {
  return (
    <Suspense fallback={<TableSkeleton rows={6} />}>
      <KycPendingContent />
    </Suspense>
  );
}
