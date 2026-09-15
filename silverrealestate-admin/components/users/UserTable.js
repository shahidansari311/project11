"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
        className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-200 shadow-2xs"
      />
    );
  }

  return (
    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
      {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
    </div>
  );
}

export default function UserTable({ users, onView, onEdit, onDelete }) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const buttonRefs = useRef({});

  const closeMenu = useCallback(() => setOpenMenuId(null), []);

  useEffect(() => {
    if (!openMenuId) return;
    function handleClickOutside(event) {
      if (
        menuRef.current && !menuRef.current.contains(event.target) &&
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

  const toggleMenu = (userId) => {
    if (openMenuId === userId) {
      closeMenu();
      return;
    }
    const btn = buttonRefs.current[userId];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < 150 && rect.top > 150;

      setMenuPos({
        top: openUpwards ? undefined : `${rect.bottom + 4}px`,
        bottom: openUpwards ? `${window.innerHeight - rect.top + 4}px` : undefined,
        right: `${Math.max(16, window.innerWidth - rect.right)}px`,
      });
    }
    setOpenMenuId(userId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <div className="overflow-auto h-full custom-scrollbar">
        <table className="w-full text-sm text-left min-w-[800px]">
          <thead className="border-b border-gray-200 bg-gray-50 sticky top-0 z-10 shadow-2xs">
            <tr className="bg-gray-50">
              <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50">Full Name</th>
              <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50">Email</th>
              <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50">Phone</th>
              <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50 text-center">Created By Admin</th>
              <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50 text-center">Has Purchased</th>
              <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50">Created At</th>
              <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(!users || users.length === 0) ? (
              <tr>
                <td colSpan={7} className="py-16 px-4 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Icon icon="lucide:users-2" className="text-gray-300" width="32" height="32" />
                    </div>
                    <h3 className="type-h5 text-gray-900 mb-1">No users found</h3>
                    <p className="type-body-sm text-gray-500 max-w-xs mx-auto">
                      We couldn&apos;t find any users matching your criteria. Try a different search term.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => onView(user)}
                  className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors cursor-pointer group"
                >
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} />
                      <span className="font-medium text-gray-900 group-hover:text-primary transition-colors type-body-sm whitespace-nowrap">
                        {user.fullName || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-gray-600 type-body-sm">
                    {user.email || "N/A"}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-gray-600 type-body-sm whitespace-nowrap">
                    {user.phone || "N/A"}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${user.createdby_admin ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                      {user.createdby_admin ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${user.hasPurchasedProperty ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {user.hasPurchasedProperty ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-gray-600 type-body-sm whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      ref={(el) => { buttonRefs.current[user.id] = el; }}
                      onClick={() => toggleMenu(user.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors inline-flex"
                    >
                      <Icon icon="lucide:more-vertical" width="18" height="18" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dropdown menu rendered as fixed portal — never clipped by overflow */}
      {openMenuId && (
        <div
          ref={menuRef}
          className="fixed w-44 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-gray-900/10 border border-gray-100 p-1.5 z-[100] animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5 flex flex-col gap-0.5"
          style={{
            top: menuPos.top,
            bottom: menuPos.bottom,
            right: menuPos.right,
          }}
        >
          <button
            type="button"
            onClick={() => {
              const u = users.find((u) => u.id === openMenuId);
              if (u) onView(u);
              closeMenu();
            }}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-primary/5 hover:text-primary rounded-xl transition-all flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center transition-colors shrink-0">
              <Icon icon="lucide:eye" width="14" height="14" />
            </div>
            <span>View Details</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const u = users.find((u) => u.id === openMenuId);
              if (u) onEdit(u);
              closeMenu();
            }}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-primary/5 hover:text-primary rounded-xl transition-all flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center transition-colors shrink-0">
              <Icon icon="lucide:edit-3" width="14" height="14" />
            </div>
            <span>Edit User</span>
          </button>
          <div className="h-px bg-gray-100 my-0.5 mx-1" />
          <button
            type="button"
            onClick={() => {
              const u = users.find((u) => u.id === openMenuId);
              if (u) onDelete(u);
              closeMenu();
            }}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:text-red-600 hover:bg-red-50/80 rounded-xl transition-all flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-red-50 text-red-600 group-hover:bg-red-100 group-hover:text-red-700 flex items-center justify-center transition-colors shrink-0">
              <Icon icon="lucide:trash-2" width="14" height="14" />
            </div>
            <span className="text-gray-700 group-hover:text-red-600">Delete User</span>
          </button>
        </div>
      )}
    </>
  );
}
