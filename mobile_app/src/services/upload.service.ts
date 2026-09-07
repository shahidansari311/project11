import api from "../utils/api";

export interface UploadResponse {
  data: {
    url: string;
  };
  message: string;
  success: boolean;
}

export const uploadService = {
  /**
   * Upload a general document (PDF or Image)
   */
  uploadDocument: async (fileUri: string, mimeType: string, fileName: string): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      type: mimeType,
      name: fileName,
    } as any);

    const response = await api.post<UploadResponse>("/upload/document", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
