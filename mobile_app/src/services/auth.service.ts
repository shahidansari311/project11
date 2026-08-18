import api from "../utils/api";

export interface UserProfile {
  id: string;
  phone: string;
  fullName: string;
  email: string | null;
  profileUrl: string | null;
  createdby_admin: boolean;
  hasPurchasedProperty: boolean;
  createdAt: string;
  updatedAt: string;
}

export const authService = {
  getProfile: async () => {
    const response = await api.get<{ data: UserProfile; message: string; success: boolean }>("/user/profile");
    return response.data;
  },
};
