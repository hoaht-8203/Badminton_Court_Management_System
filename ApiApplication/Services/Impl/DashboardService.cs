using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ApiApplication.Data;
using ApiApplication.Dtos.Dashboard;
using ApiApplication.Entities;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class DashboardService(ApplicationDbContext context) : IDashboardService
{
    private readonly ApplicationDbContext _context = context;

    public async Task<DashboardSummaryResponse> GetSummaryAsync(
        DateTime? from,
        DateTime? to,
        int? branchId
    )
    {
        // Default window: last 30 days
        to ??= DateTime.UtcNow;
        from ??= to.Value.AddDays(-30);

        var paymentsQuery = _context.Payments.AsQueryable();
        var occurrencesQuery = _context.BookingCourtOccurrences.AsQueryable();
        var customersQuery = _context.Customers.AsQueryable();

        if (from.HasValue)
        {
            paymentsQuery = paymentsQuery.Where(p => p.PaymentCreatedAt >= from.Value);
            occurrencesQuery = occurrencesQuery.Where(o =>
                o.Date >= DateOnly.FromDateTime(from.Value)
            );
        }
        if (to.HasValue)
        {
            paymentsQuery = paymentsQuery.Where(p => p.PaymentCreatedAt <= to.Value);
            occurrencesQuery = occurrencesQuery.Where(o =>
                o.Date <= DateOnly.FromDateTime(to.Value)
            );
        }

        // Revenue: sum of paid payments
        var totalRevenue =
            await paymentsQuery
                .Where(p => p.Status == Entities.Shared.PaymentStatus.Paid)
                .SumAsync(p => (decimal?)p.Amount) ?? 0m;

        // Bookings: count of occurrences in range
        var totalBookings = await occurrencesQuery.CountAsync();

        // New customers: customers created in range
        var newCustomers = await customersQuery
            .Where(c => c.CreatedAt >= from && c.CreatedAt <= to)
            .CountAsync();

        // Active customers: distinct customers with at least one paid payment in range
        var activeCustomers = await paymentsQuery
            .Where(p => p.Status == Entities.Shared.PaymentStatus.Paid)
            .Select(p => p.CustomerId)
            .Distinct()
            .CountAsync();

        // Utilization: (simple) bookings / (courts * days * hours-per-day) approximate
        var courtsCount = await _context.Courts.CountAsync();
        var days = Math.Max(1, (to.Value.Date - from.Value.Date).Days + 1);
        // assume operating 12 hours per day per court
        var totalSlots = courtsCount * days * 12;
        var utilizationRate =
            totalSlots > 0 ? Math.Round((decimal)totalBookings / totalSlots * 100m, 2) : 0m;

        return new DashboardSummaryResponse
        {
            TotalRevenue = Math.Round(totalRevenue, 2),
            TotalBookings = totalBookings,
            NewCustomers = newCustomers,
            ActiveCustomers = activeCustomers,
            UtilizationRate = utilizationRate,
        };
    }

    public async Task<List<RevenuePointDto>> GetRevenueSeriesAsync(
        DateTime? from,
        DateTime? to,
        string granularity,
        int? branchId
    )
    {
        to ??= DateTime.UtcNow;
        from ??= to.Value.AddDays(-30);

        var q = _context.Payments.Where(p =>
            p.Status == Entities.Shared.PaymentStatus.Paid
            && p.PaymentCreatedAt >= from
            && p.PaymentCreatedAt <= to
        );

        // group by day
        var grouped = await q.GroupBy(p => new
            {
                Year = p.PaymentCreatedAt.Year,
                Month = p.PaymentCreatedAt.Month,
                Day = p.PaymentCreatedAt.Day,
            })
            .Select(g => new
            {
                Date = new DateTime(g.Key.Year, g.Key.Month, g.Key.Day),
                Sum = g.Sum(x => x.Amount),
            })
            .OrderBy(x => x.Date)
            .ToListAsync();

        return grouped
            .Select(g => new RevenuePointDto { Period = g.Date, Value = Math.Round(g.Sum, 2) })
            .ToList();
    }

    public async Task<List<HeatmapCellDto>> GetBookingsHeatmapAsync(
        DateTime? from,
        DateTime? to,
        int? branchId
    )
    {
        to ??= DateTime.UtcNow;
        from ??= to.Value.AddDays(-30);

        var occ = _context.BookingCourtOccurrences.Where(o =>
            o.Date >= DateOnly.FromDateTime(from.Value) && o.Date <= DateOnly.FromDateTime(to.Value)
        );

        var grouped = await occ.GroupBy(o => new
            {
                Day = o.Date.DayOfWeek,
                Hour = o.StartTime.Hour,
            })
            .Select(g => new
            {
                Day = (int)g.Key.Day,
                Hour = g.Key.Hour,
                Count = g.Count(),
            })
            .ToListAsync();

        return grouped
            .Select(g => new HeatmapCellDto
            {
                DayOfWeek = g.Day,
                Hour = g.Hour,
                Bookings = g.Count,
            })
            .ToList();
    }

    public async Task<List<TopCourtDto>> GetTopCourtsAsync(
        DateTime? from,
        DateTime? to,
        int limit,
        int? branchId
    )
    {
        to ??= DateTime.UtcNow;
        from ??= to.Value.AddDays(-30);

        var query = _context
            .BookingCourtOccurrences.Include(o => o.BookingCourt)
            .ThenInclude(b => b.Court)
            .Where(o =>
                o.Date >= DateOnly.FromDateTime(from.Value)
                && o.Date <= DateOnly.FromDateTime(to.Value)
            );

        var grouped = await query
            .GroupBy(o => new { o.BookingCourt!.CourtId, Name = o.BookingCourt!.Court!.Name })
            .Select(g => new TopCourtDto
            {
                CourtId = g.Key.CourtId,
                CourtName = g.Key.Name ?? string.Empty,
                BookingCount = g.Count(),
            })
            .OrderByDescending(x => x.BookingCount)
            .Take(limit)
            .ToListAsync();

        return grouped;
    }

    public async Task<List<RecentTransactionDto>> GetRecentTransactionsAsync(
        DateTime? from,
        DateTime? to,
        int limit,
        int? branchId
    )
    {
        to ??= DateTime.UtcNow;
        from ??= to.Value.AddDays(-30);

        var payments = await _context
            .Payments.Include(p => p.Customer)
            .Where(p => p.PaymentCreatedAt >= from && p.PaymentCreatedAt <= to)
            .OrderByDescending(p => p.PaymentCreatedAt)
            .Take(limit)
            .Select(p => new RecentTransactionDto
            {
                Id = p.Id,
                Type = "payment",
                Amount = p.Amount,
                CreatedAt = p.PaymentCreatedAt,
                CustomerName = p.Customer != null ? p.Customer.FullName : string.Empty,
            })
            .ToListAsync();

        return payments;
    }
}
