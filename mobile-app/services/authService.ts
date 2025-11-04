import { axiosInstance, ApiResponse } from "../lib/axios";

export type LoginRequest = { email: string; password: string };
export type RegisterRequest = {
  username: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};
export type CurrentUserResponse = {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
};
export type VerifyEmailRequest = { email: string; token: string };
export type MyProfileResponse = {
  fullName: string | null;
  userName: string | null;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  ward: string | null;
  dateOfBirth: string | null;
};
export type UpdateMyProfileRequest = {
  fullName: string | null;
  phoneNumber: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  ward: string | null;
  dateOfBirth: string | null;
};
export type UpdatePasswordRequest = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};
export type ForgotPasswordRequest = { email: string };
export type ValidateForgotPasswordRequest = { email: string; token: string };

export const authService = {
  async login(
    payload: LoginRequest
  ): Promise<ApiResponse<CurrentUserResponse>> {
    const res = await axiosInstance.post<ApiResponse<CurrentUserResponse>>(
      "/api/auth/login",
      payload
    );
    return res.data;
  },
  async getCurrentUser(): Promise<ApiResponse<CurrentUserResponse>> {
    const res = await axiosInstance.get<ApiResponse<CurrentUserResponse>>(
      "/api/auth/me"
    );
    return res.data;
  },
  async refreshToken(): Promise<ApiResponse<null>> {
    const res = await axiosInstance.post<ApiResponse<null>>(
      "/api/auth/refresh-token"
    );
    return res.data;
  },
  async logout(): Promise<ApiResponse<null>> {
    const res = await axiosInstance.get<ApiResponse<null>>("/api/auth/logout");
    return res.data;
  },
  async signUp(
    payload: RegisterRequest
  ): Promise<ApiResponse<CurrentUserResponse>> {
    const res = await axiosInstance.post<ApiResponse<CurrentUserResponse>>(
      "/api/auth/sign-up",
      payload
    );
    return res.data;
  },
  async verifyEmail(payload: VerifyEmailRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.post<ApiResponse<null>>(
      "/api/auth/verify-email",
      payload
    );
    return res.data;
  },
  async myProfile(): Promise<ApiResponse<MyProfileResponse>> {
    const res = await axiosInstance.get<ApiResponse<MyProfileResponse>>(
      "/api/auth/my-profile"
    );
    return res.data;
  },
  async updateMyProfile(payload: UpdateMyProfileRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>(
      "/api/auth/update-my-profile",
      payload
    );
    return res.data;
  },
  async updatePassword(payload: UpdatePasswordRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>(
      "/api/auth/update-password",
      payload
    );
    return res.data;
  },
  async forgotPassword(payload: ForgotPasswordRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.post<ApiResponse<null>>(
      "/api/auth/forgot-password",
      payload
    );
    return res.data;
  },
  async validateForgotPassword(payload: ValidateForgotPasswordRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.post<ApiResponse<null>>(
      "/api/auth/validate-forgot-password",
      payload
    );
    return res.data;
  },
};
