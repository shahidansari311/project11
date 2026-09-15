"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import UnsavedChangesModal from "../common/UnsavedChangesModal";
import { useUnsavedChanges } from "../common/UnsavedChangesProvider";

const initialDocState = {
  frontImage: null,
  frontPreview: null,
  backImage: null,
  backPreview: null,
  remark: "",
};

function formatDocUrl(url) {
  if (!url || typeof url !== "string") return null;
  return url;
}

function isPdf(url) {
  if (!url || typeof url !== "string") return false;
  return url.toLowerCase().includes(".pdf");
}

export default function AdminDocumentUploadModal({
  isOpen,
  onClose,
  user,
  initialDocType = "AADHAAR",
  onSuccess,
}) {
  const { setDirty } = useUnsavedChanges();
  const [documentType, setDocumentType] = useState(initialDocType || "AADHAAR");
  const [docsState, setDocsState] = useState({
    AADHAAR: { ...initialDocState },
    PAN: { ...initialDocState },
  });
  const [existingDocs, setExistingDocs] = useState({
    AADHAAR: null,
    PAN: null,
  });
  const [reuploadMode, setReuploadMode] = useState({
    AADHAAR: false,
    PAN: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);
  const blobUrlsRef = useRef(new Set());
  const prevOpenRef = useRef(false);

  // Initialize/Sync existing documents from user prop ONLY when modal opens
  useEffect(() => {
    if (isOpen && !prevOpenRef.current && user) {
      const docsObj = user.documents || {};
      setExistingDocs({
        AADHAAR: docsObj.aadhaar || docsObj.AADHAAR || null,
        PAN: docsObj.pan || docsObj.PAN || null,
      });
      setDocumentType((initialDocType || "AADHAAR").toUpperCase());
      setDocsState({
        AADHAAR: { ...initialDocState },
        PAN: { ...initialDocState },
      });
      setReuploadMode({
        AADHAAR: false,
        PAN: false,
      });
      setIsUnsavedModalOpen(false);
      setPreviewImage(null);
    } else if (!isOpen && prevOpenRef.current) {
      setDirty(false);
      setPreviewImage(null);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, user, initialDocType, setDirty]);

  // Clean up all generated blob URLs ONLY when modal unmounts
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => {
        if (typeof url === "string" && url.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(url);
          } catch (err) {
            // ignore
          }
        }
      });
      blobUrlsRef.current.clear();
    };
  }, []);

  // Extract existing document data
  const existingAadhaar = existingDocs.AADHAAR;
  const existingPan = existingDocs.PAN;

  const existingAadhaarFront = formatDocUrl(
    existingAadhaar?.frontImageUrl || existingAadhaar?.frontImage || existingAadhaar?.url
  );
  const existingAadhaarBack = formatDocUrl(
    existingAadhaar?.backImageUrl || existingAadhaar?.backImage
  );
  const isAadhaarAlreadyUploaded = Boolean(
    existingAadhaar &&
    (
      (existingAadhaar.status && existingAadhaar.status !== "NOT_UPLOADED") ||
      existingAadhaarFront ||
      existingAadhaar.id
    )
  );

  const existingPanFront = formatDocUrl(
    existingPan?.frontImageUrl || existingPan?.frontImage || existingPan?.url
  );
  const existingPanBack = formatDocUrl(
    existingPan?.backImageUrl || existingPan?.backImage
  );
  const isPanAlreadyUploaded = Boolean(
    existingPan &&
    (
      (existingPan.status && existingPan.status !== "NOT_UPLOADED") ||
      existingPanFront ||
      existingPan.id
    )
  );

  const isDirty = useCallback(() => {
    const aadhaar = docsState.AADHAAR;
    const pan = docsState.PAN;
    return Boolean(
      aadhaar.frontImage || aadhaar.backImage || aadhaar.remark.trim() ||
      pan.frontImage || pan.backImage || pan.remark.trim()
    );
  }, [docsState]);

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
  }, [isOpen, isUnsavedModalOpen, isSubmitting, previewImage, docsState]);

  // Prevent background scrolling when modal is open
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

  if (!isOpen || !user) return null;

  const currentDoc = docsState[documentType] || initialDocState;
  const currentExisting = documentType === "AADHAAR" ? existingAadhaar : existingPan;
  const isCurrentAlreadyUploaded = documentType === "AADHAAR" ? isAadhaarAlreadyUploaded : isPanAlreadyUploaded;
  const isCurrentInReuploadMode = reuploadMode[documentType] || Boolean(currentDoc.frontImage || currentDoc.backImage);

  const currentExistingFront = documentType === "AADHAAR" ? existingAadhaarFront : existingPanFront;
  const currentExistingBack = documentType === "AADHAAR" ? existingAadhaarBack : existingPanBack;

  const validateFile = (file) => {
    if (!file) return false;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return false;
    }
    return true;
  };

  const handleDocTypeChange = (type) => {
    if (type === documentType) return;
    if (frontInputRef.current) frontInputRef.current.value = "";
    if (backInputRef.current) backInputRef.current.value = "";
    setDocumentType(type);
  };

  const handleFrontFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFile(file)) return;

    let preview = file.name;
    if (file.type.startsWith("image/")) {
      preview = URL.createObjectURL(file);
      blobUrlsRef.current.add(preview);
    }

    setDocsState((prev) => ({
      ...prev,
      [documentType]: {
        ...prev[documentType],
        frontImage: file,
        frontPreview: preview,
      },
    }));
  };

  const handleRemoveFront = () => {
    if (currentDoc.frontPreview && currentDoc.frontPreview.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(currentDoc.frontPreview);
        blobUrlsRef.current.delete(currentDoc.frontPreview);
      } catch (err) {
        // ignore
      }
    }
    setDocsState((prev) => ({
      ...prev,
      [documentType]: {
        ...prev[documentType],
        frontImage: null,
        frontPreview: null,
      },
    }));
    if (frontInputRef.current) frontInputRef.current.value = "";
  };

  const handleBackFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFile(file)) return;

    let preview = file.name;
    if (file.type.startsWith("image/")) {
      preview = URL.createObjectURL(file);
      blobUrlsRef.current.add(preview);
    }

    setDocsState((prev) => ({
      ...prev,
      [documentType]: {
        ...prev[documentType],
        backImage: file,
        backPreview: preview,
      },
    }));
  };

  const handleRemoveBack = () => {
    if (currentDoc.backPreview && currentDoc.backPreview.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(currentDoc.backPreview);
        blobUrlsRef.current.delete(currentDoc.backPreview);
      } catch (err) {
        // ignore
      }
    }
    setDocsState((prev) => ({
      ...prev,
      [documentType]: {
        ...prev[documentType],
        backImage: null,
        backPreview: null,
      },
    }));
    if (backInputRef.current) backInputRef.current.value = "";
  };

  const handleRemarkChange = (e) => {
    const val = e.target.value;
    setDocsState((prev) => ({
      ...prev,
      [documentType]: {
        ...prev[documentType],
        remark: val,
      },
    }));
  };

  const aadhaarData = docsState.AADHAAR;
  const panData = docsState.PAN;

  const hasNewAadhaarFiles = Boolean(aadhaarData.frontImage || aadhaarData.backImage);
  const hasNewPanFiles = Boolean(panData.frontImage || panData.backImage);

  const isAadhaarComplete = Boolean(aadhaarData.frontImage && aadhaarData.backImage);
  const isPanComplete = Boolean(panData.frontImage);

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
    });
  };

  // Upload handler supporting independent single upload and optional batch upload
  const handleUpload = async (uploadTarget = "active") => {
    if (uploadTarget === "both") {
      // Validate both documents upfront
      if (!aadhaarData.frontImage) {
        setDocumentType("AADHAAR");
        setReuploadMode((prev) => ({ ...prev, AADHAAR: true }));
        toast.error("Please upload the Front Side of Aadhaar Card. Both front and back sides are required.");
        return;
      }
      if (!aadhaarData.backImage) {
        setDocumentType("AADHAAR");
        setReuploadMode((prev) => ({ ...prev, AADHAAR: true }));
        toast.error("Please upload the Back Side of Aadhaar Card. Both front and back sides are required.");
        return;
      }
      if (!panData.frontImage) {
        setDocumentType("PAN");
        setReuploadMode((prev) => ({ ...prev, PAN: true }));
        toast.error("Please upload the PAN Card photo.");
        return;
      }

      setIsSubmitting(true);
      try {
        const aadhaarFd = new FormData();
        aadhaarFd.append("documentType", "AADHAAR");
        aadhaarFd.append("frontImage", aadhaarData.frontImage);
        aadhaarFd.append("backImage", aadhaarData.backImage);
        if (aadhaarData.remark.trim()) {
          aadhaarFd.append("remark", aadhaarData.remark.trim());
        }

        const panFd = new FormData();
        panFd.append("documentType", "PAN");
        panFd.append("frontImage", panData.frontImage);
        if (panData.backImage) {
          panFd.append("backImage", panData.backImage);
        }
        if (panData.remark.trim()) {
          panFd.append("remark", panData.remark.trim());
        }

        const [resAadhaar, resPan] = await Promise.all([
          api.post(`/admin/users/${user.id}/document`, aadhaarFd),
          api.post(`/admin/users/${user.id}/document`, panFd),
        ]);

        if (resAadhaar?.success && resPan?.success) {
          toast.success("Aadhaar Card and PAN Card uploaded & verified successfully!");
          if (onSuccess) onSuccess();
          onClose();
        } else {
          toast.error(resAadhaar?.message || resPan?.message || "Failed to upload some documents");
        }
      } catch (error) {
        toast.error(error.message || "An error occurred while uploading documents");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // SINGLE UPLOAD FLOW (for the active tab)
    if (documentType === "AADHAAR") {
      if (!aadhaarData.frontImage) {
        toast.error("Please select the Front Side image of Aadhaar Card.");
        return;
      }
      if (!aadhaarData.backImage) {
        toast.error("Please select the Back Side image of Aadhaar Card. Both front and back sides are required.");
        return;
      }

      setIsSubmitting(true);
      try {
        const aadhaarFd = new FormData();
        aadhaarFd.append("documentType", "AADHAAR");
        aadhaarFd.append("frontImage", aadhaarData.frontImage);
        aadhaarFd.append("backImage", aadhaarData.backImage);
        if (aadhaarData.remark.trim()) {
          aadhaarFd.append("remark", aadhaarData.remark.trim());
        }

        const res = await api.post(`/admin/users/${user.id}/document`, aadhaarFd);
        if (res?.success) {
          const newAadhaarDoc = {
            status: "APPROVED",
            frontImageUrl: aadhaarData.frontPreview,
            backImageUrl: aadhaarData.backPreview,
            adminRemark: aadhaarData.remark.trim(),
            createdAt: new Date().toISOString(),
          };

          setExistingDocs((prev) => ({ ...prev, AADHAAR: newAadhaarDoc }));
          setDocsState((prev) => ({ ...prev, AADHAAR: { ...initialDocState } }));
          setReuploadMode((prev) => ({ ...prev, AADHAAR: false }));

          if (hasNewPanFiles) {
            toast.success("Aadhaar Card uploaded & verified! You can now upload PAN Card.");
            if (onSuccess) onSuccess();
            setDocumentType("PAN");
          } else {
            toast.success(res.message || "Aadhaar Card uploaded and verified successfully!");
            if (onSuccess) onSuccess();
            onClose();
          }
        } else {
          toast.error(res?.message || "Failed to upload Aadhaar Card");
        }
      } catch (error) {
        toast.error(error.message || "An error occurred while uploading Aadhaar Card");
      } finally {
        setIsSubmitting(false);
      }
    } else if (documentType === "PAN") {
      if (!panData.frontImage) {
        toast.error("Please select the PAN Card photo.");
        return;
      }

      setIsSubmitting(true);
      try {
        const panFd = new FormData();
        panFd.append("documentType", "PAN");
        panFd.append("frontImage", panData.frontImage);
        if (panData.backImage) {
          panFd.append("backImage", panData.backImage);
        }
        if (panData.remark.trim()) {
          panFd.append("remark", panData.remark.trim());
        }

        const res = await api.post(`/admin/users/${user.id}/document`, panFd);
        if (res?.success) {
          const newPanDoc = {
            status: "APPROVED",
            frontImageUrl: panData.frontPreview,
            backImageUrl: panData.backPreview,
            adminRemark: panData.remark.trim(),
            createdAt: new Date().toISOString(),
          };

          setExistingDocs((prev) => ({ ...prev, PAN: newPanDoc }));
          setDocsState((prev) => ({ ...prev, PAN: { ...initialDocState } }));
          setReuploadMode((prev) => ({ ...prev, PAN: false }));

          if (hasNewAadhaarFiles) {
            toast.success("PAN Card uploaded & verified! Aadhaar Card is still staged for upload.");
            if (onSuccess) onSuccess();
            setDocumentType("AADHAAR");
          } else {
            toast.success(res.message || "PAN Card uploaded and verified successfully!");
            if (onSuccess) onSuccess();
            onClose();
          }
        } else {
          toast.error(res?.message || "Failed to upload PAN Card");
        }
      } catch (error) {
        toast.error(error.message || "An error occurred while uploading PAN Card");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const hasBothReady = isAadhaarComplete && isPanComplete;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={handleAttemptClose}
      />

      {/* Modal Card as Form with Fixed Header & Sticky Footer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleUpload("active");
        }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150"
      >
        {/* Fixed Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                Upload Document on Behalf
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              User: <span className="font-semibold text-gray-700">{user.fullName || "User"}</span> ({user.phone || user.email})
            </p>
          </div>

          <button
            type="button"
            onClick={handleAttemptClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors shrink-0 cursor-pointer"
            aria-label="Close"
          >
            <Icon icon="lucide:x" width="20" height="20" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 flex flex-col gap-4">
          {/* Document Type Selection */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700">Document Type</label>
              {hasBothReady && (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <Icon icon="lucide:check-circle-2" width="12" height="12" />
                  <span>Both documents ready</span>
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Aadhaar Tab Button */}
              <button
                type="button"
                onClick={() => handleDocTypeChange("AADHAAR")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                  documentType === "AADHAAR"
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Icon icon="lucide:id-card" width="16" height="16" className="shrink-0" />
                  <span className="truncate">Aadhaar Card</span>
                </div>
                {hasNewAadhaarFiles ? (
                  isAadhaarComplete ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 bg-emerald-400 text-white">
                      2/2 Ready
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 bg-amber-400 text-black">
                      1/2 Added
                    </span>
                  )
                ) : isAadhaarAlreadyUploaded ? (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                      documentType === "AADHAAR" ? "bg-white/20 text-white" : getDocStatusBadgeClass(existingAadhaar?.status)
                    }`}
                  >
                    {formatDocStatus(existingAadhaar?.status || "APPROVED")}
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400 font-normal shrink-0">
                    Empty
                  </span>
                )}
              </button>

              {/* PAN Tab Button */}
              <button
                type="button"
                onClick={() => handleDocTypeChange("PAN")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                  documentType === "PAN"
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Icon icon="lucide:credit-card" width="16" height="16" className="shrink-0" />
                  <span className="truncate">PAN Card</span>
                </div>
                {hasNewPanFiles ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 bg-emerald-400 text-white">
                    Ready
                  </span>
                ) : isPanAlreadyUploaded ? (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                      documentType === "PAN" ? "bg-white/20 text-white" : getDocStatusBadgeClass(existingPan?.status)
                    }`}
                  >
                    {formatDocStatus(existingPan?.status || "APPROVED")}
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400 font-normal shrink-0">
                    Empty
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* If document is ALREADY UPLOADED and NOT currently in Re-upload mode: Show Existing Document Card */}
          {isCurrentAlreadyUploaded && !isCurrentInReuploadMode ? (
            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col gap-3.5 animate-in fade-in duration-150">
              {/* Header Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Icon icon="lucide:check-circle-2" width="18" height="18" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">
                      {documentType === "AADHAAR" ? "Aadhaar Card" : "PAN Card"} is Uploaded
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Uploaded on {formatDate(currentExisting?.createdAt || currentExisting?.updatedAt)}
                    </p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 text-xs font-bold rounded-md border ${getDocStatusBadgeClass(currentExisting?.status)}`}>
                  {formatDocStatus(currentExisting?.status || "APPROVED")}
                </span>
              </div>

              {/* Document Number & Remarks (Only render if at least one detail exists) */}
              {Boolean(currentExisting?.documentNumber || currentExisting?.number || currentExisting?.adminRemark) && (
                <div className="p-3 bg-white rounded-xl border border-emerald-100 text-xs flex flex-col gap-1.5">
                  {(currentExisting?.documentNumber || currentExisting?.number) && (
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Document Number:</span>
                      <span className="font-mono font-bold text-gray-900">{currentExisting?.documentNumber || currentExisting?.number}</span>
                    </div>
                  )}
                  {currentExisting?.adminRemark && (
                    <div className="text-[11px] text-gray-600">
                      <span className="font-bold text-gray-700">Admin Remark: </span>
                      <span className="italic">{currentExisting.adminRemark}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Existing Image Thumbnails */}
              <div className="grid grid-cols-2 gap-2.5">
                {currentExistingFront && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-gray-600">Front Copy</span>
                    <div
                      onClick={() => !isPdf(currentExistingFront) && setPreviewImage(currentExistingFront)}
                      className="relative h-24 rounded-xl border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center group cursor-pointer"
                    >
                      {isPdf(currentExistingFront) ? (
                        <a
                          href={currentExistingFront}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-1 text-primary hover:underline text-xs font-bold"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Icon icon="lucide:file-text" width="28" height="28" />
                          <span>View PDF</span>
                        </a>
                      ) : (
                        <>
                          <img
                            src={currentExistingFront}
                            alt="Front document"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Icon icon="lucide:maximize-2" width="18" height="18" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {currentExistingBack && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-gray-600">Back Copy</span>
                    <div
                      onClick={() => !isPdf(currentExistingBack) && setPreviewImage(currentExistingBack)}
                      className="relative h-24 rounded-xl border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center group cursor-pointer"
                    >
                      {isPdf(currentExistingBack) ? (
                        <a
                          href={currentExistingBack}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-1 text-primary hover:underline text-xs font-bold"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Icon icon="lucide:file-text" width="28" height="28" />
                          <span>View PDF</span>
                        </a>
                      ) : (
                        <>
                          <img
                            src={currentExistingBack}
                            alt="Back document"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Icon icon="lucide:maximize-2" width="18" height="18" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button to Trigger Re-upload */}
              <button
                type="button"
                onClick={() => setReuploadMode((prev) => ({ ...prev, [documentType]: true }))}
                className="w-full py-2.5 bg-white hover:bg-emerald-100/50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer mt-1"
              >
                <Icon icon="lucide:refresh-cw" width="14" height="14" />
                <span>Re-upload / Replace {documentType === "AADHAAR" ? "Aadhaar Card" : "PAN Card"}</span>
              </button>
            </div>
          ) : (
            /* Upload Dropzones (Active for empty document or when in re-upload mode) */
            <>
              {isCurrentAlreadyUploaded && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-800">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon icon="lucide:alert-circle" width="16" height="16" className="text-amber-600 shrink-0" />
                    <span className="truncate">Replacing existing {documentType === "AADHAAR" ? "Aadhaar" : "PAN"} document</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleRemoveFront();
                      handleRemoveBack();
                      setReuploadMode((prev) => ({ ...prev, [documentType]: false }));
                    }}
                    className="text-[11px] font-bold text-gray-600 hover:text-gray-900 underline shrink-0 cursor-pointer"
                  >
                    Keep Existing
                  </button>
                </div>
              )}

              {/* Front Image Upload */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                  <span>{documentType === "AADHAAR" ? "Aadhaar Front Side" : "PAN Card Photo"} <span className="text-red-500">*</span></span>
                  <span className="text-gray-400 font-normal text-[11px]">(Max 2MB: JPG, PNG, PDF)</span>
                </label>

                <div
                  onClick={() => frontInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center ${
                    currentDoc.frontImage ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/50 bg-gray-50/50"
                  }`}
                >
                  {currentDoc.frontPreview && typeof currentDoc.frontPreview === "string" && currentDoc.frontPreview.startsWith("blob:") ? (
                    <div className="relative w-full h-36 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                      <img
                        src={currentDoc.frontPreview}
                        alt="Front Preview"
                        className="max-h-full max-w-full object-contain rounded-lg shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFront();
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm cursor-pointer z-10"
                        title="Remove front image"
                      >
                        <Icon icon="lucide:x" width="14" height="14" />
                      </button>
                    </div>
                  ) : currentDoc.frontImage ? (
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-800">
                      <Icon icon="lucide:file-check" className="text-emerald-500" width="20" height="20" />
                      <span className="truncate max-w-xs">{currentDoc.frontImage.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFront();
                        }}
                        className="p-1 text-red-500 hover:text-red-700 ml-1 cursor-pointer"
                      >
                        <Icon icon="lucide:trash-2" width="14" height="14" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-gray-500 py-2">
                      <Icon icon="lucide:upload-cloud" width="24" height="24" className="text-gray-400" />
                      <span className="text-xs font-medium">Click to upload {documentType === "AADHAAR" ? "Aadhaar front side" : "PAN card photo"}</span>
                      <span className="text-[11px] text-gray-400">PNG, JPG, JPEG, WEBP or PDF</span>
                    </div>
                  )}
                </div>
                <input
                  ref={frontInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFrontFileSelect}
                  className="hidden"
                />
              </div>

              {/* Back Image Upload (Required for Aadhaar, Optional for PAN) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                  <span>
                    {documentType === "AADHAAR" ? "Aadhaar Back Side" : "PAN Back Side"}{" "}
                    {documentType === "AADHAAR" ? (
                      <span className="text-red-500">* (Required)</span>
                    ) : (
                      <span className="text-gray-400 font-normal text-[11px]">(Optional)</span>
                    )}
                  </span>
                  <span className="text-gray-400 font-normal text-[11px]">(Max 2MB: JPG, PNG, PDF)</span>
                </label>

                <div
                  onClick={() => backInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center ${
                    currentDoc.backImage ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/50 bg-gray-50/50"
                  }`}
                >
                  {currentDoc.backPreview && typeof currentDoc.backPreview === "string" && currentDoc.backPreview.startsWith("blob:") ? (
                    <div className="relative w-full h-36 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                      <img
                        src={currentDoc.backPreview}
                        alt="Back Preview"
                        className="max-h-full max-w-full object-contain rounded-lg shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveBack();
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm cursor-pointer z-10"
                        title="Remove back image"
                      >
                        <Icon icon="lucide:x" width="14" height="14" />
                      </button>
                    </div>
                  ) : currentDoc.backImage ? (
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-800">
                      <Icon icon="lucide:file-check" className="text-emerald-500" width="20" height="20" />
                      <span className="truncate max-w-xs">{currentDoc.backImage.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveBack();
                        }}
                        className="p-1 text-red-500 hover:text-red-700 ml-1 cursor-pointer"
                      >
                        <Icon icon="lucide:trash-2" width="14" height="14" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-gray-500 py-2">
                      <Icon icon="lucide:upload-cloud" width="24" height="24" className="text-gray-400" />
                      <span className="text-xs font-medium">Click to upload {documentType === "AADHAAR" ? "Aadhaar back side" : "PAN back side"}</span>
                      <span className="text-[11px] text-gray-400">PNG, JPG, JPEG, WEBP or PDF</span>
                    </div>
                  )}
                </div>
                <input
                  ref={backInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleBackFileSelect}
                  className="hidden"
                />
              </div>

              {/* Remark Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">Admin Remark (Optional)</label>
                <input
                  type="text"
                  value={currentDoc.remark}
                  onChange={handleRemarkChange}
                  placeholder="e.g. Uploaded and verified on behalf of user"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-100 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-800">
                <Icon icon="lucide:info" className="shrink-0 mt-0.5 text-amber-600" width="15" height="15" />
                <span>Documents uploaded by Admin are automatically verified and marked as APPROVED.</span>
              </div>
            </>
          )}
        </div>

        {/* Fixed / Always Visible Sticky Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/90 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleAttemptClose}
            className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-700 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {/* Batch Upload Option if both are ready */}
            {hasBothReady && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleUpload("both")}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon icon="lucide:check-check" width="15" height="15" />
                )}
                <span>Upload Both</span>
              </button>
            )}

            {/* Primary Single Upload Button */}
            <button
              type="button"
              disabled={isSubmitting || (documentType === "AADHAAR" ? !hasNewAadhaarFiles : !hasNewPanFiles)}
              onClick={() => handleUpload("active")}
              className={`px-4 sm:px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer ${
                hasBothReady
                  ? "bg-white border border-primary text-primary hover:bg-primary/5"
                  : "bg-primary hover:bg-primary/90 text-white"
              }`}
            >
              {isSubmitting ? (
                <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
              ) : (
                <Icon icon="lucide:upload" width="15" height="15" />
              )}
              <span>
                {documentType === "AADHAAR"
                  ? isAadhaarAlreadyUploaded ? "Re-upload Aadhaar" : "Upload Aadhaar"
                  : isPanAlreadyUploaded ? "Re-upload PAN" : "Upload PAN"}
              </span>
            </button>
          </div>
        </div>
      </form>

      {/* Lightbox / Full Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white p-2">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-black/70 hover:bg-black text-white p-2 rounded-full transition-colors z-10 cursor-pointer"
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
        title="Discard Uploaded Documents?"
        message="You have selected document files that have not been uploaded yet. If you exit now, your selections will be lost."
        confirmText="Discard & Exit"
        cancelText="Continue Uploading"
      />
    </div>
  );
}
