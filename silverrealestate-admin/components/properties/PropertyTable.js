"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { formatLocation } from "../../lib/locationUtils";

function PropertyThumbnail({ prop }) {
  const [imgFailed, setImgFailed] = useState(false);
  const imgUrl = prop.images && prop.images.length > 0 ? prop.images[0] : null;

  return (
    <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
      {imgUrl && !imgFailed ? (
        <img
          src={imgUrl}
          alt={prop.title || "Property"}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <Icon icon="lucide:building-2" className="text-gray-400" width="22" height="22" />
      )}
    </div>
  );
}

export default function PropertyTable({
  properties = [],
  onView,
  onEdit,
  onAddPriceHistory,
  onDelete,
  onOpenInvestors,
}) {
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const buttonRefs = useRef({});

  const toggleMenu = (id) => {
    if (activeMenuId === id) {
      setActiveMenuId(null);
    } else {
      const btn = buttonRefs.current[id];
      if (btn) {
        const rect = btn.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpwards = spaceBelow < 220 && rect.top > 220;
        setMenuPosition({
          top: openUpwards ? undefined : rect.bottom + 4,
          bottom: openUpwards ? (window.innerHeight - rect.top + 4) : undefined,
          right: Math.max(16, window.innerWidth - rect.right),
        });
      }
      setActiveMenuId(id);
    }
  };

  // Close dropdown on scroll or resize
  useEffect(() => {
    const handleScrollOrResize = () => {
      if (activeMenuId) setActiveMenuId(null);
    };
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [activeMenuId]);

  const activeProperty = properties?.find((p) => p.id === activeMenuId);

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

  const getStatusBadge = (status) => {
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

  const getCategoryBadge = (category) => {
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

  return (
    <>
      <div className="overflow-auto h-full custom-scrollbar">
        <table className="w-full text-sm text-left min-w-[1020px]">
          <thead className="border-b border-gray-200 bg-gray-50 sticky top-0 z-10 shadow-2xs">
            <tr className="bg-gray-50">
              <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50">Property</th>
              <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50">Category</th>
              <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50">Pricing & Unit</th>
              <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50">Units Booked</th>
              <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50 text-center">Investors</th>
              <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50">Target Return</th>
              <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50 text-center">Status</th>
              <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!properties || properties.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 px-4 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                      <Icon icon="lucide:building-2" width="32" height="32" />
                    </div>
                    <h3 className="type-h5 text-gray-900 mb-1">No properties found</h3>
                    <p className="type-body-sm text-gray-500 max-w-xs mx-auto">
                      We couldn&apos;t find any properties matching your filters. Try adding a new property or adjusting your search.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              properties.map((prop) => {
                const totalUnits = prop.totalUnits || (prop.totalSize ? Number(prop.totalSize) : 0);
                const purchasedUnits = prop.purchasedUnits || 0;
                const percentBooked = totalUnits > 0 ? Math.min(100, Math.round((purchasedUnits / totalUnits) * 100)) : 0;
                const remainingUnits = Math.max(0, totalUnits - purchasedUnits);

                return (
                  <tr
                    key={prop.id}
                    onClick={() => onView(prop)}
                    className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors cursor-pointer group"
                  >
                    {/* Property details (Image + Title + Location) */}
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <PropertyThumbnail prop={prop} />
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors type-body-sm truncate max-w-xs">
                            {prop.title || "Untitled Property"}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate max-w-xs">
                            <Icon icon="lucide:map-pin" className="shrink-0 text-gray-400" width="12" height="12" />
                            <span className="truncate">{formatLocation(prop.location)}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 md:px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-md border ${getCategoryBadge(prop.category)}`}>
                        {formatCategoryLabel(prop.category)}
                      </span>
                    </td>

                    {/* Pricing & Min Investment */}
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-bold type-body-sm whitespace-nowrap">
                          {formatCurrency(prop.totalPrice)}
                        </span>
                        <span className="text-[11px] text-gray-500 whitespace-nowrap">
                          {formatCurrency(prop.perUnitPrice || prop.minInvestment)} / unit
                        </span>
                      </div>
                    </td>

                    {/* Units Booked & Progress */}
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex flex-col gap-1 min-w-[130px]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-900">
                            {purchasedUnits.toLocaleString()} <span className="font-normal text-gray-500">/ {totalUnits > 0 ? totalUnits.toLocaleString() : "—"}</span>
                          </span>
                          <span className="text-[10px] font-semibold text-gray-500">{percentBooked}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${percentBooked}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {remainingUnits.toLocaleString()} available
                        </span>
                      </div>
                    </td>

                    {/* Investors Count */}
                    <td className="px-4 md:px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onOpenInvestors && onOpenInvestors(prop)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 hover:border-purple-300 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs group/btn"
                        title="Click to view investors list & verification status"
                      >
                        <Icon icon="lucide:users" width="13" height="13" className="group-hover/btn:text-purple-900 transition-colors" />
                        <span>{prop.investors || 0}</span>
                      </button>
                    </td>


                    {/* Target Return */}
                    <td className="px-4 md:px-6 py-4 font-bold text-emerald-600 type-body-sm whitespace-nowrap">
                      {prop.targetReturn ? `${prop.targetReturn}%` : "N/A"}
                    </td>

                    {/* Status */}
                    <td className="px-4 md:px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-md border ${getStatusBadge(prop.status)}`}>
                        {formatStatusLabel(prop.status)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 md:px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        ref={(el) => {
                          buttonRefs.current[prop.id] = el;
                        }}
                        onClick={() => toggleMenu(prop.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors inline-flex cursor-pointer"
                      >
                        <Icon icon="lucide:more-vertical" width="18" height="18" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Backdrop for closing dropdown */}
      {activeMenuId && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setActiveMenuId(null)}
        />
      )}

      {/* Floating Action Menu */}
      {activeMenuId && activeProperty && (
        <div
          style={{
            position: "fixed",
            top: menuPosition.top,
            bottom: menuPosition.bottom,
            right: menuPosition.right,
          }}
          className="fixed w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-[100]"
        >
          <button
            onClick={() => {
              onView(activeProperty);
              setActiveMenuId(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Icon icon="lucide:eye" className="text-gray-400" width="16" height="16" />
            View
          </button>
          <button
            onClick={() => {
              onEdit(activeProperty);
              setActiveMenuId(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Icon icon="lucide:edit" className="text-gray-400" width="16" height="16" />
            Edit
          </button>
          {onOpenInvestors && (
            <button
              onClick={() => {
                onOpenInvestors(activeProperty);
                setActiveMenuId(null);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-purple-50 flex items-center gap-2 transition-colors cursor-pointer text-purple-700"
            >
              <Icon icon="lucide:users" className="text-purple-600" width="16" height="16" />
              View Investors
            </button>
          )}
          {onAddPriceHistory && (

            <button
              onClick={() => {
                onAddPriceHistory(activeProperty);
                setActiveMenuId(null);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Icon icon="lucide:trending-up" className="text-primary" width="16" height="16" />
              Add Price Point
            </button>
          )}

          <div className="h-px bg-gray-100 my-1" />
          <button
            onClick={() => {
              onDelete(activeProperty);
              setActiveMenuId(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Icon icon="lucide:trash-2" className="text-red-500" width="16" height="16" />
            Delete
          </button>
        </div>
      )}
    </>
  );
}
