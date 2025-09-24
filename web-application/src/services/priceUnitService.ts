import { axiosInstance } from "@/lib/axios";
import {
  CreatePriceUnitRequest,
  DeletePriceUnitRequest,
  DetailPriceUnitRequest,
  DetailPriceUnitResponse,
  ListPriceUnitResponse,
  UpdatePriceUnitRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const priceUnitService = {
  async listPriceUnit(): Promise<ApiResponse<ListPriceUnitResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListPriceUnitResponse[]>>("/api/PriceUnits/list", {});
    return res.data;
  },

  async detailPriceUnit(payload: DetailPriceUnitRequest): Promise<ApiResponse<DetailPriceUnitResponse>> {
    const res = await axiosInstance.get<ApiResponse<DetailPriceUnitResponse>>("/api/PriceUnits/detail", {
      params: payload,
    });
    return res.data;
  },

  async createPriceUnit(payload: CreatePriceUnitRequest): Promise<ApiResponse<DetailPriceUnitResponse>> {
    const res = await axiosInstance.post<ApiResponse<DetailPriceUnitResponse>>("/api/PriceUnits/create", payload);
    return res.data;
  },

  async updatePriceUnit(payload: UpdatePriceUnitRequest): Promise<ApiResponse<DetailPriceUnitResponse>> {
    const res = await axiosInstance.put<ApiResponse<DetailPriceUnitResponse>>("/api/PriceUnits/update", payload);
    return res.data;
  },

  async deletePriceUnit(payload: DeletePriceUnitRequest): Promise<ApiResponse<boolean>> {
    const res = await axiosInstance.delete<ApiResponse<boolean>>("/api/PriceUnits/delete", {
      params: payload,
    });
    return res.data;
  },
};
