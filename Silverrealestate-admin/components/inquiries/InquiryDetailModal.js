"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";

export default function InquiryDetailModal({
  isOpen,
  onClose,
  inquiry,
  onStatusChange,
}) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen || !inquiry) return null;

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleStatusUpdate = async (newStatus) => {
    if (newStatus === inquiry.status) return;
    setUpdatingStatus(true);
    try {
      await onStatusChange(inquiry.id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "NEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            New Inquiry
          </span>
        );
      case "CONTACTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Contacted
          </span>
        );
      case "RESOLVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Resolved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              <Icon icon="lucide:mail-question" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Direct Inquiry Details</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Received on {formatDate(inquiry.createdAt)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-xl transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <Icon icon="lucide:x" className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {/* Top Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
              <span className="text-[11px] font-mono uppercase tracking-wider text-gray-500 font-semibold block mb-1">
                Full Name
              </span>
              <div className="text-sm font-bold text-gray-900 flex items-center justify-between">
                <span>
                  {inquiry.firstName} {inquiry.lastName}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(`${inquiry.firstName} ${inquiry.lastName}`, "Name")
                  }
                  className="text-gray-400 hover:text-primary transition-colors p-1"
                  title="Copy Name"
                >
                  <Icon
                    icon={copiedField === "Name" ? "lucide:check" : "lucide:copy"}
                    className="w-4 h-4"
                  />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
              <span className="text-[11px] font-mono uppercase tracking-wider text-gray-500 font-semibold block mb-1">
                Corporate Email
              </span>
              <div className="text-sm font-bold text-gray-900 flex items-center justify-between">
                <a
                  href={`mailto:${inquiry.email}`}
                  className="text-primary hover:underline truncate mr-2"
                >
                  {inquiry.email}
                </a>
                <button
                  type="button"
                  onClick={() => copyToClipboard(inquiry.email, "Email")}
                  className="text-gray-400 hover:text-primary transition-colors p-1 shrink-0"
                  title="Copy Email"
                >
                  <Icon
                    icon={copiedField === "Email" ? "lucide:check" : "lucide:copy"}
                    className="w-4 h-4"
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Area of Interest & Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
              <span className="text-[11px] font-mono uppercase tracking-wider text-gray-500 font-semibold block mb-1">
                Area of Interest
              </span>
              <span className="inline-block mt-0.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                {inquiry.areaOfInterest}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
              <span className="text-[11px] font-mono uppercase tracking-wider text-gray-500 font-semibold block mb-1">
                Current Status
              </span>
              <div className="mt-0.5">{getStatusBadge(inquiry.status)}</div>
            </div>
          </div>

          {/* Message Section */}
          <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-gray-500 font-semibold">
                Message Content
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(inquiry.message, "Message")}
                className="text-xs text-gray-500 hover:text-primary flex items-center gap-1 font-medium transition-colors"
              >
                <Icon
                  icon={copiedField === "Message" ? "lucide:check" : "lucide:copy"}
                  className="w-3.5 h-3.5"
                />
                <span>{copiedField === "Message" ? "Copied" : "Copy Message"}</span>
              </button>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200/80 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {inquiry.message}
            </div>
          </div>

          {/* Quick Status Update Buttons */}
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-500 font-semibold block mb-2">
              Update Status
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={updatingStatus || inquiry.status === "NEW"}
                onClick={() => handleStatusUpdate("NEW")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  inquiry.status === "NEW"
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Mark as New
              </button>

              <button
                type="button"
                disabled={updatingStatus || inquiry.status === "CONTACTED"}
                onClick={() => handleStatusUpdate("CONTACTED")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  inquiry.status === "CONTACTED"
                    ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Mark as Contacted
              </button>

              <button
                type="button"
                disabled={updatingStatus || inquiry.status === "RESOLVED"}
                onClick={() => handleStatusUpdate("RESOLVED")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  inquiry.status === "RESOLVED"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Mark as Resolved
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <a
            href={`mailto:${inquiry.email}?subject=Regarding Your Inquiry - Silver Real Estate&body=Dear ${inquiry.firstName},%0D%0A%0D%0AThank you for contacting Silver Real Estate regarding ${inquiry.areaOfInterest}.%0D%0A%0D%0A`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs md:text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Icon icon="lucide:send" className="w-4 h-4" />
            Reply via Email
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-200 text-xs md:text-sm font-semibold rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
