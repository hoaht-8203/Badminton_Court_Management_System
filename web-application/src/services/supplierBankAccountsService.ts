import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "@/types/api";
import { UpsertBankAccountRequest } from "@/types-openapi/api";

export const supplierBankAccountsService = {
  async list(params: { supplierId: number }): Promise<ApiResponse<any[]>> {
    const res = await axiosInstance.get<ApiResponse<any[]>>("/api/SupplierBankAccounts/list", { params });
    return res.data;
  },
  async create(payload: UpsertBankAccountRequest): Promise<ApiResponse<number>> {
    const res = await axiosInstance.post<ApiResponse<number>>("/api/SupplierBankAccounts", payload);
    return res.data;
  },
  async update(id: number, payload: UpsertBankAccountRequest): Promise<ApiResponse<string>> {
    const res = await axiosInstance.put<ApiResponse<string>>(`/api/SupplierBankAccounts/${id}`, payload);
    return res.data;
  },
  async delete(id: number): Promise<ApiResponse<string>> {
    const res = await axiosInstance.delete<ApiResponse<string>>(`/api/SupplierBankAccounts/${id}`);
    return res.data;
  },
};


