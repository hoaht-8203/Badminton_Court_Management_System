import { axiosInstance } from "@/lib/axios";
import { AttendanceRequest, AttendanceResponse } from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const attendanceService = {
  async createOrUpdateAttendance(payload: AttendanceRequest): Promise<ApiResponse<any>> {
    const res = await axiosInstance.post<ApiResponse<any>>("/api/Attendance", payload);
    return res.data;
  },
  async getAttendanceById(id: number): Promise<ApiResponse<AttendanceResponse>> {
    const res = await axiosInstance.get<ApiResponse<AttendanceResponse>>(`/api/Attendance/${id}`);
    return res.data;
  },
};
