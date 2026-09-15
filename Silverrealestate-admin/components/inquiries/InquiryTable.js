"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";

export default function InquiryTable({
  inquiries,
  onView,
  onStatusChange,
  onDelete,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const buttonRefs = useRef({});

  const closeMenu = useCallback(() => setOpenMenuId(null), []);

  useEffect(() => {
    if (!openMenuId) return;
    function handleClickOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !buttonRefs.current[openMenuId]?.contains(event.target)
      ) {
        closeMenu();
      }
    }
    function handleScroll() {
      closeMenu();
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [openMenuId, closeMenu]);

  const toggleMenu = (inquiryId) => {
    if (openMenuId === inquiryId) {
      closeMenu();
      return;
    }
    const btn = buttonRefs.current[inquiryId];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < 180 && rect.top > 180;

      setMenuPos({
        top: openUpwards ? undefined : `${rect.bottom + 4}px`,
        bottom: openUpwards ? `${window.innerHeight - rect.top + 4}px` : undefined,
        right: `${Math.max(16, window.innerWidth - rect.right)}px`,
      });
    }
    setOpenMenuId(inquiryId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "NEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            New
          </span>
        );
      case "CONTACTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Contacted
          </span>
        );
      case "RESOLVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Resolved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  if (!inquiries || inquiries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
          <Icon icon="lucide:inbox" className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">No Inquiries Found</h3>
        <p className="text-xs text-gray-500 max-w-sm mt-1">
          When visitors fill out the Direct Inquiry form on the landing page, their messages will show up here.
        </p>
      </div>
    );
  }

  const activeInquiry = inquiries.find((i) => i.id === openMenuId);

  return (
    <>
      <div className="overflow-auto h-full custom-scrollbar">
        <table className="w-full text-sm text-left min-w-[900px]">
          <thead className="border-b border-gray-200 bg-gray-50 sticky top-0 z-10 shadow-2xs">
            <tr className="bg-gray-50">
              <th className="px-4 md:px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50">
                Full Name
              </th>
              <th className="px-4 md:px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50">
                Corporate Email
              </th>
              <th className="px-4 md:px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50">
                Area of Interest
              </th>
              <th className="px-4 md:px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50">
                Message Preview
              </th>
              <th className="px-4 md:px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50 text-center">
                Status
              </th>
              <th className="px-4 md:px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50">
                Received At
              </th>
              <th className="px-4 md:px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {inquiries.map((inquiry) => {
              const fullName = `${inquiry.firstName} ${inquiry.lastName}`;
              return (
                <tr
                  key={inquiry.id}
                  onClick={() => onView(inquiry)}
                  className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                >
                  {/* Name */}
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                        {inquiry.firstName ? inquiry.firstName.charAt(0).toUpperCase() : "I"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 truncate group-hover:text-primary transition-colors">
                          {fullName}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 md:px-6 py-4">
                    <span className="font-medium text-gray-700">{inquiry.email}</span>
                  </td>

                  {/* Area of Interest */}
                  <td className="px-4 md:px-6 py-4">
                    <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 border border-gray-200">
                      {inquiry.areaOfInterest}
                    </span>
                  </td>

                  {/* Message Snippet */}
                  <td className="px-4 md:px-6 py-4 max-w-xs">
                    <p className="text-xs text-gray-600 truncate" title={inquiry.message}>
                      {inquiry.message}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="px-4 md:px-6 py-4 text-center">
                    {renderStatusBadge(inquiry.status)}
                  </td>

                  {/* Date */}
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                    {formatDate(inquiry.createdAt)}
                  </td>

                  {/* Actions */}
                  <td
                    className="px-4 md:px-6 py-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onView(inquiry)}
                        title="View Full Details"
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <Icon icon="lucide:eye" className="w-4 h-4" />
                      </button>

                      <button
                        ref={(el) => {
                          if (el) buttonRefs.current[inquiry.id] = el;
                        }}
                        type="button"
                        onClick={() => toggleMenu(inquiry.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          openMenuId === inquiry.id
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                        }`}
                        aria-label="More actions"
                      >
                        <Icon icon="lucide:more-vertical" className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Floating Actions Menu */}
      {openMenuId && activeInquiry && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menuPos.top,
            bottom: menuPos.bottom,
            right: menuPos.right,
            zIndex: 9999,
          }}
          className="w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 text-xs font-semibold animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              closeMenu();
              onView(activeInquiry);
            }}
            className="w-full px-3.5 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
          >
            <Icon icon="lucide:eye" className="w-4 h-4 text-gray-400" />
            View Details
          </button>

          {activeInquiry.status !== "NEW" && (
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onStatusChange(activeInquiry.id, "NEW");
              }}
              className="w-full px-3.5 py-2 text-left text-blue-600 hover:bg-blue-50 flex items-center gap-2 cursor-pointer"
            >
              <Icon icon="lucide:bell" className="w-4 h-4" />
              Mark as New
            </button>
          )}

          {activeInquiry.status !== "CONTACTED" && (
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onStatusChange(activeInquiry.id, "CONTACTED");
              }}
              className="w-full px-3.5 py-2 text-left text-amber-600 hover:bg-amber-50 flex items-center gap-2 cursor-pointer"
            >
              <Icon icon="lucide:phone-call" className="w-4 h-4" />
              Mark as Contacted
            </button>
          )}

          {activeInquiry.status !== "RESOLVED" && (
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onStatusChange(activeInquiry.id, "RESOLVED");
              }}
              className="w-full px-3.5 py-2 text-left text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
            >
              <Icon icon="lucide:check-circle-2" className="w-4 h-4" />
              Mark as Resolved
            </button>
          )}

          <div className="h-px bg-gray-100 my-1" />

          <button
            type="button"
            onClick={() => {
              closeMenu();
              onDelete(activeInquiry);
            }}
            className="w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
          >
            <Icon icon="lucide:trash-2" className="w-4 h-4" />
            Delete Inquiry
          </button>
        </div>
      )}
    </>
  );
}
