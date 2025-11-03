import { ApiError } from "@/lib/axios";
import { userMembershipService } from "@/services/userMembershipService";
import {
  CreateUserMembershipRequest,
  CreateUserMembershipResponse,
  ExtendPaymentRequest,
  ListUserMembershipRequest,
  UpdateUserMembershipStatusRequest,
  UserMembershipResponse,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query Keys
export const userMembershipKeys = {
  all: ["user-memberships"] as const,
  lists: () => [...userMembershipKeys.all, "list"] as const,
  list: (params: ListUserMembershipRequest) => [...userMembershipKeys.lists(), params] as const,
  details: () => [...userMembershipKeys.all, "detail"] as const,
  detail: (id: number) => [...userMembershipKeys.details(), id] as const,
};

// List UserMemberships Query
export const useListUserMemberships = (params: ListUserMembershipRequest) => {
  return useQuery<ApiResponse<UserMembershipResponse[]>, ApiError>({
    queryKey: userMembershipKeys.list(params),
    queryFn: () => userMembershipService.list(params),
    enabled: true,
  });
};

// Detail UserMembership Query
export const useDetailUserMembership = (id: number) => {
  return useQuery<ApiResponse<UserMembershipResponse>, ApiError, number>({
    queryKey: userMembershipKeys.detail(id),
    queryFn: () => userMembershipService.detail(id),
    enabled: id !== undefined,
  });
};

// Update UserMembership Status Mutation
export const useUpdateUserMembershipStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<null>, ApiError, UpdateUserMembershipStatusRequest>({
    mutationFn: (data) => userMembershipService.updateStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userMembershipKeys.lists() });
    },
  });
};

// Delete UserMembership Mutation
export const useDeleteUserMembership = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<null>, ApiError, { id: number }>({
    mutationFn: (data) => userMembershipService.delete(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userMembershipKeys.lists() });
    },
  });
};

// Create UserMembership Mutation (returns payment info when method is Bank)
export const useCreateUserMembership = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<CreateUserMembershipResponse>, ApiError, CreateUserMembershipRequest>({
    mutationFn: (data) => userMembershipService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userMembershipKeys.lists() });
    },
  });
};

// Extend Payment Mutation
export const useExtendUserMembershipPayment = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<CreateUserMembershipResponse>, ApiError, ExtendPaymentRequest>({
    mutationFn: (data) => userMembershipService.extendPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userMembershipKeys.lists() });
    },
  });
};
