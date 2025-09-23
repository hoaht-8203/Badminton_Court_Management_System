import { axiosInstance } from "@/lib/axios";
import { DeleteFileRequest, UploadFileResponse } from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const fileService = {
  async uploadFile(file: File): Promise<ApiResponse<UploadFileResponse>> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axiosInstance.post<ApiResponse<UploadFileResponse>>("/api/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },

  async deleteFile(payload: DeleteFileRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.delete<ApiResponse<null>>("/api/files/delete", {
      params: payload,
    });

    return res.data;
  },
};
