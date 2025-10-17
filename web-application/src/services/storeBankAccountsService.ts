import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "@/types/api";

export const storeBankAccountsService = {
  async list(): Promise<ApiResponse<any[]>> {
    const res = await axiosInstance.get<ApiResponse<any[]>>("/api/store-bank-accounts");
    
    return res.data;
  },
  async create(payload: { accountNumber: string; accountName: string; bankName: string }): Promise<ApiResponse<any>> {
    const res = await axiosInstance.post<ApiResponse<any>>("/api/store-bank-accounts", payload);
    return res.data;
  },
  async update(id: number, payload: { accountNumber: string; accountName: string; bankName: string }): Promise<ApiResponse<string>> {
    const res = await axiosInstance.put<ApiResponse<string>>(`/api/store-bank-accounts/${id}`, payload);
    return res.data;
  },
  async delete(id: number): Promise<ApiResponse<string>> {
    const res = await axiosInstance.delete<ApiResponse<string>>(`/api/store-bank-accounts/${id}`);
    return res.data;
  }
};
