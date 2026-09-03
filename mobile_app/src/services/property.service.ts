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
    minArea?: number;
    maxArea?: number;
  }): Promise<PropertyListResponse> {
    const cleanParams = { ...params };
    // Remove empty search query
    if (cleanParams.search !== undefined && cleanParams.search.trim() === "") {
      delete cleanParams.search;
    }
    
    // Use GET /public/property with query params and a cache-buster
    const response = await api.get("/public/property", { 
      params: { ...cleanParams, _t: Date.now() } 
    });
    return response.data;
  },

  async getPropertyById(id: string): Promise<{ data: Property; message: string }> {
    const response = await api.get(`/public/property/${id}`);
    return response.data;
  }
};
