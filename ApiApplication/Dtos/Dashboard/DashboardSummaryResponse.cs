using System;

namespace ApiApplication.Dtos.Dashboard;

public class DashboardSummaryResponse
{
    public decimal TotalRevenue { get; set; }
    public int TotalBookings { get; set; }
    public int NewCustomers { get; set; }
    public int ActiveCustomers { get; set; }
    public decimal UtilizationRate { get; set; }
}
