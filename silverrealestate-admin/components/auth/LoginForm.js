"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import api from "../../lib/api";
import { Icon } from "@iconify/react";

export default function LoginForm({ initialPhone = "", onSuccess, onForgotPassword }) {
  const [phone, setPhone] = useState(initialPhone);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setPhone(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!password) {
      toast.error("Please enter your admin password");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/auth/admin/login-step1", {
        phone,
        password,
      });

      if (response && (response.success || response.message)) {
        toast.success(response.message || "Password verified! OTP sent to your phone.");
        onSuccess(phone);
      } else {
        throw new Error(response?.message || "Failed to proceed to 2FA verification.");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Invalid phone number or password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = phone.length === 10 && password.length >= 1;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      {/* Heading */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Admin Sign In</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Enter your registered mobile number and password to proceed
        </p>
      </div>

      {/* Phone Input Group */}
      <div className="flex flex-col gap-1.5 mt-1">
        <div className="flex items-center justify-between">
          <label htmlFor="phone" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Mobile Number
          </label>
          <span
            className={`text-[11px] font-semibold ${
              phone.length === 10 ? "text-emerald-600 font-bold" : "text-gray-400"
            }`}
          >
            {phone.length}/10 digits
          </span>
        </div>

        <div className="relative flex items-center">
          {/* Country Code Prefix */}
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none gap-1.5 text-gray-700 font-semibold text-xs sm:text-sm border-r border-gray-200 pr-3 my-2">
            <span>🇮🇳</span>
            <span>+91</span>
          </div>

          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={handlePhoneChange}
            required
            autoFocus
            disabled={isLoading}
            placeholder="98765 43210"
            className="w-full pl-24 pr-10 py-3.5 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium tracking-wider bg-gray-50/50 focus:bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-400 shadow-2xs"
          />

          {phone && (
            <button
              type="button"
              onClick={() => setPhone("")}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
            >
              <Icon icon="lucide:x" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Password Input Group */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Password
          </label>
          {onForgotPassword && (
            <button
              type="button"
              onClick={() => onForgotPassword(phone)}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              Forgot Password?
            </button>
          )}
        </div>

        <div className="relative flex items-center">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            placeholder="Enter your password"
            className="w-full pl-4 pr-11 py-3.5 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium bg-gray-50/50 focus:bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-400 shadow-2xs"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <Icon icon={showPassword ? "lucide:eye-off" : "lucide:eye"} className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isValid || isLoading}
        className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md mt-1 ${
          isValid && !isLoading
            ? "bg-primary text-white hover:bg-primary/90 shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.99] cursor-pointer"
            : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
        }`}
      >
        {isLoading ? (
          <>
            <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin" />
            <span>Verifying Credentials...</span>
          </>
        ) : (
          <>
            <span>Proceed to 2FA</span>
            <Icon icon="lucide:arrow-right" className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
