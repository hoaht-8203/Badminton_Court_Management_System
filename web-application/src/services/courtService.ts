import { axiosInstance } from "@/lib/axios";
import {
  CreateCourtRequest,
  DetailCourtRequest,
  DetailCourtResponse,
  ListCourtRequest,
  ListCourtResponse,
  UpdateCourtRequest,
  DeleteCourtRequest,
  ChangeCourtStatusRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const courtService = {
  async listCourt(payload: ListCourtRequest): Promise<ApiResponse<ListCourtResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListCourtResponse[]>>("/api/Courts/list", {
      params: payload,
    });
    return res.data;
  },

  async detailCourt(payload: DetailCourtRequest): Promise<ApiResponse<DetailCourtResponse>> {
    const res = await axiosInstance.get<ApiResponse<DetailCourtResponse>>("/api/Courts/detail", {
      params: payload,
    });
    return res.data;
  },

  async createCourt(payload: CreateCourtRequest): Promise<ApiResponse<DetailCourtResponse>> {
    const res = await axiosInstance.post<ApiResponse<DetailCourtResponse>>("/api/Courts/create", payload);
    return res.data;
  },

  async updateCourt(payload: UpdateCourtRequest): Promise<ApiResponse<DetailCourtResponse>> {
    const res = await axiosInstance.put<ApiResponse<DetailCourtResponse>>("/api/Courts/update", payload);
    return res.data;
  },

  async deleteCourt(payload: DeleteCourtRequest): Promise<ApiResponse<boolean>> {
    const res = await axiosInstance.delete<ApiResponse<boolean>>("/api/Courts/delete", {
      params: payload,
    });
    return res.data;
  },

  async changeCourtStatus(payload: ChangeCourtStatusRequest): Promise<ApiResponse<DetailCourtResponse>> {
    const res = await axiosInstance.put<ApiResponse<DetailCourtResponse>>("/api/Courts/change-status", payload);
    return res.data;
  },
};
