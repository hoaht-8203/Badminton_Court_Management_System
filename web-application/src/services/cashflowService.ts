import { axiosInstance } from "@/lib/axios";
import { CashflowResponse, CreateCashflowRequest, ListCashflowRequest, UpdateCashflowRequest } from "@/types-openapi/api";

import { ApiResponse } from "@/types/api";

export const cashflowService = {
  async listCashflow(params: ListCashflowRequest): Promise<ApiResponse<CashflowResponse[]>> {
    const response = await axiosInstance.get("/api/cashflows", { params });
    return response.data;
  },
  async createCashflow(payload: CreateCashflowRequest): Promise<ApiResponse<null>> {
    const response = await axiosInstance.post("/api/cashflows", payload);
    return response.data;
  },
  async updateCashflow(id: number, payload: UpdateCashflowRequest): Promise<ApiResponse<null>> {
    const response = await axiosInstance.put(`/api/cashflows/${id}`, payload);
    return response.data;
  },
  async detailCashflow(id: number): Promise<ApiResponse<CashflowResponse>> {
    const response = await axiosInstance.get(`/api/cashflows/${id}`);
    return response.data;
  },
  async deleteCashflow(id: number): Promise<ApiResponse<null>> {
    const response = await axiosInstance.delete(`/api/cashflows/${id}`);
    return response.data;
  },

  async getTypes(isPayment: boolean): Promise<ApiResponse<any>> {
    const response = await axiosInstance.get(`/api/cashflows/types`, { params: { isPayment } });
    return response.data;
  },

  async getRelatedPersons(personType: string): Promise<ApiResponse<string[]>> {
    const response = await axiosInstance.get(`/api/cashflows/related-persons`, { params: { personType } });
    return response.data;
  },
};
