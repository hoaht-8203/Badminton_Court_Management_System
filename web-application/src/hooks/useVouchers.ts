import { ApiError } from "@/lib/axios";
import { voucherService } from "@/services/voucherService";
import { CreateVoucherRequest, DeleteVoucherRequest, DetailVoucherRequest, UpdateVoucherRequest } from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query Keys
export const voucherKeys = {
  all: ["vouchers"] as const,
  lists: () => [...voucherKeys.all, "list"] as const,
  details: () => [...voucherKeys.all, "detail"] as const,
  detail: (params: DetailVoucherRequest) => [...voucherKeys.details(), params] as const,
  available: () => [...voucherKeys.all, "available"] as const,
};

// List Vouchers Query
export const useListVouchers = () => {
  return useQuery({
    queryKey: voucherKeys.lists(),
    queryFn: () => voucherService.list(),
    enabled: true,
  });
};

// Detail Voucher Query
export const useDetailVoucher = (params: DetailVoucherRequest) => {
  return useQuery({
    queryKey: voucherKeys.detail(params),
    queryFn: () => voucherService.detail(params),
    enabled: !!params.id,
  });
};

// Get Available Vouchers Query
export const useGetAvailableVouchers = () => {
  return useQuery({
    queryKey: voucherKeys.available(),
    queryFn: () => voucherService.getAvailable(),
    enabled: true,
  });
};

// Create Voucher Mutation
export const useCreateVoucher = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<null>, ApiError, CreateVoucherRequest>({
    mutationFn: (data) => voucherService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voucherKeys.lists() });
    },
  });
};

// Update Voucher Mutation
export const useUpdateVoucher = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<null>, ApiError, { id: number; data: UpdateVoucherRequest }>({
    mutationFn: ({ id, data }) => voucherService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: voucherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: voucherKeys.detail({ id: variables.id }) });
    },
  });
};

// Delete Voucher Mutation
export const useDeleteVoucher = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<null>, ApiError, DeleteVoucherRequest>({
    mutationFn: (data) => voucherService.delete(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voucherKeys.lists() });
    },
  });
};
