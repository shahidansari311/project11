"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { getYouTubeEmbedUrl, getYouTubeVideoId } from "../../lib/videoUtils";

export default function TutorialVideoModal({ isOpen, onClose }) {
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setUrl("");
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !mounted) return null;

  const embedUrl = getYouTubeEmbedUrl(url);
  const isValidVideoId = Boolean(getYouTubeVideoId(url));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      toast.error("Please enter a YouTube video URL");
      return;
    }

    if (!isValidVideoId) {
      toast.error("Please provide a valid YouTube URL or Short link");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/settings/admin/tutorial-video", {
        url: trimmedUrl,
      });

      if (res?.status !== false && res?.success !== false) {
        toast.success(res?.message || "Tutorial video updated successfully");
        onClose();
      } else {
        toast.error(res?.message || "Failed to update tutorial video");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update tutorial video. Please check permissions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0 shadow-2xs">
              <Icon icon="lucide:play-square" width="18" height="18" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900 leading-tight">
                Add Tutorial Video
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Update the global video shown on the mobile app home page
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <Icon icon="lucide:x" width="18" height="18" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-4 flex flex-col gap-3">
            {/* URL Input */}
            <div className="flex flex-col gap-1">
              <label htmlFor="tutorialVideoUrl" className="text-xs font-semibold text-gray-700">
                YouTube Video or Short URL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-red-500">
                  <Icon icon="lucide:youtube" width="16" height="16" />
                </span>
                <input
                  id="tutorialVideoUrl"
                  type="url"
                  required
                  autoFocus
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtu.be/... or https://youtube.com/shorts/..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-xs text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <p className="text-[10px] text-gray-400">
                Supports standard links, short links (<code className="text-gray-600 bg-gray-100 px-1 py-0.2 rounded">youtu.be</code>), and Shorts.
              </p>
            </div>

            {/* Live Preview Box */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Icon icon="lucide:eye" width="13" height="13" className="text-gray-500" />
                Live Video Preview
              </span>

              {embedUrl ? (
                <div className="relative w-full h-44 rounded-xl overflow-hidden bg-black shadow-inner border border-gray-200">
                  <iframe
                    src={embedUrl}
                    title="Tutorial Video Preview"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="w-full h-36 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/60 flex flex-col items-center justify-center p-3 text-center text-gray-400">
                  <div className="w-8 h-8 rounded-full bg-white shadow-2xs border border-gray-100 flex items-center justify-center text-gray-400 mb-1.5">
                    <Icon icon="lucide:video" width="16" height="16" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">No Preview Available</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">
                    Paste a valid YouTube link above to see the preview
                  </span>
                </div>
              )}
            </div>

            {/* Info Note */}
            <div className="p-2.5 bg-amber-50/80 border border-amber-200/70 rounded-xl flex items-start gap-2 text-[11px] text-amber-900 leading-snug">
              <Icon icon="lucide:info" className="text-amber-600 shrink-0 mt-0.5" width="14" height="14" />
              <span>
                Saving this will immediately update the video banner on the mobile app home screen.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-xs font-medium text-gray-700 rounded-xl transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !url.trim()}
              className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Icon icon="lucide:check" width="14" height="14" />
                  <span>Update Video</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
