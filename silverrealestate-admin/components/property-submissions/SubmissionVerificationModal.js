"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { formatLocation, getCoordinates, getGoogleMapsUrl } from "../../lib/locationUtils";
import { getYouTubeEmbedUrl } from "../../lib/videoUtils";
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

export default function SubmissionVerificationModal({
  isOpen,
  onClose,
  property,
  onSuccess,
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showConfirmReject, setShowConfirmReject] = useState(false);
  const [adminRemark, setAdminRemark] = useState("");

  useEffect(() => {
    if (isOpen) {
      setActiveImageIndex(0);
      setShowConfirmReject(false);
      setAdminRemark("");
    }
  }, [isOpen, property]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !property) return null;

  const images = Array.isArray(property.images) ? property.images : [];
  const coords = getCoordinates(property.location);
  const googleMapsUrl = getGoogleMapsUrl(property.location);

  const handleVerify = async (status) => {
    const isApprove = status === "AVAILABLE";
    if (isApprove) {
      setIsApproving(true);
    } else {
      setIsRejecting(true);
    }

    try {
      const payload = {
        status: status,
      };
      if (status === "REJECTED" && adminRemark.trim()) {
        payload.adminRemark = adminRemark.trim();
      }

      const res = await api.patch(`/admin/property/${property.id}/verification`, payload);

      if (res?.success) {
        toast.success(
          res?.message || (isApprove ? "Property approved and listed as Available!" : "Property submission rejected")
        );
        onSuccess?.();
        onClose();
      } else {
        toast.error(res?.message || "Failed to update verification status");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred during verification");
    } finally {
      setIsApproving(false);
      setIsRejecting(false);
      setShowConfirmReject(false);
      setAdminRemark("");
    }
  };

  const isPending = property.status === "PENDING_APPROVAL" || property.status === "PENDING";
  const isAvailable = property.status === "AVAILABLE";
  const isRejected = property.status === "REJECTED";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-5">
        <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon icon="lucide:building-2" width="18" height="18" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900 truncate">
                    {property.title || "Builder Property Submission"}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isPending
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : isAvailable
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : isRejected
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                  >
                    {isPending ? "Awaiting Verification" : formatStatus(property.status)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                  <Icon icon="lucide:map-pin" width="12" height="12" className="text-gray-400 shrink-0" />
                  <span>{formatLocation(property.location)}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <Icon icon="lucide:x" width="20" height="20" />
            </button>
          </div>

          {/* Body Content */}
          <div className="overflow-y-auto custom-scrollbar p-5 space-y-5 flex-1">
            {/* Image Gallery */}
            {images.length > 0 ? (
              <div className="space-y-2">
                <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                  <img
                    src={images[activeImageIndex]}
                    alt={property.title || "Property Image"}
                    className="w-full h-full object-cover"
                  />
                  {images.length > 1 && (
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-xs font-semibold">
                      {activeImageIndex + 1} / {images.length}
                    </div>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                          activeImageIndex === idx ? "border-primary scale-95" : "border-gray-200 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-36 rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                <Icon icon="lucide:image-off" width="28" height="28" className="mb-1" />
                <span className="text-xs">No images uploaded for this submission</span>
              </div>
            )}

            {/* Key Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">
                  Total Valuation
                </span>
                <span className="font-bold text-gray-900 text-sm sm:text-base">
                  {formatCurrency(property.totalPrice || property.price)}
                </span>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">
                  Per Unit Price
                </span>
                <span className="font-bold text-gray-900 text-sm sm:text-base">
                  {formatCurrency(property.perUnitPrice || property.minInvestment)}
                </span>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">
                  Total Units
                </span>
                <span className="font-bold text-gray-900 text-sm sm:text-base">
                  {property.totalUnits || property.totalSize || "N/A"}
                </span>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">
                  Target Return
                </span>
                <span className="font-bold text-emerald-600 text-sm sm:text-base">
                  {property.targetReturn ? `${property.targetReturn}%` : "N/A"}
                </span>
              </div>
            </div>

            {/* Sales & Investors Stats (if units/investors info available) */}
            {(property.purchasedUnits !== undefined || property.investors !== undefined) && (
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:pie-chart" width="16" height="16" className="text-slate-600" />
                  <span className="text-slate-600 font-medium">Fractional Units Sold:</span>
                  <span className="font-bold text-slate-900">
                    {property.purchasedUnits || 0} / {property.totalUnits || property.totalSize || "—"} units
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Icon icon="lucide:users" width="14" height="14" className="text-primary" />
                  <span>{property.investors || 0} {(property.investors === 1 ? "Investor" : "Investors")}</span>
                </div>
              </div>
            )}

            {/* Builder / Submitter Information Card */}
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-amber-200/70 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Icon icon="lucide:hard-hat" width="16" height="16" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">Submitted By (Builder)</h4>
                    <span className="text-[11px] text-amber-800/80 font-medium">Registered Builder Account</span>
                  </div>
                </div>

                {(property.builder?.id || property.builderId) && (
                  <span className="text-[10px] font-mono font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                    ID: {property.builder?.id || property.builderId}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-xl border border-amber-100">
                {/* Builder Name + Avatar */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                    {property.builder?.profileUrl ? (
                      <img src={property.builder.profileUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (property.builder?.fullName || "B").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Builder Name</span>
                    <span className="font-bold text-gray-900 block truncate text-sm">
                      {property.builder?.fullName || "Unnamed Builder"}
                    </span>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Contact Phone</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Icon icon="lucide:phone" width="13" height="13" className="text-amber-600 shrink-0" />
                    <span className="font-semibold text-gray-900 truncate">
                      {property.builder?.phone || "No phone provided"}
                    </span>
                  </div>
                </div>

                {/* Email */}
                {property.builder?.email && (
                  <div className="flex flex-col justify-center sm:col-span-2 pt-2 border-t border-gray-100">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Email Address</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Icon icon="lucide:mail" width="13" height="13" className="text-amber-600 shrink-0" />
                      <span className="font-semibold text-gray-900 break-all">
                        {property.builder.email}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Price History Section */}
            {Array.isArray(property.priceHistory) && property.priceHistory.length > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Icon icon="lucide:trending-up" width="14" height="14" className="text-primary" />
                    <span>Price History ({property.priceHistory.length} Updates)</span>
                  </h4>
                </div>
                <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                  {property.priceHistory.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between py-1.5 px-3 bg-gray-50/70 rounded-xl text-xs border border-gray-100"
                    >
                      <span className="text-gray-500 font-medium">
                        {formatDate(item.date || item.createdAt)}
                      </span>
                      <span className="font-bold text-gray-900 tabular-nums">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Property Details */}
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-gray-200">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Property Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Category:</span>
                  <span className="font-semibold text-gray-800 uppercase">{property.category || "Residential"}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Submitted Date:</span>
                  <span className="font-semibold text-gray-800">{formatDate(property.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Coordinates:</span>
                  <span className="font-semibold text-gray-800">
                    {coords && typeof coords.latitude === "number" && typeof coords.longitude === "number"
                      ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
                      : "None"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Property ID:</span>
                  <span className="font-mono font-semibold text-gray-800 select-all">{property.id}</span>
                </div>
              </div>

              {property.description && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-xs font-bold text-gray-700 block mb-1">Description:</span>
                  <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                    {property.description}
                  </p>
                </div>
              )}

              {/* External Links: Google Maps */}
              {googleMapsUrl && (
                <div className="pt-2">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    <Icon icon="lucide:map" width="13" height="13" />
                    <span>View Location on Google Maps</span>
                  </a>
                </div>
              )}
            </div>

            {/* YouTube Video Tour Embed Card */}
            {property.youtubeVideoUrl && (
              <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center justify-center">
                      <Icon icon="lucide:video" width="14" height="14" />
                    </div>
                    <span>Property Video Walkthrough</span>
                  </h4>
                  <a
                    href={property.youtubeVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>Open in YouTube</span>
                    <Icon icon="lucide:external-link" width="12" height="12" />
                  </a>
                </div>

                {getYouTubeEmbedUrl(property.youtubeVideoUrl) ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-inner border border-gray-100">
                    <iframe
                      src={getYouTubeEmbedUrl(property.youtubeVideoUrl)}
                      title={property.title ? `${property.title} Video Walkthrough` : "Property Video Walkthrough"}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>
                ) : (
                  <a
                    href={property.youtubeVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-red-50/60 hover:bg-red-50 border border-red-100 rounded-xl flex items-center justify-between text-xs text-red-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon icon="lucide:play-circle" width="18" height="18" className="text-red-600 shrink-0" />
                      <span className="truncate font-medium">{property.youtubeVideoUrl}</span>
                    </div>
                    <Icon icon="lucide:arrow-up-right" width="15" height="15" className="shrink-0" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Verification Actions Footer */}
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 shrink-0">
            {showConfirmReject ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={adminRemark}
                    onChange={(e) => setAdminRemark(e.target.value)}
                    placeholder="Reason for rejection (optional)..."
                    className="w-full px-3.5 py-2 rounded-xl border border-red-200 bg-white text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 shadow-xs"
                    autoFocus
                  />
                </div>
                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmReject(false);
                      setAdminRemark("");
                    }}
                    disabled={isRejecting}
                    className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-200/60 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerify("REJECTED")}
                    disabled={isRejecting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                  >
                    {isRejecting ? (
                      <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Icon icon="lucide:x" width="14" height="14" />
                    )}
                    <span>Confirm Reject</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="text-xs text-gray-500">
                  {isPending && "Review all specifications carefully before making property available to investors."}
                  {isAvailable && "This property is currently approved and live on the marketplace."}
                  {isRejected && "This property submission was rejected."}
                </div>

                <div className="flex items-center justify-end gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Close
                  </button>

                  {!isRejected && (
                    <button
                      type="button"
                      onClick={() => setShowConfirmReject(true)}
                      disabled={isRejecting || isApproving}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Icon icon="lucide:x-circle" width="14" height="14" />
                      <span>Reject</span>
                    </button>
                  )}

                  {!isAvailable && (
                    <button
                      type="button"
                      onClick={() => handleVerify("AVAILABLE")}
                      disabled={isApproving || isRejecting}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isApproving ? (
                        <>
                          <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" />
                          <span>Approving...</span>
                        </>
                      ) : (
                        <>
                          <Icon icon="lucide:check-circle-2" width="14" height="14" />
                          <span>Approve & Make Available</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
