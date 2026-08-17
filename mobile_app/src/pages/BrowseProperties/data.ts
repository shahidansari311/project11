/**
 * BrowseProperties — Mock Data
 * ─────────────────────────────
 * Static property listings that mirror the design reference.
 * Replace with real API responses when the backend is wired up.
 */

export type PropertyStatus = "Funding" | "Closing Soon" | "Funded";

export interface Property {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  /** Short status label shown in the badge */
  status: PropertyStatus;
  /** Dot color for the status badge */
  statusColor: string;
  /** e.g. "14.5%" */
  targetIRR: string;
  /** e.g. "$25,000" */
  minInvestment: string;
  /** Number of co-investors */
  investors: number;
  /** e.g. "$450 / sq ft" */
  pricePerSqFt: string;
  /** One of the category keys */
  category: "Commercial" | "Residential" | "Industrial";
}

export const PROPERTIES: Property[] = [
  {
    id: "1",
    title: "The Vertex Tower",
    location: "Downtown District, NY",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD9zCpYq-XLthlECfO-E2uJeRxtwy27QykCNPa4ZEJLjNw_x97_oRDhwXSgzuScPSYYNPIr_jzYXvCgjeaBb_AsYndlDruwFXxtMCehn5ZV83N79AWSN4v7tzF6JFilyS_ZUWYZMbmdPs0GJax96tMpGcRRVJ0bKV0PPEn_Otp0NZuT9LIBxFof6uQnrzDSxmFGWJAhZ920z4oP3YAGjBoK9voRrJ8U2aotO2oVcpQTsdrxICzMP8Bd",
    status: "Funding",
    statusColor: "#10b981",
    targetIRR: "14.5%",
    minInvestment: "$25,000",
    investors: 124,
    pricePerSqFt: "$450 / sq ft",
    category: "Commercial",
  },
  {
    id: "2",
    title: "Aura Residences",
    location: "Westside Quarter, CA",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBgvzmpTs3sAG6_amONUaMPvkTQnOQVQaqDYIAaT4OoG8JCdyAstOL3IMmHpA88MR0hiARVmywj0dA-PXHtRgJnNFXbs2NAM4Ywanhu-APXKu8isSzAxTVECInOxKLY_gyZJ7IBt5diktPfiAbRhita_1zkFX4820zXUXn7NJ-bWUOS8H1tIaIdkFcKLS4Ny0pgVxst5Y7Jk7RuZ3nv-iOIOOhYC9sZ70Fb2GdLw3Lu4vqsVZwYUVPA",
    status: "Closing Soon",
    statusColor: "#f59e0b",
    targetIRR: "12.8%",
    minInvestment: "$10,000",
    investors: 89,
    pricePerSqFt: "$620 / sq ft",
    category: "Residential",
  },
  {
    id: "3",
    title: "Meridian Business Park",
    location: "Tech Corridor, TX",
    imageUrl:
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80",
    status: "Funding",
    statusColor: "#10b981",
    targetIRR: "16.2%",
    minInvestment: "$50,000",
    investors: 47,
    pricePerSqFt: "$380 / sq ft",
    category: "Industrial",
  },
  {
    id: "4",
    title: "Harbor Point Lofts",
    location: "Marina Bay, FL",
    imageUrl:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    status: "Closing Soon",
    statusColor: "#f59e0b",
    targetIRR: "11.5%",
    minInvestment: "$15,000",
    investors: 203,
    pricePerSqFt: "$510 / sq ft",
    category: "Residential",
  },
];

export const CATEGORIES = ["All Assets", "Commercial", "Residential", "Industrial"] as const;
export type CategoryFilter = (typeof CATEGORIES)[number];
