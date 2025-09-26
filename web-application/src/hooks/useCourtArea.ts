import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { courtAreaService } from "@/services/courtAreaService";
import {
  CreateCourtAreaRequest,
  DeletCourtAreaRequest,
  DetailCourtAreaRequest,
  DetailCourtAreaResponse,
  ListCourtAreaResponse,
  UpdateCourtAreaRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";
import { ApiError } from "@/lib/axios";

// Query Keys
export const courtAreasKeys = {
  all: ["courtAreas"] as const,
  lists: () => [...courtAreasKeys.all, "list"] as const,
  list: () => [...courtAreasKeys.lists()] as const,
  details: () => [...courtAreasKeys.all, "detail"] as const,
  detail: (params: DetailCourtAreaRequest) => [...courtAreasKeys.details(), params] as const,
};

// List Court Areas
export const useListCourtAreas = () => {
  return useQuery<ApiResponse<ListCourtAreaResponse[]>, ApiError>({
    queryKey: courtAreasKeys.list(),
    queryFn: () => courtAreaService.listCourtArea(),
    enabled: true,
  });
};

// Detail Court Area
export const useDetailCourtArea = (params: DetailCourtAreaRequest) => {
  return useQuery<ApiResponse<DetailCourtAreaResponse>, ApiError>({
    queryKey: courtAreasKeys.detail(params),
    queryFn: () => courtAreaService.detailCourtArea(params),
    enabled: !!params.id,
  });
};

// Create Court Area
export const useCreateCourtArea = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<DetailCourtAreaResponse>, ApiError, CreateCourtAreaRequest>({
    mutationFn: (data: CreateCourtAreaRequest) => courtAreaService.createCourtArea(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courtAreasKeys.lists() });
    },
  });
};

// Update Court Area
export const useUpdateCourtArea = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<DetailCourtAreaResponse>, ApiError, UpdateCourtAreaRequest>({
    mutationFn: (data: UpdateCourtAreaRequest) => courtAreaService.updateCourtArea(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courtAreasKeys.lists() });
    },
  });
};

// Delete Court Area
export const useDeleteCourtArea = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<boolean>, ApiError, DeletCourtAreaRequest>({
    mutationFn: (data: DeletCourtAreaRequest) => courtAreaService.deleteCourtArea(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courtAreasKeys.lists() });
    },
  });
};
