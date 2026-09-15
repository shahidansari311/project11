"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import UserModal from "./UserModal";
import UserKycDocumentsSection from "../kyc/UserKycDocumentsSection";
import InvestmentDetailModal from "../investments/InvestmentDetailModal";
import InvestmentApproveModal from "../investments/InvestmentApproveModal";
import InvestmentRejectModal from "../investments/InvestmentRejectModal";
import InvestmentProofModal from "../investments/InvestmentProofModal";
import InvestmentInvoicesModal from "../investments/InvestmentInvoicesModal";
import { formatLocation } from "../../lib/locationUtils";
import { getInvestmentStatusBadge, formatStatus, formatCurrency, formatDate } from "../../lib/formatUtils";

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse max-w-7xl mx-auto pb-16">
      <div className="flex justify-between items-center">
        <div className="h-6 w-36 bg-gray-200 rounded-lg" />
        <div className="h-9 w-28 bg-gray-200 rounded-xl" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-200 shrink-0" />
          <div className="flex flex-col gap-2">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-36 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-48 bg-white rounded-2xl border border-gray-200" />
        <div className="h-48 bg-white rounded-2xl border border-gray-200" />
      </div>

      <div className="h-72 bg-white rounded-2xl border border-gray-200" />
    </div>
  );
}

