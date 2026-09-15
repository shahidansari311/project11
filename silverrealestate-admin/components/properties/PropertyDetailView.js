"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "../../lib/api";
import PriceTrendChart from "./PriceTrendChart";
import AddPriceHistoryModal from "./AddPriceHistoryModal";
import EditPriceHistoryModal from "./EditPriceHistoryModal";
import DeletePriceHistoryModal from "./DeletePriceHistoryModal";
import InvestmentDetailModal from "../investments/InvestmentDetailModal";
import InvestmentApproveModal from "../investments/InvestmentApproveModal";
import InvestmentRejectModal from "../investments/InvestmentRejectModal";
import BuyOnBehalfModal from "../investments/BuyOnBehalfModal";
import { formatLocation, getCoordinates, getGoogleMapsUrl, getGoogleMapsEmbedUrl } from "../../lib/locationUtils";
import { getYouTubeEmbedUrl } from "../../lib/videoUtils";
import { getInvestmentStatusBadge, formatStatus } from "../../lib/formatUtils";

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-5 w-full animate-pulse pb-12">
      <div className="h-5 w-32 bg-gray-200 rounded" />
      <div className="flex justify-between items-center">
        <div className="h-8 w-64 bg-gray-200 rounded-lg" />
        <div className="h-10 w-44 bg-gray-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="h-64 w-full bg-gray-100 rounded-2xl" />
          <div className="h-44 w-full bg-gray-100 rounded-2xl" />
        </div>
        <div className="lg:col-span-7 h-96 w-full bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );
}

