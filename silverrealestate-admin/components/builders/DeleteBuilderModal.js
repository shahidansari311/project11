"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";

export default function DeleteBuilderModal({ isOpen, onClose, builder, onSuccess }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !builder) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await api.delete(`/admin/builders/${builder.id}`);
      if (res?.success) {
        toast.success(res.message || "Builder account deleted successfully");
        onSuccess?.();
        onClose();
      } else {
        toast.error(res?.message || "Failed to delete builder account");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred while deleting the builder");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-3 bg-red-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <Icon icon="lucide:trash-2" width="20" height="20" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                Delete Builder Account
              </h3>
              <p className="text-[11px] text-gray-500">
                This action cannot be undone
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

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            Are you sure you want to delete the builder account for{" "}
            <strong className="text-gray-900 font-bold">{builder.fullName || "this builder"}</strong> (
            {builder.phone || builder.email || builder.id})?
          </p>

          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-800">
            <Icon icon="lucide:alert-triangle" className="shrink-0 mt-0.5 text-amber-600" width="16" height="16" />
            <div>
              <strong>Note:</strong> Deleting the builder account does not delete their existing uploaded properties unless deleted separately.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                <span>Deleting Builder...</span>
              </>
            ) : (
              <>
                <Icon icon="lucide:trash-2" width="15" height="15" />
                <span>Confirm Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
