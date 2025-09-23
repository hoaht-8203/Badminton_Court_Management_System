import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supplierService } from "@/services/supplierService";
import {
  ChangeSupplierStatusRequest,
  CreateSupplierRequest,
  DeleteSupplierRequest,
  DetailSupplierRequest,
  DetailSupplierResponse,
  ListSupplierRequest,
  ListSupplierResponse,
  UpdateSupplierRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";
import { ApiError } from "@/lib/axios";

// Query Keys
export const suppliersKeys = {
  all: ["suppliers"] as const,
  lists: () => [...suppliersKeys.all, "list"] as const,
  list: (params: ListSupplierRequest) => [...suppliersKeys.lists(), params] as const,
  details: () => [...suppliersKeys.all, "detail"] as const,
  detail: (params: DetailSupplierRequest) => [...suppliersKeys.details(), params] as const,
};

// List Suppliers Query
export const useListSuppliers = (params: ListSupplierRequest) => {
  return useQuery<ApiResponse<ListSupplierResponse[]>, ApiError>({
    queryKey: suppliersKeys.list(params),
    queryFn: () => supplierService.listSupplier(params),
    enabled: true,
  });
};

// Detail Supplier Query
export const useDetailSupplier = (params: DetailSupplierRequest) => {
  return useQuery<ApiResponse<DetailSupplierResponse>, ApiError>({
    queryKey: suppliersKeys.detail(params),
    queryFn: () => supplierService.detailSupplier(params),
    enabled: !!params.id,
  });
};

// Create Supplier Mutation
export const useCreateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, ApiError, CreateSupplierRequest>({
    mutationFn: (data: CreateSupplierRequest) => supplierService.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suppliersKeys.lists() });
    },
  });
};

// Update Supplier Mutation
export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, ApiError, UpdateSupplierRequest>({
    mutationFn: (data: UpdateSupplierRequest) => supplierService.updateSupplier(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: suppliersKeys.lists() });
      if (variables.id) {
        queryClient.invalidateQueries({
          queryKey: suppliersKeys.detail({ id: variables.id }),
        });
      }
    },
  });
};

// Delete Supplier Mutation
export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, ApiError, DeleteSupplierRequest>({
    mutationFn: (data: DeleteSupplierRequest) => supplierService.deleteSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suppliersKeys.lists() });
    },
  });
};

// Change Supplier Status Mutation
export const useChangeSupplierStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, ApiError, ChangeSupplierStatusRequest>({
    mutationFn: (data: ChangeSupplierStatusRequest) => supplierService.changeSupplierStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suppliersKeys.lists() });
    },
  });
};
