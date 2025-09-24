import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { courtService } from "@/services/courtService";
import {
  ChangeCourtStatusRequest,
  CreateCourtRequest,
  DeleteCourtRequest,
  DetailCourtRequest,
  DetailCourtResponse,
  ListCourtRequest,
  ListCourtResponse,
  UpdateCourtRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";
import { ApiError } from "@/lib/axios";

// Query Keys
export const courtsKeys = {
  all: ["courts"] as const,
  lists: () => [...courtsKeys.all, "list"] as const,
  list: (params: ListCourtRequest) => [...courtsKeys.lists(), params] as const,
  details: () => [...courtsKeys.all, "detail"] as const,
  detail: (params: DetailCourtRequest) => [...courtsKeys.details(), params] as const,
};

// List Courts
export const useListCourts = (params: ListCourtRequest) => {
  return useQuery<ApiResponse<ListCourtResponse[]>, ApiError>({
    queryKey: courtsKeys.list(params),
    queryFn: () => courtService.listCourt(params),
    enabled: true,
  });
};

// Detail Court
export const useDetailCourt = (params: DetailCourtRequest) => {
  return useQuery<ApiResponse<DetailCourtResponse>, ApiError>({
    queryKey: courtsKeys.detail(params),
    queryFn: () => courtService.detailCourt(params),
    enabled: !!params.id,
  });
};

// Create Court
export const useCreateCourt = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<DetailCourtResponse>, ApiError, CreateCourtRequest>({
    mutationFn: (data: CreateCourtRequest) => courtService.createCourt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courtsKeys.lists() });
    },
  });
};

// Update Court
export const useUpdateCourt = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<DetailCourtResponse>, ApiError, UpdateCourtRequest>({
    mutationFn: (data: UpdateCourtRequest) => courtService.updateCourt(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: courtsKeys.lists() });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: courtsKeys.detail({ id: variables.id }) });
      }
    },
  });
};

// Delete Court
export const useDeleteCourt = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<boolean>, ApiError, DeleteCourtRequest>({
    mutationFn: (data: DeleteCourtRequest) => courtService.deleteCourt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courtsKeys.lists() });
    },
  });
};

// Change Court Status
export const useChangeCourtStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<DetailCourtResponse>, ApiError, ChangeCourtStatusRequest>({
    mutationFn: (data: ChangeCourtStatusRequest) => courtService.changeCourtStatus(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: courtsKeys.lists() });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: courtsKeys.detail({ id: variables.id }) });
      }
    },
  });
};
