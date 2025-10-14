import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "@/types/api";
import { CreateStockOutRequest, DetailStockOutResponse, ListStockOutResponse } from "@/types-openapi/api";

export const stockOutService = {
  async list(params: { from?: string; to?: string; status?: number }): Promise<ApiResponse<ListStockOutResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListStockOutResponse[]>>("/api/StockOuts/list", { params });
    return res.data;
  },

  async detail(id: number): Promise<ApiResponse<DetailStockOutResponse>> {
    const res = await axiosInstance.get<ApiResponse<DetailStockOutResponse>>(`/api/StockOuts/detail/${id}`);
    return res.data;
  },

  async create(payload: CreateStockOutRequest): Promise<ApiResponse<number>> {
    const res = await axiosInstance.post<ApiResponse<number>>("/api/StockOuts/create", payload);
    return res.data;
  },

  async update(id: number, payload: CreateStockOutRequest): Promise<ApiResponse<string>> {
    const res = await axiosInstance.put<ApiResponse<string>>(`/api/StockOuts/update/${id}`, payload);
    return res.data;
  },

  async complete(id: number): Promise<ApiResponse<string>> {
    const res = await axiosInstance.post<ApiResponse<string>>(`/api/StockOuts/complete/${id}`);
    return res.data;
  },

  async cancel(id: number): Promise<ApiResponse<string>> {
    const res = await axiosInstance.post<ApiResponse<string>>(`/api/StockOuts/cancel/${id}`);
    return res.data;
  },
};
