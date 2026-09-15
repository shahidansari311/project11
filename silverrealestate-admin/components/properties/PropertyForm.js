"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Icon } from "@iconify/react";
import Link from "next/link";
import api from "../../lib/api";
import UnsavedChangesModal from "../common/UnsavedChangesModal";
import { useUnsavedChanges } from "../common/UnsavedChangesProvider";
import InteractiveMapPicker from "../common/InteractiveMapPicker";
import LocationPickerModal from "../common/LocationPickerModal";

function FormSkeleton() {
  return (
    <div className="w-full flex flex-col gap-6 animate-pulse pb-12">
      <div className="h-6 w-32 bg-gray-200 rounded" />
      <div className="flex justify-between items-center">
        <div className="h-8 w-64 bg-gray-200 rounded-lg" />
        <div className="h-10 w-36 bg-gray-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="h-72 w-full bg-gray-100 rounded-2xl" />
          <div className="h-64 w-full bg-gray-100 rounded-2xl" />
        </div>
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="h-80 w-full bg-gray-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function PropertyForm({ isEdit = false, id = null }) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const { setDirty, resetDirty } = useUnsavedChanges();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    latitude: "",
    longitude: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    placeName: "",
    youtubeVideoUrl: "",
    status: "AVAILABLE",
    category: "RESIDENTIAL",
    totalSize: "",
    targetReturn: "",
    termPeriodYears: "",
    totalPrice: "",
  });

  const [showMapDetails, setShowMapDetails] = useState(true);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const handleMapLocationSelect = (loc) => {
    if (!loc) return;
    setFormData((prev) => ({
      ...prev,
      latitude: loc.latitude !== undefined && loc.latitude !== null ? String(loc.latitude) : prev.latitude,
      longitude: loc.longitude !== undefined && loc.longitude !== null ? String(loc.longitude) : prev.longitude,
      location: loc.address || prev.location,
      placeName: loc.placeName || prev.placeName,
      city: loc.city || prev.city,
      state: loc.state || prev.state,
      postalCode: loc.postalCode || prev.postalCode,
      country: loc.country || prev.country || "India",
    }));
  };

  // Selected file objects for new upload
  const [selectedFiles, setSelectedFiles] = useState([]);
  // Blob previews for newly selected files
  const [filePreviews, setFilePreviews] = useState([]);
  // Existing image URLs (from backend in edit mode)
  const [existingImages, setExistingImages] = useState([]);

  // Full Screen Preview Modal State
  const [previewModalIndex, setPreviewModalIndex] = useState(null);

  // Unsaved Changes Tracking
  const initialDataRef = useRef(null);
  const isSavedRef = useRef(false);
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  const [pendingNavigationUrl, setPendingNavigationUrl] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit && !!id);

  useEffect(() => {
    if (isEdit && id) {
      const fetchProperty = async () => {
        setIsFetching(true);
        try {
          const res = await api.get(`/admin/property/${id}`);
          if (res?.success && res.data) {
            const p = res.data.property || res.data;

            let locAddress = "";
            let lat = "";
            let lng = "";
            let city = "";
            let state = "";
            let country = "India";
            let postalCode = "";
            let placeName = "";

            if (p.location) {
              if (typeof p.location === "object" && p.location !== null) {
                locAddress = p.location.address || p.location.placeName || "";
                lat = p.location.latitude !== undefined && p.location.latitude !== null ? String(p.location.latitude) : "";
                lng = p.location.longitude !== undefined && p.location.longitude !== null ? String(p.location.longitude) : "";
                city = p.location.city || "";
                state = p.location.state || "";
                country = p.location.country || "India";
                postalCode = p.location.postalCode || "";
                placeName = p.location.placeName || "";
              } else if (typeof p.location === "string") {
                try {
                  if (p.location.startsWith("{") && p.location.endsWith("}")) {
                    const parsed = JSON.parse(p.location);
                    locAddress = parsed.address || parsed.placeName || "";
                    lat = parsed.latitude !== undefined && parsed.latitude !== null ? String(parsed.latitude) : "";
                    lng = parsed.longitude !== undefined && parsed.longitude !== null ? String(parsed.longitude) : "";
                    city = parsed.city || "";
                    state = parsed.state || "";
                    country = parsed.country || "India";
                    postalCode = parsed.postalCode || "";
                    placeName = parsed.placeName || "";
                  } else {
                    locAddress = p.location;
                  }
                } catch {
                  locAddress = p.location;
                }
              }
            }

            if (lat || lng || city || placeName) {
              setShowMapDetails(true);
            }

            const loadedData = {
              title: p.title || "",
              description: p.description || "",
              location: locAddress,
              latitude: lat,
              longitude: lng,
              city,
              state,
              country,
              postalCode,
              placeName,
              youtubeVideoUrl: p.youtubeVideoUrl || "",
              status: p.status || "AVAILABLE",
              category: p.category === "OTHER" ? "OTHERS" : p.category || "RESIDENTIAL",
              totalSize: p.totalSize !== undefined && p.totalSize !== null ? String(p.totalSize) : "",
              targetReturn: p.targetReturn !== undefined && p.targetReturn !== null ? String(p.targetReturn) : "",
              termPeriodYears: p.termPeriodYears !== undefined && p.termPeriodYears !== null ? String(p.termPeriodYears) : "",
              totalPrice: p.totalPrice !== undefined && p.totalPrice !== null ? String(p.totalPrice) : "",
            };
            setFormData(loadedData);
            const imgs = Array.isArray(p.images) ? p.images : [];
            setExistingImages(imgs);

            initialDataRef.current = {
              formData: loadedData,
              imagesCount: imgs.length,
            };
          } else {
            toast.error(res?.message || "Failed to fetch property details");
          }
        } catch (error) {
          toast.error(error.message || "An error occurred while fetching property");
        } finally {
          setIsFetching(false);
        }
      };

      fetchProperty();
    } else {
      initialDataRef.current = {
        formData: {
          title: "",
          description: "",
          location: "",
          latitude: "",
          longitude: "",
          city: "",
          state: "",
          country: "India",
          postalCode: "",
          placeName: "",
          youtubeVideoUrl: "",
          status: "AVAILABLE",
          category: "RESIDENTIAL",
          totalSize: "",
          targetReturn: "",
          termPeriodYears: "",
          minInvestment: "",
          totalPrice: "",
        },
        imagesCount: 0,
      };
    }
  }, [isEdit, id]);

  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsDetectingLocation(false);
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        setShowMapDetails(true);
        toast.success(`Coordinates captured: ${lat}, ${lng}`);
      },
      (error) => {
        setIsDetectingLocation(false);
        toast.error(error.message || "Unable to retrieve your current location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const isFormDirty = useCallback(() => {
    if (isSavedRef.current) return false;
    if (!initialDataRef.current) return false;

    if (selectedFiles.length > 0) return true;

    const init = initialDataRef.current.formData;
    if (formData.title.trim() !== (init.title || "").trim()) return true;
    if (formData.description.trim() !== (init.description || "").trim()) return true;
    if (formData.location.trim() !== (init.location || "").trim()) return true;
    if (formData.latitude !== (init.latitude || "")) return true;
    if (formData.longitude !== (init.longitude || "")) return true;
    if (formData.city.trim() !== (init.city || "").trim()) return true;
    if (formData.state.trim() !== (init.state || "").trim()) return true;
    if (formData.postalCode.trim() !== (init.postalCode || "").trim()) return true;
    if (formData.placeName.trim() !== (init.placeName || "").trim()) return true;
    if (formData.youtubeVideoUrl.trim() !== (init.youtubeVideoUrl || "").trim()) return true;
    if (formData.status !== init.status) return true;
    if (formData.category !== init.category) return true;
    if (String(formData.totalSize).trim() !== String(init.totalSize || "").trim()) return true;
    if (String(formData.targetReturn).trim() !== String(init.targetReturn || "").trim()) return true;
    if (String(formData.termPeriodYears).trim() !== String(init.termPeriodYears || "").trim()) return true;
    if (String(formData.minInvestment).trim() !== String(init.minInvestment || "").trim()) return true;
    if (String(formData.totalPrice).trim() !== String(init.totalPrice || "").trim()) return true;
    if (existingImages.length !== initialDataRef.current.imagesCount) return true;

    return false;
  }, [formData, selectedFiles.length, existingImages.length]);

  // Sync with global UnsavedChangesProvider
  useEffect(() => {
    const dirty = isFormDirty();
    setDirty(dirty);
    return () => {
      setDirty(false);
    };
  }, [isFormDirty, setDirty]);

  // Alert on tab close/refresh if dirty
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isFormDirty()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isFormDirty]);

  const handleNavigateBack = (targetUrl) => {
    if (isFormDirty()) {
      setPendingNavigationUrl(targetUrl);
      setIsUnsavedModalOpen(true);
    } else {
      router.push(targetUrl);
    }
  };

  // Clean up blob preview URLs
  useEffect(() => {
    return () => {
      filePreviews.forEach((item) => {
        if (item.url && item.url.startsWith("blob:")) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, [filePreviews]);

  // Lock body scroll when preview modal is open
  useEffect(() => {
    if (previewModalIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [previewModalIndex]);

  // Combined list of all images for display & full screen preview
  const allImagesList = [
    ...existingImages.map((url, i) => ({ type: "existing", url, originalIndex: i })),
    ...filePreviews.map((p, i) => ({ type: "new", url: p.url, originalIndex: i })),
  ];

  const handlePrevPreview = useCallback(() => {
    if (allImagesList.length <= 1) return;
    setPreviewModalIndex((prev) => (prev === 0 ? allImagesList.length - 1 : prev - 1));
  }, [allImagesList.length]);

  const handleNextPreview = useCallback(() => {
    if (allImagesList.length <= 1) return;
    setPreviewModalIndex((prev) => (prev === allImagesList.length - 1 ? 0 : prev + 1));
  }, [allImagesList.length]);

  // Keyboard navigation for preview modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (previewModalIndex === null) return;
      if (e.key === "Escape") {
        setPreviewModalIndex(null);
        return;
      }
      if (allImagesList.length <= 1) return;
      if (e.key === "ArrowLeft") handlePrevPreview();
      if (e.key === "ArrowRight") handleNextPreview();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewModalIndex, allImagesList.length, handlePrevPreview, handleNextPreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles = [];
    const newPreviews = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not a valid image file`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        continue;
      }
      validFiles.push(file);
      newPreviews.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        url: URL.createObjectURL(file),
      });
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setFilePreviews((prev) => [...prev, ...newPreviews]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeSelectedFile = (index) => {
    const previewToRemove = filePreviews[index];
    if (previewToRemove?.url && previewToRemove.url.startsWith("blob:")) {
      URL.revokeObjectURL(previewToRemove.url);
    }
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    if (previewModalIndex !== null) setPreviewModalIndex(null);
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
    if (previewModalIndex !== null) setPreviewModalIndex(null);
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val) || val === "") return "";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url || typeof url !== "string") return null;
    try {
      const trimmed = url.trim();
      // Match 11-char video ID from watch?v=, youtu.be/, embed/, shorts/, live/, etc.
      const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
      const match = trimmed.match(regExp);
      if (match && match[1] && match[1].length === 11) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    } catch {
      return null;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Property Title is required");
      return;
    }
    if (!formData.location.trim()) {
      toast.error("Location / Address is required");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Property Description is required");
      return;
    }
    if (!formData.totalPrice || Number(formData.totalPrice) <= 0) {
      toast.error("Current Price / Total Valuation is required and must be greater than ₹0");
      return;
    }
    if (!formData.targetReturn || Number(formData.targetReturn) <= 0) {
      toast.error("Target Annual Return (%) is required and must be greater than 0%");
      return;
    }
    if (!formData.termPeriodYears || parseInt(formData.termPeriodYears, 10) <= 0) {
      toast.error("Term Period (Years) is required and must be at least 1 year");
      return;
    }
    if (!formData.totalSize || Number(formData.totalSize) <= 0) {
      toast.error("Total Size (sq.ft) is required and must be greater than 0");
      return;
    }
    if (!isEdit && selectedFiles.length === 0 && existingImages.length === 0) {
      toast.error("Please upload at least one property photo");
      return;
    }

    // Check map coordinates if provided
    const hasLat = formData.latitude !== "" && formData.latitude !== null && formData.latitude !== undefined;
    const hasLng = formData.longitude !== "" && formData.longitude !== null && formData.longitude !== undefined;

    let locationPayloadValue;

    if (hasLat || hasLng) {
      if (!hasLat || !hasLng) {
        toast.error("Both Latitude and Longitude are required when specifying coordinates");
        return;
      }
      const latNum = parseFloat(formData.latitude);
      const lngNum = parseFloat(formData.longitude);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        toast.error("Latitude must be a valid number between -90 and 90");
        return;
      }
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        toast.error("Longitude must be a valid number between -180 and 180");
        return;
      }

      const locationObject = {
        address: formData.location.trim(),
        latitude: latNum,
        longitude: lngNum,
        ...(formData.city?.trim() ? { city: formData.city.trim() } : {}),
        ...(formData.state?.trim() ? { state: formData.state.trim() } : {}),
        ...(formData.country?.trim() ? { country: formData.country.trim() } : { country: "India" }),
        ...(formData.postalCode?.trim() ? { postalCode: formData.postalCode.trim() } : {}),
        ...(formData.placeName?.trim() ? { placeName: formData.placeName.trim() } : {}),
      };
      locationPayloadValue = JSON.stringify(locationObject);
    } else if (
      formData.city?.trim() ||
      formData.state?.trim() ||
      formData.postalCode?.trim() ||
      formData.placeName?.trim()
    ) {
      const locationObject = {
        address: formData.location.trim(),
        ...(formData.city?.trim() ? { city: formData.city.trim() } : {}),
        ...(formData.state?.trim() ? { state: formData.state.trim() } : {}),
        ...(formData.country?.trim() ? { country: formData.country.trim() } : { country: "India" }),
        ...(formData.postalCode?.trim() ? { postalCode: formData.postalCode.trim() } : {}),
        ...(formData.placeName?.trim() ? { placeName: formData.placeName.trim() } : {}),
      };
      locationPayloadValue = JSON.stringify(locationObject);
    } else {
      locationPayloadValue = formData.location.trim();
    }

    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", formData.title.trim());
      if (formData.description.trim()) {
        fd.append("description", formData.description.trim());
      }
      fd.append("location", locationPayloadValue);
      if (formData.youtubeVideoUrl !== undefined) {
        fd.append("youtubeVideoUrl", formData.youtubeVideoUrl.trim());
      }
      if (isEdit && formData.status) {
        fd.append("status", formData.status);
      }
      const categoryToSend = formData.category === "OTHER" ? "OTHERS" : formData.category;
      fd.append("category", categoryToSend);
      if (formData.totalSize !== "") {
        fd.append("totalSize", Number(formData.totalSize));
      }
      if (formData.targetReturn !== "") {
        fd.append("targetReturn", Number(formData.targetReturn));
      }
      if (formData.termPeriodYears !== "") {
        fd.append("termPeriodYears", parseInt(formData.termPeriodYears, 10));
      }
      if (formData.totalPrice !== "") {
        fd.append("totalPrice", Number(formData.totalPrice));
      }

      // Append existing image URLs under 'images' key
      existingImages.forEach((imgUrl) => {
        fd.append("images", imgUrl);
      });

      // Append newly uploaded image files under 'images' key
      selectedFiles.forEach((file) => {
        fd.append("images", file);
      });

      let res;
      if (isEdit && id) {
        res = await api.put(`/admin/property/${id}`, fd);
      } else {
        res = await api.post("/admin/property/add", fd);
      }

      if (res?.success) {
        isSavedRef.current = true;
        resetDirty();
        toast.success(res.message || `Property ${isEdit ? "updated" : "added"} successfully!`);
        if (isEdit && id) {
          router.push(`/property/${id}`);
        } else {
          router.push("/property");
        }
      } else {
        toast.error(res?.message || `Failed to ${isEdit ? "update" : "add"} property`);
      }
    } catch (error) {
      toast.error(error.message || `An error occurred while ${isEdit ? "updating" : "saving"} property`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <FormSkeleton />;
  }

  const totalImageCount = allImagesList.length;

  const totalPriceNum = Number(formData.totalPrice) || 0;
  const totalSizeNum = Number(formData.totalSize) || 0;
  // 1 unit = 1 sq.ft
  const computedTotalUnits = totalSizeNum > 0 ? totalSizeNum : 0;
  const computedPerUnitPrice = computedTotalUnits > 0 ? totalPriceNum / computedTotalUnits : 0;
  const computedMinInvestment = computedPerUnitPrice;

  const hasValidCoords =
    formData.latitude !== "" &&
    formData.longitude !== "" &&
    !isNaN(parseFloat(formData.latitude)) &&
    !isNaN(parseFloat(formData.longitude));

  return (
    <div className="w-full flex flex-col min-w-0 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            type="button"
            onClick={() => handleNavigateBack(isEdit && id ? `/property/${id}` : "/property")}
            className="text-gray-500 hover:text-gray-900 text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors mb-1.5 cursor-pointer"
          >
            <Icon icon="lucide:arrow-left" width="15" height="15" />
            {isEdit ? "Back to Property Details" : "Back to Properties"}
          </button>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              {isEdit ? (formData.title ? `Edit: ${formData.title}` : "Edit Property") : "Add New Property"}
            </h1>
            <span
              className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-md ${
                isEdit
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-primary/10 text-primary border border-primary/20"
              }`}
            >
              {isEdit ? "Editing Mode" : "New Listing"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {isEdit
              ? "Update property parameters, valuation metrics, map location and gallery."
              : "Fill in the required information to publish a new investment property."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => handleNavigateBack(isEdit && id ? `/property/${id}` : "/property")}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-primary text-white hover:bg-primary/90 font-semibold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-60 cursor-pointer min-w-[130px]"
          >
            {isLoading ? (
              <>
                <Icon icon="lucide:loader-2" className="animate-spin" width="16" height="16" />
                <span>{isEdit ? "Updating..." : "Saving..."}</span>
              </>
            ) : (
              <>
                <Icon icon="lucide:check" width="16" height="16" />
                <span>{isEdit ? "Save Changes" : "Publish Property"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Responsive Grid Layout Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Section 1: Basic Information */}
        <div className="order-1 lg:col-span-8 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icon icon="lucide:building-2" width="16" height="16" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Basic Information</h2>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-xs font-semibold text-gray-700">
              Property Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g. Skytech Merion Residency"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium text-gray-900"
            />
          </div>

            {/* Location / Address */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label htmlFor="location" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <span>Location & Map Coordinates</span>
                  {isEdit ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 font-normal">
                      <Icon icon="lucide:lock" width="12" height="12" />
                      <span>(Locked after creation)</span>
                    </span>
                  ) : (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMapModalOpen(true)}
                    className="text-xs text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
                    title="Open large map in modal"
                  >
                    <Icon icon="lucide:maximize-2" width="13" height="13" />
                    <span>Expand Full Map</span>
                  </button>
                  <span className="text-gray-300">&bull;</span>
                  <button
                    type="button"
                    onClick={() => setShowMapDetails((prev) => !prev)}
                    className="text-xs text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Icon icon={showMapDetails ? "lucide:chevron-up" : "lucide:map"} width="14" height="14" />
                    <span>{showMapDetails ? "Hide Coordinates & Details" : "View Coordinates"}</span>
                  </button>
                </div>
              </div>

              {/* Swiggy / Zomato / Zepto Style Interactive Map Location Picker */}
              <div className="w-full">
                <InteractiveMapPicker
                  initialLatitude={formData.latitude}
                  initialLongitude={formData.longitude}
                  initialAddress={formData.location}
                  initialPlaceName={formData.placeName}
                  onLocationSelect={isEdit ? () => {} : handleMapLocationSelect}
                  height="340px"
                  showBottomDetails={true}
                />
              </div>

              {/* Display Address Input */}
              <div className="flex flex-col gap-1 mt-1">
                <label htmlFor="location" className="text-[11px] font-semibold text-gray-600">
                  Display Address / Street Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Icon icon="lucide:map-pin" width="16" height="16" />
                  </span>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    disabled={isEdit}
                    required
                    placeholder="e.g. Connaught Place, New Delhi"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none transition-all text-sm font-medium ${
                      isEdit
                        ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                        : "border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary text-gray-900 bg-white"
                    }`}
                  />
                </div>
              </div>



              {/* Collapsible Coordinates & Structured Map Location Section */}
              {showMapDetails && (
                <div className="mt-1 p-4 bg-slate-50/90 rounded-xl border border-slate-200/80 flex flex-col gap-3.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-1.5">
                      <Icon icon="lucide:map-pinned" className="text-primary" width="16" height="16" />
                      <span className="text-xs font-bold text-gray-800">Coordinates & Address Breakdown</span>
                    </div>
                    {hasValidCoords && (
                      <a
                        href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
                      >
                        <Icon icon="lucide:external-link" width="12" height="12" />
                        <span>Preview Pin on Google Maps</span>
                      </a>
                    )}
                  </div>

                  {/* Latitude & Longitude */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  <div className="flex flex-col gap-1">
                    <label htmlFor="latitude" className="text-[11px] font-semibold text-gray-600">
                      Latitude (-90 to 90)
                    </label>
                    <input
                      type="number"
                      step="any"
                      id="latitude"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      disabled={isEdit}
                      placeholder="e.g. 28.613939"
                      className={`w-full px-3 py-2 rounded-lg border outline-none text-xs font-mono ${
                        isEdit
                          ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                          : "border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="longitude" className="text-[11px] font-semibold text-gray-600">
                      Longitude (-180 to 180)
                    </label>
                    <input
                      type="number"
                      step="any"
                      id="longitude"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      disabled={isEdit}
                      placeholder="e.g. 77.209021"
                      className={`w-full px-3 py-2 rounded-lg border outline-none text-xs font-mono ${
                        isEdit
                          ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                          : "border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                      }`}
                    />
                  </div>
                </div>

                {/* Place Name, City, State, Postal Code */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="placeName" className="text-[11px] font-semibold text-gray-600">
                      Building / Place Name
                    </label>
                    <input
                      type="text"
                      id="placeName"
                      name="placeName"
                      value={formData.placeName}
                      onChange={handleChange}
                      disabled={isEdit}
                      placeholder="e.g. ABC Commercial Tower"
                      className={`w-full px-3 py-2 rounded-lg border outline-none text-xs ${
                        isEdit
                          ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                          : "border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="city" className="text-[11px] font-semibold text-gray-600">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      disabled={isEdit}
                      placeholder="e.g. New Delhi"
                      className={`w-full px-3 py-2 rounded-lg border outline-none text-xs ${
                        isEdit
                          ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                          : "border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="state" className="text-[11px] font-semibold text-gray-600">
                      State / Region
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      disabled={isEdit}
                      placeholder="e.g. Delhi"
                      className={`w-full px-3 py-2 rounded-lg border outline-none text-xs ${
                        isEdit
                          ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                          : "border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="postalCode" className="text-[11px] font-semibold text-gray-600">
                      Postal Code / PIN
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      disabled={isEdit}
                      placeholder="e.g. 110001"
                      className={`w-full px-3 py-2 rounded-lg border outline-none text-xs ${
                        isEdit
                          ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                          : "border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="country" className="text-[11px] font-semibold text-gray-600">
                      Country
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      disabled={isEdit}
                      placeholder="e.g. India"
                      className={`w-full px-3 py-2 rounded-lg border outline-none text-xs ${
                        isEdit
                          ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                          : "border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Category & Status (Category is EDITABLE in both Create & Edit; Status is read-only in Edit mode with NO manual override) */}
          <div className={`grid grid-cols-1 ${isEdit ? "sm:grid-cols-2" : "sm:grid-cols-1"} gap-4`}>
            {/* Category (Editable) */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="category" className="text-xs font-semibold text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium text-gray-800 bg-white cursor-pointer"
              >
                <option value="RESIDENTIAL">RESIDENTIAL</option>
                <option value="COMMERCIAL">COMMERCIAL</option>
                <option value="INDUSTRIAL">INDUSTRIAL</option>
                <option value="LAND">LAND</option>
                <option value="OTHERS">OTHERS</option>
              </select>
            </div>

            {/* Status (Read-Only Badge in Edit Mode - No Manual Override) */}
            {isEdit && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>Listing Status</span>
                    <Icon icon="lucide:lock" width="12" height="12" className="text-gray-400" />
                  </span>
                  <span className="text-gray-400 font-normal text-[11px]">System managed</span>
                </label>
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                    formData.status === "AVAILABLE"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : formData.status === "SOLD" || formData.status === "SOLD_OUT"
                      ? "bg-gray-200 text-gray-800 border border-gray-300"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}>
                    <Icon
                      icon={
                        formData.status === "AVAILABLE"
                          ? "lucide:check-circle-2"
                          : formData.status === "SOLD" || formData.status === "SOLD_OUT"
                          ? "lucide:check-check"
                          : "lucide:clock"
                      }
                      width="13"
                      height="13"
                    />
                    <span>{formData.status === "SOLD" ? "SOLD_OUT" : formData.status || "UNDER_REVIEW"}</span>
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">Read-only</span>
                </div>
              </div>
            )}
          </div>

          {/* YouTube Video URL (Optional) with Live Player Preview */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="youtubeVideoUrl" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Icon icon="lucide:video" className="text-red-500" width="15" height="15" />
                <span>YouTube Video Walkthrough URL</span>
              </label>
              <span className="text-gray-400 font-normal text-[11px]">(Optional)</span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <Icon icon="lucide:link" width="16" height="16" />
              </span>
              <input
                type="url"
                id="youtubeVideoUrl"
                name="youtubeVideoUrl"
                value={formData.youtubeVideoUrl}
                onChange={handleChange}
                placeholder="e.g. https://youtube.com/watch?v=... or https://youtube.com/shorts/..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm text-gray-900"
              />
              {formData.youtubeVideoUrl && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, youtubeVideoUrl: "" }))}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  title="Clear URL"
                >
                  <Icon icon="lucide:x" width="16" height="16" />
                </button>
              )}
            </div>

            {/* Live Playable Video Preview */}
            {formData.youtubeVideoUrl?.trim() && (
              <div className="p-3 bg-gray-50/90 border border-gray-200 rounded-xl flex flex-col gap-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon icon="lucide:play-circle" className="text-red-600" width="16" height="16" />
                    <span className="text-xs font-bold text-gray-800">Live Video Preview</span>
                  </div>
                  <a
                    href={formData.youtubeVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Open YouTube</span>
                    <Icon icon="lucide:external-link" width="12" height="12" />
                  </a>
                </div>

                {getYouTubeEmbedUrl(formData.youtubeVideoUrl) ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black shadow-inner">
                    <iframe
                      src={getYouTubeEmbedUrl(formData.youtubeVideoUrl)}
                      title="Property Video Walkthrough Preview"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center gap-2">
                    <Icon icon="lucide:alert-circle" width="15" height="15" className="text-amber-600 shrink-0" />
                    <span>Enter a valid YouTube or Shorts URL (e.g. youtube.com/watch?v=..., youtube.com/shorts/..., or youtu.be/...) to load player.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description (Read-Only in Edit Mode) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-xs font-semibold text-gray-700 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>Property Description <span className="text-red-500">*</span></span>
                {isEdit && <Icon icon="lucide:lock" width="12" height="12" className="text-gray-400" />}
              </span>
              {isEdit && <span className="text-gray-400 font-normal text-[11px]">Locked after creation</span>}
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={isEdit}
              required
              rows={4}
              placeholder="Comprehensive overview of the property, construction specs, amenities, tenant profile, and expected appreciation..."
              className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-sm resize-y ${
                isEdit
                  ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                  : "border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary text-gray-800 bg-white"
              }`}
            />
          </div>
        </div>

        {/* Section 2: Property Photos (Order 2 on Mobile right after Basic Info, 4 cols on Desktop) */}
        <div className="order-2 lg:col-span-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Icon icon="lucide:image" width="16" height="16" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Property Photos <span className="text-red-500">*</span>
                </h2>
                <span className="text-[11px] text-gray-400">{totalImageCount} photo{totalImageCount === 1 ? "" : "s"} (click to expand)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Icon icon="lucide:plus" width="14" height="14" />
              <span>Add Photos</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesSelect}
            className="hidden"
          />

          {/* Dropzone Area if no images */}
          {totalImageCount === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="h-36 border-2 border-dashed border-gray-200 hover:border-primary rounded-xl flex flex-col items-center justify-center text-center text-gray-500 hover:bg-gray-50/50 cursor-pointer transition-all gap-2 p-4"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon icon="lucide:upload-cloud" width="20" height="20" />
              </div>
              <div>
                <span className="font-semibold text-gray-800 text-xs block">
                  Click to upload photos <span className="text-red-500">*</span>
                </span>
                <span className="text-[10px] text-gray-400">JPG, PNG, WebP up to 10MB</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5">
              {/* Existing Saved Images */}
              {existingImages.map((imgUrl, index) => (
                <div
                  key={`exist-${index}`}
                  onClick={() => setPreviewModalIndex(index)}
                  className="relative group h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 cursor-pointer shadow-2xs hover:shadow-md transition-all"
                  title="Click to view full screen"
                >
                  <img
                    src={imgUrl}
                    alt={`Saved Property ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />

                  {/* Expand icon indicator on hover */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none">
                    <Icon icon="lucide:maximize-2" width="14" height="14" />
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeExistingImage(index);
                    }}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-opacity shadow-sm cursor-pointer z-10"
                    title="Remove image"
                  >
                    <Icon icon="lucide:x" width="11" height="11" />
                  </button>

                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-bold px-1 rounded backdrop-blur-xs pointer-events-none">
                    Saved
                  </span>
                </div>
              ))}

              {/* Newly Selected Uploads */}
              {filePreviews.map((preview, index) => {
                const globalIdx = existingImages.length + index;
                return (
                  <div
                    key={preview.id}
                    onClick={() => setPreviewModalIndex(globalIdx)}
                    className="relative group h-20 rounded-xl overflow-hidden border-2 border-primary/50 bg-gray-50 cursor-pointer shadow-2xs hover:shadow-md transition-all"
                    title="Click to view full screen"
                  >
                    <img
                      src={preview.url}
                      alt={`New upload ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />

                    {/* Expand icon indicator on hover */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none">
                      <Icon icon="lucide:maximize-2" width="14" height="14" />
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSelectedFile(index);
                      }}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-opacity shadow-sm cursor-pointer z-10"
                      title="Remove image"
                    >
                      <Icon icon="lucide:x" width="11" height="11" />
                    </button>

                    <span className="absolute bottom-1 left-1 bg-primary text-white text-[8px] px-1 rounded font-bold pointer-events-none">
                      New
                    </span>
                  </div>
                );
              })}

              {/* Add More Thumbnail Tile */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-20 border-2 border-dashed border-gray-200 hover:border-primary rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-primary hover:bg-gray-50/50 cursor-pointer transition-colors"
              >
                <Icon icon="lucide:plus" width="16" height="16" />
                <span className="text-[9px] font-semibold mt-0.5">Add</span>
              </button>
            </div>
          )}
        </div>

        {/* Section 3: Financials & Investment Metrics (Order 3 on Mobile, 8 cols on Desktop) */}
        <div className="order-3 lg:col-span-8 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
              <Icon icon="lucide:coins" width="16" height="16" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Financial Metrics & Valuation</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Current Price / Valuation (Editable in both Create & Edit mode) */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="totalPrice" className="text-xs font-semibold text-gray-700">
                Current Price (INR) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 font-semibold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  id="totalPrice"
                  name="totalPrice"
                  value={formData.totalPrice}
                  required
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e") e.preventDefault();
                  }}
                  onChange={handleChange}
                  placeholder="e.g. 5000000"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold text-gray-900 bg-white"
                />
              </div>
              {formData.totalPrice && !isNaN(Number(formData.totalPrice)) && (
                <span className="text-[11px] font-semibold text-primary pl-1">
                  Formatted: {formatCurrency(Number(formData.totalPrice))}
                </span>
              )}
            </div>

            {/* Target Return (%) (Locked in Edit mode) */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="targetReturn" className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span>Target Annual Return (%) <span className="text-red-500">*</span></span>
                  {isEdit && <Icon icon="lucide:lock" width="12" height="12" className="text-gray-400" />}
                </span>
                {isEdit && <span className="text-gray-400 font-normal text-[11px]">Locked after creation</span>}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  id="targetReturn"
                  name="targetReturn"
                  value={formData.targetReturn}
                  disabled={isEdit}
                  required
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e") e.preventDefault();
                  }}
                  onChange={handleChange}
                  placeholder="e.g. 14.5"
                  className={`w-full pl-4 pr-9 py-2.5 rounded-xl border outline-none transition-all text-sm font-semibold ${
                    isEdit
                      ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                      : "border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary text-emerald-600 bg-white"
                  }`}
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 font-semibold text-sm pointer-events-none">
                  %
                </span>
              </div>
            </div>

            {/* Term Period (Years) (Locked in Edit mode) */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="termPeriodYears" className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span>Term Period (Years) <span className="text-red-500">*</span></span>
                  {isEdit && <Icon icon="lucide:lock" width="12" height="12" className="text-gray-400" />}
                </span>
                <span className="text-gray-400 font-normal text-[11px]">
                  {isEdit ? "Locked after creation" : "Investment duration"}
                </span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Icon icon="lucide:hourglass" width="16" height="16" />
                </span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="1"
                  id="termPeriodYears"
                  name="termPeriodYears"
                  value={formData.termPeriodYears}
                  disabled={isEdit}
                  required
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e" || e.key === ".") e.preventDefault();
                  }}
                  onChange={handleChange}
                  placeholder="e.g. 5"
                  className={`w-full pl-10 pr-14 py-2.5 rounded-xl border outline-none transition-all text-sm font-semibold ${
                    isEdit
                      ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                      : "border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary text-indigo-700 bg-white"
                  }`}
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-gray-400 pointer-events-none">
                  Years
                </span>
              </div>
              {formData.termPeriodYears && !isNaN(Number(formData.termPeriodYears)) && (
                <span className="text-[11px] font-semibold text-indigo-600 pl-1">
                  Duration: {formData.termPeriodYears} Year{Number(formData.termPeriodYears) === 1 ? "" : "s"} Lock-in Term
                </span>
              )}
            </div>

            {/* Total Size (sq.ft) (Locked in Edit mode) */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="totalSize" className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span>Total Size (sq.ft) <span className="text-red-500">*</span></span>
                  {isEdit && <Icon icon="lucide:lock" width="12" height="12" className="text-gray-400" />}
                </span>
                <span className="text-gray-400 font-normal text-[11px]">
                  {isEdit ? "Locked after creation" : "Area in sq.ft"}
                </span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Icon icon="lucide:maximize" width="16" height="16" />
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  id="totalSize"
                  name="totalSize"
                  value={formData.totalSize}
                  disabled={isEdit}
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e") e.preventDefault();
                  }}
                  onChange={handleChange}
                  placeholder="e.g. 2000"
                  className={`w-full pl-10 pr-14 py-2.5 rounded-xl border outline-none transition-all text-sm font-medium ${
                    isEdit
                      ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                      : "border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary text-gray-900 bg-white"
                  }`}
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-gray-400 pointer-events-none">
                  sq.ft
                </span>
              </div>
            </div>

            {/* Auto-Calculated Unit Economics Preview Card */}
            {computedTotalUnits > 0 && (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between font-bold text-emerald-900 border-b border-emerald-100/80 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Icon icon="lucide:calculator" className="text-emerald-700" width="15" height="15" />
                    <span>Auto-Computed Unit Economics</span>
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Server Auto
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-gray-500 block">Total Units</span>
                    <span className="font-bold text-gray-900 text-xs sm:text-sm">{computedTotalUnits.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Price / Unit</span>
                    <span className="font-bold text-gray-900 text-xs sm:text-sm">{formatCurrency(computedPerUnitPrice)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Min. Investment</span>
                    <span className="font-bold text-emerald-700 text-xs sm:text-sm">{formatCurrency(computedMinInvestment)}</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 italic">
                  * 1 unit = 1 sq.ft. Minimum investment is automatically computed by the server as 1 unit price (Total Price / Total Units).
                </p>
              </div>
            )}
          </div>

          {isEdit && (
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-2.5 text-xs text-blue-800 mt-1">
              <Icon icon="lucide:info" className="text-blue-600 shrink-0 mt-0.5" width="15" height="15" />
              <span>
                <strong>Automatic Price History Sync:</strong> Changing the Current Price here will automatically generate a new Price History trend node.
              </span>
            </div>
          )}
        </div>

        {/* Section 4: Action Buttons Card (Order 4 on Mobile, 4 cols on Desktop) */}
        <div className="order-4 lg:col-span-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white hover:bg-primary/90 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-60 cursor-pointer text-sm"
          >
            {isLoading ? (
              <>
                <Icon icon="lucide:loader-2" className="animate-spin" width="18" height="18" />
                <span>{isEdit ? "Updating Property..." : "Publishing Property..."}</span>
              </>
            ) : (
              <>
                <Icon icon="lucide:check-circle" width="18" height="18" />
                <span>{isEdit ? "Update Property" : "Publish Property"}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleNavigateBack(isEdit && id ? `/property/${id}` : "/property")}
            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer text-center"
          >
            Cancel & Go Back
          </button>
        </div>
      </form>

      {/* Full Screen Lightbox Preview Modal for Form Photos */}
      {previewModalIndex !== null && allImagesList[previewModalIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setPreviewModalIndex(null)}
        >
          {/* Top Bar inside Fullscreen */}
          <div
            className="w-full flex items-center justify-between text-white z-20 pb-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-200">
                Photo Preview ({allImagesList[previewModalIndex].type === "existing" ? "Saved" : "New Upload"})
              </span>
              {allImagesList.length > 1 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/15 text-gray-300 font-medium">
                  {previewModalIndex + 1} of {allImagesList.length}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setPreviewModalIndex(null)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title="Close (Esc)"
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
              src={allImagesList[previewModalIndex].url}
              alt={`Full screen preview ${previewModalIndex + 1}`}
              className="max-h-[75vh] max-w-[92vw] object-contain rounded-xl select-none shadow-2xl transition-all duration-200"
            />

            {/* Left Nav in Fullscreen */}
            {allImagesList.length > 1 && (
              <button
                type="button"
                onClick={handlePrevPreview}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer border border-white/10"
                aria-label="Previous photo"
              >
                <Icon icon="lucide:chevron-left" width="24" height="24" />
              </button>
            )}

            {/* Right Nav in Fullscreen */}
            {allImagesList.length > 1 && (
              <button
                type="button"
                onClick={handleNextPreview}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer border border-white/10"
                aria-label="Next photo"
              >
                <Icon icon="lucide:chevron-right" width="24" height="24" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Strip in Fullscreen */}
          {allImagesList.length > 1 && (
            <div
              className="w-full flex items-center justify-center gap-2 overflow-x-auto pt-2 z-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              onClick={(e) => e.stopPropagation()}
            >
              {allImagesList.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPreviewModalIndex(idx)}
                  className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    previewModalIndex === idx
                      ? "border-white ring-2 ring-white/50 scale-105"
                      : "border-transparent opacity-40 hover:opacity-90"
                  }`}
                >
                  <img src={item.url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Unsaved Changes Custom Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={isUnsavedModalOpen}
        onClose={() => {
          setIsUnsavedModalOpen(false);
          setPendingNavigationUrl(null);
        }}
        onConfirm={() => {
          setIsUnsavedModalOpen(false);
          if (pendingNavigationUrl) {
            router.push(pendingNavigationUrl);
          }
        }}
      />

      {/* Location Picker Modal (Expanded Full Map View) */}
      <LocationPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialLatitude={formData.latitude}
        initialLongitude={formData.longitude}
        initialAddress={formData.location}
        initialPlaceName={formData.placeName}
        onLocationSelect={handleMapLocationSelect}
      />
    </div>
  );

}


