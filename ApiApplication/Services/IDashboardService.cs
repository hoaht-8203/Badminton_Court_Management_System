using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ApiApplication.Dtos.Dashboard;

namespace ApiApplication.Services;

public interface IDashboardService
{
    Task<DashboardSummaryResponse> GetSummaryAsync(DateTime? from, DateTime? to, int? branchId);
    Task<List<RevenuePointDto>> GetRevenueSeriesAsync(
        DateTime? from,
        DateTime? to,
        string granularity,
        int? branchId
    );
    Task<List<HeatmapCellDto>> GetBookingsHeatmapAsync(DateTime? from, DateTime? to, int? branchId);
    Task<List<TopCourtDto>> GetTopCourtsAsync(
        DateTime? from,
        DateTime? to,
        int limit,
        int? branchId
    );
    Task<List<RecentTransactionDto>> GetRecentTransactionsAsync(
        DateTime? from,
        DateTime? to,
        int limit,
        int? branchId
    );
}
