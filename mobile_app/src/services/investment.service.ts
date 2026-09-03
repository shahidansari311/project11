import api from "../utils/api";
import { Investment, InvestmentInfo, InvestmentStatus } from "../pages/BrowseProperties/data";

export interface InvestmentListResponse {
  data: {
    investments: Investment[];
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

export interface SingleInvestmentResponse {
  data: Investment;
  message: string;
}

export interface InvestmentInfoResponse {
  data: InvestmentInfo;
  message: string;
}

export const investmentService = {
  /**
   * GET /public/property/:id/investment-info
   * Returns perUnitPrice, remainingUnits, min/max investment.
   * No auth required — used to show unit info before login.
   */
  async getPropertyInvestmentInfo(propertyId: string): Promise<InvestmentInfoResponse> {
    const response = await api.get(`/public/property/${propertyId}/investment-info`);
    return response.data;
  },

  /**
   * POST /user/property/:propertyId/invest
   * User clicks "Pay Now" — creates a PENDING investment.
   */
  async createInvestment(
    propertyId: string,
    units: number
  ): Promise<SingleInvestmentResponse> {
    const response = await api.post(`/user/property/${propertyId}/invest`, { units });
    return response.data;
  },

  /**
   * GET /user/investments
   * Fetch all investments for the current user.
   */
  async getMyInvestments(params?: {
    page?: number;
    limit?: number;
    status?: InvestmentStatus;
  }): Promise<InvestmentListResponse> {
    const response = await api.get("/user/investments", { params });
    return response.data;
  },

  /**
   * GET /user/investments/:id
   */
  async getMyInvestmentById(id: string): Promise<SingleInvestmentResponse> {
    const response = await api.get(`/user/investments/${id}`);
    return response.data;
  },

  /**
   * DELETE /user/investments/:id
   * Cancel a PENDING investment (releases units back).
   */
  async cancelInvestment(id: string): Promise<SingleInvestmentResponse> {
    const response = await api.delete(`/user/investments/${id}`);
    return response.data;
  },
};
