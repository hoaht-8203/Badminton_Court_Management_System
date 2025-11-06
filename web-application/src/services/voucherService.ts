import { axiosInstance } from "@/lib/axios";
import { CreateVoucherRequest, DeleteVoucherRequest, DetailVoucherRequest, UpdateVoucherRequest, VoucherResponse } from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const voucherService = {
  async list(): Promise<ApiResponse<VoucherResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<VoucherResponse[]>>("/api/vouchers/list");
    return res.data;
  },

  async detail(payload: DetailVoucherRequest): Promise<ApiResponse<VoucherResponse | null>> {
    const res = await axiosInstance.get<ApiResponse<VoucherResponse | null>>("/api/vouchers/detail", {
      params: payload,
    });
    return res.data;
  },

  async create(payload: CreateVoucherRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.post<ApiResponse<null>>("/api/vouchers/create", payload);
    return res.data;
  },

  async update(id: number, payload: UpdateVoucherRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>(`/api/vouchers/update/${id}`, payload);
    return res.data;
  },

  async delete(payload: DeleteVoucherRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.delete<ApiResponse<null>>("/api/vouchers/delete", {
      params: payload,
    });
    return res.data;
  },

  async getAvailable(): Promise<ApiResponse<VoucherResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<VoucherResponse[]>>("/api/vouchers/available");
    return res.data;
  },
};
