"use client";

import { Toaster } from "react-hot-toast";
import { UnsavedChangesProvider } from "../components/common/UnsavedChangesProvider";

export function Providers({ children }) {
  return (
    <UnsavedChangesProvider>
      {children}
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            background: "#ffffff",
            color: "#111827",
            fontSize: "0.875rem",
            fontWeight: "500",
            borderRadius: "0.875rem",
            border: "1px solid #f0f0f0",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
            padding: "0.75rem 1rem",
            maxWidth: "360px",
          },
          success: {
            iconTheme: {
              primary: "#16a34a",
              secondary: "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#dc2626",
              secondary: "#ffffff",
            },
          },
        }}
      />
    </UnsavedChangesProvider>
  );
}
