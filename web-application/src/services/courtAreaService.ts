import { axiosInstance } from "@/lib/axios";
import {
  CreateCourtAreaRequest,
  DeletCourtAreaRequest,
  DetailCourtAreaRequest,
  DetailCourtAreaResponse,
  ListCourtAreaResponse,
  UpdateCourtAreaRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const courtAreaService = {
  async listCourtArea(): Promise<ApiResponse<ListCourtAreaResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListCourtAreaResponse[]>>("/api/CourtAreas/list", {});
    return res.data;
  },

  async detailCourtArea(payload: DetailCourtAreaRequest): Promise<ApiResponse<DetailCourtAreaResponse>> {
    const res = await axiosInstance.get<ApiResponse<DetailCourtAreaResponse>>("/api/CourtAreas/detail", {
      params: payload,
    });
    return res.data;
  },

  async createCourtArea(payload: CreateCourtAreaRequest): Promise<ApiResponse<DetailCourtAreaResponse>> {
    const res = await axiosInstance.post<ApiResponse<DetailCourtAreaResponse>>("/api/CourtAreas/create", payload);
    return res.data;
  },

  async updateCourtArea(payload: UpdateCourtAreaRequest): Promise<ApiResponse<DetailCourtAreaResponse>> {
    const res = await axiosInstance.put<ApiResponse<DetailCourtAreaResponse>>("/api/CourtAreas/update", payload);
    return res.data;
  },

  async deleteCourtArea(payload: DeletCourtAreaRequest): Promise<ApiResponse<boolean>> {
    const res = await axiosInstance.delete<ApiResponse<boolean>>("/api/CourtAreas/delete", {
      params: payload,
    });
    return res.data;
  },
};
