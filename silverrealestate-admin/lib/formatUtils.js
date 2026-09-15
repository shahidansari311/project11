/**
 * Utility functions for formatting text, currency, and status badges across the application.
 * Ensures underscores are never exposed to the UI and all labels are formatted cleanly.
 */

/**
 * Replaces underscores with spaces and capitalizes each word.
 * e.g., "PARTIAL_PAID" -> "Partially Paid", "PENDING_VERIFICATION" -> "Pending Verification"
 */
export function formatStatus(status) {
  if (!status || typeof status !== "string") return "Unknown";

  const normalized = status.toUpperCase().trim();

  switch (normalized) {
    case "APPROVED":
    case "VERIFIED":
      return "Approved";
    case "PARTIAL_PAID":
    case "PARTIALLY_PAID":
      return "Partially Paid";
    case "REFUND_REQUESTED":
      return "Refund Requested";
    case "REFUNDED":
      return "Refunded";
    case "WITHDRAWAL_REQUESTED":
      return "Withdrawal Requested";
    case "WITHDRAWN":
    case "WITHDRAWAL_COMPLETED":
      return "Withdrawn";
    case "PENDING":
    case "PENDING_VERIFICATION":
      return "Pending Verification";
    case "PENDING_APPROVAL":
      return "Pending Approval";
    case "PENDING_PAYMENT":
      return "Pending Payment";
    case "REJECTED":
      return "Rejected";
    case "CANCELLED":
    case "CANCELED":
      return "Cancelled";
    case "AVAILABLE":
      return "Available";
    case "UNDER_CONSTRUCTION":
      return "Under Construction";
    case "READY_TO_MOVE":
      return "Ready to Move";
    case "SOLD_OUT":
      return "Sold Out";
    case "FUNDED":
      return "Funded";
    case "COMPLETED":
      return "Completed";
    case "UPCOMING":
      return "Upcoming";
    case "ACTIVE":
      return "Active";
    case "INACTIVE":
      return "Inactive";
    case "BLOCKED":
      return "Blocked";
    case "NOT_UPLOADED":
      return "Not Uploaded";
    case "UPLOADED":
      return "Uploaded";
    case "BUY_ON_BEHALF":
      return "Buy on Behalf";
    case "BANK_TRANSFER":
      return "Bank Transfer";
    case "UPI_PAYMENT":
      return "UPI Payment";
    case "CHEQUE":
      return "Cheque";
    case "NET_BANKING":
      return "Net Banking";
    default:
      // Strip underscores, convert to Title Case
      return normalized
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

/**
 * Returns badge styling and icon for an investment status
 */
export function getInvestmentStatusBadge(status) {
  const norm = (status || "").toUpperCase().trim();

  switch (norm) {
    case "APPROVED":
      return {
        label: "Approved",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: "lucide:check-circle-2",
      };
    case "PARTIAL_PAID":
    case "PARTIALLY_PAID":
      return {
        label: "Partially Paid",
        className: "bg-amber-50 text-amber-700 border-amber-200",
        icon: "lucide:pie-chart",
      };
    case "REFUND_REQUESTED":
      return {
        label: "Refund Requested",
        className: "bg-purple-50 text-purple-700 border-purple-200",
        icon: "lucide:rotate-ccw",
      };
    case "WITHDRAWAL_REQUESTED":
      return {
        label: "Withdrawal Requested",
        className: "bg-indigo-50 text-indigo-700 border-indigo-200",
        icon: "lucide:arrow-up-right",
      };
    case "REFUNDED":
    case "WITHDRAWN":
    case "WITHDRAWAL_COMPLETED":
      return {
        label: norm === "WITHDRAWN" || norm === "WITHDRAWAL_COMPLETED" ? "Withdrawn" : "Refunded",
        className: "bg-slate-100 text-slate-700 border-slate-200",
        icon: "lucide:check-check",
      };
    case "PENDING":
    case "PENDING_VERIFICATION":
      return {
        label: "Pending Verification",
        className: "bg-amber-50 text-amber-700 border-amber-200",
        icon: "lucide:clock",
      };
    case "REJECTED":
      return {
        label: "Rejected",
        className: "bg-red-50 text-red-700 border-red-200",
        icon: "lucide:x-circle",
      };
    case "CANCELLED":
    case "CANCELED":
      return {
        label: "Cancelled",
        className: "bg-gray-100 text-gray-600 border-gray-200",
        icon: "lucide:ban",
      };
    default:
      return {
        label: formatStatus(status),
        className: "bg-gray-100 text-gray-700 border-gray-200",
        icon: "lucide:help-circle",
      };
  }
}

/**
 * Formats a numeric value into INR Currency (e.g. ₹1,50,000)
 */
export function formatCurrency(val) {
  if (val === null || val === undefined || isNaN(val)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

/**
 * Formats a date string into readable format (e.g. Jan 15, 2026)
 */
export function formatDate(dateString, includeTime = false) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";

  if (includeTime) {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Computes KYC verification badge data for a given user object
 */
export function getUserKycBadge(user) {
  if (!user) {
    return {
      label: "No Data",
      className: "bg-gray-100 text-gray-500 border-gray-200",
      icon: "lucide:help-circle",
    };
  }

  const aadhaarStatus = user.documents?.aadhaar?.status || user.aadhaarStatus;
  const panStatus = user.documents?.pan?.status || user.panStatus;
  const kycStatus = user.kycStatus?.toUpperCase() || user.verificationStatus?.toUpperCase();

  if (
    user.isVerified ||
    kycStatus === "APPROVED" ||
    kycStatus === "VERIFIED" ||
    (aadhaarStatus === "APPROVED" && panStatus === "APPROVED")
  ) {
    return {
      label: "KYC Verified",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: "lucide:shield-check",
    };
  }

  if (
    kycStatus === "PENDING" ||
    kycStatus === "PENDING_VERIFICATION" ||
    kycStatus === "UNDER_REVIEW" ||
    aadhaarStatus === "PENDING" ||
    aadhaarStatus === "PENDING_VERIFICATION" ||
    panStatus === "PENDING" ||
    panStatus === "PENDING_VERIFICATION"
  ) {
    return {
      label: "KYC Pending",
      className: "bg-amber-50 text-amber-700 border-amber-200",
      icon: "lucide:clock",
    };
  }

  if (kycStatus === "REJECTED" || aadhaarStatus === "REJECTED" || panStatus === "REJECTED") {
    return {
      label: "KYC Rejected",
      className: "bg-red-50 text-red-700 border-red-200",
      icon: "lucide:alert-circle",
    };
  }

  return {
    label: "KYC Incomplete",
    className: "bg-gray-50 text-gray-600 border-gray-200",
    icon: "lucide:file-question",
  };
}

/**
 * Normalizes payment proofs from an investment object into an array of proofs.
 * Handles both new `paymentProofs` array and legacy `paymentProofUrl` string.
 */
export function normalizePaymentProofs(investment) {
  if (!investment) return [];
  if (Array.isArray(investment.paymentProofs) && investment.paymentProofs.length > 0) {
    return investment.paymentProofs.filter(Boolean);
  }
  if (investment.paymentProofUrl) {
    return [investment.paymentProofUrl];
  }
  return [];
}

/**
 * Returns metadata and display format for a payment proof entry.
 * Handles special cases: "razorpay_direct_payment", "admin_cash", or file URL.
 */
export function getPaymentProofMeta(proof) {
  if (!proof || typeof proof !== "string") return null;

  const normalized = proof.trim();
  if (normalized === "razorpay_direct_payment") {
    return {
      type: "razorpay",
      label: "Paid via Razorpay",
      shortLabel: "Razorpay",
      isSpecial: true,
      icon: "lucide:credit-card",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    };
  }

  if (normalized === "admin_cash") {
    return {
      type: "cash",
      label: "Cash Payment (Admin)",
      shortLabel: "Cash (Admin)",
      isSpecial: true,
      icon: "lucide:banknote",
      className: "bg-purple-50 text-purple-700 border-purple-200",
    };
  }

  return {
    type: "file",
    label: "Payment Receipt",
    shortLabel: "Proof",
    isSpecial: false,
    url: normalized,
    icon: "lucide:file-text",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
}
