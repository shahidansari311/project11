"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";

export default function KycTabs({ showStats, onToggleStats }) {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Document Status",
      href: "/kyc/status",
      icon: "lucide:file-text",
      isActive: pathname === "/kyc/status" || pathname === "/kyc",
    },
    {
      name: "Pending Verification",
      href: "/kyc/pending",
      icon: "lucide:clock",
      isActive: pathname === "/kyc/pending",
    },
    {
      name: "Verified Documents",
      href: "/kyc/verified",
      icon: "lucide:check-circle-2",
      isActive: pathname === "/kyc/verified",
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 bg-gray-100/90 rounded-2xl border border-gray-200/80 shrink-0">
      {/* Equal-spaced 3 Tab Buttons */}
      <div className="grid grid-cols-3 gap-1.5 flex-1 min-w-0">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center justify-center gap-2 py-2 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all text-center truncate ${
              tab.isActive
                ? "bg-white text-primary shadow-xs border border-gray-200/80 font-bold"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
            }`}
          >
            <Icon
              icon={tab.icon}
              width="16"
              height="16"
              className={`shrink-0 ${tab.isActive ? "text-primary" : "text-gray-400"}`}
            />
            <span className="truncate">{tab.name}</span>
          </Link>
        ))}
      </div>

      {/* Hide / Show Overall Stats Button */}
      {onToggleStats && (
        <button
          type="button"
          onClick={onToggleStats}
          className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            showStats
              ? "bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-2xs"
              : "bg-primary text-white hover:bg-primary/90 shadow-2xs"
          }`}
          title={showStats ? "Hide summary stats cards to maximize table space" : "Show summary stats cards"}
        >
          <Icon
            icon={showStats ? "lucide:eye-off" : "lucide:bar-chart-2"}
            width="15"
            height="15"
            className={showStats ? "text-gray-500" : "text-white"}
          />
          <span className="whitespace-nowrap">{showStats ? "Hide Stats" : "Show Stats"}</span>
        </button>
      )}
    </div>
  );
}
