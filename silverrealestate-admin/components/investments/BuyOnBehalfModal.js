"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { formatLocation } from "../../lib/locationUtils";

function formatCurrency(val) {
  if (val === null || val === undefined || isNaN(val)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

function getUserKycBadge(user) {
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
    className: "bg-gray-100 text-gray-600 border-gray-200",
    icon: "lucide:file-question",
  };
}

function getPropertyAvailableUnits(property) {
  if (!property) return null;

  // Primary calculation: totalUnits - purchasedUnits
  const total = Number(
    property.totalUnits ??
    property.totalSize ??
    property.totalFractions ??
    property.unitsCount ??
    property.fractionsCount
  );

  const purchased = Number(
    property.purchasedUnits ??
    property.soldUnits ??
    property.bookedUnits ??
    0
  );

  if (!isNaN(total) && total > 0) {
    const booked = isNaN(purchased) ? 0 : purchased;
    return Math.max(0, total - booked);
  }

  // Fallback if availableUnits is directly passed
  const direct =
    property.availableUnits ??
    property.remainingUnits ??
    property.availableFractions ??
    property.remainingFractions ??
    property.availableTokens;

  if (direct !== undefined && direct !== null && !isNaN(Number(direct))) {
    return Math.max(0, Number(direct));
  }

  return null;
}

export default function BuyOnBehalfModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedUser = null,
  preselectedProperty = null,
}) {
  const [selectedUser, setSelectedUser] = useState(preselectedUser);
  const [selectedProperty, setSelectedProperty] = useState(preselectedProperty);
  const [units, setUnits] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown DOM refs for outside-click detection
  const userDropdownRef = useRef(null);
  const propDropdownRef = useRef(null);

  // User search, pagination & list state
  const [userSearch, setUserSearch] = useState("");
  const [userList, setUserList] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [userHasMore, setUserHasMore] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingMoreUsers, setIsLoadingMoreUsers] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Property search, pagination & list state
  const [propSearch, setPropSearch] = useState("");
  const [propList, setPropList] = useState([]);
  const [propPage, setPropPage] = useState(1);
  const [propHasMore, setPropHasMore] = useState(false);
  const [isLoadingProps, setIsLoadingProps] = useState(false);
  const [isLoadingMoreProps, setIsLoadingMoreProps] = useState(false);
  const [isPropDropdownOpen, setIsPropDropdownOpen] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
      if (propDropdownRef.current && !propDropdownRef.current.contains(event.target)) {
        setIsPropDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Available units calculation
  const availableUnits = useMemo(() => {
    if (!selectedProperty) return null;
    return getPropertyAvailableUnits(selectedProperty);
  }, [selectedProperty]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedUser(preselectedUser);
      setSelectedProperty(preselectedProperty);
      const initAvail = preselectedProperty ? getPropertyAvailableUnits(preselectedProperty) : null;
      if (initAvail !== null && initAvail <= 0) {
        setUnits(0);
      } else {
        setUnits(1);
      }
      setUserSearch("");
      setPropSearch("");
      setUserPage(1);
      setPropPage(1);
      setUserHasMore(false);
      setPropHasMore(false);
      setIsUserDropdownOpen(false);
      setIsPropDropdownOpen(false);
    }
  }, [isOpen, preselectedUser, preselectedProperty]);

  // Adjust units when selectedProperty changes
  useEffect(() => {
    if (selectedProperty && availableUnits !== null) {
      if (availableUnits <= 0) {
        setUnits(0);
      } else {
        setUnits((prev) => Math.min(Math.max(1, Number(prev) || 1), availableUnits));
      }
    }
  }, [selectedProperty, availableUnits]);

  // Fetch Users with pagination support
  const fetchUsers = useCallback(async (query = "", page = 1, isAppend = false) => {
    if (page === 1) {
      setIsLoadingUsers(true);
    } else {
      setIsLoadingMoreUsers(true);
    }
    try {
      const res = await api.get(
        `/admin/users?page=${page}&limit=20&search=${encodeURIComponent(query.trim())}`
      );
      if (res?.success && res.data) {
        const users = res.data.users || [];
        const pagination = res.data.pagination || {};

        if (isAppend) {
          setUserList((prev) => {
            const existingIds = new Set(prev.map((u) => u.id));
            const newFiltered = users.filter((u) => !existingIds.has(u.id));
            return [...prev, ...newFiltered];
          });
        } else {
          setUserList(users);
        }

        setUserPage(page);
        const hasNext =
          pagination.hasNext ??
          (pagination.totalPages ? page < pagination.totalPages : users.length === 20);
        setUserHasMore(Boolean(hasNext));
      } else {
        if (!isAppend) setUserList([]);
        setUserHasMore(false);
      }
    } catch {
      if (!isAppend) setUserList([]);
      setUserHasMore(false);
    } finally {
      setIsLoadingUsers(false);
      setIsLoadingMoreUsers(false);
    }
  }, []);

  // Fetch Properties with pagination support
  const fetchProperties = useCallback(async (query = "", page = 1, isAppend = false) => {
    if (page === 1) {
      setIsLoadingProps(true);
    } else {
      setIsLoadingMoreProps(true);
    }
    try {
      let url = `/admin/property?page=${page}&limit=20`;
      if (query.trim()) {
        url += `&search=${encodeURIComponent(query.trim())}`;
      }
      const res = await api.get(url);
      if (res?.success && res.data) {
        const props = res.data.properties || [];
        const pagination = res.data.pagination || {};

        if (isAppend) {
          setPropList((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newFiltered = props.filter((p) => !existingIds.has(p.id));
            return [...prev, ...newFiltered];
          });
        } else {
          setPropList(props);
        }

        setPropPage(page);
        const hasNext =
          pagination.hasNext ??
          (pagination.totalPages ? page < pagination.totalPages : props.length === 20);
        setPropHasMore(Boolean(hasNext));
      } else {
        if (!isAppend) setPropList([]);
        setPropHasMore(false);
      }
    } catch {
      if (!isAppend) setPropList([]);
      setPropHasMore(false);
    } finally {
      setIsLoadingProps(false);
      setIsLoadingMoreProps(false);
    }
  }, []);

  // Initial load of users & properties when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers("", 1, false);
      fetchProperties("", 1, false);
    }
  }, [isOpen, fetchUsers, fetchProperties]);

  // Debounce User Search
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchUsers(userSearch, 1, false);
    }, 250);
    return () => clearTimeout(timer);
  }, [userSearch, isOpen, fetchUsers]);

  // Debounce Property Search
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchProperties(propSearch, 1, false);
    }, 250);
    return () => clearTimeout(timer);
  }, [propSearch, isOpen, fetchProperties]);

  // Scroll listeners for infinite scroll pagination
  const handleUserDropdownScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 40) {
      if (!isLoadingUsers && !isLoadingMoreUsers && userHasMore) {
        fetchUsers(userSearch, userPage + 1, true);
      }
    }
  };

  const handlePropDropdownScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 40) {
      if (!isLoadingProps && !isLoadingMoreProps && propHasMore) {
        fetchProperties(propSearch, propPage + 1, true);
      }
    }
  };

  // Unit Price calculation
  const unitPrice = useMemo(() => {
    if (!selectedProperty) return 0;
    return (
      selectedProperty.perUnitPrice ||
      selectedProperty.unitPrice ||
      selectedProperty.pricePerUnit ||
      (selectedProperty.totalPrice && selectedProperty.totalUnits
        ? Math.round(selectedProperty.totalPrice / selectedProperty.totalUnits)
        : selectedProperty.minInvestment || 0)
    );
  }, [selectedProperty]);

  const totalAmount = useMemo(() => {
    const u = Number(units) || 0;
    return u * unitPrice;
  }, [units, unitPrice]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedUser?.id) {
      toast.error("Please select a user / investor");
      return;
    }

    if (!selectedProperty?.id) {
      toast.error("Please select a property");
      return;
    }

    const unitsNum = Number(units);
    if (!unitsNum || unitsNum < 1) {
      toast.error("Please enter a valid number of units (minimum 1)");
      return;
    }

    if (availableUnits !== null && availableUnits <= 0) {
      toast.error("This property is sold out. No available fractional units to purchase.");
      return;
    }

    if (availableUnits !== null && unitsNum > availableUnits) {
      toast.error(`Cannot book more than ${availableUnits} available units`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        userId: selectedUser.id,
        propertyId: selectedProperty.id,
        units: unitsNum,
      };

      const res = await api.post("/admin/investments/buy-on-behalf", payload);

      if (res?.success || res?.status === 201 || res?.data) {
        toast.success(
          res.message || "Investment created on behalf of user! Status: Approved."
        );
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        toast.error(res?.message || "Failed to create investment on behalf of user");
      }
    } catch (error) {
      toast.error(
        error.message || "An error occurred while creating the investment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const userKyc = selectedUser ? getUserKycBadge(selectedUser) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-sm shrink-0">
              <Icon icon="lucide:shopping-bag" width="20" height="20" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">
                Buy on Behalf of User
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Assign fractional investment units directly for cash payment
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

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          {/* Scrollable Form Body */}
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-5">
            {/* 1. Select User / Investor */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Icon icon="lucide:user" width="14" height="14" className="text-primary" />
                <span>1. Select Investor / User</span>
              </span>
              {selectedUser && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    setUserSearch("");
                    setIsUserDropdownOpen(true);
                  }}
                  className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                >
                  Change User
                </button>
              )}
            </label>

            {selectedUser ? (
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                    {selectedUser.fullName ? selectedUser.fullName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm truncate">
                        {selectedUser.fullName || "User"}
                      </span>
                      {userKyc && (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${userKyc.className}`}>
                          <Icon icon={userKyc.icon} width="10" height="10" />
                          <span>{userKyc.label}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 block truncate">
                      {selectedUser.phone || selectedUser.email || "No contact info"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Remove user"
                >
                  <Icon icon="lucide:x" width="16" height="16" />
                </button>
              </div>
            ) : (
              <div className="relative" ref={userDropdownRef}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Icon icon="lucide:search" width="16" height="16" />
                  </div>
                  <input
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    name="user_search_query_off"
                    placeholder="Search user by name, phone or email..."
                    value={userSearch}
                    onFocus={() => setIsUserDropdownOpen(true)}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setIsUserDropdownOpen(true);
                    }}
                    className="w-full pl-10 pr-16 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-xs sm:text-sm bg-white"
                  />
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                    {isLoadingUsers && (
                      <span className="text-gray-400 p-1">
                        <Icon icon="lucide:loader-2" className="animate-spin" width="16" height="16" />
                      </span>
                    )}
                    {(userSearch || isUserDropdownOpen) && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserSearch("");
                          setIsUserDropdownOpen(false);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Close / Clear"
                      >
                        <Icon icon="lucide:x" width="15" height="15" />
                      </button>
                    )}
                  </div>
                </div>

                {isUserDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 z-30 max-h-60 overflow-hidden flex flex-col">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Select User ({userList.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="text-xs text-gray-500 hover:text-gray-800 font-medium hover:bg-gray-200/60 px-2 py-0.5 rounded-md transition-colors"
                      >
                        Close
                      </button>
                    </div>

                    <div
                      onScroll={handleUserDropdownScroll}
                      className="overflow-y-auto flex-1 custom-scrollbar py-1"
                    >
                      {userList.length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-400">
                          {isLoadingUsers ? "Searching users..." : "No users found"}
                        </div>
                      ) : (
                        <>
                          {userList.map((u) => {
                            const kyc = getUserKycBadge(u);
                            return (
                              <div
                                key={u.id}
                                onClick={() => {
                                  setSelectedUser(u);
                                  setIsUserDropdownOpen(false);
                                }}
                                className="px-3.5 py-2.5 hover:bg-primary/5 flex items-center justify-between gap-3 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                    {u.fullName ? u.fullName.charAt(0).toUpperCase() : "U"}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-semibold text-gray-900 text-xs block truncate">
                                      {u.fullName || "Unnamed User"}
                                    </span>
                                    <span className="text-[11px] text-gray-400 block truncate">
                                      {u.phone || u.email || "No contact"}
                                    </span>
                                  </div>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${kyc.className} shrink-0`}>
                                  <Icon icon={kyc.icon} width="10" height="10" />
                                  <span>{kyc.label}</span>
                                </span>
                              </div>
                            );
                          })}
                          {isLoadingMoreUsers && (
                            <div className="py-2.5 flex items-center justify-center gap-1.5 text-xs text-gray-500 bg-gray-50/70 border-t border-gray-100">
                              <Icon icon="lucide:loader-2" className="animate-spin text-primary" width="13" height="13" />
                              <span>Loading more users...</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Select Property */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Icon icon="lucide:building-2" width="14" height="14" className="text-primary" />
                <span>2. Select Property</span>
              </span>
              {selectedProperty && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProperty(null);
                    setPropSearch("");
                    setIsPropDropdownOpen(true);
                  }}
                  className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                >
                  Change Property
                </button>
              )}
            </label>

            {selectedProperty ? (
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gray-200 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center text-gray-400">
                    {selectedProperty.images?.[0] || selectedProperty.coverImage ? (
                      <img
                        src={selectedProperty.images?.[0] || selectedProperty.coverImage}
                        alt={selectedProperty.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon icon="lucide:building-2" width="20" height="20" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-gray-900 text-sm truncate block">
                      {selectedProperty.title}
                    </span>
                    <span className="text-xs text-gray-500 block truncate">
                      {formatLocation(selectedProperty.location)}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-emerald-700 font-semibold">
                        {formatCurrency(unitPrice)} / unit
                      </span>
                      {availableUnits !== null && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            availableUnits > 0
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {availableUnits > 0 ? `${availableUnits} Fractions Available` : "Sold Out (0 Available)"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedProperty(null)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Remove property"
                >
                  <Icon icon="lucide:x" width="16" height="16" />
                </button>
              </div>
            ) : (
              <div className="relative" ref={propDropdownRef}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Icon icon="lucide:search" width="16" height="16" />
                  </div>
                  <input
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    name="prop_search_query_off"
                    placeholder="Search property by title or location..."
                    value={propSearch}
                    onFocus={() => setIsPropDropdownOpen(true)}
                    onChange={(e) => {
                      setPropSearch(e.target.value);
                      setIsPropDropdownOpen(true);
                    }}
                    className="w-full pl-10 pr-16 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-xs sm:text-sm bg-white"
                  />
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                    {isLoadingProps && (
                      <span className="text-gray-400 p-1">
                        <Icon icon="lucide:loader-2" className="animate-spin" width="16" height="16" />
                      </span>
                    )}
                    {(propSearch || isPropDropdownOpen) && (
                      <button
                        type="button"
                        onClick={() => {
                          setPropSearch("");
                          setIsPropDropdownOpen(false);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Close / Clear"
                      >
                        <Icon icon="lucide:x" width="15" height="15" />
                      </button>
                    )}
                  </div>
                </div>

                {isPropDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 z-30 max-h-60 overflow-hidden flex flex-col">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Select Property ({propList.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsPropDropdownOpen(false)}
                        className="text-xs text-gray-500 hover:text-gray-800 font-medium hover:bg-gray-200/60 px-2 py-0.5 rounded-md transition-colors"
                      >
                        Close
                      </button>
                    </div>

                    <div
                      onScroll={handlePropDropdownScroll}
                      className="overflow-y-auto flex-1 custom-scrollbar py-1"
                    >
                      {propList.length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-400">
                          {isLoadingProps ? "Searching properties..." : "No properties found"}
                        </div>
                      ) : (
                        <>
                          {propList.map((p) => {
                            const price =
                              p.perUnitPrice ||
                              p.unitPrice ||
                              p.pricePerUnit ||
                              (p.totalPrice && p.totalUnits ? Math.round(p.totalPrice / p.totalUnits) : p.minInvestment || 0);
                            const pAvail = getPropertyAvailableUnits(p);

                            return (
                              <div
                                key={p.id}
                                onClick={() => {
                                  setSelectedProperty(p);
                                  setIsPropDropdownOpen(false);
                                }}
                                className="px-3.5 py-2.5 hover:bg-primary/5 flex items-center justify-between gap-3 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center text-gray-400">
                                    {p.images?.[0] || p.coverImage ? (
                                      <img
                                        src={p.images?.[0] || p.coverImage}
                                        alt={p.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Icon icon="lucide:building-2" width="14" height="14" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-semibold text-gray-900 text-xs block truncate">
                                      {p.title}
                                    </span>
                                    <span className="text-[11px] text-gray-400 block truncate">
                                      {formatLocation(p.location)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0 gap-0.5">
                                  <span className="text-xs font-bold text-emerald-700 whitespace-nowrap">
                                    {formatCurrency(price)}/unit
                                  </span>
                                  {pAvail !== null && (
                                    <span
                                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                                        pAvail > 0
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : "bg-red-50 text-red-600 border-red-200"
                                      }`}
                                    >
                                      {pAvail > 0 ? `${pAvail} left` : "Sold Out"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {isLoadingMoreProps && (
                            <div className="py-2.5 flex items-center justify-center gap-1.5 text-xs text-gray-500 bg-gray-50/70 border-t border-gray-100">
                              <Icon icon="lucide:loader-2" className="animate-spin text-primary" width="13" height="13" />
                              <span>Loading more properties...</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Number of Units */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Icon icon="lucide:layers" width="14" height="14" className="text-primary" />
                <span>3. Number of Fractional Units</span>
              </label>
              {selectedProperty && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 font-medium">
                    Rate: <span className="font-bold text-gray-800">{formatCurrency(unitPrice)}</span>
                  </span>
                  {availableUnits !== null && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        availableUnits > 0
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {availableUnits > 0 ? `${availableUnits} Available` : "0 Available"}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <button
                  type="button"
                  disabled={units <= 1 || (availableUnits !== null && availableUnits <= 0)}
                  onClick={() => setUnits((prev) => Math.max(1, (Number(prev) || 1) - 1))}
                  className="px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-bold transition-colors cursor-pointer border-r border-gray-200"
                >
                  -
                </button>
                <input
                  type="number"
                  min={availableUnits !== null && availableUnits <= 0 ? 0 : 1}
                  max={availableUnits !== null ? availableUnits : undefined}
                  disabled={availableUnits !== null && availableUnits <= 0}
                  value={units}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      setUnits("");
                      return;
                    }
                    const num = parseInt(raw, 10);
                    if (isNaN(num)) {
                      setUnits(1);
                      return;
                    }
                    if (availableUnits !== null && num > availableUnits) {
                      setUnits(availableUnits);
                      toast.error(`Only ${availableUnits} units available for this property`, { id: "max-units-limit" });
                    } else if (num < 1) {
                      setUnits(1);
                    } else {
                      setUnits(num);
                    }
                  }}
                  onBlur={() => {
                    if (!units || Number(units) < 1) {
                      setUnits(availableUnits !== null && availableUnits <= 0 ? 0 : 1);
                    } else if (availableUnits !== null && Number(units) > availableUnits) {
                      setUnits(availableUnits);
                    }
                  }}
                  className="w-20 text-center py-2 text-sm font-bold text-gray-900 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                />
                <button
                  type="button"
                  disabled={availableUnits !== null && (units >= availableUnits || availableUnits <= 0)}
                  onClick={() =>
                    setUnits((prev) => {
                      const next = (Number(prev) || 1) + 1;
                      if (availableUnits !== null && next > availableUnits) {
                        toast.error(`Cannot select more than ${availableUnits} available units`, { id: "max-units-limit" });
                        return availableUnits;
                      }
                      return next;
                    })
                  }
                  className="px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-bold transition-colors cursor-pointer border-l border-gray-200"
                >
                  +
                </button>
              </div>

              <div className="text-xs text-gray-500">
                <span className="font-semibold text-gray-800">{units || 0}</span> {units === 1 ? "unit" : "units"} selected
                {availableUnits !== null && (
                  <span className="text-gray-400 ml-1">
                    (Max: <strong className="text-gray-700">{availableUnits}</strong>)
                  </span>
                )}
              </div>
            </div>

            {availableUnits !== null && availableUnits <= 0 && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <Icon icon="lucide:alert-circle" width="16" height="16" className="shrink-0" />
                <span>All fractional units for this property are already booked. You cannot buy on behalf for this property.</span>
              </div>
            )}
          </div>

          {/* 4. Financial Calculation Card */}
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-50/20 border border-emerald-200 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
              <span className="text-xs font-bold text-emerald-900">Total Cash Value Collected:</span>
              <span className="text-xl font-bold text-emerald-700">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-emerald-800">
              <div className="flex items-center justify-between">
                <span>Units Booked:</span>
                <span className="font-bold">{units || 0} Units</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Rate Per Unit:</span>
                <span className="font-bold">{formatCurrency(unitPrice)}</span>
              </div>
            </div>
          </div>

            {/* Notice & Push Notification info */}
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
              <Icon icon="lucide:info" width="16" height="16" className="text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-[11px] leading-relaxed">
                <span className="font-bold block">Instant Automated Workflow:</span>
                <span>
                  Submitting will automatically create an <strong>APPROVED</strong> investment and send a push notification to the investor&apos;s mobile app to complete the digital agreement signature.
                </span>
              </div>
            </div>
          </div>

          {/* Sticky / Always Visible Footer Actions */}
          <div className="p-4 sm:px-6 sm:py-3.5 bg-gray-50 border-t border-gray-200/80 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedUser ||
                !selectedProperty ||
                (availableUnits !== null && availableUnits <= 0) ||
                !units ||
                Number(units) < 1 ||
                (availableUnits !== null && Number(units) > availableUnits)
              }
              className="px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Icon icon="lucide:loader-2" className="animate-spin" width="15" height="15" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Icon icon="lucide:check-circle" width="15" height="15" />
                  <span>Confirm & Assign Investment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
