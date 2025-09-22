import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import { ApiResponse } from "@/types/api";
import { ApiError } from "@/lib/axios";
import {
  ForgotPasswordRequest,
  MyProfileResponse,
  UpdateMyProfileRequest,
  UpdatePasswordRequest,
  ValidateForgotPasswordRequest,
} from "@/types-openapi/api";

export const profileKeys = {
  all: ["profile"] as const,
  me: () => [...profileKeys.all, "me"] as const,
};

export const useMyProfile = () => {
  return useQuery<ApiResponse<MyProfileResponse>, ApiError>({
    queryKey: profileKeys.me(),
    queryFn: () => authService.myProfile(),
    staleTime: 60 * 1000,
    enabled: true,
  });
};

export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<null>, ApiError, UpdateMyProfileRequest>({
    mutationFn: (payload) => authService.updateMyProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
    },
  });
};

export const useUpdatePassword = () => {
  return useMutation<ApiResponse<null>, ApiError, UpdatePasswordRequest>({
    mutationFn: (payload) => authService.updatePassword(payload),
  });
};

export const useForgotPassword = () => {
  return useMutation<ApiResponse<null>, ApiError, ForgotPasswordRequest>({
    mutationFn: (payload) => authService.forgotPassword(payload),
  });
};

export const useValidateForgotPassword = () => {
  return useMutation<ApiResponse<null>, ApiError, ValidateForgotPasswordRequest>({
    mutationFn: (payload) => authService.validateForgotPassword(payload),
  });
};
