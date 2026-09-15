"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "../../lib/api";
import DocumentViewerModal from "../common/DocumentViewerModal";
import { formatLocation } from "../../lib/locationUtils";
import {
  getInvestmentStatusBadge,
  formatStatus,
  formatCurrency,
  formatDate,
  normalizePaymentProofs,
  getPaymentProofMeta,
} from "../../lib/formatUtils";

function getStatusBadge(status) {
  return getInvestmentStatusBadge(status);
}

function formatDocStatus(s) {
  if (!s || s === "NOT_UPLOADED") return "Not Uploaded";
  switch (s.toUpperCase()) {
    case "APPROVED":
    case "VERIFIED":
      return "Approved";
    case "PENDING":
    case "PENDING_VERIFICATION":
      return "Pending Verification";
    case "UNDER_REVIEW":
      return "Under Review";
    case "REJECTED":
      return "Rejected";
    default:
      return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

function getDocStatusBadge(s) {
  switch (s?.toUpperCase()) {
    case "APPROVED":
    case "VERIFIED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "PENDING":
    case "PENDING_VERIFICATION":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "UNDER_REVIEW":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "REJECTED":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

export default function InvestmentDetailModal({
  isOpen,
  onClose,
  investment: initialInvestment,
  onApprove,
  onReject,
  onRefund,
  onWithdrawal,
}) {
  const [investment, setInvestment] = useState(initialInvestment);
  const [userDocs, setUserDocs] = useState(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Sync state & fetch single fresh investment details if ID exists
  useEffect(() => {
    if (!isOpen || !initialInvestment) {
      setInvestment(null);
      return;
    }
    setInvestment(initialInvestment);

    let isMounted = true;
    if (initialInvestment.id) {
      api.get(`/admin/investments/${initialInvestment.id}`)
        .then((res) => {
          if (isMounted && res?.success && res.data) {
            setInvestment((prev) => ({ ...prev, ...res.data }));
          }
        })
        .catch(() => {
          // fallback to initialInvestment
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialInvestment]);

  // Fetch investor KYC documents if user ID exists
  useEffect(() => {
    if (!isOpen || !investment?.user?.id) {
      setUserDocs(null);
      return;
    }

    if (investment.user.documents) {
      setUserDocs(investment.user.documents);
      return;
    }

    let isMounted = true;
    setIsLoadingDocs(true);

    api.get(`/admin/users/${investment.user.id}/documents`)
      .then((res) => {
        if (isMounted && res?.success && res.data) {
          setUserDocs(res.data.documents || res.data);
        }
      })
      .catch(() => {
        // ignore if not available
      })
      .finally(() => {
        if (isMounted) setIsLoadingDocs(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, investment?.user?.id, investment?.user?.documents]);

  if (!isOpen || !investment) return null;

  const statusBadge = getStatusBadge(investment.status);
  const isPending = investment.status === "PENDING";
  const isPartialPaid = investment.status === "PARTIAL_PAID";
  const isRefundRequested = investment.status === "REFUND_REQUESTED";
  const isWithdrawalRequested = investment.status === "WITHDRAWAL_REQUESTED";
  const isRefunded = investment.status === "REFUNDED";

  const totalAmount = investment.totalAmount || 0;
  const paidAmount = investment.paidAmount || 0;
  const remainingDue = Math.max(0, totalAmount - paidAmount);
  const paymentPercentage = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;

  const aadhaar = userDocs?.aadhaar || userDocs?.AADHAAR || investment.user?.aadhaar;
  const pan = userDocs?.pan || userDocs?.PAN || investment.user?.pan;

  const isUserKycVerified = Boolean(
    investment.user?.isVerified ||
    investment.user?.kycStatus === "APPROVED" ||
    investment.user?.kycStatus === "VERIFIED" ||
    (aadhaar?.status?.toUpperCase() === "APPROVED" && pan?.status?.toUpperCase() === "APPROVED")
  );

  const isUserKycPending = Boolean(
    investment.user?.kycStatus === "PENDING" ||
    investment.user?.kycStatus === "PENDING_VERIFICATION" ||
    aadhaar?.status?.toUpperCase() === "PENDING" ||
    aadhaar?.status?.toUpperCase() === "PENDING_VERIFICATION" ||
    pan?.status?.toUpperCase() === "PENDING" ||
    pan?.status?.toUpperCase() === "PENDING_VERIFICATION"
  );

  const refundBank = investment.refundBankDetails;

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
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
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
              <Icon icon="lucide:receipt" width="20" height="20" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-gray-900 truncate">Investment Details</h3>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-md border ${statusBadge.className}`}>
                  <Icon icon={statusBadge.icon} width="13" height="13" />
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

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          {/* Withdrawal Request Alert Banner */}
          {isWithdrawalRequested && (
            <div className="p-4 bg-gradient-to-r from-rose-500/10 via-rose-50 to-white border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <Icon icon="lucide:hand-coins" width="20" height="20" />
                </div>
                <div>
                  <span className="text-xs font-bold text-rose-950 block">
                    User Requested Payout Withdrawal
                  </span>
                  <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                    The investor has requested withdrawal of their matured investment:{" "}
                    <strong className="text-rose-950 font-bold">
                      {formatCurrency(investment.currentValuation || investment.totalAmount)}
                    </strong>
                  </p>
                </div>
              </div>

              {onWithdrawal ? (
                <button
                  type="button"
                  onClick={() => onWithdrawal(investment)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer"
                >
                  <Icon icon="lucide:banknote" width="14" height="14" />
                  <span>Process Withdrawal</span>
                </button>
              ) : (
                <Link
                  href="/withdrawals"
                  onClick={onClose}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs shrink-0"
                >
                  <Icon icon="lucide:arrow-right" width="14" height="14" />
                  <span>Go to Withdrawals</span>
                </Link>
              )}
            </div>
          )}

          {/* Financial Breakdown Card with Payment Progress */}
          <div className="p-4 bg-gradient-to-br from-emerald-50/60 via-emerald-50/20 to-white border border-emerald-200/80 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
              <span className="text-xs font-semibold text-emerald-800">Total Investment Value</span>
              <span className="text-xl sm:text-2xl font-bold text-emerald-700 tabular-nums">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            {/* Matrix Numbers */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Units Booked</span>
                <span className="text-xs sm:text-sm font-bold text-gray-900 block">
                  {investment.units} Units
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5 truncate">
                  @{formatCurrency(investment.unitPriceAtTime)}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Paid So Far</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-700 block tabular-nums">
                  {formatCurrency(paidAmount)}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">
                  {paymentPercentage}% received
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Remaining Due</span>
                <span className="text-xs sm:text-sm font-bold text-amber-900 block tabular-nums">
                  {formatCurrency(remainingDue)}
                </span>
                <span className="text-[10px] text-amber-600 block mt-0.5">
                  {remainingDue === 0 ? "Fully Settled" : "Balance Due"}
                </span>
              </div>
            </div>

            {/* Payment Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                <span>Payment Settlement</span>
                <span className="font-bold text-emerald-700">{paymentPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    paymentPercentage >= 100 ? "bg-emerald-600" : "bg-amber-500"
                  }`}
                  style={{ width: `${paymentPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Fixed-Term & Guaranteed Return Card */}
          {(investment.maturityDate || investment.promisedReturnAmount !== undefined || investment.targetReturnAtTime !== undefined || investment.currentValuation || investment.remainingTermString || investment.property?.termPeriodYears) && (
            <div className="p-4 bg-gradient-to-br from-indigo-50/70 via-blue-50/30 to-white border border-indigo-200/80 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Icon icon="lucide:trending-up" width="16" height="16" className="text-indigo-600" />
                  <span>Fixed-Term & Guaranteed Return</span>
                </span>

                {investment.isMatured ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <Icon icon="lucide:check-circle-2" width="11" height="11" />
                    <span>Matured</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    <Icon icon="lucide:lock" width="11" height="11" />
                    <span>Term Lock-in Active</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Total Current Valuation */}
                <div className="p-3 bg-white rounded-xl border border-indigo-100/90 shadow-2xs flex flex-col justify-between min-h-[72px]">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">
                      Current Valuation
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">Invested + Returns</span>
                  </div>
                  <span className="text-base sm:text-lg font-bold text-indigo-950 block tabular-nums mt-0.5">
                    {formatCurrency(
                      investment.currentValuation ??
                      ((investment.totalAmount || 0) + (investment.promisedReturnAmount || 0))
                    )}
                  </span>
                  <span className="text-[11px] text-gray-500 block mt-0.5">
                    Initial: <strong className="font-semibold text-gray-700">{formatCurrency(investment.totalAmount || 0)}</strong>
                  </span>
                </div>

                {/* Promised Return Profit */}
                <div className="p-3 bg-white rounded-xl border border-indigo-100/90 shadow-2xs flex flex-col justify-between min-h-[72px]">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                      Promised Return
                    </span>
                    {(investment.targetReturnAtTime !== undefined && investment.targetReturnAtTime !== null) ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        {investment.targetReturnAtTime}% Locked
                      </span>
                    ) : investment.property?.targetReturn ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        {investment.property.targetReturn}% Target
                      </span>
                    ) : null}
                  </div>
                  <span className="text-base sm:text-lg font-bold text-emerald-700 block tabular-nums mt-0.5">
                    {formatCurrency(
                      investment.promisedReturnAmount !== undefined && investment.promisedReturnAmount !== null
                        ? investment.promisedReturnAmount
                        : 0
                    )}
                  </span>
                  <span className="text-[11px] text-emerald-600 block mt-0.5 font-medium">
                    Calculated Profit
                  </span>
                </div>

                {/* Maturity Date */}
                <div className="p-3 bg-white rounded-xl border border-indigo-100/90 shadow-2xs flex flex-col justify-between min-h-[72px]">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                      Maturity Date
                    </span>
                    {investment.property?.termPeriodYears && (
                      <span className="text-[10px] font-medium text-gray-500">
                        {investment.property.termPeriodYears} Years Term
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-gray-900 block mt-0.5 whitespace-normal">
                    {investment.maturityDate ? formatDate(investment.maturityDate) : "Pending Approval"}
                  </span>
                  <span className="text-[11px] text-gray-400 block mt-0.5">
                    {investment.isMatured ? "Matured date reached" : "Lock-in completion date"}
                  </span>
                </div>

                {/* Remaining Lock-in Term */}
                <div className="p-3 bg-white rounded-xl border border-indigo-100/90 shadow-2xs flex flex-col justify-between min-h-[72px]">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                      Remaining Term
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                      investment.isMatured
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-indigo-50 text-indigo-700 border-indigo-200"
                    }`}>
                      {investment.isMatured ? "Completed" : "In Lock-in"}
                    </span>
                  </div>
                  <span className={`text-xs sm:text-sm font-bold block mt-0.5 whitespace-normal break-words ${
                    investment.isMatured ? "text-emerald-700" : "text-gray-900"
                  }`}>
                    {investment.remainingTermString || (investment.isMatured ? "Matured" : "Active Lock-in")}
                  </span>
                  <span className="text-[11px] text-gray-400 block mt-0.5">
                    {investment.isMatured ? "Eligible for withdrawal" : "Time until maturity"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bank Account Details Card (For PARTIAL_PAID, REFUND_REQUESTED, WITHDRAWAL_REQUESTED, REFUNDED or any investment with bank info) */}
          {(isPartialPaid || isRefundRequested || isWithdrawalRequested || isRefunded || refundBank?.accountNumber || refundBank?.bankName) && (refundBank?.accountNumber || refundBank?.bankName || refundBank?.accountName) && (
            <div className="p-4 bg-purple-50/60 border border-purple-200/90 rounded-2xl flex flex-col gap-3 shadow-2xs">
              {/* Header */}
              <div className="flex items-center justify-between gap-2 border-b border-purple-200/70 pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Icon icon="lucide:building-2" width="15" height="15" />
                  </div>
                  <span className="text-xs font-bold text-purple-950 truncate">
                    Investor Bank Account
                  </span>
                </div>

                <span className="text-[10px] font-bold text-purple-700 bg-purple-100/90 border border-purple-200/80 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                  {isRefunded
                    ? "Refund Completed"
                    : isWithdrawalRequested
                    ? "Withdrawal Account"
                    : isRefundRequested
                    ? "Refund Requested"
                    : isPartialPaid
                    ? "Bank on File"
                    : "Bank on File"}
                </span>
              </div>

              {/* 2x2 Grid with balanced cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* Account Name */}
                <div className="bg-white p-3 rounded-xl border border-purple-100/90 shadow-2xs flex flex-col justify-between min-h-[62px]">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                    Account Name
                  </span>
                  <span className="font-bold text-gray-900 text-xs truncate mt-1" title={refundBank.accountName || investment.user?.fullName}>
                    {refundBank.accountName || investment.user?.fullName || "N/A"}
                  </span>
                </div>

                {/* Bank Name */}
                <div className="bg-white p-3 rounded-xl border border-purple-100/90 shadow-2xs flex flex-col justify-between min-h-[62px]">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                    Bank Name
                  </span>
                  <span className="font-bold text-gray-900 text-xs truncate mt-1" title={refundBank.bankName}>
                    {refundBank.bankName || "N/A"}
                  </span>
                </div>

                {/* Account Number */}
                <div className="bg-white p-3 rounded-xl border border-purple-100/90 shadow-2xs flex flex-col justify-between min-h-[62px]">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      Account Number
                    </span>
                    {refundBank.accountNumber && (
                      <button
                        type="button"
                        onClick={() => handleCopy(refundBank.accountNumber, "Account Number")}
                        className="text-[10px] font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Icon icon={copiedField === "Account Number" ? "lucide:check" : "lucide:copy"} width="11" height="11" />
                        <span>{copiedField === "Account Number" ? "Copied" : "Copy"}</span>
                      </button>
                    )}
                  </div>
                  <span className="font-mono font-bold text-gray-900 text-xs tracking-wider truncate mt-1">
                    {refundBank.accountNumber || "N/A"}
                  </span>
                </div>

                {/* IFSC Code */}
                <div className="bg-white p-3 rounded-xl border border-purple-100/90 shadow-2xs flex flex-col justify-between min-h-[62px]">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      IFSC Code
                    </span>
                    {refundBank.ifscCode && (
                      <button
                        type="button"
                        onClick={() => handleCopy(refundBank.ifscCode, "IFSC Code")}
                        className="text-[10px] font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Icon icon={copiedField === "IFSC Code" ? "lucide:check" : "lucide:copy"} width="11" height="11" />
                        <span>{copiedField === "IFSC Code" ? "Copied" : "Copy"}</span>
                      </button>
                    )}
                  </div>
                  <span className="font-mono font-bold text-gray-900 text-xs tracking-wider uppercase truncate mt-1">
                    {refundBank.ifscCode || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* User Information Card */}
          <div className="p-4 bg-gray-50/80 border border-gray-200 rounded-2xl flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Icon icon="lucide:user" width="15" height="15" className="text-gray-400" />
                <span>Investor Details</span>
              </span>
              {investment.user?.id && (
                <Link
                  href={`/users/${investment.user.id}`}
                  className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>View User Profile</span>
                  <Icon icon="lucide:external-link" width="12" height="12" />
                </Link>
              )}
            </div>

            <div className="text-xs space-y-2 bg-white p-3.5 rounded-xl border border-gray-100">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-gray-500 font-medium shrink-0">Name:</span>
                <span className="font-semibold text-gray-900">{investment.user?.fullName || "Unnamed User"}</span>
              </div>
              {investment.user?.phone && (
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-gray-500 font-medium shrink-0">Phone:</span>
                  <span className="font-semibold text-gray-800">{investment.user.phone}</span>
                </div>
              )}
              {investment.user?.email && (
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-gray-500 font-medium shrink-0">Email:</span>
                  <span className="font-semibold text-gray-800 break-all">{investment.user.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* User KYC Documents Verification Status Card */}
          <div className="p-4 bg-gray-50/80 border border-gray-200 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Icon icon="lucide:shield-check" width="15" height="15" className="text-primary" />
                <span>User Document & KYC Status</span>
              </span>
              {isUserKycVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Icon icon="lucide:check-circle-2" width="12" height="12" />
                  <span>KYC Verified</span>
                </span>
              ) : isUserKycPending ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Icon icon="lucide:clock" width="12" height="12" />
                  <span>KYC Pending Review</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                  <Icon icon="lucide:alert-triangle" width="12" height="12" />
                  <span>KYC Incomplete</span>
                </span>
              )}
            </div>

            {isLoadingDocs ? (
              <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-2.5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
              </div>
            ) : (
              <div className="bg-white p-3.5 rounded-xl border border-gray-100 flex flex-col gap-2.5 text-xs">
                {/* Aadhaar Item */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Icon icon="lucide:file-text" width="13" height="13" />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800 block">Aadhaar Card</span>
                      {aadhaar?.documentNumber && (
                        <span className="text-[10px] text-gray-400 font-mono block">
                          No: {aadhaar.documentNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getDocStatusBadge(aadhaar?.status)}`}>
                    {formatDocStatus(aadhaar?.status)}
                  </span>
                </div>

                {/* PAN Item */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Icon icon="lucide:credit-card" width="13" height="13" />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800 block">PAN Card</span>
                      {pan?.documentNumber && (
                        <span className="text-[10px] text-gray-400 font-mono block">
                          No: {pan.documentNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getDocStatusBadge(pan?.status)}`}>
                    {formatDocStatus(pan?.status)}
                  </span>
                </div>
              </div>
            )}

            {/* Quick Action to KYC queue */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-gray-500">Need to inspect or approve documents?</span>
              <Link
                href={`/kyc/pending?search=${encodeURIComponent(investment.user?.phone || investment.user?.fullName || "")}`}
                className="font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Go to KYC Queue</span>
                <Icon icon="lucide:arrow-right" width="12" height="12" />
              </Link>
            </div>
          </div>

          {/* Property Information Card */}
          <div className="p-4 bg-gray-50/80 border border-gray-200 rounded-2xl flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Icon icon="lucide:building-2" width="15" height="15" className="text-gray-400" />
                <span>Linked Property</span>
              </span>
              {investment.property?.id && (
                <Link
                  href={`/property/${investment.property.id}`}
                  className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>View Property Page</span>
                  <Icon icon="lucide:external-link" width="12" height="12" />
                </Link>
              )}
            </div>

            <div className="text-xs space-y-2 bg-white p-3.5 rounded-xl border border-gray-100">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-gray-500 font-medium shrink-0">Property Title:</span>
                <span className="font-semibold text-gray-900">{investment.property?.title || "Property"}</span>
              </div>
              {investment.property?.location && (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-gray-500 font-medium shrink-0">Location:</span>
                  <span className="font-semibold text-gray-800 leading-relaxed break-words">
                    {formatLocation(investment.property.location)}
                  </span>
                </div>
              )}
              {investment.property?.category && (
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-gray-500 font-medium shrink-0">Category:</span>
                  <span className="font-semibold text-gray-800 uppercase">{investment.property.category}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Proof / Transaction Receipt Card */}
          {(() => {
            const proofs = normalizePaymentProofs(investment);
            const proofCount = proofs.length;

            return (
              <div className="p-4 bg-gray-50/80 border border-gray-200 rounded-2xl flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Icon icon="lucide:receipt-text" width="15" height="15" className="text-primary" />
                    <span>Payment Proof & Verification</span>
                  </span>

                  {proofCount > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <Icon icon="lucide:file-check" width="12" height="12" />
                      <span>{proofCount} {proofCount === 1 ? "Proof Attached" : "Proofs Attached"}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                      <span>No Proof Uploaded</span>
                    </span>
                  )}
                </div>

                {proofCount === 0 ? (
                  <div className="bg-white p-3.5 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-400">
                      No payment proof image or receipt was submitted with this booking.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-0.5">
                    {proofs.map((proof, idx) => {
                      const meta = getPaymentProofMeta(proof);
                      if (!meta) return null;

                      if (meta.type === "razorpay") {
                        return (
                          <div
                            key={idx}
                            className="bg-white p-3.5 rounded-xl border border-blue-100 flex items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                                <Icon icon="lucide:credit-card" width="20" height="20" />
                              </div>
                              <div>
                                <span className="font-semibold text-gray-900 text-xs block">
                                  Paid via Razorpay
                                </span>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                  Payment was captured directly through the Razorpay payment gateway.
                                </p>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                              <Icon icon="lucide:shield-check" width="13" height="13" />
                              <span>Paid via Razorpay</span>
                            </span>
                          </div>
                        );
                      }

                      if (meta.type === "cash") {
                        return (
                          <div
                            key={idx}
                            className="bg-white p-3.5 rounded-xl border border-purple-100 flex items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                                <Icon icon="lucide:banknote" width="20" height="20" />
                              </div>
                              <div>
                                <span className="font-semibold text-gray-900 text-xs block">
                                  Cash Payment (Admin)
                                </span>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                  This investment was created directly by an Admin with cash settlement.
                                </p>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                              <Icon icon="lucide:user-check" width="13" height="13" />
                              <span>Cash Payment (Admin)</span>
                            </span>
                          </div>
                        );
                      }

                      const proofTitle = proofCount > 1 ? `Payment Proof Receipt #${idx + 1}` : "Payment Transfer Receipt";

                      return (
                        <div
                          key={idx}
                          className="bg-white p-3.5 rounded-xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                        >
                          <div
                            onClick={() =>
                              setViewingDoc({
                                url: meta.url,
                                title: proofTitle,
                                subtitle: `Investor: ${investment.user?.fullName || "User"} • ${investment.property?.title || "Property"}`,
                              })
                            }
                            className="flex items-center gap-3 min-w-0 cursor-pointer group"
                          >
                            <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center relative group-hover:border-primary transition-colors">
                              <img
                                src={meta.url}
                                alt={proofTitle}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-gray-900 group-hover:text-primary transition-colors text-xs block truncate">
                                {proofTitle}
                              </span>
                              <span className="text-[11px] text-gray-400 block truncate max-w-[200px]">
                                Click to preview receipt in modal
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setViewingDoc({
                                  url: meta.url,
                                  title: proofTitle,
                                  subtitle: `Investor: ${investment.user?.fullName || "User"} • ${investment.property?.title || "Property"}`,
                                })
                              }
                              className="px-3 py-1.5 bg-gray-900 text-white hover:bg-gray-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Icon icon="lucide:eye" width="13" height="13" />
                              <span>Preview Proof</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Payment History & Invoices Section */}
          {(() => {
            const history = Array.isArray(investment.paymentHistory) ? investment.paymentHistory : [];
            const invoices = Array.isArray(investment.invoices) ? investment.invoices : [];

            // Normalize payment list: prefer paymentHistory objects, fallback to invoices array if needed
            let items = [...history];
            if (items.length === 0 && invoices.length > 0) {
              items = invoices.map((invUrl, idx) => ({
                date: investment.updatedAt || investment.createdAt,
                amount: invoices.length === 1 ? (investment.paidAmount || investment.totalAmount) : 0,
                invoiceUrl: typeof invUrl === "string" ? invUrl : invUrl?.url || invUrl?.invoiceUrl,
              }));
            }

            const totalInvoicesCount = items.length;

            return (
              <div className="p-4 bg-gray-50/80 border border-gray-200 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Icon icon="lucide:file-spreadsheet" width="16" height="16" className="text-primary" />
                    <span>Payment History & Invoices</span>
                  </span>

                  {totalInvoicesCount > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Icon icon="lucide:receipt" width="12" height="12" />
                      <span>
                        {totalInvoicesCount} {totalInvoicesCount === 1 ? "Invoice Generated" : "Invoices Generated"}
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                      <span>No Invoices Yet</span>
                    </span>
                  )}
                </div>

                {totalInvoicesCount === 0 ? (
                  <div className="bg-white p-3.5 rounded-xl border border-gray-100 text-xs text-gray-500">
                    <p className="leading-relaxed font-medium">
                      No approved payment records or PDF invoices generated yet.
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      PDF invoices and payment installments are automatically recorded here whenever an admin approves a payment or creates a cash investment.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-0.5">
                    {items.map((payment, idx) => {
                      const amountVal = Number(payment.amount) || 0;
                      const dateVal = payment.date;
                      const invoiceUrl = payment.invoiceUrl || (typeof invoices[idx] === "string" ? invoices[idx] : null);
                      const paymentTitle = items.length > 1 ? `Payment #${idx + 1}` : "Payment #1";

                      return (
                        <div
                          key={idx}
                          className="bg-white p-3.5 rounded-xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs hover:border-emerald-200 transition-colors"
                        >
                          {/* Payment info with Cash / Bank Icon */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold shrink-0">
                              <Icon icon="lucide:banknote" width="20" height="20" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-gray-900 text-xs sm:text-sm tabular-nums">
                                  ₹{amountVal.toLocaleString("en-IN")}
                                </span>
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {paymentTitle}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                                <Icon icon="lucide:calendar" width="12" height="12" className="text-gray-400 shrink-0" />
                                <span>{dateVal ? formatDate(dateVal, true) : "Date N/A"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Invoice Action Buttons (Preview Modal & Direct Download) */}
                          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-50">
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
                                  title="Click to preview invoice PDF"
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
                                  title="Download / Open PDF directly"
                                >
                                  <Icon icon="lucide:download" width="14" height="14" />
                                </a>
                              </>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">
                                Invoice pending
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Bank Transfer Payout Receipt Card (For WITHDRAWN / REFUNDED) */}
          {investment.refundProofUrl && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col gap-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Icon icon="lucide:file-check" width="16" height="16" className="text-emerald-600" />
                  <span>Bank Transfer Payout Receipt Proof</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Icon icon="lucide:check-circle-2" width="11" height="11" />
                  <span>Payout Processed</span>
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div
                  onClick={() =>
                    setViewingDoc({
                      url: investment.refundProofUrl,
                      title: "Bank Transfer Payout Receipt",
                      subtitle: `Payout for ${investment.user?.fullName || "Investor"} • ${investment.property?.title || "Property"}`,
                    })
                  }
                  className="flex items-center gap-3 min-w-0 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-105 transition-transform">
                    <Icon icon="lucide:file-text" width="20" height="20" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-900 group-hover:text-primary transition-colors text-xs block truncate">
                      Bank Transfer Payout Receipt
                    </span>
                    <span className="text-[11px] text-gray-400 block truncate">
                      Uploaded by Admin during payout processing
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setViewingDoc({
                      url: investment.refundProofUrl,
                      title: "Bank Transfer Payout Receipt",
                      subtitle: `Payout for ${investment.user?.fullName || "Investor"} • ${investment.property?.title || "Property"}`,
                    })
                  }
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer shrink-0"
                >
                  <Icon icon="lucide:eye" width="13" height="13" />
                  <span>View Payout Receipt</span>
                </button>
              </div>
            </div>
          )}

          {/* Digital Investment Agreement Card */}
          <div className="p-4 bg-gray-50/80 border border-gray-200 rounded-2xl flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Icon icon="lucide:file-signature" width="15" height="15" className="text-primary" />
                <span>Investment Agreement</span>
              </span>

              {investment.status === "APPROVED" && (
                investment.agreementUrl ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Icon icon="lucide:check-circle-2" width="12" height="12" />
                    <span>Agreement Signed</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Icon icon="lucide:clock" width="12" height="12" />
                    <span>Pending User Signature</span>
                  </span>
                )
              )}
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              {investment.agreementUrl ? (
                <>
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-900 block">Digitally Signed Agreement</span>
                    <span className="text-[11px] text-gray-400 block mt-0.5">
                      Legal investment agreement signed and generated.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setViewingDoc({
                        url: investment.agreementUrl,
                        title: "Signed Investment Agreement",
                        subtitle: `Investor: ${investment.user?.fullName || "User"} • ${investment.property?.title || "Property"}`,
                      })
                    }
                    className="px-3.5 py-1.5 bg-primary text-white hover:bg-primary/90 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-2xs shrink-0 cursor-pointer"
                  >
                    <Icon icon="lucide:file-text" width="14" height="14" />
                    <span>Preview Agreement</span>
                    <Icon icon="lucide:eye" width="12" height="12" />
                  </button>
                </>
              ) : investment.status === "APPROVED" ? (
                <div className="text-gray-600 text-[11px] leading-relaxed">
                  <span className="font-semibold text-amber-800 block">Awaiting Mobile Signature:</span>
                  <span>The investment is approved. The user has received a push notification and needs to complete digital signature on the mobile app.</span>
                </div>
              ) : (
                <div className="text-gray-400 text-[11px]">
                  <span>Agreement will become available after full payment approval.</span>
                </div>
              )}
            </div>
          </div>

          {/* Refund Proof Receipt Card (if refunded or refundProofUrl present) */}
          {(investment.status === "REFUNDED" || investment.refundProofUrl) && (
            <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-2xl flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <Icon icon="lucide:file-check-2" width="15" height="15" className="text-purple-600" />
                  <span>Refund Transfer Proof</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  <Icon icon="lucide:check-check" width="11" height="11" />
                  <span>Refunded</span>
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-purple-100 flex items-center justify-between gap-3 text-xs">
                {investment.refundProofUrl ? (
                  <>
                    <div className="min-w-0">
                      <span className="font-semibold text-gray-900 block truncate">
                        Bank Transfer Receipt
                      </span>
                      <span className="text-[11px] text-gray-500 block truncate">
                        Proof uploaded by Admin during refund processing.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setViewingDoc({
                          url: investment.refundProofUrl,
                          title: "Refund Transfer Receipt",
                          subtitle: `Investor: ${investment.user?.fullName || "User"} • ${investment.property?.title || "Property"}`,
                        })
                      }
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-2xs shrink-0 cursor-pointer"
                    >
                      <Icon icon="lucide:eye" width="13" height="13" />
                      <span>Preview Receipt</span>
                    </button>
                  </>
                ) : (
                  <span className="text-gray-400 text-[11px]">
                    Refund processed without attached document URL.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Admin Remark (if present) */}
          {investment.adminRemark && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-800 flex items-start gap-2">
              <Icon icon="lucide:alert-circle" width="16" height="16" className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Admin Remark: </span>
                <span>{investment.adminRemark}</span>
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
            <span>Submitted On:</span>
            <span>{formatDate(investment.createdAt)}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {/* Pending State Actions */}
            {isPending && (
              <>
                <button
                  type="button"
                  onClick={() => onReject && onReject(investment)}
                  className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Icon icon="lucide:x-circle" width="14" height="14" />
                  <span>Reject</span>
                </button>

                <button
                  type="button"
                  onClick={() => onApprove && onApprove(investment)}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Icon icon="lucide:check-circle-2" width="15" height="15" />
                  <span>Approve / Partial</span>
                </button>
              </>
            )}

            {/* Partial Paid State Actions */}
            {isPartialPaid && (
              <button
                type="button"
                onClick={() => onApprove && onApprove(investment)}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Icon icon="lucide:plus-circle" width="15" height="15" />
                <span>Receive Next Payment</span>
              </button>
            )}

            {/* Refund Requested Actions */}
            {isRefundRequested && (
              <button
                type="button"
                onClick={() => onRefund && onRefund(investment)}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Icon icon="lucide:rotate-ccw" width="15" height="15" />
                <span>Process Refund</span>
              </button>
            )}

            {/* Withdrawal Requested Actions */}
            {isWithdrawalRequested && onWithdrawal && (
              <button
                type="button"
                onClick={() => onWithdrawal(investment)}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Icon icon="lucide:banknote" width="15" height="15" />
                <span>Process Withdrawal</span>
              </button>
            )}
          </div>
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

