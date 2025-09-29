import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { courtService } from "@/services/courtService";
import {
  ChangeCourtStatusRequest,
  CourtPricingRuleTemplateDto,
  CreateCourtPricingRuleTemplateRequest,
  CreateCourtRequest,
  DeleteCourtPricingRuleTemplateRequest,
  DeleteCourtRequest,
  DetailCourtRequest,
  DetailCourtResponse,
  ListCourtGroupByCourtAreaResponse,
  ListCourtRequest,
  ListCourtResponse,
  UpdateCourtPricingRuleTemplateRequest,
  UpdateCourtRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";
import { ApiError } from "@/lib/axios";

// Query Keys
export const courtsKeys = {
  all: ["courts"] as const,
  lists: () => [...courtsKeys.all, "list"] as const,
  list: (params: ListCourtRequest) => [...courtsKeys.lists(), params] as const,
  details: () => [...courtsKeys.all, "detail"] as const,
  detail: (params: DetailCourtRequest) => [...courtsKeys.details(), params] as const,
  listPricingRuleTemplates: () => [...courtsKeys.all, "listPricingRuleTemplates"] as const,
  listCourtGroupByCourtArea: () => [...courtsKeys.all, "listCourtGroupByCourtArea"] as const,
};

// List Courts
export const useListCourts = (params: ListCourtRequest) => {
  return useQuery<ApiResponse<ListCourtResponse[]>, ApiError>({
    queryKey: courtsKeys.list(params),
    queryFn: () => courtService.listCourt(params),
    enabled: true,
  });
};

// Detail Court
export const useDetailCourt = (params: DetailCourtRequest) => {
  return useQuery<ApiResponse<DetailCourtResponse>, ApiError>({
    queryKey: courtsKeys.detail(params),
    queryFn: () => courtService.detailCourt(params),
    enabled: !!params.id,
  });
};

// Create Court
export const useCreateCourt = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<DetailCourtResponse>, ApiError, CreateCourtRequest>({
    mutationFn: (data: CreateCourtRequest) => courtService.createCourt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courtsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: courtsKeys.listCourtGroupByCourtArea() });
    },
  });
};

// Update Court
export const useUpdateCourt = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<DetailCourtResponse>, ApiError, UpdateCourtRequest>({
    mutationFn: (data: UpdateCourtRequest) => courtService.updateCourt(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: courtsKeys.lists() });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: courtsKeys.detail({ id: variables.id }) });
      }
      queryClient.invalidateQueries({ queryKey: courtsKeys.listCourtGroupByCourtArea() });
    },
  });
};

// Delete Court
export const useDeleteCourt = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<boolean>, ApiError, DeleteCourtRequest>({
    mutationFn: (data: DeleteCourtRequest) => courtService.deleteCourt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courtsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: courtsKeys.listCourtGroupByCourtArea() });
    },
  });
};

// Change Court Status
export const useChangeCourtStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<DetailCourtResponse>, ApiError, ChangeCourtStatusRequest>({
    mutationFn: (data: ChangeCourtStatusRequest) => courtService.changeCourtStatus(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: courtsKeys.lists() });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: courtsKeys.detail({ id: variables.id }) });
      }
      queryClient.invalidateQueries({ queryKey: courtsKeys.listCourtGroupByCourtArea() });
    },
  });
};

// List Court Pricing Rule Templates
export const useListCourtPricingRuleTemplates = () => {
  return useQuery<ApiResponse<CourtPricingRuleTemplateDto[]>, ApiError>({
    queryKey: courtsKeys.listPricingRuleTemplates(),
    queryFn: () => courtService.listCourtPricingRuleTemplates(),
    enabled: true,
  });
};

// Create Court Pricing Rule Template
export const useCreateCourtPricingRuleTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<CourtPricingRuleTemplateDto>, ApiError, CreateCourtPricingRuleTemplateRequest>({
    mutationFn: (data: CreateCourtPricingRuleTemplateRequest) => courtService.createCourtPricingRuleTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courtsKeys.listPricingRuleTemplates() });
      queryClient.invalidateQueries({ queryKey: courtsKeys.listCourtGroupByCourtArea() });
    },
  });
};

// Update Court Pricing Rule Template
export const useUpdateCourtPricingRuleTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<CourtPricingRuleTemplateDto>, ApiError, UpdateCourtPricingRuleTemplateRequest>({
    mutationFn: (data: UpdateCourtPricingRuleTemplateRequest) => courtService.updateCourtPricingRuleTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courtsKeys.listPricingRuleTemplates() });
      queryClient.invalidateQueries({ queryKey: courtsKeys.listCourtGroupByCourtArea() });
    },
  });
};

// Delete Court Pricing Rule Template
export const useDeleteCourtPricingRuleTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<null>, ApiError, DeleteCourtPricingRuleTemplateRequest>({
    mutationFn: (data: DeleteCourtPricingRuleTemplateRequest) => courtService.deleteCourtPricingRuleTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courtsKeys.listPricingRuleTemplates() });
      queryClient.invalidateQueries({ queryKey: courtsKeys.listCourtGroupByCourtArea() });
    },
  });
};

// List Court Group By Court Area
export const useListCourtGroupByCourtArea = () => {
  return useQuery<ApiResponse<ListCourtGroupByCourtAreaResponse[]>, ApiError>({
    queryKey: courtsKeys.listCourtGroupByCourtArea(),
    queryFn: () => courtService.listCourtGroupByCourtArea(),
    enabled: true,
  });
};
