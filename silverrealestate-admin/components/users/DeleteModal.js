"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";

export default function DeleteModal({ isOpen, onClose, user, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const res = await api.delete(`/admin/users/${user.id}`);

      if (res?.success) {
        toast.success(res.message || "User deleted successfully");
        onSuccess();
        onClose();
      } else {
        toast.error(res?.message || "Failed to delete user");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col p-6 text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
          <Icon icon="lucide:alert-triangle" width="24" height="24" />
        </div>
        
        <h3 className="type-h3 font-semibold text-gray-900 mb-2">Delete User</h3>
        <p className="type-body-sm text-gray-500 mb-6">
          Are you sure you want to delete <span className="font-semibold text-gray-700">{user.fullName || "this user"}</span>? This action cannot be undone.
        </p>

        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="flex-1 bg-red-600 text-white hover:bg-red-700 px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Icon icon="lucide:loader-2" className="animate-spin" width="18" height="18" />
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
