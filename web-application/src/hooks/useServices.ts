import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { serviceService } from "@/services/serviceService";
import {
  CreateServiceRequest,
  DetailServiceRequest,
  DetailServiceResponse,
  ListServiceRequest,
  ListServiceResponse,
  UpdateServiceRequest,
  ChangeServiceStatusRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";
import { ApiError } from "@/lib/axios";

// Query Keys
export const servicesKeys = {
  all: ["services"] as const,
  lists: () => [...servicesKeys.all, "list"] as const,
  list: (params: ListServiceRequest) => [...servicesKeys.lists(), params] as const,
  details: () => [...servicesKeys.all, "detail"] as const,
  detail: (params: DetailServiceRequest) => [...servicesKeys.details(), params] as const,
};

// List Services Query
export const useListServices = (params: ListServiceRequest) => {
  return useQuery<ApiResponse<ListServiceResponse[]>, ApiError>({
    queryKey: servicesKeys.list(params),
    queryFn: () => serviceService.listService(params),
    enabled: true,
  });
};

// Detail Service Query
export const useDetailService = (params: DetailServiceRequest) => {
  return useQuery<ApiResponse<DetailServiceResponse>, ApiError>({
    queryKey: servicesKeys.detail(params),
    queryFn: () => serviceService.detailService(params),
    enabled: !!params.id,
  });
};

// Create Service Mutation
export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, ApiError, CreateServiceRequest>({
    mutationFn: (data: CreateServiceRequest) => serviceService.createService(data),
    onSuccess: () => {
      // Invalidate and refetch service lists
      queryClient.invalidateQueries({ queryKey: servicesKeys.lists() });
    },
  });
};

// Update Service Mutation
export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, ApiError, UpdateServiceRequest>({
    mutationFn: (data: UpdateServiceRequest) => serviceService.updateService(data),
    onSuccess: (_, variables) => {
      // Invalidate and refetch service lists
      queryClient.invalidateQueries({ queryKey: servicesKeys.lists() });
      // Invalidate specific service detail if we have id
      if (variables.id) {
        queryClient.invalidateQueries({
          queryKey: servicesKeys.detail({ id: variables.id }),
        });
      }
    },
  });
};

// Change Service Status Mutation
export const useChangeServiceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, ApiError, ChangeServiceStatusRequest>({
    mutationFn: (data: ChangeServiceStatusRequest) => serviceService.changeServiceStatus(data),
    onSuccess: () => {
      // Invalidate and refetch service lists
      queryClient.invalidateQueries({ queryKey: servicesKeys.lists() });
    },
  });
};
