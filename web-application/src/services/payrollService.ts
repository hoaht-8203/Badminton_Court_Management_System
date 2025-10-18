import { axiosInstance } from "@/lib/axios";
import { CreatePayrollRequest, ListPayrollResponse, PayrollDetailResponse } from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const payrollService = {
  async create(data: CreatePayrollRequest): Promise<ApiResponse<null>> {
    const response = await axiosInstance.post("api/payroll", data);
    return response.data;
  },
  async list(params?: any): Promise<ApiResponse<ListPayrollResponse[]>> {
    const response = await axiosInstance.get("api/payroll", { params });
    return response.data;
  },
  async refresh(payrollId: number): Promise<ApiResponse<null>> {
    const response = await axiosInstance.post(`api/payroll/refresh/${payrollId}`);
    return response.data;
  },
  async payItem(payrollItemId: number, amount: number): Promise<ApiResponse<null>> {
    const response = await axiosInstance.post(`api/payroll/pay-item/${payrollItemId}`, null, {
      params: { amount },
    });
    return response.data;
  },
  async getById(payrollId: number): Promise<ApiResponse<PayrollDetailResponse>> {
    const response = await axiosInstance.get(`api/payroll/${payrollId}`);
    return response.data;
  },
};
