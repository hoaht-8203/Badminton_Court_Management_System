import { productService } from "@/services/productService";
import { CreateProductRequest, DeleteProductRequest, DetailProductRequest, ListProductRequest, UpdateProductRequest } from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/axios";

export const useListProducts = (params: ListProductRequest) => {
  return useQuery({
    queryKey: [
      "products",
      params,
      params?.id ?? null,
      params?.code ?? null,
      params?.name ?? null,
      params?.category ?? null,
      params?.menuType ?? null,
      params?.isDirectSale ?? null,
    ],
    queryFn: () => productService.list(params),
  });
};

export const useDetailProduct = (params: DetailProductRequest, enabled = true) => {
  return useQuery({
    queryKey: ["product", params, params?.id],
    queryFn: () => productService.detail(params),
    enabled,
  });
};

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<null>, ApiError, CreateProductRequest>({
    mutationFn: (payload) => productService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<null>, ApiError, UpdateProductRequest>({
    mutationFn: (payload) => productService.update(payload),
    onSuccess: () => {
      // Reload lists
      qc.invalidateQueries({ queryKey: ["products"] });
      // Reload any product detail caches (expanded rows, drawers, etc.)
      qc.invalidateQueries({ queryKey: ["product"] });
    },
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<null>, ApiError, DeleteProductRequest>({
    mutationFn: (payload) => productService.delete(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product"] });
    },
  });
}; 