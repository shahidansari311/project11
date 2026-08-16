import React, { useState } from "react";
import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";

export default function AuthScreen() {
  const [activePage, setActivePage] = useState<"login" | "register">("login");
  const [regToken, setRegToken] = useState<string>("");

  if (activePage === "login") {
    return (
      <LoginPage 
        onRegisterRequired={(token) => {
          setRegToken(token);
          setActivePage("register");
        }} 
      />
    );
  }

  return (
    <RegisterPage 
      registrationToken={regToken}
      onGoBackToLogin={() => setActivePage("login")} 
    />
  );
}
