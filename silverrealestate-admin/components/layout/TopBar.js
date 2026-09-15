"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { logout } from "../../lib/api";
import TutorialVideoModal from "../common/TutorialVideoModal";

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const profileRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine breadcrumb and page title based on current route
  let sectionName = "General";
  let pageTitle = "Overview";
  let pageIcon = "lucide:layout-dashboard";

  if (pathname.includes("/dashboard")) {
    sectionName = "Overview";
    pageTitle = "Dashboard";
    pageIcon = "lucide:layout-dashboard";
  } else if (pathname.includes("/investments")) {
    sectionName = "Overview";
    pageTitle = "Investments";
    pageIcon = "lucide:hand-coins";
  } else if (pathname.includes("/add-property")) {
    sectionName = "Real Estate";
    pageTitle = "Add Property";
    pageIcon = "lucide:plus-circle";
  } else if (pathname.includes("/property/edit")) {
    sectionName = "Real Estate";
    pageTitle = "Edit Property";
    pageIcon = "lucide:edit";
  } else if (pathname.includes("/property-submissions")) {
    sectionName = "Real Estate";
    pageTitle = "Builder Submissions";
    pageIcon = "lucide:file-check";
  } else if (pathname.startsWith("/property/")) {
    sectionName = "Real Estate";
    pageTitle = "Property Details";
    pageIcon = "lucide:building-2";
  } else if (pathname === "/property" || pathname.includes("/property")) {
    sectionName = "Real Estate";
    pageTitle = "Properties";
    pageIcon = "lucide:building";
  } else if (pathname.includes("/builders")) {
    sectionName = "Real Estate";
    pageTitle = "Builders";
    pageIcon = "lucide:hard-hat";
  } else if (pathname.includes("/users")) {
    sectionName = "Management";
    pageTitle = "Users";
    pageIcon = "lucide:users";
  } else if (pathname.includes("/favorites")) {
    sectionName = "Inventory";
    pageTitle = "Favorites";
    pageIcon = "lucide:heart";
  } else if (pathname.includes("/kyc/status")) {
    sectionName = "Compliance";
    pageTitle = "Document Status";
    pageIcon = "lucide:file-text";
  } else if (pathname.includes("/kyc/pending")) {
    sectionName = "Compliance";
    pageTitle = "Pending Verification";
    pageIcon = "lucide:clock";
  } else if (pathname.includes("/kyc/verified")) {
    sectionName = "Compliance";
    pageTitle = "Verified Documents";
    pageIcon = "lucide:badge-check";
  } else if (pathname.includes("/kyc")) {
    sectionName = "Compliance";
    pageTitle = "KYC Queue";
    pageIcon = "lucide:shield-check";
  }

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
  };

  return (
    <header className="hidden lg:flex h-20 items-center justify-between px-8 border-b border-gray-200 bg-white sticky top-0 z-30 select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Left: Breadcrumbs & Dynamic Title */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-0.5">
          <span>{sectionName}</span>
          <Icon icon="lucide:chevron-right" className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-gray-600 font-semibold">{pageTitle}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Icon icon={pageIcon} className="w-4 h-4" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{pageTitle}</h1>
        </div>
      </div>

      {/* Right: User Menu */}
      <div className="flex items-center gap-3">
        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            aria-label="User menu"
            className={`flex items-center gap-3 p-1.5 pr-3 rounded-2xl transition-all cursor-pointer border ${
              isProfileOpen
                ? "bg-gray-50 border-gray-200 shadow-2xs ring-2 ring-primary/10"
                : "border-transparent hover:bg-gray-50 hover:border-gray-200/60"
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-[#003845] text-white flex items-center justify-center font-bold text-sm shadow-xs ring-1 ring-primary/20 shrink-0">
              A
            </div>

            <div className="text-left hidden sm:flex flex-col">
              <span className="text-xs font-bold text-gray-800 leading-tight">Admin User</span>
            </div>

            <Icon
              icon="lucide:chevron-down"
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isProfileOpen ? "rotate-180 text-primary" : ""
              }`}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-gray-100 shadow-xl shadow-gray-200/50 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  A
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-gray-900 truncate">Admin User</span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  href="/dashboard"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  <Icon icon="lucide:layout-dashboard" className="w-4 h-4 text-gray-400" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/property-submissions"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  <Icon icon="lucide:file-check" className="w-4 h-4 text-gray-400" />
                  <span>Property Submissions</span>
                </Link>
                <Link
                  href="/kyc/pending"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  <Icon icon="lucide:shield-check" className="w-4 h-4 text-gray-400" />
                  <span>KYC Verification</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsTutorialModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors cursor-pointer text-left"
                >
                  <Icon icon="lucide:video" className="w-4 h-4 text-gray-400" />
                  <span>Add Tutorial Video</span>
                </button>
              </div>

              <div className="border-t border-gray-100 pt-1 mt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Icon icon="lucide:log-out" className="w-4 h-4 text-red-500" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tutorial Video Modal */}
      <TutorialVideoModal
        isOpen={isTutorialModalOpen}
        onClose={() => setIsTutorialModalOpen(false)}
      />
    </header>
  );
}
