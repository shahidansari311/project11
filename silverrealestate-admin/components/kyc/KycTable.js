"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";

function UserAvatar({ user }) {
  const [imgFailed, setImgFailed] = useState(false);
  const imgUrl = user?.profileImage || user?.profileUrl || user?.image || user?.avatar;

  if (imgUrl && !imgFailed) {
    return (
      <img
        src={imgUrl}
        alt={user?.fullName || "User"}
        onError={() => setImgFailed(true)}
        className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-200"
      />
    );
  }

  return (
    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
      {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
    </div>
  );
}

export default function KycTable({
  users = [],
  onVerify,
  onUpload,
}) {
  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
      case "VERIFIED":
        return {
          label: "Approved",
          className: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: "lucide:check-circle-2",
        };
      case "PENDING":
      case "PENDING_VERIFICATION":
        return {
          label: "Pending",
          className: "bg-amber-50 text-amber-700 border-amber-200",
          icon: "lucide:clock",
        };
      case "UNDER_REVIEW":
        return {
          label: "Under Review",
          className: "bg-blue-50 text-blue-700 border-blue-200",
          icon: "lucide:eye",
        };
      case "REJECTED":
        return {
          label: "Rejected",
          className: "bg-red-50 text-red-700 border-red-200",
          icon: "lucide:x-circle",
        };
      default:
        return {
          label: "Not Uploaded",
          className: "bg-gray-100 text-gray-600 border-gray-200",
          icon: "lucide:file-x",
        };
    }
  };

  const getOverallStatus = (aadhaarStatus, panStatus) => {
    if (aadhaarStatus === "APPROVED" && panStatus === "APPROVED") {
      return {
        label: "Verified",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    }
    if (aadhaarStatus === "PENDING" || panStatus === "PENDING") {
      return {
        label: "Pending Review",
        className: "bg-amber-50 text-amber-700 border-amber-200 font-bold",
      };
    }
    if (aadhaarStatus === "REJECTED" || panStatus === "REJECTED") {
      return {
        label: "Rejected",
        className: "bg-red-50 text-red-700 border-red-200",
      };
    }
    return {
      label: "Pending Upload",
      className: "bg-gray-100 text-gray-500 border-gray-200",
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="overflow-auto h-full flex-1 custom-scrollbar">
      <table className="w-full text-sm text-left min-w-[850px]">
        <thead className="border-b border-gray-200 bg-gray-50 sticky top-0 z-10 shadow-2xs">
          <tr className="bg-gray-50">
            <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50">User Details</th>
            <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50 text-center">Aadhaar Card</th>
            <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50 text-center">PAN Card</th>
            <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50 text-center">Overall KYC</th>
            <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50">Joined Date</th>
            <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {!users || users.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-20 px-4 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-400">
                    <Icon icon="lucide:shield-off" width="32" height="32" />
                  </div>
                  <h3 className="type-h5 text-gray-900 font-semibold mb-1">No KYC Records Found</h3>
                  <p className="type-body-sm text-gray-500 max-w-sm mx-auto">
                    No users matched your document filter or search keyword.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            users.map((user) => {
              const aadhaar = user.documents?.aadhaar || {};
              const pan = user.documents?.pan || {};
              const aadhaarBadge = getStatusBadge(aadhaar.status || "NOT_UPLOADED");
              const panBadge = getStatusBadge(pan.status || "NOT_UPLOADED");
              const overall = getOverallStatus(aadhaar.status || "NOT_UPLOADED", pan.status || "NOT_UPLOADED");

              const hasAnyUploaded = (aadhaar.status && aadhaar.status !== "NOT_UPLOADED") || (pan.status && pan.status !== "NOT_UPLOADED");

              return (
                <tr
                  key={user.id}
                  onClick={() => onVerify(user, aadhaar.status !== "NOT_UPLOADED" ? "aadhaar" : "pan")}
                  className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors cursor-pointer group"
                >
                  {/* User Profile Info */}
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} />
                      <div className="min-w-0">
                        <Link
                          href={`/users/${user.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-gray-900 group-hover:text-primary transition-colors type-body-sm block truncate max-w-xs"
                        >
                          {user.fullName || "Unnamed User"}
                        </Link>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5 truncate max-w-xs">
                          {user.phone && <span>{user.phone}</span>}
                          {user.email && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="truncate">{user.email}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Aadhaar Badge */}
                  <td className="px-4 md:px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        if (aadhaar.status && aadhaar.status !== "NOT_UPLOADED") {
                          onVerify(user, "aadhaar");
                        } else {
                          onUpload(user, "AADHAAR");
                        }
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border transition-all hover:scale-105 ${aadhaarBadge.className}`}
                      title={aadhaar.status && aadhaar.status !== "NOT_UPLOADED" ? "Click to verify Aadhaar" : "Click to upload Aadhaar"}
                    >
                      <Icon icon={aadhaarBadge.icon} width="13" height="13" />
                      <span>{aadhaarBadge.label}</span>
                    </button>
                  </td>

                  {/* PAN Badge */}
                  <td className="px-4 md:px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        if (pan.status && pan.status !== "NOT_UPLOADED") {
                          onVerify(user, "pan");
                        } else {
                          onUpload(user, "PAN");
                        }
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border transition-all hover:scale-105 ${panBadge.className}`}
                      title={pan.status && pan.status !== "NOT_UPLOADED" ? "Click to verify PAN" : "Click to upload PAN"}
                    >
                      <Icon icon={panBadge.icon} width="13" height="13" />
                      <span>{panBadge.label}</span>
                    </button>
                  </td>

                  {/* Overall Status */}
                  <td className="px-4 md:px-6 py-4 text-center">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full border ${overall.className}`}>
                      {overall.label}
                    </span>
                  </td>

                  {/* Joined Date */}
                  <td className="px-4 md:px-6 py-4 text-gray-600 type-body-sm whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 md:px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      {hasAnyUploaded ? (
                        <button
                          type="button"
                          onClick={() => onVerify(user, aadhaar.status !== "NOT_UPLOADED" ? "aadhaar" : "pan")}
                          className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs whitespace-nowrap"
                        >
                          <Icon icon="lucide:shield-check" width="14" height="14" />
                          <span>Verify</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onUpload(user, "AADHAAR")}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-primary text-gray-700 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs whitespace-nowrap"
                        >
                          <Icon icon="lucide:upload-cloud" width="14" height="14" />
                          <span>Upload</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onUpload(user, "AADHAAR")}
                        title="Upload document on behalf"
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors inline-flex"
                      >
                        <Icon icon="lucide:more-vertical" width="16" height="16" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
