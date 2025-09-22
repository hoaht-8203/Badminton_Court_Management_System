import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { roleService } from "@/services/roleService";
import {
  CreateRoleRequest,
  DeleteRoleRequest,
  DetailRoleRequest,
  DetailRoleResponse,
  ListRoleRequest,
  ListRoleResponse,
  UpdateRoleRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";
import { ApiError } from "@/lib/axios";
import { userKeys } from "./useUsers";

// Query Keys
export const rolesKeys = {
  all: ["roles"] as const,
  lists: () => [...rolesKeys.all, "list"] as const,
  list: (params: ListRoleRequest) => [...rolesKeys.lists(), params] as const,
  details: () => [...rolesKeys.all, "detail"] as const,
  detail: (params: DetailRoleRequest) => [...rolesKeys.details(), params] as const,
};

// List Roles Query
export const useListRoles = (params: ListRoleRequest) => {
  return useQuery<ApiResponse<ListRoleResponse[]>, ApiError>({
    queryKey: rolesKeys.list(params),
    queryFn: () => roleService.listRole(params),
    enabled: true,
  });
};

// Detail Role Query
export const useDetailRole = (params: DetailRoleRequest) => {
  return useQuery<ApiResponse<DetailRoleResponse>, ApiError>({
    queryKey: rolesKeys.detail(params),
    queryFn: () => roleService.detailRole(params),
    enabled: !!params.roleId,
  });
};

// Create Role Mutation
export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, ApiError, CreateRoleRequest>({
    mutationFn: (data: CreateRoleRequest) => roleService.createRole(data),
    onSuccess: () => {
      // Invalidate and refetch role lists
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.listUserRoless() });
    },
  });
};

// Update Role Mutation
export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, ApiError, UpdateRoleRequest>({
    mutationFn: (data: UpdateRoleRequest) => roleService.updateRole(data),
    onSuccess: (_, variables) => {
      // Invalidate and refetch role lists
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
      // Invalidate specific role detail if we have roleId
      if (variables.roleId) {
        queryClient.invalidateQueries({
          queryKey: rolesKeys.detail({ roleId: variables.roleId }),
        });
      }
    },
  });
};

// Delete Role Mutation
export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, ApiError, DeleteRoleRequest>({
    mutationFn: (data: DeleteRoleRequest) => roleService.deleteRole(data),
    onSuccess: () => {
      // Invalidate and refetch role lists
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
    },
  });
};
