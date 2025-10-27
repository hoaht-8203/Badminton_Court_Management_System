import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sliderService } from "@/services/sliderService";
import {
  CreateSliderRequest,
  DeleteSliderRequest,
  DetailSliderRequest,
  DetailSliderResponse,
  ListSliderRequest,
  ListSliderResponse,
  UpdateSliderRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";
import { ApiError } from "@/lib/axios";

// Query Keys
export const slidersKeys = {
  all: ["sliders"] as const,
  lists: () => [...slidersKeys.all, "list"] as const,
  list: (params: ListSliderRequest) => [...slidersKeys.lists(), params] as const,
  details: () => [...slidersKeys.all, "detail"] as const,
  detail: (params: DetailSliderRequest) => [...slidersKeys.details(), params] as const,
};

// List Sliders Query
export const useListSliders = (params: ListSliderRequest) => {
  return useQuery<ApiResponse<ListSliderResponse[]>, ApiError>({
    queryKey: slidersKeys.list(params),
    queryFn: () => sliderService.listSlider(params),
    enabled: true,
  });
};

// User List Sliders Query (for homepage)
export const useUserListSliders = () => {
  return useQuery<ApiResponse<ListSliderResponse[]>, ApiError>({
    queryKey: [...slidersKeys.all, "user-list"],
    queryFn: () => sliderService.userListSlider(),
    enabled: true,
  });
};

// Detail Slider Query
export const useDetailSlider = (params: DetailSliderRequest) => {
  return useQuery<ApiResponse<DetailSliderResponse>, ApiError>({
    queryKey: slidersKeys.detail(params),
    queryFn: () => sliderService.detailSlider(params),
    enabled: !!params.id,
  });
};

// Create Slider Mutation
export const useCreateSlider = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<DetailSliderResponse>, ApiError, CreateSliderRequest>({
    mutationFn: (data: CreateSliderRequest) => sliderService.createSlider(data),
    onSuccess: () => {
      // Invalidate and refetch slider lists
      queryClient.invalidateQueries({ queryKey: slidersKeys.lists() });
    },
  });
};

// Update Slider Mutation
export const useUpdateSlider = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<DetailSliderResponse>, ApiError, UpdateSliderRequest>({
    mutationFn: (data: UpdateSliderRequest) => sliderService.updateSlider(data),
    onSuccess: (_, variables) => {
      // Invalidate and refetch slider lists
      queryClient.invalidateQueries({ queryKey: slidersKeys.lists() });
      // Invalidate specific slider detail if we have id
      if (variables.id) {
        queryClient.invalidateQueries({
          queryKey: slidersKeys.detail({ id: variables.id }),
        });
      }
    },
  });
};

// Delete Slider Mutation
export const useDeleteSlider = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<boolean>, ApiError, DeleteSliderRequest>({
    mutationFn: (data: DeleteSliderRequest) => sliderService.deleteSlider(data),
    onSuccess: () => {
      // Invalidate and refetch slider lists
      queryClient.invalidateQueries({ queryKey: slidersKeys.lists() });
    },
  });
};
