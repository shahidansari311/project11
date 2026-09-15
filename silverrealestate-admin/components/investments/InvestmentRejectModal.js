"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";

export default function InvestmentRejectModal({
  isOpen,
  onClose,
  investment,
  onSuccess,
}) {
  const [remark, setRemark] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !investment) return null;

  const handleReject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.patch(`/admin/investments/${investment.id}/reject`, {
        remark: remark.trim() || undefined,
      });

      if (res?.success) {
        toast.success(res.message || "Investment rejected successfully. Units released.");
        setRemark("");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res?.message || "Failed to reject investment");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred while rejecting investment");
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

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3 bg-red-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <Icon icon="lucide:x-circle" width="20" height="20" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                Reject Investment Request
              </h3>
              <p className="text-[11px] text-gray-500">
                ID: <span className="font-mono">{investment.id}</span>
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

        {/* Form Body */}
        <form onSubmit={handleReject} className="p-4 sm:p-5 flex flex-col gap-4">
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-800 flex items-start gap-2.5">
            <Icon icon="lucide:alert-triangle" className="text-red-600 shrink-0 mt-0.5" width="16" height="16" />
            <div>
              <p className="font-semibold">Rejecting this investment will:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-red-700">
                <li>Mark status as <strong>REJECTED</strong></li>
                <li>Automatically release <strong>{investment.units} units</strong> back to the property</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="rejectRemark" className="text-xs font-semibold text-gray-700 flex items-center justify-between">
              <span>Reason / Admin Remark</span>
              <span className="text-gray-400 font-normal text-[11px]">(Optional)</span>
            </label>
            <textarea
              id="rejectRemark"
              rows={3}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="e.g. Payment not received in bank account / Invalid transaction reference"
              className="w-full p-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-xs text-gray-900 transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                  <span>Rejecting...</span>
                </>
              ) : (
                <>
                  <Icon icon="lucide:x-circle" width="15" height="15" />
                  <span>Confirm Rejection</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
