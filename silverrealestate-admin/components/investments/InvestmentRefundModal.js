"use client";

import { useState, useRef } from "react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { formatLocation } from "../../lib/locationUtils";
import { formatCurrency } from "../../lib/formatUtils";

export default function InvestmentRefundModal({
  isOpen,
  onClose,
  investment,
  onSuccess,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Refund Document Proof State
  const [proofMode, setProofMode] = useState("file"); // "file" | "url"
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [refundProofUrl, setRefundProofUrl] = useState("");
  const fileInputRef = useRef(null);

  if (!isOpen || !investment) return null;

  const refundBank = investment.refundBankDetails || {};
  const paidAmount = investment.paidAmount || 0;

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Receipt document must be less than 10MB");
      return;
    }

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isImage && !isPdf) {
      toast.error("Please upload a valid image (PNG/JPG) or PDF file");
      return;
    }

    setSelectedFile(file);
    if (isImage) {
      const previewUrl = URL.createObjectURL(file);
      setFilePreview({ type: "image", url: previewUrl, name: file.name, size: file.size });
    } else {
      setFilePreview({ type: "pdf", name: file.name, size: file.size });
    }
  };

  const handleRemoveFile = () => {
    if (filePreview?.url && filePreview.url.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(filePreview.url);
      } catch {
        // ignore
      }
    }
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleProcessRefund = async () => {
    let finalProofUrl = refundProofUrl.trim();

    if (proofMode === "url" && !finalProofUrl) {
      toast.error("Please enter the Refund Proof Document URL");
      return;
    }

    if (proofMode === "file" && !selectedFile && !finalProofUrl) {
      toast.error("Please select a bank transfer receipt (PDF or Image)");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("file", selectedFile);
      } else if (finalProofUrl) {
        formData.append("refundProofUrl", finalProofUrl);
        formData.append("fileUrl", finalProofUrl);
      }

      const res = await api.post(`/admin/investments/${investment.id}/refund`, formData);

      if (res?.success) {
        toast.success(res.message || "Refund processed successfully and units released!");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res?.message || "Failed to process refund");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred while processing refund");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3 bg-purple-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Icon icon="lucide:rotate-ccw" width="22" height="22" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                Process Investment Refund
              </h3>
              <p className="text-[11px] text-gray-500">
                Investment ID: <span className="font-mono font-semibold text-gray-700">{investment.id}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            <Icon icon="lucide:x" width="18" height="18" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Investment & Refund Summary Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col gap-3">
            {/* User & Property Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-gray-200/80 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Investor</span>
                <span className="font-bold text-gray-900 block truncate">
                  {investment.user?.fullName || "User"}
                </span>
                <span className="text-[11px] text-gray-500 block truncate">
                  {investment.user?.phone || investment.user?.email || "No contact"}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Property</span>
                <span className="font-bold text-gray-900 block truncate">
                  {investment.property?.title || "Property"}
                </span>
                <span className="text-[11px] text-gray-500 block truncate">
                  {formatLocation(investment.property?.location)}
                </span>
              </div>
            </div>

            {/* Refund Numbers */}
            <div className="grid grid-cols-2 gap-2 text-center pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-gray-200/70">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                  Units to Release
                </span>
                <span className="text-xs sm:text-sm font-bold text-gray-900">
                  {investment.units} {investment.units === 1 ? "unit" : "units"}
                </span>
              </div>

              <div className="bg-purple-50/80 p-2.5 rounded-xl border border-purple-200">
                <span className="text-[10px] uppercase font-bold text-purple-700 block mb-0.5">
                  Refund Amount Due
                </span>
                <span className="text-xs sm:text-base font-bold text-purple-900">
                  {formatCurrency(paidAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Bank Account Details For Transfer */}
          <div className="p-4 bg-white border border-purple-200/80 rounded-2xl flex flex-col gap-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2">
              <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                <Icon icon="lucide:building-2" width="16" height="16" className="text-purple-600" />
                <span>Investor&apos;s Bank Account Details</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Transfer Destination
              </span>
            </div>

            {refundBank.accountNumber || refundBank.bankName ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* Account Holder Name */}
                <div className="bg-purple-50/40 p-3 rounded-xl border border-purple-100/90 shadow-2xs flex flex-col justify-between min-h-[62px]">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Account Holder Name</span>
                  <span className="font-bold text-gray-900 text-xs truncate mt-1">
                    {refundBank.accountName || investment.user?.fullName || "N/A"}
                  </span>
                </div>

                {/* Bank Name */}
                <div className="bg-purple-50/40 p-3 rounded-xl border border-purple-100/90 shadow-2xs flex flex-col justify-between min-h-[62px]">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Bank Name</span>
                  <span className="font-bold text-gray-900 text-xs truncate mt-1">
                    {refundBank.bankName || "N/A"}
                  </span>
                </div>

                {/* Account Number */}
                <div className="bg-purple-50/40 p-3 rounded-xl border border-purple-100/90 shadow-2xs flex flex-col justify-between min-h-[62px]">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Account Number</span>
                    {refundBank.accountNumber && (
                      <button
                        type="button"
                        onClick={() => handleCopy(refundBank.accountNumber, "Account Number")}
                        className="text-[10px] font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Icon icon={copiedField === "Account Number" ? "lucide:check" : "lucide:copy"} width="11" height="11" />
                        <span>{copiedField === "Account Number" ? "Copied" : "Copy"}</span>
                      </button>
                    )}
                  </div>
                  <span className="font-mono font-bold text-gray-900 text-xs tracking-wider truncate mt-1">
                    {refundBank.accountNumber || "N/A"}
                  </span>
                </div>

                {/* IFSC Code */}
                <div className="bg-purple-50/40 p-3 rounded-xl border border-purple-100/90 shadow-2xs flex flex-col justify-between min-h-[62px]">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">IFSC Code</span>
                    {refundBank.ifscCode && (
                      <button
                        type="button"
                        onClick={() => handleCopy(refundBank.ifscCode, "IFSC Code")}
                        className="text-[10px] font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Icon icon={copiedField === "IFSC Code" ? "lucide:check" : "lucide:copy"} width="11" height="11" />
                        <span>{copiedField === "IFSC Code" ? "Copied" : "Copy"}</span>
                      </button>
                    )}
                  </div>
                  <span className="font-mono font-bold text-gray-900 text-xs tracking-wider uppercase truncate mt-1">
                    {refundBank.ifscCode || "N/A"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <Icon icon="lucide:alert-circle" width="16" height="16" className="shrink-0 text-amber-600" />
                <span>No specific refund bank details attached. Please verify investor details directly.</span>
              </div>
            )}
          </div>

          {/* Refund Proof Receipt Document Upload (Step 1 & Step 2) */}
          <div className="p-4 bg-white border border-gray-200 rounded-2xl flex flex-col gap-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Icon icon="lucide:file-check-2" width="16" height="16" className="text-purple-600" />
                <span>Refund Transfer Receipt / Proof</span>
                <span className="text-red-500 font-bold">*</span>
              </span>

              {/* Mode Toggle (File Upload vs Direct URL) */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setProofMode("file")}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    proofMode === "file" ? "bg-white text-purple-700 shadow-2xs font-bold" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setProofMode("url")}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    proofMode === "url" ? "bg-white text-purple-700 shadow-2xs font-bold" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Paste URL
                </button>
              </div>
            </div>

            {proofMode === "file" ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
                  className="hidden"
                />

                {filePreview ? (
                  <div className="flex items-center justify-between p-3 bg-purple-50/60 rounded-xl border border-purple-200 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {filePreview.type === "image" ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-purple-200 bg-white shrink-0">
                          <img src={filePreview.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                          <Icon icon="lucide:file-text" width="20" height="20" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-semibold text-gray-900 block truncate text-xs">
                          {filePreview.name}
                        </span>
                        <span className="text-[10px] text-gray-500 block">
                          {(filePreview.size / 1024).toFixed(1)} KB &bull; {filePreview.type.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Remove receipt file"
                    >
                      <Icon icon="lucide:trash-2" width="16" height="16" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-purple-400 bg-gray-50/60 hover:bg-purple-50/30 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors text-center"
                  >
                    <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mb-0.5">
                      <Icon icon="lucide:upload-cloud" width="18" height="18" />
                    </div>
                    <span className="text-xs font-semibold text-gray-800">
                      Click to upload bank transfer receipt
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Supports PDF, PNG, JPG or WEBP (Max 10MB)
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Icon icon="lucide:link" width="15" height="15" />
                  </div>
                  <input
                    type="url"
                    value={refundProofUrl}
                    onChange={(e) => setRefundProofUrl(e.target.value)}
                    placeholder="https://storage-url-to-receipt.pdf"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                  />
                </div>
                <span className="text-[10px] text-gray-400 block mt-1">
                  Enter the direct URL of the uploaded bank transfer proof in S3/Supabase storage.
                </span>
              </div>
            )}
          </div>

          {/* Refund Warning Notice */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
            <Icon icon="lucide:alert-triangle" className="text-amber-600 shrink-0 mt-0.5" width="18" height="18" />
            <div className="space-y-1">
              <p className="font-bold text-amber-950">
                Important Refund Confirmation
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Processing this refund will change status to <strong>REFUNDED</strong> and immediately restore <strong>{investment.units} units</strong> back to the listing. Ensure the transfer of <strong>{formatCurrency(paidAmount)}</strong> is completed.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting || (proofMode === "file" && !selectedFile && !refundProofUrl) || (proofMode === "url" && !refundProofUrl.trim())}
            onClick={handleProcessRefund}
            className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                <span>Processing Refund...</span>
              </>
            ) : (
              <>
                <Icon icon="lucide:check-circle-2" width="16" height="16" />
                <span>Confirm & Process Refund</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
