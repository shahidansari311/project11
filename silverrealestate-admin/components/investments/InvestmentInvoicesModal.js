"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import DocumentViewerModal from "../common/DocumentViewerModal";
import { formatLocation } from "../../lib/locationUtils";
import {
  formatCurrency,
  formatDate,
  getInvestmentStatusBadge,
} from "../../lib/formatUtils";

export default function InvestmentInvoicesModal({
  isOpen,
  onClose,
  investment,
}) {
  const [viewingDoc, setViewingDoc] = useState(null);

  if (!isOpen || !investment) return null;

  const rawHistory = Array.isArray(investment.paymentHistory) ? investment.paymentHistory : [];
  const rawInvoices = Array.isArray(investment.invoices) ? investment.invoices : [];

  let items = [...rawHistory];
  if (items.length === 0 && rawInvoices.length > 0) {
    items = rawInvoices.map((invUrl, idx) => ({
      date: investment.updatedAt || investment.createdAt,
      amount: rawInvoices.length === 1 ? (investment.paidAmount || investment.totalAmount) : 0,
      invoiceUrl: typeof invUrl === "string" ? invUrl : invUrl?.url || invUrl?.invoiceUrl,
    }));
  }

  const invoiceCount = items.length;
  const statusBadge = getInvestmentStatusBadge(investment.status);
  const totalPaid = investment.paidAmount || 0;
  const totalAmount = investment.totalAmount || 0;
  const remainingDue = Math.max(0, totalAmount - totalPaid);

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
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Icon icon="lucide:file-spreadsheet" width="20" height="20" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-gray-900 truncate">Tax Invoices & Payment History</h3>
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

            {/* Financial Numbers */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-white p-2 rounded-xl border border-gray-200/70">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Total Value</span>
                <span className="text-xs font-bold text-gray-900 block tabular-nums">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              <div className="bg-white p-2 rounded-xl border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-0.5">Paid So Far</span>
                <span className="text-xs font-bold text-emerald-700 block tabular-nums">
                  {formatCurrency(totalPaid)}
                </span>
              </div>

              <div className="bg-white p-2 rounded-xl border border-amber-100">
                <span className="text-[10px] uppercase font-bold text-amber-700 block mb-0.5">Balance Due</span>
                <span className="text-xs font-bold text-amber-900 block tabular-nums">
                  {formatCurrency(remainingDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Invoices List Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <Icon icon="lucide:receipt" width="16" height="16" className="text-emerald-600" />
              <span>Generated Invoices & Installments</span>
            </span>

            {invoiceCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Icon icon="lucide:check-circle-2" width="12" height="12" />
                <span>{invoiceCount} {invoiceCount === 1 ? "Invoice Generated" : "Invoices Generated"}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                <span>No Invoices Yet</span>
              </span>
            )}
          </div>

          {/* Invoices List */}
          {invoiceCount === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-1">
                <Icon icon="lucide:file-x" width="24" height="24" />
              </div>
              <span className="font-bold text-gray-800 text-sm">No Invoices Generated Yet</span>
              <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                PDF tax invoices are automatically created and added here as soon as you approve a payment or create an investment.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((payment, idx) => {
                const amountVal = Number(payment.amount) || 0;
                const dateVal = payment.date;
                const invoiceUrl = payment.invoiceUrl || (typeof rawInvoices[idx] === "string" ? rawInvoices[idx] : null);
                const paymentTitle = items.length > 1 ? `Installment Payment #${idx + 1}` : "Full Payment (#1)";

                return (
                  <div
                    key={idx}
                    className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 shadow-2xs hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                          <Icon icon="lucide:banknote" width="16" height="16" />
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 text-xs sm:text-sm block">
                            {paymentTitle}
                          </span>
                          <span className="text-[11px] text-gray-400 block">
                            Tax Invoice PDF #{idx + 1}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-emerald-700 text-sm sm:text-base block tabular-nums">
                          ₹{amountVal.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-gray-400 block">
                          Approved Amount
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Icon icon="lucide:calendar" width="13" height="13" className="text-gray-400" />
                        <span>{dateVal ? formatDate(dateVal, true) : "Date N/A"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {invoiceUrl ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setViewingDoc({
                                  url: invoiceUrl,
                                  title: `Tax Invoice - ${paymentTitle} (₹${amountVal.toLocaleString("en-IN")})`,
                                  subtitle: `Investor: ${investment.user?.fullName || "User"} • ${investment.property?.title || "Property"}`,
                                })
                              }
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                              title="Preview PDF Invoice in Modal"
                            >
                              <Icon icon="lucide:file-text" width="13" height="13" />
                              <span>View Invoice #{idx + 1}</span>
                              <Icon icon="lucide:eye" width="13" height="13" />
                            </button>

                            <a
                              href={invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors cursor-pointer"
                              title="Download PDF"
                            >
                              <Icon icon="lucide:download" width="14" height="14" />
                            </a>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            Invoice pending generation
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
