export type PropertyStatus = "AVAILABLE" | "SOLD" | "UNDER_REVIEW" | "COMING_SOON";
export type PropertyCategory = "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL" | "LAND";

export interface Property {
  id: string;
  title: string;
  description: string;
  images: string[];
  location: string;
  status: PropertyStatus;
  targetReturn: number;
  minInvestment: number;
  investors: number;
  totalPrice: number;
  totalSize: string;
  category: PropertyCategory;
  createdAt: string;
  updatedAt: string;
}

export const CATEGORIES = ["ALL ASSETS", "RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "LAND"] as const;
export type CategoryFilter = (typeof CATEGORIES)[number];

export const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"; // Generic placeholder
