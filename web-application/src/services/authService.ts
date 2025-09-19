import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "@/types/api";
import { CurrentUserResponse, LoginRequest } from "@/types-openapi/api";

export const authService = {
  async login(payload: LoginRequest): Promise<ApiResponse<CurrentUserResponse>> {
    const res = await axiosInstance.post<ApiResponse<CurrentUserResponse>>("/api/auth/login", payload);
    return res.data;
  },
  async getCurrentUser(): Promise<ApiResponse<CurrentUserResponse>> {
    const res = await axiosInstance.get<ApiResponse<CurrentUserResponse>>("/api/auth/me");
    return res.data;
  },
  async refreshToken(): Promise<ApiResponse<null>> {
    const res = await axiosInstance.post<ApiResponse<null>>("/api/auth/refresh-token");
    return res.data;
  },
  async logout(): Promise<ApiResponse<null>> {
    const res = await axiosInstance.get<ApiResponse<null>>("/api/auth/logout");
    return res.data;
  },
};
