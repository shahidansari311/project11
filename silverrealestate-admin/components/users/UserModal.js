"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import UnsavedChangesModal from "../common/UnsavedChangesModal";
import { useUnsavedChanges } from "../common/UnsavedChangesProvider";

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Avatar skeleton */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-[42px] w-full bg-gray-100 rounded-xl animate-pulse" />
        </div>
      ))}
      <div className="flex items-center justify-end gap-3 mt-2 pt-4 border-t border-gray-100">
        <div className="h-[42px] w-20 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-[42px] w-[120px] bg-gray-200 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

export default function UserModal({ isOpen, onClose, user, onSuccess }) {
  const { setDirty } = useUnsavedChanges();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const fileInputRef = useRef(null);

  // Unsaved changes tracking
  const initialDataRef = useRef(null);
  const isSavedRef = useRef(false);
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      isSavedRef.current = false;
      if (user?.id) {
        fetchUserDetails(user.id);
      } else {
        const init = { fullName: "", email: "", phone: "" };
        setFormData(init);
        setProfileImage(null);
        setProfilePreview(null);
        initialDataRef.current = init;
      }
    }
  }, [isOpen, user]);

  // Prevent body scrolling when modal is open
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

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (profilePreview && profilePreview.startsWith("blob:")) {
        URL.revokeObjectURL(profilePreview);
      }
    };
  }, [profilePreview]);

  const fetchUserDetails = async (id) => {
    setIsFetching(true);
    try {
      const res = await api.get(`/admin/users/${id}`);
      if (res?.success) {
        const u = res.data;
        const loaded = {
          fullName: u.fullName || "",
          email: u.email || "",
          phone: u.phone || "",
        };
        setFormData(loaded);
        setProfilePreview(u.profileImage || u.profileUrl || null);
        setProfileImage(null);
        initialDataRef.current = loaded;
      } else {
        toast.error(res?.message || "Failed to fetch user details");
      }
    } catch (error) {
      toast.error("An error occurred while fetching user details");
    } finally {
      setIsFetching(false);
    }
  };

  const isDirty = useCallback(() => {
    if (isSavedRef.current) return false;
    if (!initialDataRef.current) return false;
    if (profileImage !== null) return true;
    const init = initialDataRef.current;
    if (formData.fullName.trim() !== (init.fullName || "").trim()) return true;
    if (formData.email.trim() !== (init.email || "").trim()) return true;
    if (formData.phone.trim() !== (init.phone || "").trim()) return true;
    return false;
  }, [formData, profileImage]);

  // Sync with global UnsavedChangesProvider
  useEffect(() => {
    if (isOpen) {
      setDirty(isDirty());
    } else {
      setDirty(false);
    }
    return () => {
      setDirty(false);
    };
  }, [isOpen, isDirty, setDirty]);

  const handleAttemptClose = () => {
    if (isDirty()) {
      setIsUnsavedModalOpen(true);
    } else {
      setDirty(false);
      onClose();
    }
  };

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isUnsavedModalOpen && !isLoading) {
        handleAttemptClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isUnsavedModalOpen, isLoading, isDirty]);

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
    setFormData((prev) => ({ ...prev, phone: value }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setProfileImage(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setProfileImage(null);
    setProfilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isCreate = !user?.id;

    if (!formData.fullName.trim() || !formData.phone.trim()) {
      toast.error("Full Name and Phone Number are required");
      return;
    }

    if (formData.phone.trim().length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    // Email is required when creating user
    if (isCreate && !formData.email.trim()) {
      toast.error("Email Address is required");
      return;
    }

    // Validate email format if provided
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    setIsLoading(true);
    try {
      const url = user?.id ? `/admin/users/${user.id}` : `/admin/users`;
      const method = user?.id ? "PUT" : "POST";

      let body;
      let headers = {};

      if (profileImage) {
        // Use FormData for file upload
        const fd = new FormData();
        fd.append("fullName", formData.fullName.trim());
        fd.append("phone", formData.phone.trim());
        if (formData.email.trim()) fd.append("email", formData.email.trim().toLowerCase());
        fd.append("profileImage", profileImage);
        body = fd;
      } else {
        body = {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          ...(formData.email.trim() ? { email: formData.email.trim().toLowerCase() } : {}),
        };
      }

      const res = await api({ method, url, data: body, headers });

      if (res?.success) {
        isSavedRef.current = true;
        toast.success(res.message || `User ${user?.id ? "updated" : "added"} successfully`);
        onSuccess();
        onClose();
      } else {
        toast.error(res?.message || `Failed to ${user?.id ? "update" : "add"} user`);
      }
    } catch (error) {
      if (
        error?.response?.status === 409 ||
        error?.status === 409 ||
        error?.message?.toLowerCase().includes("already has this email") ||
        error?.message?.toLowerCase().includes("conflict")
      ) {
        toast.error("Another user already has this email address.");
      } else {
        toast.error(error.message || `An error occurred while ${user?.id ? "updating" : "adding"} the user`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleAttemptClose}
      />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="type-h3 font-semibold text-gray-800">
            {user?.id ? "Edit User" : "Add User"}
          </h2>
          <button
            type="button"
            onClick={handleAttemptClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <Icon icon="lucide:x" width="20" height="20" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {isFetching ? (
            <FormSkeleton />
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
              {/* Profile Image Upload */}
              <div className="flex flex-col items-center gap-2 mb-2">
                <div className="relative group">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-full border-2 border-dashed border-gray-200 hover:border-primary flex items-center justify-center cursor-pointer transition-colors overflow-hidden bg-gray-50"
                  >
                    {profilePreview ? (
                      <img
                        src={profilePreview}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon icon="lucide:user" className="w-8 h-8 text-gray-400" />
                    )}
                  </div>

                  {/* Remove button */}
                  {profilePreview && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-sm"
                    >
                      <Icon icon="lucide:x" className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                <p className="type-body-sm text-gray-400">
                  {profilePreview ? "Click to change photo" : "Upload profile photo"}
                </p>
              </div>

              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fullName" className="text-xs font-medium text-gray-500">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                />
              </div>

              {/* Phone Number — numbers only */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-xs font-medium text-gray-500">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="9876543210"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-medium text-gray-500">
                  Email Address {!user?.id && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  required={!user?.id}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleAttemptClose}
                  className="px-4 py-2.5 rounded-xl font-medium text-sm text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary text-white hover:bg-primary/90 px-5 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors min-w-[120px] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <Icon icon="lucide:loader-2" className="animate-spin" width="18" height="18" />
                  ) : (
                    user?.id ? "Save Changes" : "Add User"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Unsaved Changes Custom Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={isUnsavedModalOpen}
        onClose={() => setIsUnsavedModalOpen(false)}
        onConfirm={() => {
          setIsUnsavedModalOpen(false);
          onClose();
        }}
      />
    </div>
  );
}
