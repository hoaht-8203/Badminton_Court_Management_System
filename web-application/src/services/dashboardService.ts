import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "@/types/api";
import { DashboardSummaryResponse, HeatmapCellDto, RecentTransactionDto, RevenuePointDto, TopCourtDto } from "@/types-openapi/api";

export const dashboardService = {
  async getSummary(params?: { from?: Date; to?: Date; branchId?: number }): Promise<ApiResponse<DashboardSummaryResponse | null>> {
    const res = await axiosInstance.get<ApiResponse<DashboardSummaryResponse | null>>("/api/Dashboard/summary", {
      params: params ? { ...params } : undefined,
    });
    return res.data;
  },

  async getRevenueSeries(params?: {
    from?: Date;
    to?: Date;
    granularity?: string;
    branchId?: number;
  }): Promise<ApiResponse<RevenuePointDto[] | null>> {
    // serialize dates to ISO strings for query params
    const qp: Record<string, any> = {};
    if (params) {
      if (params.from) qp.from = params.from.toISOString();
      if (params.to) qp.to = params.to.toISOString();
      qp.granularity = params.granularity ?? "month";
      if (params.branchId) qp.branchId = params.branchId;
    }
    const res = await axiosInstance.get<ApiResponse<RevenuePointDto[] | null>>("/api/Dashboard/revenue", {
      params: Object.keys(qp).length ? qp : undefined,
    });
    return res.data;
  },

  async getBookingsHeatmap(params?: { from?: Date; to?: Date; branchId?: number }): Promise<ApiResponse<HeatmapCellDto[] | null>> {
    const res = await axiosInstance.get<ApiResponse<HeatmapCellDto[] | null>>("/api/Dashboard/bookings/heatmap", {
      params: params ? { ...params } : undefined,
    });
    return res.data;
  },

  async getTopCourts(params?: { from?: Date; to?: Date; limit?: number; branchId?: number }): Promise<ApiResponse<TopCourtDto[] | null>> {
    const res = await axiosInstance.get<ApiResponse<TopCourtDto[] | null>>("/api/Dashboard/top-courts", {
      params: params ? { ...params } : undefined,
    });
    return res.data;
  },

  async getRecentTransactions(params?: {
    from?: Date;
    to?: Date;
    limit?: number;
    branchId?: number;
  }): Promise<ApiResponse<RecentTransactionDto[] | null>> {
    const res = await axiosInstance.get<ApiResponse<RecentTransactionDto[] | null>>("/api/Dashboard/recent-transactions", {
      params: params ? { ...params } : undefined,
    });
    return res.data;
  },
};

export type DashboardService = typeof dashboardService;
