import { ApiError } from "@/lib/axios";
import { membershipService } from "@/services/membershipService";
import {
  CreateMembershipRequest,
  DeleteMembershipRequest,
  DetailMembershipRequest,
  ListMembershipRequest,
  UpdateMembershipRequest,
  UpdateMemberShipStatusRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query Keys
export const membershipKeys = {
  all: ["memberships"] as const,
  lists: () => [...membershipKeys.all, "list"] as const,
  list: (params: ListMembershipRequest) => [...membershipKeys.lists(), params] as const,
  details: () => [...membershipKeys.all, "detail"] as const,
  detail: (params: DetailMembershipRequest) => [...membershipKeys.details(), params] as const,
};

// List Memberships Query
export const useListMemberships = (params: ListMembershipRequest) => {
  return useQuery({
    queryKey: membershipKeys.list(params),
    queryFn: () => membershipService.listMembership(params),
    enabled: true,
  });
};

// Detail Membership Query
export const useDetailMembership = (params: DetailMembershipRequest) => {
  return useQuery({
    queryKey: membershipKeys.detail(params),
    queryFn: () => membershipService.detailMembership(params),
    enabled: !!params.id,
  });
};

// Create Membership Mutation
export const useCreateMembership = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<null>, ApiError, CreateMembershipRequest>({
    mutationFn: (data) => membershipService.createMembership(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membershipKeys.lists() });
    },
  });
};

// Update Membership Mutation
export const useUpdateMembership = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<null>, ApiError, UpdateMembershipRequest>({
    mutationFn: (data) => membershipService.updateMembership(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: membershipKeys.lists() });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: membershipKeys.detail({ id: variables.id }) });
      }
    },
  });
};

// Delete Membership Mutation
export const useDeleteMembership = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<null>, ApiError, DeleteMembershipRequest>({
    mutationFn: (data) => membershipService.deleteMembership(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membershipKeys.lists() });
    },
  });
};

// Update Membership Status Mutation
export const useUpdateMembershipStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<null>, ApiError, UpdateMemberShipStatusRequest>({
    mutationFn: (data) => membershipService.updateMembershipStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membershipKeys.lists() });
    },
  });
};
