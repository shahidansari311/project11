"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import DocumentViewerModal from "../common/DocumentViewerModal";
import { formatLocation } from "../../lib/locationUtils";
import {
  formatCurrency,
  formatDate,
  getInvestmentStatusBadge,
  normalizePaymentProofs,
  getPaymentProofMeta,
  getUserKycBadge,
} from "../../lib/formatUtils";

export default function InvestmentProofModal({
  isOpen,
  onClose,
  investment,
  onApprove,
}) {
  const [viewingDoc, setViewingDoc] = useState(null);

  if (!isOpen || !investment) return null;

  const proofs = normalizePaymentProofs(investment);
  const proofCount = proofs.length;
  const statusBadge = getInvestmentStatusBadge(investment.status);
  const kycBadge = getUserKycBadge(investment.user);
  const isPending = investment.status === "PENDING";
  const isPartialPaid = investment.status === "PARTIAL_PAID";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3 bg-blue-50/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Icon icon="lucide:receipt" width="20" height="20" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-gray-900 truncate">Payment Proof Verification</h3>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-md border ${statusBadge.className}`}>
                  <Icon icon={statusBadge.icon} width="12" height="12" />
                  <span>{statusBadge.label}</span>
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5 truncate">
                ID: {investment.id}
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
        <div className="p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          {/* Quick Info Ribbon */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5 flex flex-col gap-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-gray-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Investor</span>
                <span className="font-bold text-gray-900 block truncate">
                  {investment.user?.fullName || "Unnamed User"}
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

            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-medium">Total Value:</span>
                <span className="font-bold text-gray-900 tabular-nums text-sm">
                  {formatCurrency(investment.totalAmount)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-medium">Paid So Far:</span>
                <span className="font-bold text-emerald-700 tabular-nums text-sm">
                  {formatCurrency(investment.paidAmount || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Proof Count Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <Icon icon="lucide:file-check" width="16" height="16" className="text-blue-600" />
              <span>Attached Proofs & Receipts</span>
            </span>

            {proofCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <Icon icon="lucide:check-circle-2" width="12" height="12" />
                <span>{proofCount} {proofCount === 1 ? "Proof Attached" : "Proofs Attached"}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                <span>No Proof Uploaded</span>
              </span>
            )}
          </div>

          {/* Proof Items List */}
          {proofCount === 0 ? (
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-800 font-bold">
                <Icon icon="lucide:alert-circle" width="16" height="16" className="text-amber-600 shrink-0" />
                <span>No Payment Proof Attached</span>
              </div>
              <p className="text-amber-700 leading-relaxed text-[11px]">
                The user submitted this investment request without attaching an image receipt or transfer slip. Please verify bank credits manually before approving.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {proofs.map((proof, idx) => {
                const meta = getPaymentProofMeta(proof);
                if (!meta) return null;

                if (meta.type === "razorpay") {
                  return (
                    <div
                      key={idx}
                      className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                          <Icon icon="lucide:credit-card" width="22" height="22" />
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 text-xs sm:text-sm block">
                            Direct Razorpay Payment
                          </span>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Payment was verified and captured directly via Razorpay Payment Gateway.
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                        <Icon icon="lucide:shield-check" width="13" height="13" />
                        <span>Verified Gateway</span>
                      </span>
                    </div>
                  );
                }

                if (meta.type === "cash") {
                  return (
                    <div
                      key={idx}
                      className="bg-purple-50/50 border border-purple-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
                          <Icon icon="lucide:banknote" width="22" height="22" />
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 text-xs sm:text-sm block">
                            Cash Payment (Admin Recorded)
                          </span>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Created directly by Admin on behalf of the user with physical cash settlement.
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                        <Icon icon="lucide:user-check" width="13" height="13" />
                        <span>Cash Booking</span>
                      </span>
                    </div>
                  );
                }

                const proofTitle = proofCount > 1 ? `Payment Proof Receipt #${idx + 1}` : "Bank Transfer Receipt";

                return (
                  <div
                    key={idx}
                    className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 shadow-2xs hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Icon icon="lucide:image" width="15" height="15" />
                        </div>
                        <span className="font-bold text-gray-900 text-xs">
                          {proofTitle}
                        </span>
                      </div>

                      <span className="text-[10px] text-gray-400 font-medium">
                        Uploaded Document
                      </span>
                    </div>

                    {/* Image Preview Box */}
                    <div
                      onClick={() =>
                        setViewingDoc({
                          url: meta.url,
                          title: proofTitle,
                          subtitle: `Investor: ${investment.user?.fullName || "User"} • ${investment.property?.title || "Property"}`,
                        })
                      }
                      className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group cursor-pointer flex items-center justify-center"
                    >
                      <img
                        src={meta.url}
                        alt={proofTitle}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="px-3 py-1.5 bg-white text-gray-900 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md">
                          <Icon icon="lucide:maximize-2" width="14" height="14" />
                          <span>Click to Zoom Preview</span>
                        </span>
                      </div>
                    </div>

                    {/* Actions bar */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-gray-400 truncate max-w-[200px]">
                        Click preview or buttons to inspect
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setViewingDoc({
                              url: meta.url,
                              title: proofTitle,
                              subtitle: `Investor: ${investment.user?.fullName || "User"} • ${investment.property?.title || "Property"}`,
                            })
                          }
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                        >
                          <Icon icon="lucide:eye" width="13" height="13" />
                          <span>Preview Full Screen</span>
                        </button>

                        <a
                          href={meta.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors cursor-pointer"
                          title="Open or Download image"
                        >
                          <Icon icon="lucide:download" width="14" height="14" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>

          {(isPending || isPartialPaid) && onApprove && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onApprove(investment);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Icon icon="lucide:check-circle-2" width="14" height="14" />
              <span>Proceed to Approve</span>
            </button>
          )}
        </div>
      </div>

      {/* In-App Document Preview Modal */}
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
