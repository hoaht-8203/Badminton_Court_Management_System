import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "@/types/api";
import { CurrentUserResponse, LoginRequest, MyProfileResponse, UpdateMyProfileRequest, UpdatePasswordRequest } from "@/types-openapi/api";

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
  async myProfile(): Promise<ApiResponse<MyProfileResponse>> {
    const res = await axiosInstance.get<ApiResponse<MyProfileResponse>>("/api/auth/my-profile");
    return res.data;
  },
  async updateMyProfile(payload: UpdateMyProfileRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>("/api/auth/update-my-profile", payload);
    return res.data;
  },
  async updatePassword(payload: UpdatePasswordRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>("/api/auth/update-password", payload);
    return res.data;
  },
};
