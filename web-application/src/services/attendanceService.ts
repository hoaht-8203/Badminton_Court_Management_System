import { axiosInstance } from "@/lib/axios";
import { AttendanceRequest, AttendanceResponse } from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const attendanceService = {
  async createAttendance(payload: AttendanceRequest): Promise<ApiResponse<any>> {
    const res = await axiosInstance.post<ApiResponse<any>>("/api/Attendance", payload);
    return res.data;
  },
  async updateAttendance(payload: AttendanceRequest): Promise<ApiResponse<any>> {
    const res = await axiosInstance.put<ApiResponse<any>>("/api/Attendance", payload);
    return res.data;
  },
  async getAttendanceById(id: number): Promise<ApiResponse<AttendanceResponse>> {
    const res = await axiosInstance.get<ApiResponse<AttendanceResponse>>(`/api/Attendance/${id}`);
    return res.data;
  },
  async getAttendanceRecordsByStaffId(staffId: number, date: string): Promise<ApiResponse<AttendanceResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<AttendanceResponse[]>>(`/api/Attendance/staff/${staffId}?date=${date}`);
    return res.data;
  },

  async deleteAttendanceRecord(id: number): Promise<ApiResponse<any>> {
    const res = await axiosInstance.delete<ApiResponse<any>>(`/api/Attendance/${id}`);
    return res.data;
  },
};
