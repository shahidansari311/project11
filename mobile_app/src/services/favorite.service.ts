import api from "../utils/api";
import { Property } from "../pages/BrowseProperties/data"; // Import Property type

export const favoriteService = {
  getFavoriteIds: async () => {
    const response = await api.get<{ data: string[]; message: string; success: boolean }>("/user/favorites/ids");
    return response.data;
  },

  getFavoriteProperties: async () => {
    const response = await api.get<{ data: Property[]; message: string; success: boolean }>("/user/favorites");
    return response.data;
  },

  toggleFavorite: async (propertyId: string) => {
    const response = await api.post<{ data: { favorited: boolean }; message: string; success: boolean }>(`/user/favorites/${propertyId}`);
    return response.data;
  }
};
