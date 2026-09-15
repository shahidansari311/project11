import api from "../utils/api";

export const settingService = {
  async getTutorialVideo(): Promise<{ data: { url: string }; message: string }> {
    const response = await api.get("/settings/public/tutorial-video");
    return response.data;
  },

  async updateTutorialVideo(url: string): Promise<{ data: { url: string }; message: string }> {
    const response = await api.post("/settings/admin/tutorial-video", { url });
    return response.data;
  }
};
