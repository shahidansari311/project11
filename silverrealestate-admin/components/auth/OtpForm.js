"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Icon } from "@iconify/react";
import api from "../../lib/api";
import Cookies from "js-cookie";
import { v4 as uuidv4 } from "uuid";

export default function OtpForm({ phone, onBack }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(60); // 1 minute to resend
  const [expiryTimer, setExpiryTimer] = useState(300); // 5 minutes to expire
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();

    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      setExpiryTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleBoxChange = (index, e) => {
    const value = e.target.value.replace(/\D/g, "");

    // Handling multi-digit paste
    if (value.length > 1) {
      const pastedDigits = value.slice(0, 6).split("");
      const newOtp = [...otp];
      pastedDigits.forEach((digit, idx) => {
        if (index + idx < 6) {
          newOtp[index + idx] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + pastedDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const fullOtpString = otp.join("");

  const handleCancelOtp = async () => {
    setIsCancelling(true);
    try {
      const response = await api.post("/auth/admin/cancel-otp", { phone });
      if (response?.message) {
        toast.success(response.message);
      }
    } catch (error) {
      console.error("Cancel OTP error:", error);
    } finally {
      setIsCancelling(false);
      onBack();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (fullOtpString.length !== 6 || expiryTimer === 0) return;

    let deviceId = localStorage.getItem("x-device-id");
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem("x-device-id", deviceId);
    }

    setIsVerifying(true);
    try {
      const response = await api.post("/auth/admin/login-step2", {
        phone,
        otp: fullOtpString,
      });

      if (response && (response.success || response.data?.token || response?.token)) {
        const token = response.data?.token || response.data?.accessToken || response?.token;
        const refreshToken = response.data?.refreshToken || response?.refreshToken;

        if (token) {
          Cookies.set("token", token, { expires: 7 }); // 7 days expiration
        }
        if (refreshToken) {
          Cookies.set("refreshToken", refreshToken, { expires: 30 });
        }

        toast.success(response.message || "2FA verification successful! Welcome back.");
        router.push("/dashboard");
      } else {
        throw new Error(response?.message || "Invalid 2FA verification code.");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to verify OTP. Please try again."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      // Re-trigger OTP sending
      const response = await api.post("/auth/admin/resend-otp", { phone }).catch(async () => {
        // Fallback to login-step1 or cancel-otp
        return await api.post("/auth/admin/send-otp", { phone });
      });

      if (response && (response.success || response.message)) {
        setResendTimer(60); // Reset resend timer
        setExpiryTimer(300); // Reset expiry timer
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        toast.success(response.message || "New OTP sent successfully!");
      } else {
        throw new Error(response?.message || "Failed to resend OTP.");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to resend OTP. Please try again."
      );
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isExpired = expiryTimer === 0;
  const isValid = fullOtpString.length === 6 && !isExpired;
  const isInputDisabled = isExpired || isVerifying || isResending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Verify Code</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Enter the 6-digit verification code sent to
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100/80 rounded-full text-xs font-bold text-gray-800 mt-2">
          <span>+91 {phone}</span>
          <button
            type="button"
            onClick={handleCancelOtp}
            disabled={isCancelling}
            className="text-primary hover:text-primary/80 ml-1"
            title="Change Number"
          >
            <Icon icon="lucide:pencil" className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Expiry Pill */}
      <div className="flex justify-center">
        {isExpired ? (
          <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full flex items-center gap-1">
            <Icon icon="lucide:alert-circle" className="w-3.5 h-3.5" />
            Code expired. Please request a new OTP.
          </span>
        ) : (
          <span className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full flex items-center gap-1.5">
            <Icon icon="lucide:clock" className="w-3.5 h-3.5 text-primary" />
            Expires in <strong className="text-gray-900 font-bold">{formatTime(expiryTimer)}</strong>
          </span>
        )}
      </div>

      {/* 6-box OTP Input */}
      <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-1">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleBoxChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={isInputDisabled}
            className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-2xl border transition-all outline-none ${
              digit
                ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                : "border-gray-200 bg-gray-50/50 text-gray-900 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            } disabled:bg-gray-100 disabled:text-gray-400`}
          />
        ))}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isValid || isVerifying || isResending}
        className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
          isValid && !isVerifying && !isResending
            ? "bg-primary text-white hover:bg-primary/90 shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.99]"
            : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
        }`}
      >
        {isVerifying ? (
          <>
            <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin" />
            <span>Verifying & Signing In...</span>
          </>
        ) : (
          <>
            <span>Verify & Login</span>
            <Icon icon="lucide:check-circle" className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Footer Actions */}
      <div className="flex flex-col items-center gap-2 text-xs pt-1">
        {resendTimer > 0 ? (
          <span className="text-gray-400">
            Resend OTP in <strong className="text-gray-600 font-bold">{formatTime(resendTimer)}</strong>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || isVerifying}
            className="text-primary font-bold hover:underline flex items-center gap-1.5 disabled:opacity-50"
          >
            {isResending ? (
              <>
                <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" />
                <span>Resending OTP...</span>
              </>
            ) : (
              <>
                <Icon icon="lucide:rotate-ccw" className="w-3.5 h-3.5" />
                <span>Resend OTP</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={handleCancelOtp}
          disabled={isVerifying || isResending || isCancelling}
          className="text-gray-500 hover:text-gray-800 mt-1 flex items-center gap-1 transition-colors font-medium"
        >
          {isCancelling ? (
            <>
              <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" />
              <span>Cancelling...</span>
            </>
          ) : (
            <>
              <Icon icon="lucide:arrow-left" className="w-3.5 h-3.5" />
              <span>Change mobile number</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
