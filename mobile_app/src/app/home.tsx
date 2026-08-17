/**
 * Home Screen — Entry point after successful Login / Register.
 * Delegates all rendering to the BrowseProperties page.
 */
import React from "react";
import BrowsePropertiesPage from "@/pages/BrowseProperties";

export default function HomeScreen() {
  return <BrowsePropertiesPage />;
}
