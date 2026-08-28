import api from "../utils/api";
import { Property } from "../pages/BrowseProperties/data";

export interface PropertyListResponse {
  data: {
    properties: Property[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  message: string;
}

export interface FilterResponse {
  data: {
    categories: string[];
    statuses: string[];
    locations: string[];
    areas: string[];
    minPrice: number;
    maxPrice: number;
  };
  message: string;
}

export const propertyService = {
  async getProperties(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
    location?: string;
    area?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<PropertyListResponse> {
    // Switch to /public/property so it doesn't require authentication tokens
    const response = await api.get("/public/property", { params });
    return response.data;
  },

  async getPropertyById(id: string): Promise<{ data: Property; message: string }> {
    const response = await api.get(`/public/property/${id}`);
    return response.data;
  },

  async getFilters(): Promise<FilterResponse> {
    const response = await api.get("/public/property/filters");
    return response.data;
  }
};
