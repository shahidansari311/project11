import React, { useState } from "react";
import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";

export default function AuthScreen() {
  const [activePage, setActivePage] = useState<"login" | "register">("login");

  if (activePage === "login") {
    return <LoginPage onRegisterRequired={() => setActivePage("register")} />;
  }

  return <RegisterPage onGoBackToLogin={() => setActivePage("login")} />;
}
