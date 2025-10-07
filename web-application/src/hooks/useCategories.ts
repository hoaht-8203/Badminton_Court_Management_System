import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/axios";
import { ApiResponse } from "@/types/api";
import { categoryService } from "@/services/categoryService";
import { 
  ListCategoryRequest, 
  ListCategoryResponse, 
  DetailCategoryRequest, 
  DetailCategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  DeleteCategoryRequest
} from "@/types-openapi/api";

// Use axios-backed service to ensure auth headers/session are applied

export const useListCategories = (params: ListCategoryRequest) => {
  return useQuery({
    queryKey: ["categories", params],
    queryFn: () => categoryService.list(params),
  });
};

export const useDetailCategory = (params: DetailCategoryRequest, enabled = true) => {
  return useQuery({
    queryKey: ["category", params],
    queryFn: () => categoryService.detail(params),
    enabled,
  });
};

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryRequest) => categoryService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCategoryRequest) => categoryService.update(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["category"] });
    },
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeleteCategoryRequest) => categoryService.delete(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["category"] });
    },
  });
};
