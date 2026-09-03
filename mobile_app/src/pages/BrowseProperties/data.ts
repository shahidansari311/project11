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
  totalSize: number;         // numeric area in sq.ft
  totalUnits: number;        // floor(totalPrice / totalSize)
  perUnitPrice: number;      // totalPrice / totalUnits
  purchasedUnits: number;    // locked units (PENDING + APPROVED)
  category: PropertyCategory;
  createdAt: string;
  updatedAt: string;
  youtubeVideoUrl?: string;
  priceHistory?: { id: string; price: number; date: string }[];
}

export type InvestmentStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface Investment {
  id: string;
  propertyId: string;
  userId: string;
  units: number;
  unitPriceAtTime: number;
  totalAmount: number;
  status: InvestmentStatus;
  paymentRef?: string;
  adminRemark?: string;
  createdAt: string;
  updatedAt: string;
  property?: Pick<Property, "id" | "title" | "location" | "category" | "status" | "images">;
  user?: { id: string; fullName?: string; phone: string; email?: string };
}

export interface InvestmentInfo {
  propertyId: string;
  status: PropertyStatus;
  totalPrice: number;
  totalSize: number;
  totalUnits: number;
  perUnitPrice: number;
  purchasedUnits: number;
  remainingUnits: number;
  minInvestment: number;
  maxInvestment: number;
}

export const CATEGORIES = ["ALL ASSETS", "RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "LAND"] as const;
export type CategoryFilter = (typeof CATEGORIES)[number];

export const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"; // Generic placeholder
