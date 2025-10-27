import { axiosInstance } from "@/lib/axios";
import {
  CreateSliderRequest,
  DeleteSliderRequest,
  DetailSliderRequest,
  DetailSliderResponse,
  ListSliderResponse,
  UpdateSliderRequest,
} from "@/types-openapi/api";
import { ListSliderRequest } from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const sliderService = {
  async listSlider(payload: ListSliderRequest): Promise<ApiResponse<ListSliderResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListSliderResponse[]>>("/api/sliders/list", {
      params: payload,
    });
    return res.data;
  },

  async userListSlider(): Promise<ApiResponse<ListSliderResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListSliderResponse[]>>("/api/sliders/users/list");
    return res.data;
  },

  async detailSlider(payload: DetailSliderRequest): Promise<ApiResponse<DetailSliderResponse>> {
    const res = await axiosInstance.get<ApiResponse<DetailSliderResponse>>("/api/sliders/detail", {
      params: payload,
    });
    return res.data;
  },

  async createSlider(payload: CreateSliderRequest): Promise<ApiResponse<DetailSliderResponse>> {
    const res = await axiosInstance.post<ApiResponse<DetailSliderResponse>>("/api/sliders/create", payload);
    return res.data;
  },

  async updateSlider(payload: UpdateSliderRequest): Promise<ApiResponse<DetailSliderResponse>> {
    const res = await axiosInstance.put<ApiResponse<DetailSliderResponse>>("/api/sliders/update", payload);
    return res.data;
  },

  async deleteSlider(payload: DeleteSliderRequest): Promise<ApiResponse<boolean>> {
    const res = await axiosInstance.delete<ApiResponse<boolean>>(`/api/sliders/delete`, {
      params: payload,
    });
    return res.data;
  },
};
