import { axiosInstance } from "@/lib/axios";
import { ScheduleByShiftResponse, ScheduleByStaffResponse, ScheduleRequest, ScheduleResponse } from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const scheduleService = {
  getScheduleByShift: async (request: ScheduleRequest): Promise<ApiResponse<ScheduleByShiftResponse[]>> => {
    const response = await axiosInstance.get("/api/schedule/by-shift", { params: request });
    return response.data;
  },
  getScheduleByStaff: async (request: ScheduleRequest): Promise<ApiResponse<ScheduleByStaffResponse[]>> => {
    const response = await axiosInstance.get("/api/schedule/by-staff", { params: request });
    return response.data;
  },
  getScheduleByStaffId: async (staffId: number, request: { startDate: string; endDate: string }): Promise<ApiResponse<ScheduleResponse[]>> => {
    const response = await axiosInstance.get(`/api/schedule/by-staff/${staffId}`, { params: request });
    return response.data;
  },
  assign: async (request: ScheduleRequest): Promise<ApiResponse<null>> => {
    const response = await axiosInstance.post("/api/schedule/assign", request);
    return response.data;
  },
  remove: async (request: ScheduleRequest): Promise<ApiResponse<null>> => {
    const response = await axiosInstance.post("/api/schedule/remove", request);
    return response.data;
  },
};
