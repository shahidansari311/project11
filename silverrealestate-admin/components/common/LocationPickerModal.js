"use client";

import React from "react";
import { Icon } from "@iconify/react";
import InteractiveMapPicker from "./InteractiveMapPicker";

export default function LocationPickerModal({
  isOpen,
  onClose,
  initialLatitude,
  initialLongitude,
  initialAddress,
  initialPlaceName,
  onLocationSelect,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Icon icon="lucide:map-pin" width="20" height="20" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Pinpoint Property Location</h2>
              <p className="text-xs text-gray-500">
                Search area, landmark or drag the pin to capture precise GPS coordinates.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Icon icon="lucide:x" width="18" height="18" />
          </button>
        </div>

        {/* Modal Body with Map */}
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
          <InteractiveMapPicker
            initialLatitude={initialLatitude}
            initialLongitude={initialLongitude}
            initialAddress={initialAddress}
            initialPlaceName={initialPlaceName}
            onLocationSelect={onLocationSelect}
            height="440px"
            showBottomDetails={true}
            isModal={true}
            onCloseModal={onClose}
          />
        </div>
      </div>
    </div>
  );
}
