"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import UnsavedChangesModal from "./UnsavedChangesModal";

const UnsavedChangesContext = createContext({
  isDirty: false,
  setDirty: () => {},
  promptUnsaved: (targetUrl) => {},
  resetDirty: () => {},
});

export function useUnsavedChanges() {
  return useContext(UnsavedChangesContext);
}

export function UnsavedChangesProvider({ children }) {
  const router = useRouter();
  const [isDirty, setIsDirtyState] = useState(false);
  const isDirtyRef = useRef(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const setDirty = useCallback((dirty) => {
    const val = Boolean(dirty);
    isDirtyRef.current = val;
    setIsDirtyState(val);
  }, []);

  const resetDirty = useCallback(() => {
    isDirtyRef.current = false;
    setIsDirtyState(false);
    setPendingUrl(null);
    setPendingAction(null);
    setIsModalOpen(false);
  }, []);

  const promptUnsaved = useCallback((targetUrlOrAction) => {
    if (typeof targetUrlOrAction === "string") {
      setPendingUrl(targetUrlOrAction);
      setPendingAction(null);
    } else if (typeof targetUrlOrAction === "function") {
      setPendingAction(() => targetUrlOrAction);
      setPendingUrl(null);
    }
    setIsModalOpen(true);
  }, []);

  // 1. Intercept Browser Tab Close / Refresh / Address Bar URL Change
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // 2. Intercept All In-App Link Clicks Globally (Sidebar, TopBar, Breadcrumbs, etc.)
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!isDirtyRef.current) return;

      // Find closest anchor tag clicked
      const anchor = e.target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      // Skip non-navigational links
      if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("tel:") || href.startsWith("mailto:")) {
        return;
      }

      // Check if clicking the exact current URL
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl) return;

      // Target="_blank" opens in new tab, so no risk of losing current page state
      if (anchor.getAttribute("target") === "_blank") return;

      // Prevent immediate client-side navigation
      e.preventDefault();
      e.stopPropagation();

      setPendingUrl(href);
      setPendingAction(null);
      setIsModalOpen(true);
    };

    // Capture phase so we intercept before Next.js Link onClick
    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, []);

  // 3. Intercept Browser Back / Forward Buttons (popstate)
  useEffect(() => {
    let pushedState = false;

    if (isDirty) {
      // Push state so back button triggers popstate on current page
      window.history.pushState({ unsavedGuard: true }, "", window.location.href);
      pushedState = true;
    }

    const handlePopState = (e) => {
      if (isDirtyRef.current) {
        // Push state back to prevent navigation
        window.history.pushState({ unsavedGuard: true }, "", window.location.href);
        setPendingUrl(null);
        setPendingAction(() => () => {
          isDirtyRef.current = false;
          setIsDirtyState(false);
          window.history.go(-2);
        });
        setIsModalOpen(true);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isDirty]);

  const handleConfirmDiscard = () => {
    isDirtyRef.current = false;
    setIsDirtyState(false);
    setIsModalOpen(false);

    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    } else if (pendingUrl) {
      const url = pendingUrl;
      setPendingUrl(null);
      router.push(url);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPendingUrl(null);
    setPendingAction(null);
  };

  return (
    <UnsavedChangesContext.Provider
      value={{
        isDirty,
        setDirty,
        promptUnsaved,
        resetDirty,
      }}
    >
      {children}

      {/* Global Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDiscard}
      />
    </UnsavedChangesContext.Provider>
  );
}
