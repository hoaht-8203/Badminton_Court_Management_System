using System;

namespace ApiApplication.Dtos.Dashboard;

public class RevenuePointDto
{
    public DateTime Period { get; set; }

    // Total revenue (incoming cashflows)
    public decimal Value { get; set; }

    // Profit = revenue - expenses for the period
    public decimal Profit { get; set; }

    // Human friendly label (e.g. "T1/2025" for month, "Q1/2025" for quarter)
    public string? Label { get; set; }
}
