"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

export default function DeleteInquiryModal({
  isOpen,
  onClose,
  inquiry,
  onConfirm,
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !inquiry) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(inquiry.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <Icon icon="lucide:trash-2" className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Inquiry?</h3>
        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to delete the inquiry from{" "}
          <span className="font-semibold text-gray-800">
            {inquiry.firstName} {inquiry.lastName}
          </span>{" "}
          ({inquiry.email})? This action cannot be undone.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold text-sm rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
