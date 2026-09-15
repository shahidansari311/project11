"use client";

import { useState, useRef } from "react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { formatLocation } from "../../lib/locationUtils";
import { formatCurrency, formatDate } from "../../lib/formatUtils";

export default function InvestmentWithdrawalModal({
  isOpen,
  onClose,
  investment,
  onSuccess,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Document Proof State
  const [proofMode, setProofMode] = useState("file"); // "file" | "url"
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [payoutProofUrl, setPayoutProofUrl] = useState("");
  const fileInputRef = useRef(null);

  if (!isOpen || !investment) return null;

  const bankDetails = investment?.refundBankDetails || {};
  const initialAmount = investment?.totalAmount || investment?.paidAmount || 0;
  const payoutAmount =
    investment?.currentValuation ??
    (investment?.promisedReturnAmount
      ? Number(initialAmount) + Number(investment.promisedReturnAmount)
      : investment?.totalAmount || investment?.paidAmount || 0);

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

  const handleProcessPayout = async () => {
    let finalProofUrl = payoutProofUrl.trim();

    if (proofMode === "url" && !finalProofUrl) {
      toast.error("Please enter the Bank Transfer Payout Receipt URL");
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

      let res;
      try {
        res = await api.post(`/admin/investments/${investment.id}/process-withdrawal`, formData);
      } catch (err) {
        // Fallback to refund endpoint if process-withdrawal returns 404
        if (err.response?.status === 404) {
          res = await api.post(`/admin/investments/${investment.id}/refund`, formData);
        } else {
          throw err;
        }
      }

      if (res?.success) {
        toast.success(res.message || "Withdrawal payout processed successfully!");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res?.message || "Failed to process withdrawal payout");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred while processing withdrawal payout");
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
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3 bg-gradient-to-r from-rose-50 via-rose-50/50 to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Icon icon="lucide:banknote" width="22" height="22" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                Process Withdrawal Request
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
          {/* Matured Investment & Valuation Payout Card */}
          <div className="bg-gradient-to-br from-rose-50/60 via-orange-50/20 to-white border border-rose-200/80 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-rose-100 pb-2.5">
              <div className="flex items-center gap-1.5">
                <Icon icon="lucide:trending-up" width="16" height="16" className="text-rose-600" />
                <span className="text-xs font-bold text-rose-950">Promised Maturity Return</span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Icon icon="lucide:check-circle-2" width="11" height="11" />
                <span>Matured Investment</span>
              </span>
            </div>

            {/* Investor & Property Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
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

            {/* Financial Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-rose-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Units</span>
                <span className="text-xs sm:text-sm font-bold text-gray-900">
                  {investment.units} {investment.units === 1 ? "unit" : "units"}
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  Initial: {formatCurrency(initialAmount)}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-rose-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Term Period</span>
                <span className="text-xs sm:text-sm font-bold text-gray-900">
                  {investment.property?.termPeriodYears ? `${investment.property.termPeriodYears} Years` : "Fixed-Term"}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5 font-semibold">
                  {(investment.targetReturnAtTime !== undefined && investment.targetReturnAtTime !== null)
                    ? `${investment.targetReturnAtTime}% Return`
                    : investment.property?.targetReturn
                    ? `${investment.property.targetReturn}% Return`
                    : "Matured"}
                </span>
              </div>

              <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                <span className="text-[10px] uppercase font-bold text-rose-700 block mb-0.5">Payout Due</span>
                <span className="text-xs sm:text-sm font-bold text-rose-950 block tabular-nums">
                  {formatCurrency(payoutAmount)}
                </span>
                <span className="text-[10px] text-rose-600 block mt-0.5 font-medium">
                  Guaranteed Payout
                </span>
              </div>
            </div>
          </div>

          {/* Investor's Destination Bank Account */}
          <div className="p-4 bg-purple-50/60 border border-purple-200/90 rounded-2xl flex flex-col gap-3 shadow-2xs">
            <div className="flex items-center justify-between gap-2 border-b border-purple-200/70 pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Icon icon="lucide:building-2" width="15" height="15" />
                </div>
                <span className="text-xs font-bold text-purple-950 truncate">
                  Investor Bank Account
                </span>
              </div>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-100/90 border border-purple-200/80 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                Payout Account
              </span>
            </div>

            {bankDetails.accountNumber || bankDetails.bankName ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* Account Holder Name */}
                <div className="bg-white p-3 rounded-xl border border-purple-100/90 shadow-2xs flex flex-col justify-between min-h-[62px]">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                    Account Name
                  </span>
                  <span className="font-bold text-gray-900 text-xs truncate mt-1" title={bankDetails.accountName || investment.user?.fullName}>
                    {bankDetails.accountName || investment.user?.fullName || "N/A"}
                  </span>
                </div>

                {/* Bank Name */}
                <div className="bg-white p-3 rounded-xl border border-purple-100/90 shadow-2xs flex flex-col justify-between min-h-[62px]">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                    Bank Name
                  </span>
                  <span className="font-bold text-gray-900 text-xs truncate mt-1" title={bankDetails.bankName}>
                    {bankDetails.bankName || "N/A"}
                  </span>
                </div>

                {/* Account Number */}
                <div className="bg-white p-3 rounded-xl border border-purple-100/90 shadow-2xs flex flex-col justify-between min-h-[62px]">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      Account Number
                    </span>
                    {bankDetails.accountNumber && (
                      <button
                        type="button"
                        onClick={() => handleCopy(bankDetails.accountNumber, "Account Number")}
                        className="text-[10px] font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Icon icon={copiedField === "Account Number" ? "lucide:check" : "lucide:copy"} width="11" height="11" />
                        <span>{copiedField === "Account Number" ? "Copied" : "Copy"}</span>
                      </button>
                    )}
                  </div>
                  <span className="font-mono font-bold text-gray-900 text-xs tracking-wider truncate mt-1">
                    {bankDetails.accountNumber || "N/A"}
                  </span>
                </div>

                {/* IFSC Code */}
                <div className="bg-white p-3 rounded-xl border border-purple-100/90 shadow-2xs flex flex-col justify-between min-h-[62px]">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      IFSC Code
                    </span>
                    {bankDetails.ifscCode && (
                      <button
                        type="button"
                        onClick={() => handleCopy(bankDetails.ifscCode, "IFSC Code")}
                        className="text-[10px] font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Icon icon={copiedField === "IFSC Code" ? "lucide:check" : "lucide:copy"} width="11" height="11" />
                        <span>{copiedField === "IFSC Code" ? "Copied" : "Copy"}</span>
                      </button>
                    )}
                  </div>
                  <span className="font-mono font-bold text-gray-900 text-xs tracking-wider uppercase truncate mt-1">
                    {bankDetails.ifscCode || "N/A"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <Icon icon="lucide:alert-circle" width="16" height="16" className="shrink-0 text-amber-600" />
                <span>No specific payout bank details attached. Please verify investor details directly.</span>
              </div>
            )}
          </div>

          {/* Bank Transfer Payout Receipt Upload */}
          <div className="p-4 bg-white border border-gray-200 rounded-2xl flex flex-col gap-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Icon icon="lucide:file-check-2" width="16" height="16" className="text-rose-600" />
                <span>Bank Transfer Payout Receipt / Proof</span>
                <span className="text-red-500 font-bold">*</span>
              </span>

              {/* Mode Toggle */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setProofMode("file")}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    proofMode === "file" ? "bg-white text-rose-700 shadow-2xs font-bold" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setProofMode("url")}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    proofMode === "url" ? "bg-white text-rose-700 shadow-2xs font-bold" : "text-gray-500 hover:text-gray-800"
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
                  <div className="flex items-center justify-between p-3 bg-rose-50/60 rounded-xl border border-rose-200 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {filePreview.type === "image" ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-rose-200 bg-white shrink-0">
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
                    className="border-2 border-dashed border-gray-300 hover:border-rose-400 bg-gray-50/60 hover:bg-rose-50/30 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors text-center"
                  >
                    <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mb-0.5">
                      <Icon icon="lucide:upload-cloud" width="18" height="18" />
                    </div>
                    <span className="text-xs font-semibold text-gray-800">
                      Click to upload bank transfer payout receipt
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
                    value={payoutProofUrl}
                    onChange={(e) => setPayoutProofUrl(e.target.value)}
                    placeholder="https://storage-url-to-receipt.pdf"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                  />
                </div>
                <span className="text-[10px] text-gray-400 block mt-1">
                  Enter the direct URL of the bank payout proof receipt.
                </span>
              </div>
            )}
          </div>

          {/* Important Confirmation Notice */}
          <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-950">
            <Icon icon="lucide:alert-circle" className="text-rose-600 shrink-0 mt-0.5" width="18" height="18" />
            <div className="space-y-1">
              <p className="font-bold text-rose-950">
                Matured Return Payout Confirmation
              </p>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Confirming this payout will record the bank transfer proof and complete the payout of <strong>{formatCurrency(payoutAmount)}</strong> to the investor&apos;s bank account.
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
            disabled={isSubmitting || (proofMode === "file" && !selectedFile && !payoutProofUrl) || (proofMode === "url" && !payoutProofUrl.trim())}
            onClick={handleProcessPayout}
            className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                <span>Processing Payout...</span>
              </>
            ) : (
              <>
                <Icon icon="lucide:check-circle-2" width="16" height="16" />
                <span>Confirm & Process Payout</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
