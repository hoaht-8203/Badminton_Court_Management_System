import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboardService";
import {
  DashboardSummaryResponse,
  HeatmapCellDto,
  RecentTransactionDto,
  RevenuePointDto,
  TopCourtDto,
} from "@/types-openapi/api";
import { ApiError } from "@/lib/axios";
import { ApiResponse } from "@/types/api";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: () => [...dashboardKeys.all, "summary"] as const,
  revenue: (params?: { from?: Date; to?: Date; granularity?: string; branchId?: number }) => [...dashboardKeys.all, "revenue", params] as const,
  heatmap: () => [...dashboardKeys.all, "heatmap"] as const,
  topCourts: () => [...dashboardKeys.all, "topCourts"] as const,
  // include params in key so queries refetch when params change
  recent: (params?: { limit?: number; from?: Date; to?: Date; branchId?: number }) => [...dashboardKeys.all, "recent", params] as const,
};

export const useDashboardSummary = (params?: { from?: Date; to?: Date; branchId?: number }) => {
  return useQuery<ApiResponse<DashboardSummaryResponse | null>, ApiError>({
    queryKey: dashboardKeys.summary(),
    queryFn: () => dashboardService.getSummary(params),
    enabled: true,
  });
};

export const useDashboardRevenue = (params?: { from?: Date; to?: Date; granularity?: string; branchId?: number }) => {
  return useQuery<ApiResponse<RevenuePointDto[] | null>, ApiError>({
    queryKey: dashboardKeys.revenue(params),
    queryFn: () => dashboardService.getRevenueSeries(params),
    enabled: true,
  });
};

export const useDashboardHeatmap = (params?: { from?: Date; to?: Date; branchId?: number }) => {
  return useQuery<ApiResponse<HeatmapCellDto[] | null>, ApiError>({
    queryKey: dashboardKeys.heatmap(),
    queryFn: () => dashboardService.getBookingsHeatmap(params),
    enabled: true,
  });
};

export const useDashboardTopCourts = (params?: { from?: Date; to?: Date; limit?: number; branchId?: number }) => {
  return useQuery<ApiResponse<TopCourtDto[] | null>, ApiError>({
    queryKey: dashboardKeys.topCourts(),
    queryFn: () => dashboardService.getTopCourts(params),
    enabled: true,
  });
};

export const useDashboardRecent = (params?: { from?: Date; to?: Date; limit?: number; branchId?: number }) => {
  return useQuery<ApiResponse<RecentTransactionDto[] | null>, ApiError>({
    queryKey: dashboardKeys.recent(params),
    queryFn: () => dashboardService.getRecentTransactions(params),
    enabled: true,
  });
};
