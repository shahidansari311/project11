export type PropertyStatus = "AVAILABLE" | "SOLD" | "UNDER_REVIEW" | "COMING_SOON";
export type PropertyCategory = "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL" | "LAND" | "OTHERS";

export interface LocationObject {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  placeName?: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  images: string[];
  location: string | LocationObject;
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
  termPeriodYears?: number;
  priceHistory?: { id: string; price: number; date: string }[];
}

export type InvestmentStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "PARTIAL_PAID" | "REFUND_REQUESTED" | "REFUNDED";

export interface Investment {
  id: string;
  propertyId: string;
  userId: string;
  units: number;
  unitPriceAtTime: number;
  totalAmount: number;
  paidAmount: number;
  status: InvestmentStatus;
  paymentRef?: string;
  paymentProofs?: string[];
  signatureBase64?: string;
  placeOfSignature?: string;
  agreementUrl?: string;
  adminRemark?: string;
  refundBankDetails?: any;
  refundProofUrl?: string;
  maturityDate?: string;
  targetReturnAtTime?: number;
  promisedReturnAmount?: number;
  isMatured?: boolean;
  remainingTermString?: string;
  currentValuation?: number;
  paymentHistory?: { date: string, amount: number, invoiceUrl: string | null }[];
  invoices?: string[];
  createdAt: string;
  updatedAt: string;
  property?: Pick<Property, "id" | "title" | "location" | "category" | "status" | "images"> & { priceHistory?: { id: string; price: number; date: string }[] };
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

export const CATEGORIES = ["ALL ASSETS", "RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "LAND", "OTHERS"] as const;
export type CategoryFilter = (typeof CATEGORIES)[number];

export const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"; // Generic placeholder
