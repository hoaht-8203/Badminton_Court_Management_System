import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { priceUnitService } from "@/services/priceUnitService";
import {
  CreatePriceUnitRequest,
  DeletePriceUnitRequest,
  DetailPriceUnitRequest,
  DetailPriceUnitResponse,
  ListPriceUnitResponse,
  UpdatePriceUnitRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";
import { ApiError } from "@/lib/axios";

// Query Keys
export const priceUnitsKeys = {
  all: ["priceUnits"] as const,
  lists: () => [...priceUnitsKeys.all, "list"] as const,
  list: () => [...priceUnitsKeys.lists()] as const,
  details: () => [...priceUnitsKeys.all, "detail"] as const,
  detail: (params: DetailPriceUnitRequest) => [...priceUnitsKeys.details(), params] as const,
};

// List Price Units
export const useListPriceUnits = () => {
  return useQuery<ApiResponse<ListPriceUnitResponse[]>, ApiError>({
    queryKey: priceUnitsKeys.list(),
    queryFn: () => priceUnitService.listPriceUnit(),
    enabled: true,
  });
};

// Detail Price Unit
export const useDetailPriceUnit = (params: DetailPriceUnitRequest) => {
  return useQuery<ApiResponse<DetailPriceUnitResponse>, ApiError>({
    queryKey: priceUnitsKeys.detail(params),
    queryFn: () => priceUnitService.detailPriceUnit(params),
    enabled: !!params.id,
  });
};

// Create Price Unit
export const useCreatePriceUnit = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<DetailPriceUnitResponse>, ApiError, CreatePriceUnitRequest>({
    mutationFn: (data: CreatePriceUnitRequest) => priceUnitService.createPriceUnit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceUnitsKeys.lists() });
    },
  });
};

// Update Price Unit
export const useUpdatePriceUnit = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<DetailPriceUnitResponse>, ApiError, UpdatePriceUnitRequest>({
    mutationFn: (data: UpdatePriceUnitRequest) => priceUnitService.updatePriceUnit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceUnitsKeys.lists() });
    },
  });
};

// Delete Price Unit
export const useDeletePriceUnit = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<boolean>, ApiError, DeletePriceUnitRequest>({
    mutationFn: (data: DeletePriceUnitRequest) => priceUnitService.deletePriceUnit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceUnitsKeys.lists() });
    },
  });
};
