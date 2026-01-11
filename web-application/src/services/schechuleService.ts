import { axiosInstance } from "@/lib/axios";
import { ScheduleByShiftResponse, ScheduleByStaffResponse, ScheduleRequest, ScheduleResponse, WeeklyScheduleRequest } from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

// Helper to serialize array params correctly for ASP.NET Core
const serializeParams = (params: WeeklyScheduleRequest): Record<string, any> => {
  const result: Record<string, any> = {};

  // Convert Date to YYYY-MM-DD format (local date) to avoid timezone issues
  // Using toISOString() would convert to UTC and cause date misalignment
  if (params.startDate) {
    const d = params.startDate instanceof Date ? params.startDate : new Date(params.startDate);
    result.startDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  if (params.endDate) {
    const d = params.endDate instanceof Date ? params.endDate : new Date(params.endDate);
    result.endDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // Serialize staffIds array correctly: staffIds=1&staffIds=2 (not staffIds[]=1&staffIds[]=2)
  if (params.staffIds && params.staffIds.length > 0) {
    // For arrays, we need to pass them as multiple params with the same name
    // Axios will handle this correctly if we use paramsSerializer
    result.staffIds = params.staffIds;
  }

  return result;
};

export const scheduleService = {
  getScheduleByShift: async (request: WeeklyScheduleRequest): Promise<ApiResponse<ScheduleByShiftResponse[]>> => {
    const params = serializeParams(request);
    const response = await axiosInstance.get("/api/schedule/by-shift", {
      params,
      paramsSerializer: {
        indexes: null, // This tells axios to serialize arrays as staffIds=1&staffIds=2 instead of staffIds[]=1&staffIds[]=2
      },
    });
    return response.data;
  },
  getScheduleByStaff: async (request: WeeklyScheduleRequest): Promise<ApiResponse<ScheduleByStaffResponse[]>> => {
    const params = serializeParams(request);
    const response = await axiosInstance.get("/api/schedule/by-staff", {
      params,
      paramsSerializer: {
        indexes: null, // This tells axios to serialize arrays as staffIds=1&staffIds=2 instead of staffIds[]=1&staffIds[]=2
      },
    });
    return response.data;
  },
  getScheduleByStaffId: async (staffId: number, request: { startDate: string; endDate: string }): Promise<ApiResponse<ScheduleResponse[]>> => {
    const response = await axiosInstance.get(`/api/schedule/by-staff/${staffId}`, { params: request });
    return response.data;
  },
  getMySchedule: async (request: { startDate: string; endDate: string }): Promise<ApiResponse<ScheduleResponse[]>> => {
    const response = await axiosInstance.get(`/api/schedule/me`, { params: request });
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
