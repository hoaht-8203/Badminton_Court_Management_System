import { axiosInstance } from "@/lib/axios";
import { ListStaffRequest, StaffRequest, StaffResponse } from "@/types-openapi/api";

import { ApiResponse } from "@/types/api";

export const staffService = {
  async list(params: ListStaffRequest): Promise<ApiResponse<StaffResponse[]>> {
    const response = await axiosInstance.get("api/staff", { params });
    return response.data;
  },

  async getById(staffId: number): Promise<ApiResponse<StaffResponse>> {
    const response = await axiosInstance.get(`api/staff/${staffId}`);
    return response.data;
  },

  async create(data: StaffRequest): Promise<ApiResponse<null>> {
    const response = await axiosInstance.post("api/staff", data);
    return response.data;
  },

  async update(staffId: number, data: StaffRequest): Promise<ApiResponse<null>> {
    const response = await axiosInstance.put(`api/staff/${staffId}`, data);
    return response.data;
  },
};
