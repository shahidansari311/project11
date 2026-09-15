"use client";

import { useEffect } from "react";
import { Icon } from "@iconify/react";

export default function DeletePriceHistoryModal({
  isOpen,
  onClose,
  historyItem,
  onConfirm,
  isDeleting,
}) {
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

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !historyItem) return null;

  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val) || val === "") return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={() => {
          if (!isDeleting) onClose();
        }}
      />

      {/* Modal Dialog */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0">
              <Icon icon="lucide:trash-2" width="20" height="20" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Delete Price History Point
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                This action will permanently remove this valuation record from the timeline.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors shrink-0 cursor-pointer disabled:opacity-40"
            aria-label="Close"
          >
            <Icon icon="lucide:x" width="18" height="18" />
          </button>
        </div>

        {/* Content Details */}
        <div className="px-5 py-3 flex flex-col gap-3">
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Recorded Date
              </span>
              <span className="text-xs font-bold text-gray-800">
                {formatDate(historyItem.date || historyItem.createdAt)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Price Point
              </span>
              <span className="text-sm font-bold text-red-600 font-mono">
                {formatCurrency(historyItem.price)}
              </span>
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-start gap-2 text-xs text-amber-800">
            <Icon icon="lucide:alert-triangle" className="text-amber-600 shrink-0 mt-0.5" width="15" height="15" />
            <span>
              Are you sure you want to delete this point? If this is the latest price point, the current property price will be adjusted to the previous point.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2.5 shrink-0 mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-700 rounded-xl transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer min-w-[120px] justify-center"
          >
            {isDeleting ? (
              <>
                <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Icon icon="lucide:trash-2" width="15" height="15" />
                <span>Delete Point</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
