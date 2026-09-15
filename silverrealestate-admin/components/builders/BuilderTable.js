"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "@iconify/react";

function BuilderAvatar({ user }) {
  const [imgFailed, setImgFailed] = useState(false);
  const imgUrl = user?.profileImage || user?.profileUrl || user?.image || user?.avatar;

  if (imgUrl && !imgFailed) {
    return (
      <img
        src={imgUrl}
        alt={user?.fullName || "Builder"}
        onError={() => setImgFailed(true)}
        className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200 shadow-2xs"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center justify-center font-bold text-xs shrink-0">
      {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "B"}
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BuilderTable({
  builders = [],
  onView,
  onEdit,
  onDelete,
  onViewSubmissions,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
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

  const toggleMenu = (builderId) => {
    if (openMenuId === builderId) {
      closeMenu();
      return;
    }
    const btn = buttonRefs.current[builderId];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < 190 && rect.top > 190;

      setMenuPos({
        top: openUpwards ? undefined : `${rect.bottom + 4}px`,
        bottom: openUpwards ? `${window.innerHeight - rect.top + 4}px` : undefined,
        right: `${Math.max(16, window.innerWidth - rect.right)}px`,
      });
    }
    setOpenMenuId(builderId);
  };

  return (
    <div className="overflow-auto h-full custom-scrollbar flex-1 relative">
      <table className="w-full text-sm text-left min-w-[750px]">
        <thead className="border-b border-gray-200 bg-gray-50/80 sticky top-0 z-10 shadow-2xs">
          <tr className="bg-gray-50/90 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            <th className="px-5 py-3.5">Builder Name</th>
            <th className="px-5 py-3.5">Email</th>
            <th className="px-5 py-3.5">Phone</th>
            <th className="px-5 py-3.5 text-center">Account Role</th>
            <th className="px-5 py-3.5 whitespace-nowrap">Registered At</th>
            <th className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {!builders || builders.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-20 px-4 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-amber-500 border border-amber-100">
                    <Icon icon="lucide:hard-hat" width="32" height="32" />
                  </div>
                  <h3 className="type-h5 text-gray-900 font-semibold mb-1">No Builders Found</h3>
                  <p className="type-body-sm text-gray-500 max-w-sm mx-auto">
                    There are no builder accounts registered yet. Use the &quot;Create Builder&quot; button to add one.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            builders.map((builder) => (
              <tr
                key={builder.id}
                onClick={() => onView && onView(builder)}
                className="hover:bg-amber-50/30 transition-colors group cursor-pointer"
              >
                {/* Avatar + Full Name */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <BuilderAvatar user={builder} />
                    <div className="min-w-0">
                      <span className="font-semibold text-gray-900 group-hover:text-primary transition-colors block truncate max-w-[200px]">
                        {builder.fullName || "Unnamed Builder"}
                      </span>
                      {builder.createdby_admin && (
                        <span className="text-[10px] text-gray-400 font-medium block">
                          Created by Admin
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Email */}
                <td className="px-5 py-3.5 text-gray-600 text-xs">
                  {builder.email || "—"}
                </td>

                {/* Phone */}
                <td className="px-5 py-3.5 text-gray-700 font-medium text-xs whitespace-nowrap">
                  {builder.phone || "—"}
                </td>

                {/* Role Badge */}
                <td className="px-5 py-3.5 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                    <Icon icon="lucide:hard-hat" width="12" height="12" />
                    <span>{builder.role || "BUILDER"}</span>
                  </span>
                </td>

                {/* Registered At */}
                <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                  {formatDate(builder.createdAt)}
                </td>

                {/* Actions */}
                <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    {onViewSubmissions && (
                      <button
                        type="button"
                        onClick={() => onViewSubmissions(builder)}
                        className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                        title="View properties submitted by this builder"
                      >
                        <Icon icon="lucide:building-2" width="13" height="13" />
                        <span className="hidden sm:inline">Properties</span>
                      </button>
                    )}

                    <button
                      type="button"
                      ref={(el) => {
                        buttonRefs.current[builder.id] = el;
                      }}
                      onClick={() => toggleMenu(builder.id)}
                      title="More actions"
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center ${
                        openMenuId === builder.id
                          ? "bg-primary text-white shadow-2xs"
                          : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon icon="lucide:more-vertical" width="16" height="16" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Action Dropdown Menu Portal */}
      {openMenuId && (() => {
        const builder = builders.find((b) => b.id === openMenuId);
        if (!builder) return null;

        return (
          <div
            ref={menuRef}
            className="fixed w-48 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-gray-900/10 border border-gray-100 p-1.5 z-[100] animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5 flex flex-col gap-0.5 text-xs"
            style={{
              top: menuPos.top,
              bottom: menuPos.bottom,
              right: menuPos.right,
            }}
          >
            {/* View Details & Properties */}
            <button
              type="button"
              onClick={() => {
                closeMenu();
                if (onView) onView(builder);
              }}
              className="w-full px-2.5 py-2 text-left rounded-xl hover:bg-gray-100 text-gray-700 font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Icon icon="lucide:eye" width="15" height="15" className="text-gray-400" />
              <span>View Profile & Properties</span>
            </button>

            {/* Edit Profile */}
            <button
              type="button"
              onClick={() => {
                closeMenu();
                if (onEdit) onEdit(builder);
              }}
              className="w-full px-2.5 py-2 text-left rounded-xl hover:bg-amber-50 text-amber-800 font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Icon icon="lucide:pencil" width="15" height="15" className="text-amber-600" />
              <span>Edit Profile</span>
            </button>

            {/* View Submissions */}
            {onViewSubmissions && (
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  onViewSubmissions(builder);
                }}
                className="w-full px-2.5 py-2 text-left rounded-xl hover:bg-primary/5 text-primary font-medium flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Icon icon="lucide:building-2" width="15" height="15" className="text-primary" />
                <span>View Submissions Queue</span>
              </button>
            )}

            <div className="h-px bg-gray-100 my-1" />

            {/* Delete Builder */}
            <button
              type="button"
              onClick={() => {
                closeMenu();
                if (onDelete) onDelete(builder);
              }}
              className="w-full px-2.5 py-2 text-left rounded-xl hover:bg-red-50 text-red-600 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Icon icon="lucide:trash-2" width="15" height="15" className="text-red-500" />
              <span>Delete Builder</span>
            </button>
          </div>
        );
      })()}
    </div>
  );
}
