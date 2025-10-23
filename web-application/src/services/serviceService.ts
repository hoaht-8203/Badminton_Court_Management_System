import { axiosInstance } from "@/lib/axios";
import {
  ChangeServiceStatusRequest,
  CreateServiceRequest,
  DetailServiceRequest,
  DetailServiceResponse,
  ListServiceRequest,
  ListServiceResponse,
  UpdateServiceRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const serviceService = {
  async listService(payload: ListServiceRequest): Promise<ApiResponse<ListServiceResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListServiceResponse[]>>("/api/services/list", {
      params: payload,
    });
    return res.data;
  },

  async detailService(payload: DetailServiceRequest): Promise<ApiResponse<DetailServiceResponse>> {
    const res = await axiosInstance.get<ApiResponse<DetailServiceResponse>>("/api/services/detail", {
      params: payload,
    });
    return res.data;
  },

  async createService(payload: CreateServiceRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.post<ApiResponse<null>>("/api/services/create", payload);
    return res.data;
  },

  async updateService(payload: UpdateServiceRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>("/api/services/update", payload);
    return res.data;
  },

  async changeServiceStatus(payload: ChangeServiceStatusRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>("/api/services/change-status", payload);
    return res.data;
  },
};
