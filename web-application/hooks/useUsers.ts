import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/services/usersService";
import {
  CreateAdministratorRequest,
  DetailAdministratorRequest,
  ListAdministratorRequest,
  UpdateUserRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";
import { ApiError } from "@/lib/axios";

// Query Keys
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: ListAdministratorRequest) =>
    [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (params: DetailAdministratorRequest) =>
    [...userKeys.details(), params] as const,
};

// List Administrators Query
export const useListAdministrators = (params: ListAdministratorRequest) => {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersService.listAdministrator(params),
    enabled: true,
  });
};

// Detail Administrator Query
export const useDetailAdministrator = (params: DetailAdministratorRequest) => {
  return useQuery({
    queryKey: userKeys.detail(params),
    queryFn: () => usersService.detailAdministrator(params),
    enabled: !!params.userId,
  });
};

// Create Administrator Mutation
export const useCreateAdministrator = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, ApiError, CreateAdministratorRequest>({
    mutationFn: (data: CreateAdministratorRequest) =>
      usersService.createAdministrator(data),
    onSuccess: () => {
      // Invalidate and refetch user lists
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

// Update Administrator Mutation
export const useUpdateAdministrator = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, ApiError, UpdateUserRequest>({
    mutationFn: (data: UpdateUserRequest) =>
      usersService.updateAdministrator(data),
    onSuccess: (_, variables) => {
      // Invalidate and refetch user lists
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      // Invalidate specific user detail if we have userId
      if (variables.userId) {
        queryClient.invalidateQueries({
          queryKey: userKeys.detail({ userId: variables.userId }),
        });
      }
    },
  });
};
