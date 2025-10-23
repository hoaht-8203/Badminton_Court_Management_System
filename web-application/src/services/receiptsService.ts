import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "@/types/api";
import { CreateReceiptRequest, DetailReceiptResponse, ListReceiptResponse } from "@/types-openapi/api";

export const receiptsService = {
  async list(params: { from?: string; to?: string; status?: number }): Promise<ApiResponse<ListReceiptResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListReceiptResponse[]>>("/api/Receipts/list", { params });
    return res.data;
  },
  async create(payload: CreateReceiptRequest): Promise<ApiResponse<number>> {
    const res = await axiosInstance.post<ApiResponse<number>>("/api/Receipts", payload);
    return res.data;
  },
  async detail(id: number): Promise<ApiResponse<DetailReceiptResponse>> {
    const res = await axiosInstance.get<ApiResponse<DetailReceiptResponse>>("/api/Receipts/detail", { params: { id } });
    return res.data;
  },
  async update(id: number, payload: CreateReceiptRequest): Promise<ApiResponse<string>> {
    const res = await axiosInstance.put<ApiResponse<string>>(`/api/Receipts/${id}`, payload);
    return res.data;
  },
  async complete(id: number): Promise<ApiResponse<string>> {
    const res = await axiosInstance.put<ApiResponse<string>>(`/api/Receipts/${id}/complete`, {});
    return res.data;
  },
  async cancel(id: number): Promise<ApiResponse<string>> {
    const res = await axiosInstance.put<ApiResponse<string>>(`/api/Receipts/${id}/cancel`, {});
    return res.data;
  },
};
