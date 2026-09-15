"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";

function isPdfUrl(url) {
  if (!url || typeof url !== "string") return false;
  const clean = url.split("?")[0].toLowerCase();
  return clean.endsWith(".pdf") || url.includes("application/pdf") || url.includes("/pdf");
}

export default function DocumentViewerModal({
  isOpen,
  onClose,
  title = "Document Preview",
  url,
  subtitle,
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset zoom & rotation when url or open state changes
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
    }
  }, [isOpen, url]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !url || !mounted) return null;

  const isPdf = isPdfUrl(url);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center p-2 sm:p-4 md:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] max-h-[92vh] overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150 border border-gray-100">
        {/* Header */}
        <div className="p-3.5 sm:px-5 sm:py-3.5 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Icon icon={isPdf ? "lucide:file-text" : "lucide:image"} width="18" height="18" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Controls & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {!isPdf && (
              <div className="flex items-center bg-white border border-gray-200 rounded-xl p-0.5 shadow-2xs mr-1">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <Icon icon="lucide:zoom-out" width="15" height="15" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-2 py-1 text-[11px] font-mono text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-semibold cursor-pointer"
                  title="Reset Zoom"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <Icon icon="lucide:zoom-in" width="15" height="15" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors ml-0.5 border-l border-gray-100 cursor-pointer"
                  title="Rotate 90°"
                >
                  <Icon icon="lucide:rotate-cw" width="14" height="14" />
                </button>
              </div>
            )}

            {/* Download / Open external fallback button */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 bg-white rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Open full document"
            >
              <Icon icon="lucide:external-link" width="15" height="15" />
              <span className="hidden sm:inline">Open Fullscreen</span>
            </a>

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <Icon icon="lucide:x" width="18" height="18" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 bg-slate-900/5 overflow-auto relative flex items-center justify-center p-2 sm:p-4 min-h-0">
          {isPdf ? (
            <div className="w-full h-full bg-white rounded-xl overflow-hidden shadow-inner border border-gray-200">
              <iframe
                src={`${url}#toolbar=1&navpanes=0`}
                title={title}
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center overflow-auto custom-scrollbar p-4">
              <div
                className="transition-transform duration-150 ease-out origin-center inline-block max-w-full max-h-full"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
              >
                <img
                  src={url}
                  alt={title}
                  className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-lg border border-gray-200/80 bg-white"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
