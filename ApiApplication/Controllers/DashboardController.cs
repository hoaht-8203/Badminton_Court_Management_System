using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ApiApplication.Authorization;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Dashboard;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = PolicyConstants.ManagementOnly)]
public class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    private readonly IDashboardService _dashboardService = dashboardService;

    [HttpGet("summary")]
    public async Task<ApiResponse<DashboardSummaryResponse>> Summary(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int? branchId
    )
    {
        var data = await _dashboardService.GetSummaryAsync(from, to, branchId);
        return ApiResponse<DashboardSummaryResponse>.SuccessResponse(data);
    }

    [HttpGet("revenue")]
    public async Task<ApiResponse<RevenuePointDto[]>> Revenue(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] string granularity = "month",
        [FromQuery] int? branchId = null
    )
    {
        // normalize granularity and validate
        var g = (granularity ?? "month").Trim().ToLowerInvariant();
        if (g != "day" && g != "month" && g != "quarter")
        {
            // default to month when unsupported value provided
            g = "month";
        }

        // ensure query DateTimes are treated as UTC to avoid Npgsql Kind errors
        DateTime? fromUtc = null;
        DateTime? toUtc = null;
        if (from.HasValue)
            fromUtc = DateTime.SpecifyKind(from.Value, DateTimeKind.Utc);
        if (to.HasValue)
            toUtc = DateTime.SpecifyKind(to.Value, DateTimeKind.Utc);

        var data = await _dashboardService.GetRevenueSeriesAsync(fromUtc, toUtc, g, branchId);
        return ApiResponse<RevenuePointDto[]>.SuccessResponse(data.ToArray());
    }

    [HttpGet("bookings/heatmap")]
    public async Task<ApiResponse<HeatmapCellDto[]>> Heatmap(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int? branchId = null
    )
    {
        var data = await _dashboardService.GetBookingsHeatmapAsync(from, to, branchId);
        return ApiResponse<HeatmapCellDto[]>.SuccessResponse(data.ToArray());
    }

    [HttpGet("top-courts")]
    public async Task<ApiResponse<TopCourtDto[]>> TopCourts(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int limit = 10,
        [FromQuery] int? branchId = null
    )
    {
        var data = await _dashboardService.GetTopCourtsAsync(from, to, limit, branchId);
        return ApiResponse<TopCourtDto[]>.SuccessResponse(data.ToArray());
    }

    [HttpGet("recent-transactions")]
    public async Task<ApiResponse<RecentTransactionDto[]>> RecentTransactions(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int limit = 20,
        [FromQuery] int? branchId = null
    )
    {
        var data = await _dashboardService.GetRecentTransactionsAsync(from, to, limit, branchId);
        return ApiResponse<RecentTransactionDto[]>.SuccessResponse(data.ToArray());
    }

    [HttpGet("monthly-customer-types")]
    public async Task<ApiResponse<MonthlyCustomerTypeDto[]>> MonthlyCustomerTypes(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int? branchId = null
    )
    {
        var data = await _dashboardService.GetMonthlyCustomerTypeAsync(from, to, branchId);
        return ApiResponse<MonthlyCustomerTypeDto[]>.SuccessResponse(data.ToArray());
    }
}
