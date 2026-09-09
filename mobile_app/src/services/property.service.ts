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
    status?: string | string[];
    category?: string;
    search?: string;
    location?: string | string[];
    area?: string;
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
  }): Promise<PropertyListResponse> {
    const cleanParams: any = { ...params };
    // Remove empty search query
    if (cleanParams.search !== undefined && cleanParams.search.trim() === "") {
      delete cleanParams.search;
    }
    
    if (Array.isArray(cleanParams.status)) {
      cleanParams.status = cleanParams.status.join(",");
    }
    if (Array.isArray(cleanParams.location)) {
      cleanParams.location = cleanParams.location.join(",");
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
  },

  async getLocationSuggestions(query: string): Promise<{ data: string[]; message: string }> {
    const response = await api.get("/public/property/locations/suggestions", {
      params: { query, _t: Date.now() }
    });
    return response.data;
  },

  async getBuilderProperties(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PropertyListResponse> {
    const response = await api.get("/builder/property/builder/list", { 
      params: { ...params, _t: Date.now() } 
    });
    return response.data;
  },

  async addBuilderProperty(data: FormData): Promise<{ data: Property; message: string }> {
    const response = await api.post("/builder/property/builder/add", data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateBuilderProperty(id: string, data: FormData): Promise<{ data: Property; message: string }> {
    const response = await api.patch(`/builder/property/builder/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};
