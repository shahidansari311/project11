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
    units: number,
    paymentProofUrl?: string,
    signatureBase64?: string,
    placeOfSignature?: string
  ): Promise<SingleInvestmentResponse> {
    const response = await api.post(`/user/property/${propertyId}/invest`, { 
      units,
      paymentProofUrl,
      signatureBase64,
      placeOfSignature
    });
    return response.data;
  },

  /**
   * POST /user/investments/:id/sign
   * User signs an admin-created investment
   */
  async signAdminInvestment(
    investmentId: string,
    signatureBase64: string,
    placeOfSignature: string
  ): Promise<SingleInvestmentResponse> {
    const response = await api.post(`/user/investments/${investmentId}/sign`, {
      signatureBase64,
      placeOfSignature
    });
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

  /**
   * POST /user/investments/:id/pay-remaining
   * Pay remaining balance for PARTIAL_PAID investment
   */
  async payRemainingInvestment(id: string, paymentProofUrl: string): Promise<SingleInvestmentResponse> {
    const response = await api.post(`/user/investments/${id}/pay-remaining`, { paymentProofUrl });
    return response.data;
  },

  /**
   * POST /user/investments/:id/refund
   * Request refund for a PARTIAL_PAID investment
   */
  async requestRefund(
    id: string,
    refundBankDetails: { accountName: string; bankName: string; accountNumber: string; ifscCode: string }
  ): Promise<SingleInvestmentResponse> {
    const response = await api.post(`/user/investments/${id}/refund`, { refundBankDetails });
    return response.data;
  },

  /**
   * POST /user/investments/:id/request-withdrawal
   * Request withdrawal after maturity
   */
  async requestWithdrawal(
    id: string,
    refundBankDetails: { accountName: string; bankName: string; accountNumber: string; ifscCode: string }
  ): Promise<SingleInvestmentResponse> {
    const response = await api.post(`/user/investments/${id}/request-withdrawal`, { refundBankDetails });
    return response.data;
  },
};
