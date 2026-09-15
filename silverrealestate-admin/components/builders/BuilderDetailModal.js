"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "../../lib/api";
import DocumentViewerModal from "../common/DocumentViewerModal";
import { formatStatus } from "../../lib/formatUtils";

function formatCurrency(val) {
  if (val === null || val === undefined || isNaN(val)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getPropertyStatusBadge(status) {
  switch (status?.toUpperCase()) {
    case "APPROVED":
    case "AVAILABLE":
      return { label: "Approved / Available", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "PENDING":
    case "PENDING_APPROVAL":
      return { label: "Pending Verification", className: "bg-amber-50 text-amber-700 border-amber-200" };
    case "REJECTED":
      return { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200" };
    case "SOLD_OUT":
      return { label: "Sold Out", className: "bg-gray-100 text-gray-700 border-gray-200" };
    default:
      return { label: formatStatus(status), className: "bg-gray-50 text-gray-600 border-gray-200" };
  }
}

export default function BuilderDetailModal({ isOpen, onClose, builderId, onEdit, onDelete }) {
  const [builder, setBuilder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingDoc, setViewingDoc] = useState(null);

  useEffect(() => {
    if (!isOpen || !builderId) {
      setBuilder(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    api.get(`/admin/builders/${builderId}`)
      .then((res) => {
        if (isMounted && res?.success && res.data) {
          setBuilder(res.data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          toast.error(err.message || "Failed to load builder details");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, builderId]);

  if (!isOpen) return null;

  const properties = Array.isArray(builder?.properties) ? builder.properties : [];
  const documents = Array.isArray(builder?.documents) ? builder.documents : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3 bg-gradient-to-r from-amber-50/50 via-white to-transparent shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0 border border-amber-200">
              <Icon icon="lucide:hard-hat" width="22" height="22" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  {builder?.fullName || (isLoading ? "Loading Builder..." : "Builder Profile")}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Icon icon="lucide:shield-check" width="11" height="11" />
                  <span>BUILDER</span>
                </span>
                {builder?.createdby_admin && (
                  <span className="inline-flex text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                    Admin Created
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                ID: <span className="font-mono text-gray-700">{builderId}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <Icon icon="lucide:x" width="18" height="18" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 flex flex-col gap-5">
          {isLoading ? (
            <div className="space-y-4 py-8 animate-pulse">
              <div className="h-20 bg-gray-100 rounded-2xl" />
              <div className="h-40 bg-gray-100 rounded-2xl" />
              <div className="h-40 bg-gray-100 rounded-2xl" />
            </div>
          ) : !builder ? (
            <div className="py-16 text-center text-gray-400">
              <Icon icon="lucide:alert-circle" width="32" height="32" className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Builder details not found.</p>
            </div>
          ) : (
            <>
              {/* Profile Overview Card */}
              <div className="p-4 bg-gray-50/80 border border-gray-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg shrink-0 border border-amber-200 overflow-hidden">
                    {builder.profileUrl || builder.profileImage ? (
                      <img
                        src={builder.profileUrl || builder.profileImage}
                        alt={builder.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{builder.fullName ? builder.fullName.charAt(0).toUpperCase() : "B"}</span>
                    )}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                      {builder.fullName}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Icon icon="lucide:phone" width="13" height="13" className="text-gray-400" />
                        <span>{builder.phone || "No phone"}</span>
                      </span>
                      {builder.email && (
                        <span className="flex items-center gap-1">
                          <Icon icon="lucide:mail" width="13" height="13" className="text-gray-400" />
                          <span className="break-all">{builder.email}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEdit(builder);
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Icon icon="lucide:pencil" width="13" height="13" />
                      <span>Edit</span>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onDelete(builder);
                      }}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Icon icon="lucide:trash-2" width="13" height="13" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Uploaded Properties Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Icon icon="lucide:building-2" width="16" height="16" className="text-primary" />
                    <span>Uploaded Properties ({properties.length})</span>
                  </span>
                  <Link
                    href={`/property-submissions?search=${encodeURIComponent(builder.phone || builder.fullName || "")}`}
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>View in Submissions Queue</span>
                    <Icon icon="lucide:arrow-right" width="13" height="13" />
                  </Link>
                </div>

                {properties.length === 0 ? (
                  <div className="p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                    <Icon icon="lucide:building" width="28" height="28" className="mx-auto mb-2 text-gray-300" />
                    <p className="text-xs text-gray-500 font-medium">No properties uploaded by this builder yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {properties.map((prop) => {
                      const statusBadge = getPropertyStatusBadge(prop.status);
                      const coverImg = prop.images?.[0] || prop.coverImage;

                      return (
                        <div
                          key={prop.id}
                          className="p-3 bg-white border border-gray-200 rounded-2xl shadow-2xs hover:border-primary/50 transition-all flex flex-col justify-between gap-2.5"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {coverImg ? (
                                <img src={coverImg} alt={prop.title} className="w-full h-full object-cover" />
                              ) : (
                                <Icon icon="lucide:building-2" width="20" height="20" className="text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-gray-900 text-xs truncate block">
                                  {prop.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold border ${statusBadge.className}`}>
                                  {statusBadge.label}
                                </span>
                                {prop.perUnitPrice && (
                                  <span className="text-[11px] font-semibold text-emerald-700">
                                    {formatCurrency(prop.perUnitPrice)} / unit
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-gray-100 text-center text-[10px] text-gray-500">
                            <div className="bg-gray-50 p-1.5 rounded-lg">
                              <span className="block text-gray-400">Total Units</span>
                              <span className="font-bold text-gray-800 mt-0.5 block">{prop.totalUnits ?? "—"}</span>
                            </div>
                            <div className="bg-gray-50 p-1.5 rounded-lg">
                              <span className="block text-gray-400">Available</span>
                              <span className="font-bold text-emerald-700 mt-0.5 block">{prop.availableUnits ?? "—"}</span>
                            </div>
                            <div className="bg-gray-50 p-1.5 rounded-lg">
                              <span className="block text-gray-400">Investors</span>
                              <span className="font-bold text-gray-800 mt-0.5 block">{prop.investors ?? 0}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Documents Section */}
              {documents.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Icon icon="lucide:file-text" width="16" height="16" className="text-primary" />
                    <span>Attached Documents ({documents.length})</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Icon icon="lucide:file-text" width="16" height="16" />
                          </div>
                          <span className="font-semibold text-gray-800 truncate">
                            {doc.title || doc.name || `Document #${idx + 1}`}
                          </span>
                        </div>

                        {doc.url && (
                          <button
                            type="button"
                            onClick={() =>
                              setViewingDoc({
                                url: doc.url,
                                title: doc.title || "Builder Document",
                                subtitle: builder.fullName,
                              })
                            }
                            className="px-2.5 py-1 text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            Preview
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta Timestamps */}
              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                <span>Registered On: {formatDate(builder.createdAt)}</span>
                {builder.updatedAt && <span>Last Updated: {formatDate(builder.updatedAt)}</span>}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* In-App Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={Boolean(viewingDoc)}
        onClose={() => setViewingDoc(null)}
        url={viewingDoc?.url}
        title={viewingDoc?.title}
        subtitle={viewingDoc?.subtitle}
      />
    </div>
  );
}
