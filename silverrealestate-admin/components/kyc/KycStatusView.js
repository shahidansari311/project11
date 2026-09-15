"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import KycTabs from "./KycTabs";
import AdminDocumentUploadModal from "./AdminDocumentUploadModal";
import DocumentVerificationModal from "./DocumentVerificationModal";
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

function KycStatusContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // URL Query Params
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 20);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");
  const [verificationStatus, setVerificationStatus] = useState(searchParams.get("status") || "ALL");

  // Modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState("AADHAAR");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [showStats, setShowStats] = useState(true);

  // Load showStats from localStorage
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
    if (verificationStatus !== "ALL") {
      params.set("status", verificationStatus);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [page, limit, debouncedSearch, verificationStatus, pathname, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchDocumentStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/admin/documents?page=${page}&limit=${limit}`;
      if (debouncedSearch.trim()) {
        url += `&search=${encodeURIComponent(debouncedSearch.trim())}`;
      }
      if (verificationStatus && verificationStatus !== "ALL") {
        url += `&verificationStatus=${verificationStatus}`;
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
      toast.error(error.message || "Failed to fetch document status overview");
      setUsers([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, verificationStatus]);

  useEffect(() => {
    fetchDocumentStatus();
  }, [fetchDocumentStatus]);

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleOpenUpload = (user, docType = "AADHAAR") => {
    setSelectedUser(user);
    setSelectedDocType(docType.toUpperCase());
    setIsUploadModalOpen(true);
  };

  const handleOpenVerify = (user, docType = "aadhaar") => {
    setSelectedUser(user);
    setSelectedDocType(docType.toLowerCase());
    setIsVerifyModalOpen(true);
  };

  const filteredUsers = users;

  const metrics = useMemo(() => {
    let bothCount = 0;
    let noneCount = 0;
    let partialCount = 0;

    users.forEach((user) => {
      const aadhaarUploaded = user.documents?.aadhaar?.status && user.documents.aadhaar.status !== "NOT_UPLOADED";
      const panUploaded = user.documents?.pan?.status && user.documents.pan.status !== "NOT_UPLOADED";

      if (aadhaarUploaded && panUploaded) bothCount++;
      else if (!aadhaarUploaded && !panUploaded) noneCount++;
      else partialCount++;
    });

    return {
      total: pagination?.total ?? users.length,
      both: bothCount,
      none: noneCount,
      partial: partialCount,
    };
  }, [users, pagination]);

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

  const renderDocStatusBadge = (doc, docType, user) => {
    const isUploaded = doc?.status && doc.status !== "NOT_UPLOADED";

    if (isUploaded) {
      return (
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => handleOpenVerify(user, docType)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border transition-all hover:scale-105 cursor-pointer ${getDocStatusBadgeClass(
              doc.status
            )}`}
            title="Click to view & verify document"
          >
            <Icon
              icon={
                doc.status?.toUpperCase() === "APPROVED"
                  ? "lucide:check-circle-2"
                  : doc.status?.toUpperCase() === "REJECTED"
                  ? "lucide:x-circle"
                  : "lucide:clock"
              }
              width="13"
              height="13"
            />
            <span>{formatDocStatus(doc.status)}</span>
            <Icon icon="lucide:eye" width="12" height="12" className="opacity-70 ml-0.5" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-600 border border-gray-200">
          <Icon icon="lucide:file-x" width="13" height="13" className="text-gray-400" />
          <span>Not Uploaded</span>
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 w-full h-[calc(100vh-120px)] min-h-[500px]">
      {/* Top Tab Bar with Equal Spacing & Stats Toggle */}
      <KycTabs showStats={showStats} onToggleStats={handleToggleStats} />

      {/* Metric Cards (Collapsible) */}
      {showStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in duration-150">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 block mb-1">Total Users</span>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.total}</div>
              <span className="text-[11px] text-gray-400 mt-0.5 block">In system</span>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
              <Icon icon="lucide:users" width="20" height="20" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 block mb-1">Both Uploaded</span>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600">{metrics.both}</div>
              <span className="text-[11px] text-gray-400 mt-0.5 block">Aadhaar & PAN</span>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
              <Icon icon="lucide:check-circle-2" width="20" height="20" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-700 block mb-1">Partially Uploaded</span>
              <div className="text-xl sm:text-2xl font-bold text-amber-600">{metrics.partial}</div>
              <span className="text-[11px] text-gray-400 mt-0.5 block">1 of 2 uploaded</span>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
              <Icon icon="lucide:clock" width="20" height="20" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-700 block mb-1">Not Uploaded</span>
              <div className="text-xl sm:text-2xl font-bold text-rose-600">{metrics.none}</div>
              <span className="text-[11px] text-gray-400 mt-0.5 block">No docs uploaded</span>
            </div>
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 border border-rose-100 shrink-0">
              <Icon icon="lucide:file-x" width="20" height="20" />
            </div>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0 flex-1 w-full">
        {/* Toolbar */}
        <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <div className="relative w-full sm:max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Icon icon="lucide:search" width="18" height="18" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email or phone..."
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

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <select
              value={verificationStatus}
              onChange={(e) => {
                setVerificationStatus(e.target.value);
                setPage(1);
              }}
              className="flex-1 sm:flex-initial px-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-white text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="ALL">All Document Statuses</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="VERIFIED">Verified (Both Approved)</option>
              <option value="UNVERIFIED">Unverified (In Progress)</option>
              <option value="NOT_UPLOADED">Not Uploaded (0 Documents)</option>
            </select>

            <button
              type="button"
              onClick={fetchDocumentStatus}
              title="Refresh list"
              className="p-2 sm:px-3 sm:py-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors shrink-0 flex items-center gap-1.5 text-xs font-medium bg-white"
            >
              <Icon icon="lucide:refresh-cw" width="16" height="16" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto overflow-y-auto h-full flex-1 custom-scrollbar w-full">
          {isLoading ? (
            <TableSkeleton rows={limit > 10 ? 8 : 5} />
          ) : filteredUsers.length === 0 ? (
            <div className="py-20 px-4 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-400">
                <Icon icon="lucide:shield-off" width="32" height="32" />
              </div>
              <h3 className="type-h5 text-gray-900 font-semibold mb-1">No Records Found</h3>
              <p className="type-body-sm text-gray-500 max-w-sm mx-auto">
                No users matched your document filter or search keyword.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm text-left min-w-[720px]">
              <thead className="border-b border-gray-200 bg-gray-50 sticky top-0 z-10 shadow-2xs">
                <tr className="bg-gray-50">
                  <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50">User Details</th>
                  <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50 text-center">Aadhaar Status</th>
                  <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50 text-center">PAN Status</th>
                  <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50 text-right">Upload on Behalf</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const aadhaar = user.documents?.aadhaar;
                  const pan = user.documents?.pan;

                  return (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} />
                          <div className="min-w-0">
                            <Link
                              href={`/users/${user.id}`}
                              className="font-semibold text-gray-900 hover:text-primary transition-colors type-body-sm block truncate max-w-xs"
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

                      <td className="px-4 md:px-6 py-4 text-center">
                        {renderDocStatusBadge(aadhaar, "aadhaar", user)}
                      </td>

                      <td className="px-4 md:px-6 py-4 text-center">
                        {renderDocStatusBadge(pan, "pan", user)}
                      </td>

                      <td className="px-4 md:px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenUpload(user, "AADHAAR")}
                            className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs whitespace-nowrap"
                          >
                            <Icon icon="lucide:id-card" width="13" height="13" />
                            <span>Upload Aadhaar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenUpload(user, "PAN")}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-primary text-gray-700 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs whitespace-nowrap"
                          >
                            <Icon icon="lucide:credit-card" width="13" height="13" />
                            <span>Upload PAN</span>
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
        {pagination && (
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={handleLimitChange}
          />
        )}
      </div>

      {/* Modals */}
      <AdminDocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        initialDocType={selectedDocType}
        onSuccess={fetchDocumentStatus}
      />

      <DocumentVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => {
          setIsVerifyModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        initialDocType={selectedDocType}
        onSuccess={fetchDocumentStatus}
        onOpenUploadModal={handleOpenUpload}
      />
    </div>
  );
}

export default function KycStatusView() {
  return (
    <Suspense fallback={<TableSkeleton rows={6} />}>
      <KycStatusContent />
    </Suspense>
  );
}