export default function PropertyDetailView({ id }) {
  const router = useRouter();
  const [property, setProperty] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  // Property Investments State & Modals
  const [propertyInvestments, setPropertyInvestments] = useState([]);
  const [isLoadingInvestments, setIsLoadingInvestments] = useState(true);
  const [investorFilterTab, setInvestorFilterTab] = useState("ALL"); // "ALL" | "APPROVED" | "PENDING"
  const [investorSearch, setInvestorSearch] = useState("");
  const [debouncedInvestorSearch, setDebouncedInvestorSearch] = useState("");
  const [selectedInvestmentForDetail, setSelectedInvestmentForDetail] = useState(null);
  const [selectedInvestmentForApprove, setSelectedInvestmentForApprove] = useState(null);
  const [selectedInvestmentForReject, setSelectedInvestmentForReject] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInvestorSearch(investorSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [investorSearch]);

  // Modals & State for Price History
  const [isAddPriceModalOpen, setIsAddPriceModalOpen] = useState(false);
  const [isEditPriceModalOpen, setIsEditPriceModalOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [isDeletePriceModalOpen, setIsDeletePriceModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeletingPoint, setIsDeletingPoint] = useState(false);
  const [isBuyOnBehalfOpen, setIsBuyOnBehalfOpen] = useState(false);

  // Fullscreen Lightbox Modal State
  const [isFullscreenImage, setIsFullscreenImage] = useState(false);


  // Swipe gesture tracking
  const touchStartXRef = useRef(null);
  const touchEndXRef = useRef(null);

  const fetchPropertyInvestments = useCallback(async () => {
    setIsLoadingInvestments(true);
    try {
      let url = `/admin/investments/property/${id}?limit=50`;
      if (investorFilterTab !== "ALL") {
        url += `&status=${investorFilterTab}`;
      }
      if (debouncedInvestorSearch.trim()) {
        url += `&search=${encodeURIComponent(debouncedInvestorSearch.trim())}`;
      }
      const res = await api.get(url);
      if (res?.success && res.data) {
        const list = Array.isArray(res.data.investments)
          ? res.data.investments
          : Array.isArray(res.data)
          ? res.data
          : [];
        setPropertyInvestments(list);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingInvestments(false);
    }
  }, [id, investorFilterTab, debouncedInvestorSearch]);

  const fetchProperty = useCallback(
    async (showFullLoader = true) => {
      if (showFullLoader) setIsLoading(true);
      try {
        const res = await api.get(`/admin/property/${id}`);
        if (res?.success && res.data) {
          setProperty(res.data.property || res.data);
        } else {
          toast.error(res?.message || "Failed to fetch property details");
        }
      } catch (error) {
        toast.error(error.message || "An error occurred");
      } finally {
        if (showFullLoader) setIsLoading(false);
      }
    },
    [id]
  );

  // Initial property details fetch (only when id changes)
  useEffect(() => {
    if (id) {
      fetchProperty(true);
    }
  }, [id, fetchProperty]);

  // Dedicated investments fetch (when filter tab or search changes)
  useEffect(() => {
    if (id) {
      fetchPropertyInvestments();
    }
  }, [id, fetchPropertyInvestments]);

  // Lock body scroll when fullscreen lightbox is open
  useEffect(() => {
    if (isFullscreenImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreenImage]);

  const images = Array.isArray(property?.images) ? property.images : [];

  const handlePrevImage = useCallback(() => {
    if (images.length <= 1) return;
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNextImage = useCallback(() => {
    if (images.length <= 1) return;
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const handleCloseFullscreen = useCallback(() => {
    setIsFullscreenImage(false);
  }, []);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    const threshold = 35;
    if (diff > threshold) {
      handleNextImage();
    } else if (diff < -threshold) {
      handlePrevImage();
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFullscreenImage) {
        setIsFullscreenImage(false);
        return;
      }
      if (images.length <= 1) return;
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "ArrowRight") handleNextImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrevImage, handleNextImage, images.length, isFullscreenImage]);

  const handlePriceHistoryAdded = (newPoint) => {
    if (!newPoint) {
      fetchProperty();
      return;
    }
    setProperty((prev) => {
      if (!prev) return prev;
      const currentHistory = Array.isArray(prev.priceHistory) ? [...prev.priceHistory] : [];
      const updatedHistory = [...currentHistory, newPoint].sort(
        (a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt)
      );

      const latestPoint = updatedHistory[updatedHistory.length - 1];

      return {
        ...prev,
        priceHistory: updatedHistory,
        totalPrice: latestPoint?.price ?? prev.totalPrice,
      };
    });
  };

  const handleOpenEditPricePoint = (item) => {
    setSelectedHistoryItem(item);
    setIsEditPriceModalOpen(true);
  };

  const handlePriceHistoryUpdated = () => {
    fetchProperty();
  };

  const handleDeletePricePoint = (item) => {
    if (!item?.id) return;

    const currentPoints = Array.isArray(property?.priceHistory) ? property.priceHistory : [];
    if (currentPoints.length <= 1) {
      toast.error("Cannot delete the only price history point for this property.");
      return;
    }

    setItemToDelete(item);
    setIsDeletePriceModalOpen(true);
  };

  const handleConfirmDeletePricePoint = async () => {
    if (!itemToDelete?.id) return;

    setIsDeletingPoint(true);
    try {
      const res = await api.delete(`/admin/property/price-history/${itemToDelete.id}`);
      if (res?.success) {
        toast.success(res.message || "Price history deleted successfully");
        setIsDeletePriceModalOpen(false);
        setItemToDelete(null);
        fetchProperty();
      } else {
        toast.error(res?.message || "Failed to delete price history");
      }
    } catch (error) {
      toast.error(error.message || "Cannot delete the only price history point for this property.");
    } finally {
      setIsDeletingPoint(false);
    }
  };

  const handleCopyId = () => {
    if (!property?.id) return;
    navigator.clipboard.writeText(property.id);
    setCopiedId(true);
    toast.success("Property ID copied to clipboard");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatStatusLabel = (status) => {
    if (!status) return "Available";
    switch (status.toUpperCase()) {
      case "AVAILABLE":
        return "Available";
      case "SOLD":
      case "SOLD_OUT":
        return "Sold";
      case "COMING_SOON":
      case "UPCOMING":
        return "Coming Soon";
      case "UNDER_REVIEW":
        return "Under Review";
      default:
        return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toUpperCase()) {
      case "AVAILABLE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "SOLD":
      case "SOLD_OUT":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "COMING_SOON":
      case "UPCOMING":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "UNDER_REVIEW":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatCategoryLabel = (category) => {
    if (!category) return "Residential";
    switch (category.toUpperCase()) {
      case "RESIDENTIAL":
        return "Residential";
      case "COMMERCIAL":
        return "Commercial";
      case "INDUSTRIAL":
        return "Industrial";
      case "LAND":
        return "Land";
      case "OTHERS":
      case "OTHER":
        return "Others";
      default:
        return category.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  const getCategoryBadgeClass = (category) => {
    switch (category?.toUpperCase()) {
      case "RESIDENTIAL":
        return "bg-primary/10 text-primary border-primary/20";
      case "COMMERCIAL":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "INDUSTRIAL":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "LAND":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "OTHERS":
      case "OTHER":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) return <DetailSkeleton />;

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
          <Icon icon="lucide:building-2" width="32" height="32" />
        </div>
        <h3 className="type-h3 text-gray-900">Property not found</h3>
        <button
          onClick={() => router.push("/property")}
          className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Icon icon="lucide:arrow-left" width="16" height="16" />
          Back to Properties
        </button>
      </div>
    );
  }

  const currentImage = images[activeImageIndex] || null;
  const isCurrentImageFailed = currentImage && failedImages[currentImage];

  return (
    <div className="flex flex-col gap-5 w-full min-w-0 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/property"
            className="text-gray-500 hover:text-gray-900 text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors mb-1.5"
          >
            <Icon icon="lucide:arrow-left" width="15" height="15" />
            Back to Properties
          </Link>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              {property.title || "Untitled Property"}
            </h1>
            <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-md border ${getCategoryBadgeClass(property.category)}`}>
              {formatCategoryLabel(property.category)}
            </span>
            <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-md border ${getStatusBadgeClass(property.status)}`}>
              {formatStatusLabel(property.status)}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 flex items-center gap-2 mt-1 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Icon icon="lucide:map-pin" className="text-gray-400 shrink-0" width="15" height="15" />
              <span>{formatLocation(property.location)}</span>
            </div>
            {getGoogleMapsUrl(property.location) && (
              <a
                href={getGoogleMapsUrl(property.location)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1 ml-1"
              >
                <Icon icon="lucide:external-link" width="12" height="12" />
                <span>Open in Maps</span>
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsBuyOnBehalfOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition-colors shadow-2xs cursor-pointer"
            title="Buy fractional units for an investor on this property"
          >
            <Icon icon="lucide:shopping-bag" width="16" height="16" />
            <span>Buy on Behalf</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddPriceModalOpen(true)}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition-colors shadow-2xs cursor-pointer"
          >
            <Icon icon="lucide:trending-up" className="text-primary" width="16" height="16" />
            <span>Add Price Point</span>
          </button>

          <Link
            href={`/property/edit/${property.id}`}
            className="bg-primary text-white hover:bg-primary/90 font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition-colors shadow-sm"
          >
            <Icon icon="lucide:edit" width="16" height="16" />
            <span>Edit Property</span>
          </Link>
        </div>
      </div>

      {/* Executive Quick Metrics Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Current Valuation */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block mb-0.5">
              Current Valuation
            </span>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
              {formatCurrency(property.totalPrice)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon icon="lucide:banknote" width="20" height="20" />
          </div>
        </div>

        {/* Target Return */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider block mb-0.5">
              Target Annual Return
            </span>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600">
              {property.targetReturn ? `${property.targetReturn}%` : "N/A"}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Icon icon="lucide:trending-up" width="20" height="20" />
          </div>
        </div>

        {/* Min Investment */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block mb-0.5">
              Min. Investment
            </span>
            <div className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
              {formatCurrency(property.minInvestment)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-700 border border-gray-100 flex items-center justify-center shrink-0">
            <Icon icon="lucide:coins" width="20" height="20" />
          </div>
        </div>

        {/* Active Investors & Size */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block mb-0.5">
              Active Investors
            </span>
            <div className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
              {property.investors || 0} <span className="text-xs font-normal text-gray-400">Users</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0">
            <Icon icon="lucide:users" width="20" height="20" />
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (5 Cols): Compact Image Slider, Description & Property Details */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Compact Image Gallery Card */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm p-3 sm:p-3.5 flex flex-col gap-2.5">
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative w-full h-[220px] sm:h-[250px] rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center group select-none"
            >
              {currentImage && !isCurrentImageFailed ? (
                <>
                  {/* Clean Property Photo */}
                  <img
                    key={currentImage}
                    src={currentImage}
                    alt={property.title || "Property Preview"}
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [currentImage]: true }))
                    }
                    className="w-full h-full object-cover transition-all duration-300 animate-in fade-in zoom-in-95"
                  />

                  {/* Left / Previous Button */}
                  {images.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevImage();
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md backdrop-blur-md flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer border border-gray-100"
                      aria-label="Previous Image"
                    >
                      <Icon icon="lucide:chevron-left" width="18" height="18" />
                    </button>
                  )}

                  {/* Right / Next Button */}
                  {images.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextImage();
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md backdrop-blur-md flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer border border-gray-100"
                      aria-label="Next Image"
                    >
                      <Icon icon="lucide:chevron-right" width="18" height="18" />
                    </button>
                  )}

                  {/* Top Counter Badge */}
                  {images.length > 1 && (
                    <div className="absolute top-2.5 left-2.5 z-20 bg-black/60 text-white px-2 py-0.5 rounded-md backdrop-blur-xs text-[11px] font-semibold shadow-xs">
                      {activeImageIndex + 1} / {images.length}
                    </div>
                  )}

                  {/* Bottom Dot Indicators */}
                  {images.length > 1 && (
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-full backdrop-blur-xs">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImageIndex(idx)}
                          className={`rounded-full transition-all cursor-pointer ${
                            activeImageIndex === idx
                              ? "w-4 h-1.5 bg-white"
                              : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                          }`}
                          aria-label={`Go to slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Fullscreen Preview Button */}
                  <button
                    type="button"
                    onClick={() => setIsFullscreenImage(true)}
                    className="absolute bottom-2.5 right-2.5 z-20 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg backdrop-blur-xs transition-opacity opacity-80 group-hover:opacity-100 cursor-pointer flex items-center gap-1 text-[11px] font-medium"
                    title="View Full Size"
                  >
                    <Icon icon="lucide:maximize-2" width="13" height="13" />
                    <span className="hidden sm:inline">Zoom</span>
                  </button>
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center text-gray-400 gap-2 p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-white/80 shadow-xs flex items-center justify-center text-primary/70">
                    <Icon icon="lucide:building-2" width="22" height="22" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    {property.title || "Property Asset"}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {images.length > 0 ? "Image preview not available" : "No images uploaded"}
                  </span>
                </div>
              )}
            </div>

            {/* Compact Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-14 h-11 sm:w-16 sm:h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all bg-gray-50 cursor-pointer ${
                      activeImageIndex === idx
                        ? "border-primary ring-1 ring-primary/20 scale-[1.02]"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    {!failedImages[img] ? (
                      <img
                        src={img}
                        alt={`Thumb ${idx + 1}`}
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [img]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Icon icon="lucide:image" width="14" height="14" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Property Specifications & Metadata Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 text-xs">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Listing Details
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-[10px] text-gray-500 uppercase font-semibold block mb-0.5">Total Size</span>
                <span className="text-xs font-bold text-gray-900">
                  {property.totalSize
                    ? String(property.totalSize).toLowerCase().includes("sq")
                      ? property.totalSize
                      : `${property.totalSize} sq ft`
                    : "N/A"}
                </span>
              </div>

              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Category</span>
                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-md border ${getCategoryBadgeClass(property.category)}`}>
                  {formatCategoryLabel(property.category)}
                </span>
              </div>

              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Status</span>
                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-md border ${getStatusBadgeClass(property.status)}`}>
                  {formatStatusLabel(property.status)}
                </span>
              </div>

              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-[10px] text-gray-500 uppercase font-semibold block mb-0.5">Date Listed</span>
                <span className="text-xs font-bold text-gray-900">{formatDate(property.createdAt)}</span>
              </div>

              {property.termPeriodYears && (
                <div className="p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100 col-span-2">
                  <span className="text-[10px] text-indigo-700 uppercase font-semibold block mb-0.5">Term Lock-in Period</span>
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                    <Icon icon="lucide:hourglass" width="13" height="13" className="text-indigo-600" />
                    <span>{property.termPeriodYears} Year{Number(property.termPeriodYears) === 1 ? "" : "s"} Guaranteed Returns Term</span>
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
              <span className="text-gray-500 font-medium shrink-0">Property ID</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="font-mono text-gray-700 bg-gray-100 hover:bg-gray-200 text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer select-all truncate"
                title="Click to copy Property ID"
              >
                <span>{property.id}</span>
                <Icon
                  icon={copiedId ? "lucide:check" : "lucide:copy"}
                  className={copiedId ? "text-emerald-600" : "text-gray-400 shrink-0"}
                  width="13"
                  height="13"
                />
              </button>
            </div>
          </div>

          {/* Fractional Unit Allocation Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Icon icon="lucide:pie-chart" width="15" height="15" className="text-primary" />
                <span>Fractional Unit Economics</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {property.totalUnits > 0
                  ? `${Math.min(100, Math.round(((property.purchasedUnits || 0) / property.totalUnits) * 100))}% Booked`
                  : "Available"}
              </span>
            </div>

            {/* Progress Bar */}
            {property.totalUnits > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round(((property.purchasedUnits || 0) / property.totalUnits) * 100))}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>{property.purchasedUnits || 0} units locked</span>
                  <span>{Math.max(0, (property.totalUnits || 0) - (property.purchasedUnits || 0))} units available</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Total Units</span>
                <span className="text-xs font-bold text-gray-900 mt-0.5 block">
                  {property.totalUnits ? property.totalUnits.toLocaleString() : "Auto-computed"}
                </span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-gray-500 block text-[10px] uppercase font-semibold">Price / Unit</span>
                <span className="text-xs font-bold text-gray-900 mt-0.5 block">
                  {formatCurrency(property.perUnitPrice || property.minInvestment)}
                </span>
              </div>
              <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <span className="text-emerald-700 block text-[10px] uppercase font-semibold">Min. Investment</span>
                <span className="text-xs font-bold text-emerald-800 mt-0.5 block">
                  {formatCurrency(property.minInvestment || property.perUnitPrice)}
                </span>
              </div>
              <div className="p-2.5 bg-purple-50/60 rounded-xl border border-purple-100">
                <span className="text-purple-700 block text-[10px] uppercase font-semibold">Active Investors</span>
                <span className="text-xs font-bold text-purple-800 mt-0.5 block">
                  {property.investors || 0} Users
                </span>
              </div>
            </div>
          </div>

          {/* Map Location & Coordinates Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Icon icon="lucide:map-pin" width="14" height="14" />
                </div>
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Property Location & Map
                </h2>
              </div>
              {getGoogleMapsUrl(property.location) && (
                <a
                  href={getGoogleMapsUrl(property.location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-semibold flex items-center gap-1 text-[11px]"
                >
                  <Icon icon="lucide:external-link" width="12" height="12" />
                  <span>Google Maps</span>
                </a>
              )}
            </div>

            <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <Icon icon="lucide:map-pin" className="text-primary shrink-0 mt-0.5" width="15" height="15" />
                <span className="text-xs font-semibold text-gray-900 leading-snug">
                  {formatLocation(property.location)}
                </span>
              </div>

              {/* Coordinates badge if available */}
              {(() => {
                const coords = getCoordinates(property.location);
                if (!coords || typeof coords.latitude !== "number" || typeof coords.longitude !== "number") return null;
                return (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200/60 flex-wrap">
                    <span className="text-[11px] text-gray-500 font-medium">GPS Coordinates:</span>
                    <span className="font-mono text-[11px] font-bold text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200">
                      {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
                    </span>
                  </div>
                );
              })()}

              {/* Structured sub-fields if available */}
              {typeof property.location === "object" && property.location !== null && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-gray-200/60 text-[11px]">
                  {property.location.city && (
                    <div>
                      <span className="text-gray-400 block text-[10px]">City</span>
                      <span className="font-medium text-gray-800">{property.location.city}</span>
                    </div>
                  )}
                  {property.location.state && (
                    <div>
                      <span className="text-gray-400 block text-[10px]">State</span>
                      <span className="font-medium text-gray-800">{property.location.state}</span>
                    </div>
                  )}
                  {property.location.postalCode && (
                    <div>
                      <span className="text-gray-400 block text-[10px]">PIN Code</span>
                      <span className="font-medium text-gray-800">{property.location.postalCode}</span>
                    </div>
                  )}
                  {property.location.placeName && (
                    <div className="col-span-2">
                      <span className="text-gray-400 block text-[10px]">Place / Building</span>
                      <span className="font-medium text-gray-800">{property.location.placeName}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Embedded Google Map Preview */}
            {getGoogleMapsEmbedUrl(property.location) && (
              <div className="relative w-full h-44 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-inner">
                <iframe
                  src={getGoogleMapsEmbedUrl(property.location)}
                  title={property.title ? `${property.title} Map Location` : "Property Map Location"}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>

          {/* Description & Overview */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About Property</h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {property.description || "No detailed description provided for this property."}
            </p>
          </div>

          {/* YouTube Video Walkthrough Card */}
          {property.youtubeVideoUrl && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center justify-center">
                    <Icon icon="lucide:video" width="16" height="16" />
                  </div>
                  <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Video Walkthrough
                  </h2>
                </div>
                <a
                  href={property.youtubeVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Open YouTube</span>
                  <Icon icon="lucide:external-link" width="13" height="13" />
                </a>
              </div>

              {getYouTubeEmbedUrl(property.youtubeVideoUrl) ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-inner">
                  <iframe
                    src={getYouTubeEmbedUrl(property.youtubeVideoUrl)}
                    title={property.title || "Property Video Walkthrough"}
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
                  className="p-3 bg-red-50/50 hover:bg-red-50 border border-red-100 rounded-xl flex items-center justify-between text-xs text-red-700 transition-colors"
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

        {/* Right Column (7 Cols): Prominent Price Trend & Valuation History */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <PriceTrendChart
            priceHistory={property.priceHistory || []}
            currentPrice={property.totalPrice}
            onAddPricePoint={() => setIsAddPriceModalOpen(true)}
            onEditPricePoint={handleOpenEditPricePoint}
            onDeletePricePoint={handleDeletePricePoint}
          />
        </div>
      </div>

      {/* Property Investments Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {/* Section Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
              <Icon icon="lucide:hand-coins" width="18" height="18" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">Investments on this Property</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 shrink-0">
                  {propertyInvestments.length}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate">
                View all investors, verified buyers, and fractional bookings for this property
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={fetchPropertyInvestments}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              title="Refresh Investments"
            >
              <Icon icon="lucide:refresh-cw" width="15" height="15" className={isLoadingInvestments ? "animate-spin text-primary" : ""} />
            </button>
          </div>
        </div>

        {/* Filter Toolbar (Verified Buyers / Pending Payment / Search) */}
        <div className="px-4 py-3 bg-slate-50/60 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100/90 rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setInvestorFilterTab("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                investorFilterTab === "ALL"
                  ? "bg-white text-gray-900 shadow-2xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <span>All</span>
            </button>

            <button
              type="button"
              onClick={() => setInvestorFilterTab("APPROVED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                investorFilterTab === "APPROVED"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <Icon icon="lucide:badge-check" width="13" height="13" />
              <span>Verified Buyers</span>
            </button>

            <button
              type="button"
              onClick={() => setInvestorFilterTab("PENDING")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                investorFilterTab === "PENDING"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "text-amber-700 hover:bg-amber-50"
              }`}
            >
              <Icon icon="lucide:clock" width="13" height="13" />
              <span>Pending</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
              <Icon icon="lucide:search" width="14" height="14" />
            </span>
            <input
              type="text"
              value={investorSearch}
              onChange={(e) => setInvestorSearch(e.target.value)}
              placeholder="Search investor..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-gray-400"
            />
            {investorSearch && (
              <button
                type="button"
                onClick={() => setInvestorSearch("")}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <Icon icon="lucide:x" width="13" height="13" />
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="p-0">
          {isLoadingInvestments ? (
            <div className="p-6 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : propertyInvestments.length === 0 ? (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center text-gray-400">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-300 border border-gray-100">
                <Icon icon="lucide:hand-coins" width="24" height="24" />
              </div>
              <p className="text-sm font-bold text-gray-800">No Investments Yet</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                No users have purchased fractional units for this property yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Investor / User</th>
                    <th className="px-4 py-3 text-center">Units Booked</th>
                    <th className="px-4 py-3">Price / Unit</th>
                    <th className="px-4 py-3">Total Amount</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {propertyInvestments.map((inv) => {
                      const isPending = inv.status === "PENDING";
                      const isApproved = inv.status === "APPROVED";

                      return (
                        <tr
                          key={inv.id}
                          onClick={() => setSelectedInvestmentForDetail(inv)}
                          className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {inv.user?.fullName ? inv.user.fullName.charAt(0).toUpperCase() : "U"}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-gray-900 group-hover:text-primary transition-colors block truncate max-w-[160px]">
                                    {inv.user?.fullName || "Unnamed User"}
                                  </span>
                                  {inv.user?.isVerified && (
                                    <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800" title="KYC Verified">
                                      <Icon icon="lucide:badge-check" width="10" height="10" />
                                      <span>KYC</span>
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-gray-400 block truncate max-w-[160px]">
                                  {inv.user?.phone || inv.user?.email || "No contact"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex px-2 py-0.5 rounded-md bg-gray-100 font-bold text-gray-800">
                              {inv.units} {inv.units === 1 ? "unit" : "units"}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-gray-700 font-medium">
                            {formatCurrency(inv.unitPriceAtTime)}
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="font-bold text-gray-900 text-sm">
                              {formatCurrency(inv.totalAmount)}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            {(() => {
                              const badge = getInvestmentStatusBadge(inv.status);
                              return (
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${badge.className}`}
                                >
                                  <Icon icon={badge.icon} width="12" height="12" />
                                  <span>{badge.label}</span>
                                </span>
                              );
                            })()}
                          </td>

                          <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                            {formatDate(inv.createdAt)}
                          </td>

                          <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedInvestmentForApprove(inv)}
                                    title="Confirm Payment & Approve"
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                                  >
                                    <Icon icon="lucide:check" width="12" height="12" />
                                    <span>Approve</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setSelectedInvestmentForReject(inv)}
                                    title="Reject"
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Icon icon="lucide:x" width="15" height="15" />
                                  </button>
                                </>
                              )}

                              {inv.user?.id && (
                                <Link
                                  href={`/users/${inv.user.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  title="View User Profile"
                                  className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors inline-flex"
                                >
                                  <Icon icon="lucide:user" width="14" height="14" />
                                </Link>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelectedInvestmentForDetail(inv)}
                                title="Details"
                                className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                              >
                                <Icon icon="lucide:chevron-right" width="15" height="15" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>


      {/* Clean Fullscreen Lightbox Modal */}
      {isFullscreenImage && currentImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-5 animate-in fade-in duration-150 select-none overflow-hidden"
          onClick={handleCloseFullscreen}
        >
          {/* Header Strip in Fullscreen */}
          <div
            className="w-full flex items-center justify-between z-20 pb-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="text-white/80 text-xs sm:text-sm font-medium">
                Photo {activeImageIndex + 1} of {images.length}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCloseFullscreen}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Close Fullscreen (Esc)"
            >
              <Icon icon="lucide:x" width="18" height="18" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>

          {/* Center Main High-Res Image with Left/Right Navigation */}
          <div
            className="relative flex-1 w-full flex items-center justify-center overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImage}
              alt={property.title || "Full size preview"}
              className="max-h-[75vh] max-w-[92vw] object-contain rounded-xl select-none shadow-2xl transition-all duration-200"
            />

            {/* Left Nav in Fullscreen */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer border border-white/10"
                aria-label="Previous photo"
              >
                <Icon icon="lucide:chevron-left" width="24" height="24" />
              </button>
            )}

            {/* Right Nav in Fullscreen */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer border border-white/10"
                aria-label="Next photo"
              >
                <Icon icon="lucide:chevron-right" width="24" height="24" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Strip in Fullscreen (No scrollbars) */}
          {images.length > 1 && (
            <div
              className="w-full flex items-center justify-center gap-2 overflow-x-auto pt-2 z-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-14 h-10 sm:w-16 sm:h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    activeImageIndex === idx
                      ? "border-white ring-2 ring-white/50 scale-105"
                      : "border-transparent opacity-40 hover:opacity-90"
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Price History Modal */}
      <AddPriceHistoryModal
        isOpen={isAddPriceModalOpen}
        onClose={() => setIsAddPriceModalOpen(false)}
        property={property}
        onSuccess={handlePriceHistoryAdded}
      />

      {/* Edit Price History Modal */}
      <EditPriceHistoryModal
        isOpen={isEditPriceModalOpen}
        onClose={() => {
          setIsEditPriceModalOpen(false);
          setSelectedHistoryItem(null);
        }}
        historyItem={selectedHistoryItem}
        onSuccess={handlePriceHistoryUpdated}
      />

      {/* Delete Price History Custom Confirmation Modal */}
      <DeletePriceHistoryModal
        isOpen={isDeletePriceModalOpen}
        onClose={() => {
          setIsDeletePriceModalOpen(false);
          setItemToDelete(null);
        }}
        historyItem={itemToDelete}
        onConfirm={handleConfirmDeletePricePoint}
        isDeleting={isDeletingPoint}
      />

      {/* Investment Detail Modal */}
      <InvestmentDetailModal
        isOpen={Boolean(selectedInvestmentForDetail)}
        onClose={() => setSelectedInvestmentForDetail(null)}
        investment={selectedInvestmentForDetail}
        onApprove={(inv) => {
          setSelectedInvestmentForDetail(null);
          setSelectedInvestmentForApprove(inv);
        }}
        onReject={(inv) => {
          setSelectedInvestmentForDetail(null);
          setSelectedInvestmentForReject(inv);
        }}
      />

      {/* Investment Approve Confirmation Modal */}
      <InvestmentApproveModal
        isOpen={Boolean(selectedInvestmentForApprove)}
        onClose={() => setSelectedInvestmentForApprove(null)}
        investment={selectedInvestmentForApprove}
        onSuccess={() => {
          fetchProperty(false);
          fetchPropertyInvestments();
        }}
      />

      {/* Investment Reject Modal */}
      <InvestmentRejectModal
        isOpen={Boolean(selectedInvestmentForReject)}
        onClose={() => setSelectedInvestmentForReject(null)}
        investment={selectedInvestmentForReject}
        onSuccess={() => {
          fetchProperty(false);
          fetchPropertyInvestments();
        }}
      />

      {/* Buy on Behalf Modal */}
      <BuyOnBehalfModal
        isOpen={isBuyOnBehalfOpen}
        onClose={() => setIsBuyOnBehalfOpen(false)}
        preselectedProperty={property}
        onSuccess={() => {
          fetchProperty(false);
          fetchPropertyInvestments();
        }}
      />
    </div>
  );
}
