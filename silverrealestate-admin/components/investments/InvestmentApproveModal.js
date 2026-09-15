"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import DocumentViewerModal from "../common/DocumentViewerModal";
import { formatLocation } from "../../lib/locationUtils";
import {
  formatCurrency,
  formatDate,
  getUserKycBadge,
  normalizePaymentProofs,
  getPaymentProofMeta,
} from "../../lib/formatUtils";

export default function InvestmentApproveModal({
  isOpen,
  onClose,
  investment,
  onSuccess,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [amountReceived, setAmountReceived] = useState("");

  const totalAmount = investment?.totalAmount || 0;
  const previousPaid = investment?.paidAmount || 0;
  const remainingDue = Math.max(0, totalAmount - previousPaid);

  // Initialize amountReceived to remainingDue when investment changes
  useEffect(() => {
    if (investment) {
      const due = Math.max(0, (investment.totalAmount || 0) - (investment.paidAmount || 0));
      setAmountReceived(String(due));
    }
  }, [investment]);

  if (!isOpen || !investment) return null;

  const kycBadge = getUserKycBadge(investment.user);
  const numericAmountReceived = Number(amountReceived) || 0;
  const isOverRemaining = numericAmountReceived > remainingDue;
  const projectedPaid = previousPaid + numericAmountReceived;
  const projectedRemaining = Math.max(0, totalAmount - projectedPaid);
  const isFullApproval = projectedPaid >= totalAmount && totalAmount > 0;

  const handleApprove = async (e) => {
    if (e) e.preventDefault();
    if (numericAmountReceived <= 0) {
      toast.error("Please enter a valid amount received (greater than ₹0).");
      return;
    }

    if (numericAmountReceived > remainingDue) {
      toast.error(`Approve amount cannot be greater than the remaining balance (${formatCurrency(remainingDue)}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.patch(`/admin/investments/${investment.id}/approve`, {
        amountReceived: numericAmountReceived,
      });

      if (res?.success) {
        toast.success(
          res.message ||
            (isFullApproval
              ? "Investment fully approved! User notified to sign agreement."
              : `Partial payment of ${formatCurrency(numericAmountReceived)} recorded!`)
        );
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res?.message || "Failed to approve investment");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred while approving investment");
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
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3 bg-emerald-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Icon icon="lucide:shield-check" width="22" height="22" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                {isFullApproval ? "Confirm & Full Approve" : "Approve Partial / Full Payment"}
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
        <form onSubmit={handleApprove} className="p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          {/* Summary Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col gap-3">
            {/* Investor & Property Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-gray-200/80 text-xs">
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Investor</span>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${kycBadge.className}`}>
                    <Icon icon={kycBadge.icon} width="10" height="10" />
                    <span>{kycBadge.label}</span>
                  </span>
                </div>
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

            {/* Financial Numbers Matrix */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-gray-200/70">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Total Value</span>
                <span className="text-xs sm:text-sm font-bold text-gray-900 block tabular-nums">
                  {formatCurrency(totalAmount)}
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  ({investment.units} units)
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-gray-200/70">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Already Paid</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-700 block tabular-nums">
                  {formatCurrency(previousPaid)}
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  {totalAmount > 0 ? `${Math.round((previousPaid / totalAmount) * 100)}%` : "0%"}
                </span>
              </div>

              <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-amber-700 block mb-0.5">Remaining Due</span>
                <span className="text-xs sm:text-sm font-bold text-amber-900 block tabular-nums">
                  {formatCurrency(remainingDue)}
                </span>
                <span className="text-[10px] text-amber-600 block mt-0.5">
                  to complete
                </span>
              </div>
            </div>

            {/* Payment Proof Quick Check */}
            {(() => {
              const proofs = normalizePaymentProofs(investment);
              if (proofs.length === 0) return null;

              return (
                <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-200/80 text-xs">
                  <span className="text-gray-500 font-medium">Attached Payment Proofs:</span>
                  <div className="flex flex-wrap gap-2">
                    {proofs.map((proof, idx) => {
                      const meta = getPaymentProofMeta(proof);
                      if (!meta) return null;

                      if (meta.type === "razorpay") {
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                          >
                            <Icon icon="lucide:credit-card" width="12" height="12" />
                            <span>Paid via Razorpay</span>
                          </span>
                        );
                      }

                      if (meta.type === "cash") {
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200"
                          >
                            <Icon icon="lucide:banknote" width="12" height="12" />
                            <span>Cash Payment (Admin)</span>
                          </span>
                        );
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setViewingDoc({
                              url: meta.url,
                              title: proofs.length > 1 ? `Payment Proof #${idx + 1}` : "Payment Proof Receipt",
                              subtitle: `Investor: ${investment.user?.fullName || "User"} • ${investment.property?.title || "Property"}`,
                            })
                          }
                          className="inline-flex items-center gap-1 text-primary hover:underline font-bold cursor-pointer bg-white px-2 py-0.5 rounded border border-gray-200 hover:border-primary transition-colors"
                        >
                          <Icon icon="lucide:file-text" width="13" height="13" />
                          <span>{proofs.length > 1 ? `Receipt #${idx + 1}` : "Preview Receipt"}</span>
                          <Icon icon="lucide:eye" width="11" height="11" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Existing Payment History & Invoices (if partial payments exist) */}
            {(() => {
              const history = Array.isArray(investment.paymentHistory) ? investment.paymentHistory : [];
              if (history.length === 0) return null;

              return (
                <div className="flex flex-col gap-2 pt-2.5 border-t border-gray-200/80 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-bold flex items-center gap-1 text-[11px]">
                      <Icon icon="lucide:history" width="13" height="13" className="text-emerald-600" />
                      <span>Previous Payments Recorded ({history.length}):</span>
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                    {history.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-2 rounded-lg border border-gray-200/80 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <Icon icon="lucide:banknote" width="13" height="13" />
                          </div>
                          <span className="font-bold text-gray-900 tabular-nums text-xs">
                            ₹{(Number(item.amount) || 0).toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] text-gray-400 truncate">
                            • {item.date ? formatDate(item.date) : "N/A"}
                          </span>
                        </div>

                        {item.invoiceUrl && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setViewingDoc({
                                  url: item.invoiceUrl,
                                  title: `Tax Invoice - Payment #${idx + 1} (₹${(Number(item.amount) || 0).toLocaleString("en-IN")})`,
                                  subtitle: `Investor: ${investment.user?.fullName || "User"} • ${investment.property?.title || "Property"}`,
                                })
                              }
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                              title="Click to view invoice PDF"
                            >
                              <Icon icon="lucide:file-text" width="12" height="12" />
                              <span>View Invoice #{idx + 1}</span>
                              <Icon icon="lucide:eye" width="12" height="12" />
                            </button>

                            <a
                              href={item.invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="p-1 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-lg transition-colors cursor-pointer"
                              title="Download Invoice PDF"
                            >
                              <Icon icon="lucide:download" width="13" height="13" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Amount Received Input Section */}
          <div className="p-4 bg-white border border-gray-200 rounded-2xl flex flex-col gap-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <label htmlFor="amountReceivedInput" className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Icon icon="lucide:coins" width="16" height="16" className="text-primary" />
                <span>Actual Amount Received in Bank (₹)</span>
              </label>
              <span className="text-[11px] text-gray-500 font-medium">
                Entered: <span className="font-bold text-gray-900">{formatCurrency(numericAmountReceived)}</span>
              </span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 font-bold text-sm">
                ₹
              </div>
              <input
                id="amountReceivedInput"
                type="number"
                min="1"
                max={remainingDue}
                step="1"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="Enter amount received..."
                className={`w-full pl-8 pr-4 py-2.5 rounded-xl border outline-none text-sm font-bold text-gray-900 tabular-nums transition-all ${
                  isOverRemaining
                    ? "border-red-500 bg-red-50/30 focus:border-red-600 focus:ring-2 focus:ring-red-200"
                    : "border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
                }`}
                required
              />
            </div>

            {/* Error when entered amount exceeds remaining */}
            {isOverRemaining && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium animate-in fade-in">
                <Icon icon="lucide:alert-circle" width="16" height="16" className="shrink-0 text-red-600" />
                <span>
                  Approval amount cannot exceed remaining due of <strong className="font-bold">{formatCurrency(remainingDue)}</strong>.
                </span>
              </div>
            )}

            {/* Quick Fill Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-gray-400 font-medium">Quick Fill:</span>
              <button
                type="button"
                onClick={() => setAmountReceived(String(remainingDue))}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  numericAmountReceived === remainingDue
                    ? "bg-primary text-white border-primary"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                Full Remaining ({formatCurrency(remainingDue)})
              </button>

              {remainingDue > 10000 && (
                <button
                  type="button"
                  onClick={() => setAmountReceived(String(Math.round(remainingDue / 2)))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    numericAmountReceived === Math.round(remainingDue / 2)
                      ? "bg-primary text-white border-primary"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  50% ({formatCurrency(Math.round(remainingDue / 2))})
                </button>
              )}
            </div>
          </div>

          {/* Dynamic Outcome Banner */}
          {numericAmountReceived > 0 && !isOverRemaining && (
            <div
              className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                isFullApproval
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-amber-50 border-amber-200 text-amber-900"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isFullApproval ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                <Icon icon={isFullApproval ? "lucide:check-circle-2" : "lucide:pie-chart"} width="18" height="18" />
              </div>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm">
                    {isFullApproval ? "Full Approval" : "Partial Payment Approval"}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[10px] font-bold ${
                      isFullApproval
                        ? "bg-emerald-200/70 text-emerald-800"
                        : "bg-amber-200/70 text-amber-800"
                    }`}
                  >
                    Status will become: {isFullApproval ? "APPROVED" : "PARTIAL_PAID"}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {isFullApproval ? (
                    <>
                      Cumulative payment reaches <strong>{formatCurrency(projectedPaid)}</strong> (100%).
                      The user will be notified to digitally sign their <strong>Investment Agreement</strong>.
                    </>
                  ) : (
                    <>
                      Cumulative payment will be <strong>{formatCurrency(projectedPaid)}</strong> of <strong>{formatCurrency(totalAmount)}</strong>.
                      Remaining balance due from user: <strong>{formatCurrency(projectedRemaining)}</strong>.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </form>

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
            disabled={isSubmitting || numericAmountReceived <= 0 || isOverRemaining}
            onClick={handleApprove}
            className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer ${
              isFullApproval
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {isSubmitting ? (
              <>
                <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                <span>Processing Approval...</span>
              </>
            ) : isFullApproval ? (
              <>
                <Icon icon="lucide:check-circle-2" width="16" height="16" />
                <span>Confirm & Full Approve</span>
              </>
            ) : (
              <>
                <Icon icon="lucide:check" width="16" height="16" />
                <span>Approve Partial Payment ({formatCurrency(numericAmountReceived)})</span>
              </>
            )}
          </button>
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

