"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";

export default function BuilderModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({ fullName: "", email: "", phone: "" });
      setProfileImage(null);
      setProfilePreview(null);
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

  // Clean up blob preview URL
  useEffect(() => {
    return () => {
      if (profilePreview && profilePreview.startsWith("blob:")) {
        URL.revokeObjectURL(profilePreview);
      }
    };
  }, [profilePreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "fullName") {
      const lettersAndSpaces = value.replace(/[^a-zA-Z\s]/g, "");
      setFormData((prev) => ({ ...prev, [name]: lettersAndSpaces }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length > 0 && !/^[6-9]/.test(value)) {
      toast.error("Phone number must start with 6, 7, 8, or 9");
      return;
    }
    if (value.length <= 10) {
      setFormData((prev) => ({ ...prev, phone: value }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setProfileImage(file);
      const previewUrl = URL.createObjectURL(file);
      setProfilePreview(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    if (profilePreview && profilePreview.startsWith("blob:")) {
      URL.revokeObjectURL(profilePreview);
    }
    setProfilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error("Please enter the builder's full name");
      return;
    }

    if (!formData.phone.trim()) {
      toast.error("Please enter the builder's phone number");
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      toast.error("Please enter a valid 10-digit phone number starting with 6, 7, 8, or 9");
      return;
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    setIsLoading(true);
    try {
      let payload;
      if (profileImage) {
        payload = new FormData();
        payload.append("fullName", formData.fullName.trim());
        payload.append("phone", formData.phone.trim());
        if (formData.email.trim()) {
          payload.append("email", formData.email.trim());
        }
        payload.append("profileImage", profileImage);
      } else {
        payload = {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
        };
        if (formData.email.trim()) {
          payload.email = formData.email.trim();
        }
      }

      const res = await api.post("/admin/builders", payload);
      if (res?.success) {
        toast.success(res?.message || "Builder created successfully!");
        onSuccess?.();
        onClose();
      } else {
        toast.error(res?.message || "Failed to create builder account");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred while creating the builder");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
                <Icon icon="lucide:hard-hat" width="22" height="22" />
              </div>
              <div>
                <h3 className="type-h4 font-bold text-gray-900">Create Builder Account</h3>
                <p className="text-xs text-gray-500 mt-0.5">Register a builder with property submission rights</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <Icon icon="lucide:x" width="20" height="20" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
            {/* Profile Image Picker */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-200 group-hover:border-primary flex items-center justify-center overflow-hidden bg-gray-50 transition-colors">
                  {profilePreview ? (
                    <img
                      src={profilePreview}
                      alt="Builder Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon icon="lucide:hard-hat" width="36" height="36" className="text-gray-300" />
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-md hover:bg-primary/90 transition-colors cursor-pointer"
                  title="Upload profile picture"
                >
                  <Icon icon="lucide:camera" width="14" height="14" />
                </button>
              </div>

              {profilePreview && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-xs text-rose-500 hover:underline font-medium cursor-pointer"
                >
                  Remove Photo
                </button>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Full Name / Company Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Icon icon="lucide:user" width="16" height="16" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Acme Builders Pvt Ltd"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <span
                  className={`text-[11px] font-semibold ${
                    formData.phone.length === 10
                      ? "text-emerald-600 font-bold"
                      : formData.phone.length > 0
                      ? "text-amber-600"
                      : "text-gray-400"
                  }`}
                >
                  {formData.phone.length}/10 digits
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Icon icon="lucide:phone" width="16" height="16" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  inputMode="numeric"
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  required
                />
                {formData.phone && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, phone: "" }))}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <Icon icon="lucide:x" className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Email Address <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Icon icon="lucide:mail" width="16" height="16" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. builder@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            {/* Role Notice */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-800">
              <Icon icon="lucide:info" width="16" height="16" className="shrink-0 mt-0.5 text-amber-600" />
              <div>
                This account will be registered with the <span className="font-bold">BUILDER</span> role, allowing them to submit properties for verification.
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                    <span>Creating Builder...</span>
                  </>
                ) : (
                  <>
                    <Icon icon="lucide:check" width="16" height="16" />
                    <span>Create Builder</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
