import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customerService } from "@/services/customerService";
import {
  CreateCustomerRequest,
  DeleteCustomerRequest,
  DetailCustomerRequest,
  DetailCustomerResponse,
  ListCustomerRequest,
  ListCustomerResponse,
  UpdateCustomerRequest,
  ChangeCustomerStatusRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";
import { ApiError } from "@/lib/axios";

// Query Keys
export const customersKeys = {
  all: ["customers"] as const,
  lists: () => [...customersKeys.all, "list"] as const,
  list: (params: ListCustomerRequest) => [...customersKeys.lists(), params] as const,
  details: () => [...customersKeys.all, "detail"] as const,
  detail: (params: DetailCustomerRequest) => [...customersKeys.details(), params] as const,
};

// List Customers Query
export const useListCustomers = (params: ListCustomerRequest) => {
  return useQuery<ApiResponse<ListCustomerResponse[]>, ApiError>({
    queryKey: customersKeys.list(params),
    queryFn: () => customerService.listCustomer(params),
    enabled: true,
  });
};

// Detail Customer Query
export const useDetailCustomer = (params: DetailCustomerRequest) => {
  return useQuery<ApiResponse<DetailCustomerResponse>, ApiError>({
    queryKey: customersKeys.detail(params),
    queryFn: () => customerService.detailCustomer(params),
    enabled: !!params.id,
  });
};

// Create Customer Mutation
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, ApiError, CreateCustomerRequest>({
    mutationFn: (data: CreateCustomerRequest) => customerService.createCustomer(data),
    onSuccess: () => {
      // Invalidate and refetch customer lists
      queryClient.invalidateQueries({ queryKey: customersKeys.lists() });
    },
  });
};

// Update Customer Mutation
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, ApiError, UpdateCustomerRequest>({
    mutationFn: (data: UpdateCustomerRequest) => customerService.updateCustomer(data),
    onSuccess: (_, variables) => {
      // Invalidate and refetch customer lists
      queryClient.invalidateQueries({ queryKey: customersKeys.lists() });
      // Invalidate specific customer detail if we have id
      if (variables.id) {
        queryClient.invalidateQueries({
          queryKey: customersKeys.detail({ id: variables.id }),
        });
      }
    },
  });
};

// Delete Customer Mutation
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, ApiError, DeleteCustomerRequest>({
    mutationFn: (data: DeleteCustomerRequest) => customerService.deleteCustomer(data),
    onSuccess: () => {
      // Invalidate and refetch customer lists
      queryClient.invalidateQueries({ queryKey: customersKeys.lists() });
    },
  });
};

// Change Customer Status Mutation
export const useChangeCustomerStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, ApiError, ChangeCustomerStatusRequest>({
    mutationFn: (data: ChangeCustomerStatusRequest) => customerService.changeCustomerStatus(data),
    onSuccess: () => {
      // Invalidate and refetch customer lists
      queryClient.invalidateQueries({ queryKey: customersKeys.lists() });
    },
  });
};
