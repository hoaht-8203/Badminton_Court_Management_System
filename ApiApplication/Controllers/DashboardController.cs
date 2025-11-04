using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Dashboard;
using ApiApplication.Services;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[ApiController]
[Route("api/[controller]")]
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
        [FromQuery] string granularity = "day",
        [FromQuery] int? branchId = null
    )
    {
        var data = await _dashboardService.GetRevenueSeriesAsync(from, to, granularity, branchId);
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
}
