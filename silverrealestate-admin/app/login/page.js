"use client";

import { useState } from "react";
import LoginForm from "../../components/auth/LoginForm";
import OtpForm from "../../components/auth/OtpForm";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";
import { Icon } from "@iconify/react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  // mode: "LOGIN" | "RESET_PASSWORD"
  const [mode, setMode] = useState("LOGIN");
  // 2FA step: 1 = Phone & Password, 2 = OTP
  const [loginStep, setLoginStep] = useState(1);

  const handleStep1Success = (userPhone) => {
    setPhone(userPhone);
    setLoginStep(2);
  };

  const handleBackToLoginStep1 = () => {
    setLoginStep(1);
  };

  const handleOpenForgotPassword = (userPhone) => {
    if (userPhone) setPhone(userPhone);
    setMode("RESET_PASSWORD");
  };

  const handleResetPasswordSuccess = (userPhone) => {
    if (userPhone) setPhone(userPhone);
    setMode("LOGIN");
    setLoginStep(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md mx-auto">
        {/* Brand Logo */}
        <div className="flex flex-col items-center justify-center mb-6 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-[#003845] rounded-2xl flex items-center justify-center text-white shadow-md shadow-primary/25 ring-1 ring-primary/20 mb-2.5">
            <Icon icon="lucide:building-2" className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Silver Real Estate</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Admin Management Portal</p>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 p-6 sm:p-8">
          {mode === "LOGIN" ? (
            loginStep === 1 ? (
              <LoginForm
                initialPhone={phone}
                onSuccess={handleStep1Success}
                onForgotPassword={handleOpenForgotPassword}
              />
            ) : (
              <OtpForm phone={phone} onBack={handleBackToLoginStep1} />
            )
          ) : (
            <ResetPasswordForm
              initialPhone={phone}
              onBackToLogin={() => setMode("LOGIN")}
              onSuccess={handleResetPasswordSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
}
