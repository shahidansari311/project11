"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import UnsavedChangesModal from "../common/UnsavedChangesModal";
import { useUnsavedChanges } from "../common/UnsavedChangesProvider";

function formatDocUrl(url) {
  if (!url) return null;
  if (typeof url !== "string") return null;
  return url;
}

function isPdf(url) {
  if (!url || typeof url !== "string") return false;
  return url.toLowerCase().includes(".pdf");
}

export default function DocumentVerificationModal({
  isOpen,
  onClose,
  user,
  initialDocType = "aadhaar",
  onSuccess,
  onOpenUploadModal,
}) {
  const { setDirty } = useUnsavedChanges();
  const [selectedDocType, setSelectedDocType] = useState("aadhaar");
  const [userDetails, setUserDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [status, setStatus] = useState("APPROVED");
  const [remark, setRemark] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isChangingDecision, setIsChangingDecision] = useState(false);
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  const prevOpenRef = useRef(false);

  // Fetch full user documents from GET /admin/users/:userId/documents
  const fetchSingleUserDocs = useCallback(async (userId) => {
    if (!userId) return;
    setIsLoadingDetails(true);
    try {
      const res = await api.get(`/admin/users/${userId}/documents`);
      if (res?.success && res.data) {
        const rawDocs = res.data.documents || res.data;
        setUserDetails((prev) => ({
          ...(prev || {}),
          ...res.data,
          documents: rawDocs.documents || rawDocs,
        }));
      }
    } catch (error) {
      console.warn("Failed to fetch fresh user documents, using cached data", error);
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !prevOpenRef.current && user) {
      const normalizedType = (initialDocType || "aadhaar").toLowerCase();
      setSelectedDocType(normalizedType);
      setStatus("APPROVED");
      setRemark("");
      setIsChangingDecision(false);
      setIsUnsavedModalOpen(false);
      setUserDetails(user);
      if (user.id) {
        fetchSingleUserDocs(user.id);
      }
    } else if (!isOpen && prevOpenRef.current) {
      setUserDetails(null);
      setIsChangingDecision(false);
      setDirty(false);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, user, initialDocType, fetchSingleUserDocs, setDirty]);

  const isDirty = useCallback(() => {
    return Boolean(remark.trim() !== "" || isChangingDecision);
  }, [remark, isChangingDecision]);

  // Sync with global UnsavedChangesProvider
  useEffect(() => {
    if (isOpen) {
      setDirty(isDirty());
    } else {
      setDirty(false);
    }
    return () => {
      setDirty(false);
    };
  }, [isOpen, isDirty, setDirty]);

  const handleAttemptClose = () => {
    if (isDirty()) {
      setIsUnsavedModalOpen(true);
    } else {
      setDirty(false);
      onClose();
    }
  };

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isUnsavedModalOpen && !isSubmitting && !previewImage) {
        handleAttemptClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isUnsavedModalOpen, isSubmitting, previewImage, remark, isChangingDecision]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const activeUser = userDetails || user;
  const docsObj = activeUser.documents || {};

  // Extract Aadhaar and PAN documents safely
  const aadhaarDoc = docsObj.aadhaar || docsObj.AADHAAR || docsObj.Aadhaar || null;
  const panDoc = docsObj.pan || docsObj.PAN || docsObj.Pan || null;

  const currentDoc = selectedDocType === "pan" ? panDoc : aadhaarDoc;

  // Extract image/document URLs safely across potential key formats
  const frontUrl = formatDocUrl(
    currentDoc?.frontImageUrl ||
    currentDoc?.frontImage ||
    currentDoc?.front_image_url ||
    currentDoc?.front_image ||
    currentDoc?.url
  );

  const backUrl = formatDocUrl(
    currentDoc?.backImageUrl ||
    currentDoc?.backImage ||
    currentDoc?.back_image_url ||
    currentDoc?.back_image
  );

  const isDocUploaded = Boolean(
    currentDoc &&
    (
      (currentDoc.status && currentDoc.status !== "NOT_UPLOADED") ||
      frontUrl ||
      currentDoc.id
    )
  );

  const docStatus = currentDoc?.status || (isDocUploaded ? "PENDING" : "NOT_UPLOADED");
  const isPending = docStatus === "PENDING";
  const isApproved = docStatus === "APPROVED";
  const isRejected = docStatus === "REJECTED";

  const showVerificationForm = isPending || isChangingDecision;
  const docId = currentDoc?.id || currentDoc?._id || currentDoc?.documentId;

  const handleVerify = async () => {
    if (!docId) {
      toast.error("Document ID not found. Cannot submit verification.");
      return;
    }

    if (status === "REJECTED" && !remark.trim()) {
      toast.error("Please provide a remark explaining the rejection reason");
      return;
    }

    const currentTypeLabel = selectedDocType === "aadhaar" ? "Aadhaar Card" : "PAN Card";
    const otherDocType = selectedDocType === "aadhaar" ? "pan" : "aadhaar";
    const otherDoc = otherDocType === "pan" ? panDoc : aadhaarDoc;
    const otherTypeLabel = otherDocType === "aadhaar" ? "Aadhaar Card" : "PAN Card";

    const isOtherDocUploaded = Boolean(
      otherDoc &&
      (
        (otherDoc.status && otherDoc.status !== "NOT_UPLOADED") ||
        otherDoc.frontImageUrl ||
        otherDoc.frontImage ||
        otherDoc.front_image_url ||
        otherDoc.url ||
        otherDoc.id
      )
    );
    const isOtherDocNeedsReview = isOtherDocUploaded && otherDoc?.status !== "APPROVED";

    setIsSubmitting(true);
    try {
      const res = await api.post(`/admin/document/${docId}/verify`, {
        status,
        remark: remark.trim() || undefined,
      });

      if (res?.success) {
        // Update userDetails locally so UI reflects verified status immediately
        setUserDetails((prev) => {
          if (!prev) return prev;
          const prevDocs = prev.documents || {};
          return {
            ...prev,
            documents: {
              ...prevDocs,
              [selectedDocType]: {
                ...(prevDocs[selectedDocType] || {}),
                status,
                adminRemark: remark.trim() || undefined,
              },
            },
          };
        });

        if (onSuccess) onSuccess();

        // If the other document is uploaded and still needs review, switch to it seamlessly!
        if (isOtherDocUploaded && isOtherDocNeedsReview) {
          toast.success(`${currentTypeLabel} marked as ${status}. Switched to ${otherTypeLabel}.`);
          setSelectedDocType(otherDocType);
          setStatus("APPROVED");
          setRemark("");
          setIsChangingDecision(false);
          setDirty(false);
          if (activeUser?.id) {
            fetchSingleUserDocs(activeUser.id);
          }
        } else {
          // If no pending document remains, close the modal
          toast.success(res.message || `${currentTypeLabel} marked as ${status}`);
          setDirty(false);
          onClose();
        }
      } else {
        toast.error(res?.message || "Failed to verify document");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred during verification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (s) => {
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
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={handleAttemptClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between gap-4 bg-white shrink-0">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
              Verify KYC Documents
            </h2>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              User: <span className="font-semibold text-gray-800">{activeUser.fullName || "User"}</span> (
              {activeUser.phone || activeUser.email || activeUser.id})
            </p>
          </div>

          <button
            onClick={handleAttemptClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors shrink-0 cursor-pointer"
            aria-label="Close"
          >
            <Icon icon="lucide:x" width="20" height="20" />
          </button>
        </div>

        {/* Document Type Tabs */}
        <div className="flex items-center border-b border-gray-100 px-4 sm:px-6 bg-white shrink-0">
          <button
            type="button"
            onClick={() => {
              setSelectedDocType("aadhaar");
              setIsChangingDecision(false);
            }}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              selectedDocType === "aadhaar"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Icon icon="lucide:id-card" width="16" height="16" />
            <span>Aadhaar Card</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getStatusBadge(
                aadhaarDoc?.status || "NOT_UPLOADED"
              )}`}
            >
              {formatDocStatus(aadhaarDoc?.status)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedDocType("pan");
              setIsChangingDecision(false);
            }}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              selectedDocType === "pan"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Icon icon="lucide:credit-card" width="16" height="16" />
            <span>PAN Card</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getStatusBadge(
                panDoc?.status || "NOT_UPLOADED"
              )}`}
            >
              {formatDocStatus(panDoc?.status)}
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 flex flex-col gap-5">
          {isLoadingDetails && (
            <div className="p-2.5 bg-primary/5 border border-primary/10 rounded-xl flex items-center gap-2 text-xs text-primary">
              <Icon icon="lucide:loader-2" className="animate-spin" width="14" height="14" />
              <span>Fetching latest document information...</span>
            </div>
          )}

          {!isDocUploaded ? (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center bg-gray-50/70 rounded-2xl border border-dashed border-gray-200">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                <Icon icon="lucide:file-question" width="26" height="26" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                {selectedDocType === "aadhaar" ? "Aadhaar Card" : "PAN Card"} Not Uploaded
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mb-4">
                The user has not uploaded their {selectedDocType === "aadhaar" ? "Aadhaar Card" : "PAN Card"} yet.
                You can upload the document on their behalf.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenUploadModal) {
                    onOpenUploadModal(activeUser, selectedDocType.toUpperCase());
                  }
                }}
                className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <Icon icon="lucide:upload-cloud" width="15" height="15" />
                <span>Upload {selectedDocType.toUpperCase()} on Behalf</span>
              </button>
            </div>
          ) : (
            <>
              {/* Document Meta Info Card */}
              <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block text-[11px]">Current Status</span>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-md border mt-0.5 ${getStatusBadge(docStatus)}`}>
                    {formatDocStatus(docStatus)}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 block text-[11px]">Upload Origin</span>
                  <span className="font-semibold text-gray-800 mt-0.5 block">
                    {currentDoc?.isUploadedByAdmin ? "Uploaded by Admin" : "Uploaded by User"}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 block text-[11px]">Uploaded At</span>
                  <span className="font-medium text-gray-700 mt-0.5 block">
                    {formatDate(currentDoc?.createdAt)}
                  </span>
                </div>

                {currentDoc?.remark && (
                  <div className="w-full pt-2 border-t border-gray-200/60">
                    <span className="text-gray-400 block text-[11px]">Existing Remark:</span>
                    <span className="text-gray-700 italic block mt-0.5">{currentDoc.remark}</span>
                  </div>
                )}
              </div>

              {/* Document Images / PDF Preview Grid */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-700">Uploaded Document Files</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Front Side */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-gray-600">Front Side</span>
                    {frontUrl ? (
                      isPdf(frontUrl) ? (
                        <div className="h-48 rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center p-4 text-center gap-2">
                          <Icon icon="lucide:file-text" className="w-10 h-10 text-red-500" />
                          <span className="text-xs font-medium text-gray-800">PDF Document</span>
                          <a
                            href={frontUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-primary/90 transition-colors shadow-2xs"
                          >
                            <Icon icon="lucide:external-link" width="13" height="13" />
                            <span>Open PDF</span>
                          </a>
                        </div>
                      ) : (
                        <div
                          onClick={() => setPreviewImage(frontUrl)}
                          className="h-48 sm:h-56 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 cursor-pointer relative group flex items-center justify-center shadow-2xs"
                        >
                          <img
                            src={frontUrl}
                            alt="Front Document"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity text-xs font-semibold gap-1.5 backdrop-blur-2xs">
                            <Icon icon="lucide:zoom-in" width="18" height="18" />
                            <span>Click to Zoom & View</span>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="h-48 rounded-xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-400">
                        No front file uploaded
                      </div>
                    )}
                  </div>

                  {/* Back Side */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-gray-600">Back Side</span>
                    {backUrl ? (
                      isPdf(backUrl) ? (
                        <div className="h-48 rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center p-4 text-center gap-2">
                          <Icon icon="lucide:file-text" className="w-10 h-10 text-red-500" />
                          <span className="text-xs font-medium text-gray-800">PDF Document</span>
                          <a
                            href={backUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-primary/90 transition-colors shadow-2xs"
                          >
                            <Icon icon="lucide:external-link" width="13" height="13" />
                            <span>Open PDF</span>
                          </a>
                        </div>
                      ) : (
                        <div
                          onClick={() => setPreviewImage(backUrl)}
                          className="h-48 sm:h-56 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 cursor-pointer relative group flex items-center justify-center shadow-2xs"
                        >
                          <img
                            src={backUrl}
                            alt="Back Document"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity text-xs font-semibold gap-1.5 backdrop-blur-2xs">
                            <Icon icon="lucide:zoom-in" width="18" height="18" />
                            <span>Click to Zoom & View</span>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="h-48 rounded-xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-400">
                        {selectedDocType === "pan" ? "No back image required for PAN" : "No back file uploaded"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Banner when already resolved */}
              {!showVerificationForm && (
                <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                  isApproved
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                    : "bg-red-50/80 border-red-200 text-red-900"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isApproved
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      <Icon
                        icon={isApproved ? "lucide:check-circle-2" : "lucide:x-circle"}
                        width="20"
                        height="20"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold">
                        {isApproved
                          ? "Document Verified & Approved"
                          : "Document Rejected"}
                      </h4>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        {currentDoc?.remark ? `Remark: "${currentDoc.remark}"` : "Status recorded by administrator."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setStatus(docStatus === "APPROVED" ? "REJECTED" : "APPROVED");
                      setIsChangingDecision(true);
                    }}
                    className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 transition-colors shadow-2xs shrink-0 flex items-center gap-1"
                  >
                    <Icon icon="lucide:edit-3" width="13" height="13" />
                    <span>Change Status</span>
                  </button>
                </div>
              )}

              {/* Active Verification Form (Only shown when pending OR when Admin clicks Change Status) */}
              {showVerificationForm && (
                <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 flex flex-col gap-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">Verification Action</span>
                    {isChangingDecision && (
                      <button
                        type="button"
                        onClick={() => setIsChangingDecision(false)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Cancel Change
                      </button>
                    )}
                  </div>

                  {/* Status selection buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setStatus("APPROVED")}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        status === "APPROVED"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300"
                      }`}
                    >
                      <Icon icon="lucide:check-circle" width="15" height="15" />
                      <span>Approve</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus("REJECTED")}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        status === "REJECTED"
                          ? "bg-red-600 text-white border-red-600 shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:border-red-300"
                      }`}
                    >
                      <Icon icon="lucide:x-circle" width="15" height="15" />
                      <span>Reject</span>
                    </button>
                  </div>

                  {/* Remark Textarea */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Remark / Feedback {status === "REJECTED" && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                      rows={2}
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder={
                        status === "APPROVED"
                          ? "Optional verification notes (e.g. All details verified successfully)"
                          : "Reason for rejection (The user will be prompted to re-upload)"
                      }
                      className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleAttemptClose}
            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-xs font-medium text-gray-700 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>

          {isDocUploaded && showVerificationForm && (
            <button
              type="button"
              onClick={handleVerify}
              disabled={isSubmitting}
              className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 text-white transition-all shadow-sm disabled:opacity-50 cursor-pointer ${
                status === "APPROVED"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Icon icon="lucide:check" width="15" height="15" />
                  <span>Submit {status === "APPROVED" ? "Approval" : "Rejection"}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Lightbox / Full Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white p-2">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-black/70 hover:bg-black text-white p-2 rounded-full transition-colors z-10"
            >
              <Icon icon="lucide:x" width="20" height="20" />
            </button>
            <img
              src={previewImage}
              alt="Full Preview"
              className="max-h-[85vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Custom Unsaved Changes Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={isUnsavedModalOpen}
        onClose={() => setIsUnsavedModalOpen(false)}
        onCancel={() => setIsUnsavedModalOpen(false)}
        onConfirm={() => {
          setIsUnsavedModalOpen(false);
          setDirty(false);
          onClose();
        }}
        title="Discard Verification Changes?"
        message="You have unsaved changes or remarks in this document review. If you close now, your changes will be discarded."
        confirmText="Discard & Close"
        cancelText="Continue Review"
      />
    </div>
  );
}
