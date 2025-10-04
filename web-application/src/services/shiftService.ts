import { axiosInstance } from "@/lib/axios";
import { ShiftRequest, ShiftResponse } from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const shiftService = {
  async list(includeInactive: boolean = false): Promise<ApiResponse<ShiftResponse[]>> {
    const response = await axiosInstance.get("api/shift", {
      params: { includeInactive },
    });
    return response.data;
  },
  async getById(id: number): Promise<ApiResponse<ShiftResponse>> {
    const response = await axiosInstance.get(`api/shift/${id}`);
    return response.data;
  },
  async create(data: ShiftRequest): Promise<ApiResponse<null>> {
    const response = await axiosInstance.post("api/shift", data);
    return response.data;
  },
  async update(id: number, data: ShiftRequest): Promise<ApiResponse<null>> {
    const response = await axiosInstance.put(`api/shift/${id}`, data);
    return response.data;
  },
  async delete(id: number): Promise<ApiResponse<null>> {
    const response = await axiosInstance.delete(`api/shift/${id}`);
    return response.data;
  },
};
