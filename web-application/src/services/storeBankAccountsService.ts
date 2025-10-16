import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "@/types/api";

export const storeBankAccountsService = {
  async list(): Promise<ApiResponse<any[]>> {
    const res = await axiosInstance.get<any>("/api/store-bank-accounts");
    // BE trả về mảng thuần, chuẩn hóa về ApiResponse cho đồng nhất với các service khác
    return { success: true, message: "", data: res.data } as ApiResponse<any[]>;
  },
  async create(payload: { accountNumber: string; accountName: string; bankName: string }): Promise<ApiResponse<any>> {
    const res = await axiosInstance.post<any>("/api/store-bank-accounts", payload);
    return { success: true, message: "", data: res.data } as ApiResponse<any>;
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
