import api from "../utils/api";
import { Property } from "../pages/BrowseProperties/data";

export interface PropertyListResponse {
  data: {
    properties: Property[];
    total: number;
    page: number;
    pages: number;
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
  }): Promise<PropertyListResponse> {
    // Switch to /public/property so it doesn't require authentication tokens
    const response = await api.get("/public/property", { params });
    return response.data;
  }
};
