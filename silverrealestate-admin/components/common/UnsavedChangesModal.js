"use client";

import { useEffect } from "react";
import { Icon } from "@iconify/react";

export default function UnsavedChangesModal({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title = "Unsaved Changes",
  message = "You have unsaved modifications. If you leave now, all your changes will be discarded. Are you sure you want to proceed?",
  confirmText = "Discard Changes",
  cancelText = "Keep Editing",
}) {
  const handleCancel = onCancel || onClose || (() => {});
  const handleConfirm = (e) => {
    if (e) e.stopPropagation();
    if (onConfirm) onConfirm();
  };

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
      if (e.key === "Escape" && isOpen) {
        handleCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={handleCancel}
      />

      {/* Modal Dialog */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150 border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Icon icon="lucide:alert-triangle" width="22" height="22" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{message}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors shrink-0 cursor-pointer"
            aria-label="Close"
          >
            <Icon icon="lucide:x" width="18" height="18" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2.5 shrink-0 mt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-700 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Icon icon="lucide:trash-2" width="15" height="15" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
