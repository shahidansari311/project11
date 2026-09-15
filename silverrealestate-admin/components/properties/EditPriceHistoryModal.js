"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import UnsavedChangesModal from "../common/UnsavedChangesModal";
import { useUnsavedChanges } from "../common/UnsavedChangesProvider";

export default function EditPriceHistoryModal({
  isOpen,
  onClose,
  historyItem,
  onSuccess,
}) {
  const { setDirty } = useUnsavedChanges();
  const [price, setPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && historyItem) {
      setPrice(historyItem.price !== undefined ? String(historyItem.price) : "");
      setIsUnsavedModalOpen(false);
    } else {
      setDirty(false);
    }
  }, [isOpen, historyItem, setDirty]);

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

  const isDirty = () => {
    if (!historyItem) return false;
    const initialPrice = historyItem.price !== undefined ? String(historyItem.price) : "";
    return price.trim() !== initialPrice.trim();
  };

  useEffect(() => {
    if (isOpen) {
      setDirty(isDirty());
    }
    return () => {
      setDirty(false);
    };
  }, [isOpen, price, historyItem, setDirty]);

  const handleAttemptClose = () => {
    if (isDirty()) {
      setIsUnsavedModalOpen(true);
    } else {
      onClose();
    }
  };

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isUnsavedModalOpen && !isSubmitting) {
        handleAttemptClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isUnsavedModalOpen, isSubmitting, price, historyItem]);

  if (!isOpen || !historyItem) return null;

  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val) || val === "") return "";
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const numericPrice = Number(price);
    if (price === "" || isNaN(numericPrice) || numericPrice < 0) {
      toast.error("Please enter a valid price (min 0)");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        price: numericPrice,
      };

      const res = await api.put(`/admin/property/price-history/${historyItem.id}`, payload);

      if (res?.success) {
        toast.success(res.message || "Price history updated successfully");
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        toast.error(res?.message || "Failed to update price history");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred while updating price history");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={handleAttemptClose}
      />

      {/* Modal Dialog */}
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon icon="lucide:pencil" width="17" height="17" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 truncate">
                  Edit Price Point
                </h2>
                <p className="text-xs text-gray-500 truncate">
                  Logged on {formatDate(historyItem.date || historyItem.createdAt)}
                </p>
              </div>
            </div>
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 flex flex-col gap-4">
          {/* Previous recorded price */}
          <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Original Recorded Price</span>
            <span className="text-xs font-bold text-gray-800">
              {formatCurrency(historyItem.price)}
            </span>
          </div>

          {/* New Price Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="editPriceInput" className="text-xs font-semibold text-gray-700">
              Updated Price (INR) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 font-semibold text-sm">
                ₹
              </span>
              <input
                id="editPriceInput"
                type="number"
                min="0"
                step="any"
                required
                autoFocus
                value={price}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e") {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || Number(val) >= 0) {
                    setPrice(val);
                  }
                }}
                placeholder="e.g. 5600000"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold text-gray-900"
              />
            </div>
            {price && !isNaN(Number(price)) && Number(price) > 0 && (
              <div className="text-[11px] text-primary font-semibold pl-1">
                Formatted: {formatCurrency(Number(price))}
              </div>
            )}
          </div>

          <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-2 text-xs text-blue-800">
            <Icon icon="lucide:info" className="text-blue-600 shrink-0 mt-0.5" width="15" height="15" />
            <span>
              If this is the most recent price point on the graph, the property&apos;s total valuation will also be automatically updated.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={handleAttemptClose}
            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-xs font-medium text-gray-700 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Icon icon="lucide:check" width="15" height="15" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Unsaved Changes Custom Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={isUnsavedModalOpen}
        onClose={() => setIsUnsavedModalOpen(false)}
        onConfirm={() => {
          setIsUnsavedModalOpen(false);
          onClose();
        }}
      />
    </div>
  );
}
