import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "@/types/api";
import { CreateReturnGoodsRequest, DetailReturnGoodsResponse, ListReturnGoodsResponse } from "@/types-openapi/api";

export const returnGoodsService = {
  async list(params: { from?: Date; to?: Date; status?: number }): Promise<ApiResponse<ListReturnGoodsResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListReturnGoodsResponse[]>>("/api/ReturnGoods/list", { params });
    return res.data;
  },
  async create(payload: CreateReturnGoodsRequest): Promise<ApiResponse<number>> {
    const res = await axiosInstance.post<ApiResponse<number>>("/api/ReturnGoods/create", payload);
    return res.data;
  },
  async detail(id: number): Promise<ApiResponse<DetailReturnGoodsResponse>> {
    const res = await axiosInstance.get<ApiResponse<DetailReturnGoodsResponse>>("/api/ReturnGoods/detail/" + id);
    return res.data;
  },
  async update(id: number, payload: CreateReturnGoodsRequest): Promise<ApiResponse<string>> {
    const res = await axiosInstance.put<ApiResponse<string>>(`/api/ReturnGoods/update/${id}`, payload);
    return res.data;
  },
  async complete(id: number): Promise<ApiResponse<string>> {
    const res = await axiosInstance.post<ApiResponse<string>>(`/api/ReturnGoods/complete/${id}`, {});
    return res.data;
  },
  async cancel(id: number): Promise<ApiResponse<string>> {
    const res = await axiosInstance.post<ApiResponse<string>>(`/api/ReturnGoods/cancel/${id}`, {});
    return res.data;
  },
  async updateNote(id: number, note: string): Promise<ApiResponse<string>> {
    const res = await axiosInstance.put<ApiResponse<string>>(`/api/ReturnGoods/${id}/note`, { note });
    return res.data;
  },
};
