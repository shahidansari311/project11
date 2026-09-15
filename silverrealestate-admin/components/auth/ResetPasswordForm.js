"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Icon } from "@iconify/react";
import api from "../../lib/api";

export default function ResetPasswordForm({ initialPhone = "", onBackToLogin, onSuccess }) {
  // Steps: 1 = Phone -> Fetch Question, 2 = Security Answer -> Get resetToken, 3 = New Password
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState(initialPhone);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setPhone(value);
    }
  };

  // Step 1: Fetch Security Question
  const handleFetchQuestion = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/auth/admin/reset-password/question`, {
        params: { phone },
      });

      const q = response?.data?.question || response?.question;
      if (q) {
        setQuestion(q);
        setStep(2);
        toast.success(response?.message || "Security question retrieved successfully");
      } else {
        throw new Error(response?.message || "No security question found for this account.");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to retrieve security question. Please check the phone number."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify Security Answer
  const handleVerifyAnswer = async (e) => {
    e.preventDefault();
    if (!answer.trim()) {
      toast.error("Please enter your answer to the security question");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/auth/admin/reset-password/verify-answer", {
        phone,
        answer: answer.trim(),
      });

      const token = response?.data?.resetToken || response?.resetToken;
      if (token) {
        setResetToken(token);
        setStep(3);
        toast.success(response?.message || "Security answer verified!");
      } else if (response?.success) {
        setResetToken(response?.data?.token || response?.token || "verified");
        setStep(3);
        toast.success(response?.message || "Security answer verified!");
      } else {
        throw new Error(response?.message || "Invalid answer.");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Incorrect answer to the security question."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Confirm New Password
  const handleConfirmPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/auth/admin/reset-password/confirm", {
        phone,
        resetToken,
        newPassword,
      });

      if (response && (response.success || response.message)) {
        toast.success(response.message || "Password updated successfully! Please log in.");
        onSuccess(phone);
      } else {
        throw new Error(response?.message || "Failed to update password.");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to reset password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="text-center">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2.5">
          <Icon icon="lucide:key-round" className="w-5 h-5" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          {step === 1 && "Reset Password"}
          {step === 2 && "Security Verification"}
          {step === 3 && "Set New Password"}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          {step === 1 && "Enter your registered mobile number to locate your account"}
          {step === 2 && "Answer your security question to verify your identity"}
          {step === 3 && "Create a secure new password for your admin account"}
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 my-1">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step === s
                ? "w-8 bg-primary"
                : step > s
                ? "w-4 bg-emerald-500"
                : "w-4 bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* STEP 1: Phone input */}
      {step === 1 && (
        <form onSubmit={handleFetchQuestion} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="reset-phone" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Mobile Number
              </label>
              <span className="text-[11px] font-semibold text-gray-400">
                {phone.length}/10 digits
              </span>
            </div>

            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none gap-1.5 text-gray-700 font-semibold text-xs sm:text-sm border-r border-gray-200 pr-3 my-2">
                <span>🇮🇳</span>
                <span>+91</span>
              </div>
              <input
                id="reset-phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={handlePhoneChange}
                required
                autoFocus
                disabled={isLoading}
                placeholder="98765 43210"
                className="w-full pl-24 pr-4 py-3.5 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium tracking-wider bg-gray-50/50 focus:bg-white text-gray-900 disabled:bg-gray-100 shadow-2xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={phone.length !== 10 || isLoading}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
              phone.length === 10 && !isLoading
                ? "bg-primary text-white hover:bg-primary/90 shadow-primary/25 cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
            }`}
          >
            {isLoading ? (
              <>
                <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin" />
                <span>Finding Account...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <Icon icon="lucide:arrow-right" className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 2: Security Question & Answer */}
      {step === 2 && (
        <form onSubmit={handleVerifyAnswer} className="flex flex-col gap-4">
          <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex items-start gap-3">
            <Icon icon="lucide:help-circle" className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                Security Question
              </span>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{question}</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="security-answer" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Your Answer
            </label>
            <input
              id="security-answer"
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              autoFocus
              disabled={isLoading}
              placeholder="Enter your answer"
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium bg-gray-50/50 focus:bg-white text-gray-900 disabled:bg-gray-100 shadow-2xs"
            />
          </div>

          <button
            type="submit"
            disabled={!answer.trim() || isLoading}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
              answer.trim() && !isLoading
                ? "bg-primary text-white hover:bg-primary/90 shadow-primary/25 cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
            }`}
          >
            {isLoading ? (
              <>
                <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin" />
                <span>Verifying Answer...</span>
              </>
            ) : (
              <>
                <span>Verify Answer</span>
                <Icon icon="lucide:shield-check" className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 3: New Password */}
      {step === 3 && (
        <form onSubmit={handleConfirmPassword} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-password" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              New Password
            </label>
            <div className="relative flex items-center">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoFocus
                disabled={isLoading}
                placeholder="Enter new password (min 6 chars)"
                className="w-full pl-4 pr-11 py-3.5 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium bg-gray-50/50 focus:bg-white text-gray-900 disabled:bg-gray-100 shadow-2xs"
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

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm-password" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Confirm New Password
            </label>
            <div className="relative flex items-center">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Re-enter new password"
                className="w-full pl-4 pr-11 py-3.5 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium bg-gray-50/50 focus:bg-white text-gray-900 disabled:bg-gray-100 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <Icon icon={showConfirmPassword ? "lucide:eye-off" : "lucide:eye"} className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!newPassword || newPassword !== confirmPassword || isLoading}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
              newPassword && newPassword === confirmPassword && !isLoading
                ? "bg-primary text-white hover:bg-primary/90 shadow-primary/25 cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
            }`}
          >
            {isLoading ? (
              <>
                <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <span>Save New Password & Login</span>
                <Icon icon="lucide:check" className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Back to Login link */}
      <div className="flex justify-center pt-1 border-t border-gray-100">
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Icon icon="lucide:arrow-left" className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </button>
      </div>
    </div>
  );
}