export default function UserDetailView({ id }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userDocs, setUserDocs] = useState(null);
  const [userInvestments, setUserInvestments] = useState([]);
  const [isLoadingInvestments, setIsLoadingInvestments] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  // Investment Modals
  const [selectedInvestmentForDetail, setSelectedInvestmentForDetail] = useState(null);
  const [selectedInvestmentForApprove, setSelectedInvestmentForApprove] = useState(null);
  const [selectedInvestmentForReject, setSelectedInvestmentForReject] = useState(null);
  const [selectedInvestmentForProof, setSelectedInvestmentForProof] = useState(null);
  const [selectedInvestmentForInvoices, setSelectedInvestmentForInvoices] = useState(null);

  // Edit User Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // User Favorites State
  const [favorites, setFavorites] = useState([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [togglingPropertyId, setTogglingPropertyId] = useState(null);

  // Add Property to Favorites State with Scroll-based Pagination
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [propertySearch, setPropertySearch] = useState("");
  const [allProperties, setAllProperties] = useState([]);
  const [isSearchingProperties, setIsSearchingProperties] = useState(false);
  const [isLoadingMoreProps, setIsLoadingMoreProps] = useState(false);
  const [propPage, setPropPage] = useState(1);
  const [hasMoreProps, setHasMoreProps] = useState(true);
  const [addingPropId, setAddingPropId] = useState(null);
  const propSearchRef = useRef(null);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userRes, docsRes, favRes, invRes] = await Promise.all([
        api.get(`/admin/users/${id}`),
        api.get(`/admin/users/${id}/documents`).catch(() => null),
        api.get(`/admin/favorites/user/${id}`).catch(() => null),
        api.get(`/admin/investments/user/${id}`).catch(() => null),
      ]);

      if (userRes?.success) {
        setUser(userRes.data);
      } else {
        toast.error(userRes?.message || "Failed to fetch user details");
      }

      if (docsRes?.success && docsRes.data) {
        setUserDocs(docsRes.data.documents || docsRes.data);
      }

      if (favRes?.success && favRes.data) {
        const favList = Array.isArray(favRes.data.favorites)
          ? favRes.data.favorites
          : Array.isArray(favRes.data.properties)
          ? favRes.data.properties
          : Array.isArray(favRes.data)
          ? favRes.data
          : [];
        setFavorites(favList);
      }

      if (invRes?.success && invRes.data) {
        const invList = Array.isArray(invRes.data.investments)
          ? invRes.data.investments
          : Array.isArray(invRes.data)
          ? invRes.data
          : [];
        setUserInvestments(invList);
      }
    } catch (error) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
      setIsLoadingInvestments(false);
      setIsLoadingFavorites(false);
    }
  }, [id]);

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get(`/admin/users/${id}`);
      if (res?.success) {
        setUser(res.data);
      }
    } catch {
      // ignore
    }
  }, [id]);

  const fetchUserDocs = useCallback(async () => {
    try {
      const res = await api.get(`/admin/users/${id}/documents`);
      if (res?.success && res.data) {
        setUserDocs(res.data.documents || res.data);
      }
    } catch {
      // Non-blocking if documents are not found
    }
  }, [id]);

  const fetchUserInvestments = useCallback(async () => {
    setIsLoadingInvestments(true);
    try {
      const res = await api.get(`/admin/investments/user/${id}`);
      if (res?.success && res.data) {
        const invList = Array.isArray(res.data.investments)
          ? res.data.investments
          : Array.isArray(res.data)
          ? res.data
          : [];
        setUserInvestments(invList);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingInvestments(false);
    }
  }, [id]);

  const fetchUserFavorites = useCallback(async () => {
    setIsLoadingFavorites(true);
    try {
      const res = await api.get(`/admin/favorites/user/${id}`);
      if (res?.success && res.data) {
        const favList = Array.isArray(res.data.favorites)
          ? res.data.favorites
          : Array.isArray(res.data.properties)
          ? res.data.properties
          : Array.isArray(res.data)
          ? res.data
          : [];
        setFavorites(favList);
      } else {
        setFavorites([]);
      }
    } catch {
      setFavorites([]);
    } finally {
      setIsLoadingFavorites(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchInitialData();
    }
  }, [id, fetchInitialData]);

  // Search & Scroll Pagination for properties
  const searchProperties = useCallback(async (query, pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setIsSearchingProperties(true);
    } else {
      setIsLoadingMoreProps(true);
    }

    try {
      let url = `/admin/property?page=${pageNum}&limit=12`;
      if (query && query.trim()) {
        url += `&search=${encodeURIComponent(query.trim())}`;
      }
      const res = await api.get(url);
      if (res?.success && res.data?.properties) {
        const incoming = res.data.properties;
        const pagination = res.data.pagination;
        setHasMoreProps(pagination ? pagination.hasNext : incoming.length >= 12);
        setPropPage(pageNum);

        if (append) {
          setAllProperties((prev) => {
            const existingIds = new Set(prev.map((p) => p.id || p.propertyId));
            const fresh = incoming.filter((p) => !existingIds.has(p.id || p.propertyId));
            return [...prev, ...fresh];
          });
        } else {
          setAllProperties(incoming);
        }
      } else {
        if (!append) setAllProperties([]);
        setHasMoreProps(false);
      }
    } catch {
      if (!append) setAllProperties([]);
      setHasMoreProps(false);
    } finally {
      setIsSearchingProperties(false);
      setIsLoadingMoreProps(false);
    }
  }, []);

  const loadMoreProperties = () => {
    if (isSearchingProperties || isLoadingMoreProps || !hasMoreProps) return;
    searchProperties(propertySearch, propPage + 1, true);
  };

  const handlePropListScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      loadMoreProperties();
    }
  };

  useEffect(() => {
    if (showAddProperty) {
      setTimeout(() => propSearchRef.current?.focus(), 100);
      searchProperties("", 1, false);
    }
  }, [showAddProperty, searchProperties]);

  useEffect(() => {
    if (!showAddProperty) return;
    const timer = setTimeout(() => {
      searchProperties(propertySearch, 1, false);
    }, 250);
    return () => clearTimeout(timer);
  }, [propertySearch, showAddProperty, searchProperties]);

  const handleToggleFavorite = async (property) => {
    const propId = typeof property === "object" ? (property.id || property.propertyId) : property;
    if (!id || !propId) return;

    setTogglingPropertyId(propId);
    setAddingPropId(propId);
    try {
      const res = await api.post(`/admin/favorites/user/${id}/property/${propId}`);
      if (res?.success) {
        toast.success(res.message || "Favorite updated successfully");
        const isFavorited = res.data?.favorited;
        if (isFavorited === false) {
          setFavorites((prev) => prev.filter((p) => (p.id || p.propertyId) !== propId));
        } else if (typeof property === "object") {
          setFavorites((prev) => {
            if (prev.some((p) => (p.id || p.propertyId) === propId)) return prev;
            return [property, ...prev];
          });
          setShowAddProperty(false);
        } else {
          fetchUserFavorites();
          setShowAddProperty(false);
        }
      } else {
        toast.error(res?.message || "Failed to update favorite");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update favorite");
    } finally {
      setTogglingPropertyId(null);
      setAddingPropId(null);
    }
  };

  const handleCopyId = (userId) => {
    if (!userId) return;
    navigator.clipboard.writeText(userId);
    setCopiedId(true);
    toast.success("User ID copied to clipboard!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDocStatus = (status) => {
    if (!status || status === "NOT_UPLOADED") return "Not Uploaded";
    switch (status.toUpperCase()) {
      case "APPROVED":
      case "VERIFIED":
        return "Approved";
      case "PENDING":
      case "PENDING_VERIFICATION":
        return "Pending";
      case "UNDER_REVIEW":
        return "Under Review";
      case "REJECTED":
        return "Rejected";
      default:
        return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  const getDocStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
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
  };

  if (isLoading) return <DetailSkeleton />;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
          <Icon icon="lucide:user-x" className="text-gray-400" width="32" height="32" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">User not found</h3>
        <button
          onClick={() => router.push("/users")}
          className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-2xs hover:bg-primary/90"
        >
          <Icon icon="lucide:arrow-left" width="16" height="16" />
          Back to Users
        </button>
      </div>
    );
  }

  const aadhaar = userDocs?.aadhaar;
  const pan = userDocs?.pan;

  const activeUserWithDocs = user
    ? {
        ...user,
        documents: userDocs || user.documents || {},
      }
    : null;

  return (
    <div className="flex flex-col gap-6 w-full pb-16 max-w-7xl mx-auto">
      {/* Navigation Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <Link
            href="/users"
            className="text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5 font-medium"
          >
            <Icon icon="lucide:arrow-left" width="16" height="16" />
            <span>Users</span>
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-bold truncate max-w-xs sm:max-w-md">
            {user.fullName || "User Profile"}
          </span>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              fetchUser();
              fetchUserDocs();
              fetchUserFavorites();
            }}
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Icon icon="lucide:refresh-cw" width="14" height="14" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Icon icon="lucide:pencil" width="14" height="14" />
            <span>Edit User</span>
          </button>
        </div>
      </div>

      {/* User Detail Hero Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header Profile Info */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-gray-50/90 via-white to-white border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              {user.profileImage || user.profileUrl ? (
                <img
                  src={user.profileImage || user.profileUrl}
                  alt={user.fullName || "User"}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 border border-gray-200 shadow-2xs"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl sm:text-3xl shrink-0 border border-primary/20 shadow-2xs">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
                    {user.fullName || "Unnamed User"}
                  </h1>
                  {user.createdby_admin && (
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      Created by Admin
                    </span>
                  )}
                  {user.hasPurchasedProperty ? (
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Verified Buyer
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                      Member
                    </span>
                  )}
                </div>

                {/* Contact Pill Badges */}
                <div className="flex items-center gap-2 sm:gap-3 mt-2.5 flex-wrap text-xs">
                  {user.phone && (
                    <a
                      href={`tel:${user.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200/80 font-medium transition-colors"
                    >
                      <Icon icon="lucide:phone" width="13" height="13" className="text-gray-400" />
                      <span>{user.phone}</span>
                    </a>
                  )}
                  {user.email && (
                    <a
                      href={`mailto:${user.email}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200/80 font-medium transition-colors"
                    >
                      <Icon icon="lucide:mail" width="13" height="13" className="text-gray-400" />
                      <span>{user.email}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* User ID Copy Button */}
            <button
              type="button"
              onClick={() => handleCopyId(user.id)}
              className="group self-start md:self-center flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-mono text-gray-600 transition-all cursor-pointer shadow-2xs"
              title="Click to copy ID"
            >
              <span className="text-gray-400 font-sans font-medium text-[11px]">ID:</span>
              <span className="font-semibold text-gray-800">{user.id}</span>
              <Icon
                icon={copiedId ? "lucide:check" : "lucide:copy"}
                width="14"
                height="14"
                className={copiedId ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"}
              />
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="p-5 md:p-8 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white">
          <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-100 flex flex-col justify-between">
            <span className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1.5">
              <Icon icon="lucide:calendar" width="14" height="14" className="text-gray-400" />
              Member Since
            </span>
            <span className="text-sm font-bold text-gray-900">{formatDate(user.createdAt)}</span>
          </div>

          <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-100 flex flex-col justify-between">
            <span className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1.5">
              <Icon icon="lucide:shield-check" width="14" height="14" className="text-gray-400" />
              KYC Aadhaar
            </span>
            <div>
              <span className={`inline-flex px-2 py-0.5 text-[11px] font-bold rounded-md border ${getDocStatusBadge(aadhaar?.status)}`}>
                {formatDocStatus(aadhaar?.status)}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-100 flex flex-col justify-between">
            <span className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1.5">
              <Icon icon="lucide:credit-card" width="14" height="14" className="text-gray-400" />
              KYC PAN
            </span>
            <div>
              <span className={`inline-flex px-2 py-0.5 text-[11px] font-bold rounded-md border ${getDocStatusBadge(pan?.status)}`}>
                {formatDocStatus(pan?.status)}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-100 flex flex-col justify-between">
            <span className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1.5">
              <Icon icon="lucide:heart" width="14" height="14" className="text-rose-500 fill-rose-500" />
              Favorited Listings
            </span>
            <span className="text-sm font-bold text-gray-900">{favorites.length} Saved</span>
          </div>
        </div>
      </div>

      {/* KYC Documents & Verification Panel */}
      <UserKycDocumentsSection
        user={user}
        initialDocs={userDocs}
        onRefresh={() => {
          fetchUser();
          fetchUserDocs();
        }}
      />

      {/* User's Favorited Properties Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {/* Section Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0 shadow-2xs">
              <Icon icon="lucide:heart" width="18" height="18" className="fill-rose-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">Favorited Properties</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 shrink-0">
                  {favorites.length}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate">Properties bookmarked & saved by this user</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddProperty((prev) => !prev)}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer ${
              showAddProperty
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
                : "bg-primary hover:bg-primary/90 text-white"
            }`}
          >
            <Icon icon={showAddProperty ? "lucide:x" : "lucide:plus"} width="14" height="14" />
            <span className="hidden sm:inline">{showAddProperty ? "Cancel" : "Add Property to Favorites"}</span>
            <span className="sm:hidden">{showAddProperty ? "Cancel" : "Add Favorite"}</span>
          </button>
        </div>

        {/* Add Property Search Drawer */}
        {showAddProperty && (
          <div className="p-3.5 sm:p-5 bg-gray-50/90 border-b border-gray-200 flex flex-col gap-3 animate-in fade-in duration-150">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Icon icon="lucide:search" width="16" height="16" />
              </div>
              <input
                ref={propSearchRef}
                type="text"
                value={propertySearch}
                onChange={(e) => setPropertySearch(e.target.value)}
                placeholder="Search properties by title or location..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-2xs"
              />
              {propertySearch && (
                <button
                  type="button"
                  onClick={() => setPropertySearch("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <Icon icon="lucide:x" width="15" height="15" />
                </button>
              )}
            </div>

            {/* Results Box with Scroll-based Pagination */}
            <div
              onScroll={handlePropListScroll}
              className="max-h-64 overflow-y-auto flex flex-col divide-y divide-gray-100 bg-white rounded-xl border border-gray-200 shadow-xs [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              {isSearchingProperties ? (
                <div className="py-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                  <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin text-primary" />
                  <span>Searching properties...</span>
                </div>
              ) : allProperties.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  No properties found matching &quot;{propertySearch}&quot;
                </div>
              ) : (
                <>
                  {allProperties.map((p) => {
                    const propId = p.id || p.propertyId;
                    const isAlreadyFav = favorites.some((fav) => (fav.id || fav.propertyId) === propId);
                    const isAddingThis = addingPropId === propId;

                    return (
                      <div
                        key={propId}
                        className="p-3 hover:bg-gray-50/80 flex items-center justify-between gap-3 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 shrink-0 overflow-hidden">
                            {p.images?.[0] ? (
                              <img
                                src={p.images[0]}
                                alt=""
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Icon icon="lucide:home" width="18" height="18" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-gray-900 truncate">{p.title || "Untitled Property"}</p>
                            <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                              <Icon icon="lucide:map-pin" width="11" height="11" className="text-gray-400 shrink-0" />
                              <span>{formatLocation(p.location)}</span>
                              {(p.totalPrice || p.price) && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className="font-semibold text-gray-700">
                                    {formatCurrency(p.totalPrice || p.price)}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        {isAlreadyFav ? (
                          <span className="text-[11px] font-semibold text-rose-600 px-2.5 py-1 bg-rose-50 rounded-lg shrink-0 border border-rose-100 flex items-center gap-1">
                            <Icon icon="lucide:check" width="12" height="12" />
                            <span>Already Favorited</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleFavorite(p)}
                            disabled={isAddingThis}
                            className="px-3 py-1.5 bg-primary text-white hover:bg-primary/90 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50 shadow-2xs cursor-pointer"
                          >
                            {isAddingThis ? (
                              <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Icon icon="lucide:plus" width="13" height="13" />
                                <span>Add to Favorites</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Scroll Loading Indicator */}
                  {isLoadingMoreProps && (
                    <div className="p-3 text-center text-xs text-gray-500 flex items-center justify-center gap-2 bg-gray-50/50">
                      <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin text-primary" />
                      <span>Loading more properties...</span>
                    </div>
                  )}

                  {!hasMoreProps && allProperties.length > 6 && (
                    <div className="p-2.5 text-center text-[11px] text-gray-400 bg-gray-50/30">
                      All available properties loaded
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Favorites Content Grid */}
        <div className="p-5 md:p-6">
          {isLoadingFavorites ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center text-gray-400">
              <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mb-3 text-rose-300 border border-rose-100">
                <Icon icon="lucide:heart-off" width="24" height="24" />
              </div>
              <p className="text-sm font-bold text-gray-800">No Favorited Properties</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto mb-4">
                This user hasn&apos;t favorited any properties yet. You can add one using the search above.
              </p>
              {!showAddProperty && (
                <button
                  type="button"
                  onClick={() => setShowAddProperty(true)}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  <Icon icon="lucide:plus" width="14" height="14" />
                  <span>Add First Favorite</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map((prop) => {
                const propId = prop.id || prop.propertyId;
                const isToggling = togglingPropertyId === propId;
                const propImg = prop.images?.[0] || prop.image || null;

                return (
                  <div
                    key={propId}
                    className="p-4 rounded-2xl border border-gray-200 hover:border-primary/40 bg-white hover:shadow-sm transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 shrink-0 overflow-hidden flex items-center justify-center">
                        {propImg ? (
                          <img
                            src={propImg}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <Icon icon="lucide:home" className="text-gray-400" width="20" height="20" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/property/${propId}`}
                          className="font-bold text-sm text-gray-900 group-hover:text-primary transition-colors line-clamp-1 block"
                        >
                          {prop.title || "Untitled Property"}
                        </Link>
                        {prop.location && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                            <Icon icon="lucide:map-pin" width="12" height="12" className="text-gray-400 shrink-0" />
                            <span className="truncate">{formatLocation(prop.location)}</span>
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(propId)}
                        disabled={isToggling}
                        title="Remove from favorites"
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                      >
                        {isToggling ? (
                          <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin text-rose-500" />
                        ) : (
                          <Icon icon="lucide:trash-2" width="15" height="15" />
                        )}
                      </button>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Current Price</span>
                        <span className="font-bold text-gray-900 text-sm">
                          {formatCurrency(prop.totalPrice || prop.price)}
                        </span>
                      </div>
                      {prop.targetReturn && (
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Target Return</span>
                          <span className="font-bold text-emerald-600 text-sm">
                            {prop.targetReturn}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* User's Fractional Investments Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {/* Section Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
              <Icon icon="lucide:hand-coins" width="18" height="18" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">Fractional Investments</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  {userInvestments.length}
                </span>
                {user.hasPurchasedProperty && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500 text-white shrink-0">
                    Verified Buyer
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate">Property units booked and capital invested by this user</p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchUserInvestments}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            title="Refresh Investments"
          >
            <Icon icon="lucide:refresh-cw" width="15" height="15" />
          </button>
        </div>

        {/* Investments Table / Empty State */}
        <div className="p-0">
          {isLoadingInvestments ? (
            <div className="p-6 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : userInvestments.length === 0 ? (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center text-gray-400">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-3 text-emerald-300 border border-emerald-100">
                <Icon icon="lucide:hand-coins" width="24" height="24" />
              </div>
              <p className="text-sm font-bold text-gray-800">No Investments Yet</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                This user has not placed any unit investment bookings so far.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Property</th>
                    <th className="px-4 py-3 text-center">Units Booked</th>
                    <th className="px-4 py-3">Price / Unit</th>
                    <th className="px-4 py-3">Total Amount</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {userInvestments.map((inv) => {
                    const isPending = inv.status === "PENDING";

                    return (
                      <tr
                        key={inv.id}
                        onClick={() => setSelectedInvestmentForDetail(inv)}
                        className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3.5">
                          <div className="min-w-0">
                            <span className="font-bold text-gray-900 group-hover:text-primary transition-colors block truncate max-w-[200px]">
                              {inv.property?.title || "Property Listing"}
                            </span>
                            <span className="text-[11px] text-gray-400 block truncate max-w-[200px]">
                              {formatLocation(inv.property?.location)}
                            </span>
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

      {/* Edit User In-Place Modal */}
      <UserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        onSuccess={() => {
          fetchUser();
        }}
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
          fetchUser();
          fetchUserInvestments();
        }}
      />

      {/* Investment Reject Modal */}
      <InvestmentRejectModal
        isOpen={Boolean(selectedInvestmentForReject)}
        onClose={() => setSelectedInvestmentForReject(null)}
        investment={selectedInvestmentForReject}
        onSuccess={() => {
          fetchUser();
          fetchUserInvestments();
        }}
      />

      {/* Dedicated Investment Proof Modal */}
      <InvestmentProofModal
        isOpen={Boolean(selectedInvestmentForProof)}
        onClose={() => setSelectedInvestmentForProof(null)}
        investment={selectedInvestmentForProof}
        onApprove={(inv) => {
          setSelectedInvestmentForProof(null);
          setSelectedInvestmentForApprove(inv);
        }}
      />

      {/* Dedicated Investment Invoices Modal */}
      <InvestmentInvoicesModal
        isOpen={Boolean(selectedInvestmentForInvoices)}
        onClose={() => setSelectedInvestmentForInvoices(null)}
        investment={selectedInvestmentForInvoices}
      />
    </div>
  );
}
