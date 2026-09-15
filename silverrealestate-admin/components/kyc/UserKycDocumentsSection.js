"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import api from "../../lib/api";
import DocumentVerificationModal from "./DocumentVerificationModal";
import AdminDocumentUploadModal from "./AdminDocumentUploadModal";

function formatDocStatus(s) {
  if (!s || s === "NOT_UPLOADED") return "Not Uploaded";
  switch (s.toUpperCase()) {
    case "APPROVED":
    case "VERIFIED":
      return "Approved";
    case "PENDING":
    case "PENDING_VERIFICATION":
      return "Pending Verification";
    case "UNDER_REVIEW":
      return "Under Review";
    case "REJECTED":
      return "Rejected";
    default:
      return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

function getDocStatusBadge(s) {
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
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function UserKycDocumentsSection({ user, initialDocs, onRefresh }) {
  const [userDocs, setUserDocs] = useState(initialDocs || user?.documents || null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Sync initialDocs when provided by parent
  useEffect(() => {
    if (initialDocs !== undefined && initialDocs !== null) {
      setUserDocs(initialDocs);
    }
  }, [initialDocs]);

  // Modals state
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("aadhaar");

  const fetchDocs = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingDocs(true);
    try {
      const res = await api.get(`/admin/users/${user.id}/documents`);
      if (res?.success && res.data) {
        setUserDocs(res.data.documents || res.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingDocs(false);
    }
  }, [user?.id]);

  useEffect(() => {
    // Only auto-fetch if initialDocs were not provided
    if (user?.id && !initialDocs && !userDocs) {
      fetchDocs();
    }
  }, [user?.id, initialDocs, userDocs, fetchDocs]);

  const aadhaar = userDocs?.aadhaar || userDocs?.AADHAAR;
  const pan = userDocs?.pan || userDocs?.PAN;

  const isAadhaarUploaded = Boolean(
    aadhaar &&
    ((aadhaar.status && aadhaar.status !== "NOT_UPLOADED") || aadhaar.frontImageUrl || aadhaar.frontImage || aadhaar.id)
  );

  const isPanUploaded = Boolean(
    pan &&
    ((pan.status && pan.status !== "NOT_UPLOADED") || pan.frontImageUrl || pan.frontImage || pan.id)
  );

  const isAadhaarResolved = Boolean(
    aadhaar?.status && ["APPROVED", "VERIFIED", "REJECTED"].includes(aadhaar.status.toUpperCase())
  );

  const isPanResolved = Boolean(
    pan?.status && ["APPROVED", "VERIFIED", "REJECTED"].includes(pan.status.toUpperCase())
  );

  const activeModalUser = {
    ...user,
    documents: userDocs || user?.documents || {},
  };

  const handleOpenUpload = (docType = "aadhaar") => {
    setSelectedDocType(docType.toLowerCase());
    setIsUploadModalOpen(true);
  };

  const handleOpenVerify = (docType = "aadhaar") => {
    setSelectedDocType(docType.toLowerCase());
    setIsVerifyModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchDocs();
    if (onRefresh) onRefresh();
  };

  if (isLoadingDocs) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm h-52 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gray-200" />
              <div className="space-y-1.5">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="h-6 w-20 bg-gray-200 rounded-md" />
          </div>
          <div className="space-y-2 py-2">
            <div className="h-3.5 w-full bg-gray-100 rounded" />
            <div className="h-3.5 w-3/4 bg-gray-100 rounded" />
          </div>
          <div className="h-8 w-28 bg-gray-200 rounded-lg ml-auto" />
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm h-52 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gray-200" />
              <div className="space-y-1.5">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="h-6 w-20 bg-gray-200 rounded-md" />
          </div>
          <div className="space-y-2 py-2">
            <div className="h-3.5 w-full bg-gray-100 rounded" />
            <div className="h-3.5 w-3/4 bg-gray-100 rounded" />
          </div>
          <div className="h-8 w-28 bg-gray-200 rounded-lg ml-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* KYC Documents Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Aadhaar Card */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold">
                  <Icon icon="lucide:shield-check" width="18" height="18" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Aadhaar Card Verification</h3>
                  <p className="text-[11px] text-gray-400">Identity & Address Proof</p>
                </div>
              </div>

              <span className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-md border ${getDocStatusBadge(aadhaar?.status)}`}>
                {formatDocStatus(aadhaar?.status)}
              </span>
            </div>

            <div className="py-3 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between text-gray-500">
                <span>Document Number:</span>
                <span className="font-semibold text-gray-800 font-mono">
                  {aadhaar?.documentNumber || aadhaar?.number || "Not provided"}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-500">
                <span>Last Updated:</span>
                <span className="font-semibold text-gray-800">
                  {formatDate(aadhaar?.updatedAt || aadhaar?.createdAt)}
                </span>
              </div>
              {aadhaar?.adminRemark && (
                <div className="p-2.5 bg-gray-50 rounded-xl text-gray-600 text-[11px] mt-1 border border-gray-100">
                  <span className="font-bold text-gray-700">Admin Remark: </span>
                  {aadhaar.adminRemark}
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => handleOpenUpload("aadhaar")}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Icon icon="lucide:upload" width="13" height="13" />
              <span>{isAadhaarUploaded ? "Re-upload" : "Upload Aadhaar"}</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenVerify("aadhaar")}
              className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Icon
                icon={isAadhaarResolved ? "lucide:edit-3" : "lucide:check-circle"}
                width="13"
                height="13"
              />
              <span>{isAadhaarResolved ? "Change Status" : "Review & Verify"}</span>
            </button>
          </div>
        </div>

        {/* PAN Card */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-bold">
                  <Icon icon="lucide:credit-card" width="18" height="18" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">PAN Card Verification</h3>
                  <p className="text-[11px] text-gray-400">Tax & Permanent Account Number</p>
                </div>
              </div>

              <span className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-md border ${getDocStatusBadge(pan?.status)}`}>
                {formatDocStatus(pan?.status)}
              </span>
            </div>

            <div className="py-3 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between text-gray-500">
                <span>PAN Number:</span>
                <span className="font-semibold text-gray-800 font-mono">
                  {pan?.documentNumber || pan?.number || "Not provided"}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-500">
                <span>Last Updated:</span>
                <span className="font-semibold text-gray-800">
                  {formatDate(pan?.updatedAt || pan?.createdAt)}
                </span>
              </div>
              {pan?.adminRemark && (
                <div className="p-2.5 bg-gray-50 rounded-xl text-gray-600 text-[11px] mt-1 border border-gray-100">
                  <span className="font-bold text-gray-700">Admin Remark: </span>
                  {pan.adminRemark}
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => handleOpenUpload("pan")}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Icon icon="lucide:upload" width="13" height="13" />
              <span>{isPanUploaded ? "Re-upload" : "Upload PAN"}</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenVerify("pan")}
              className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Icon
                icon={isPanResolved ? "lucide:edit-3" : "lucide:check-circle"}
                width="13"
                height="13"
              />
              <span>{isPanResolved ? "Change Status" : "Review & Verify"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KYC Verification Modal */}
      <DocumentVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        user={activeModalUser}
        initialDocType={selectedDocType}
        onSuccess={handleModalSuccess}
        onOpenUploadModal={(targetDocType) => {
          setIsVerifyModalOpen(false);
          if (targetDocType) setSelectedDocType(targetDocType.toLowerCase());
          setIsUploadModalOpen(true);
        }}
      />

      {/* Admin Document Upload Modal */}
      <AdminDocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        user={activeModalUser}
        initialDocType={selectedDocType?.toUpperCase() || "AADHAAR"}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
