import { pricesService } from "@/services/pricesService";
import { ApiError } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreatePriceTableRequest,
  DeletePriceTableRequest,
  DetailPriceTableRequest,
  ListPriceTableRequest,
  UpdatePriceTableRequest,
  SetPriceTableProductsRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const useListPrices = (params: ListPriceTableRequest) => {
  return useQuery({
    queryKey: ["price-tables", params, params?.name ?? null, params?.isActive ?? null],
    queryFn: () => pricesService.list(params),
  });
};

export const useDetailPrice = (params: DetailPriceTableRequest, enabled = true) => {
  return useQuery({
    queryKey: ["price-table", params, params.id],
    queryFn: () => pricesService.detail(params),
    enabled,
  });
};

export const useCreatePrice = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<null>, ApiError, CreatePriceTableRequest>({
    mutationFn: (payload) => pricesService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["price-tables"] });
    },
  });
};

export const useUpdatePrice = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<null>, ApiError, UpdatePriceTableRequest>({
    mutationFn: (payload) => pricesService.update(payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["price-tables"] });
      qc.invalidateQueries({ queryKey: ["price-table", { id: v.id }] });
    },
  });
};

export const useDeletePrice = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<null>, ApiError, DeletePriceTableRequest>({
    mutationFn: (payload) => pricesService.delete(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["price-tables"] });
    },
  });
};

export const useGetPriceTableProducts = (priceTableId: number, enabled = true) => {
  return useQuery({
    queryKey: ["price-table-products", priceTableId],
    queryFn: () => pricesService.getProducts(priceTableId),
    enabled,
  });
};

export const useSetPriceTableProducts = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<null>, ApiError, SetPriceTableProductsRequest>({
    mutationFn: (payload) => pricesService.setProducts(payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["price-table-products", v.priceTableId] });
    },
  });
}; 