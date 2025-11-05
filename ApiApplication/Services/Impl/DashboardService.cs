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

        // Revenue: sum of paid cashflows (include other income types, not just payments)
        var totalRevenue =
            await _context
                .Cashflows.Where(c =>
                    c.Status == Entities.Shared.CashFlowStatus.Paid
                    && !c.IsPayment
                    && c.Time >= from.Value
                    && c.Time <= to.Value
                )
                .SumAsync(c => (decimal?)c.Value) ?? 0m;

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
        // Normalize granularity (default to month)
        var g = (granularity ?? "month").Trim().ToLowerInvariant();

        // If caller didn't provide from/to, choose sensible defaults per granularity
        var nowUtc = DateTime.UtcNow;
        if (!from.HasValue && !to.HasValue)
        {
            if (g == "month")
            {
                // last 10 months (including current month)
                var end = new DateTime(
                    nowUtc.Year,
                    nowUtc.Month,
                    DateTime.DaysInMonth(nowUtc.Year, nowUtc.Month),
                    23,
                    59,
                    59
                );
                var startMonth = end.AddMonths(-9);
                var start = new DateTime(startMonth.Year, startMonth.Month, 1);
                from = start;
                to = end;
            }
            else if (g == "quarter")
            {
                // last 10 quarters (including current quarter)
                var currentQuarterStart = new DateTime(
                    nowUtc.Year,
                    ((nowUtc.Month - 1) / 3) * 3 + 1,
                    1
                );
                var startQuarter = currentQuarterStart.AddMonths(-9 * 3);
                from = new DateTime(startQuarter.Year, startQuarter.Month, 1);
                // end at end of current quarter
                var quarterEnd = currentQuarterStart.AddMonths(3).AddTicks(-1);
                to = quarterEnd;
            }
            else
            {
                to = nowUtc;
                from = to.Value.AddDays(-30);
            }
        }

        // If either from/to is still missing, fill sensible defaults relative to the other
        if (!from.HasValue)
        {
            var toRef = to ?? DateTime.UtcNow;
            if (g == "month")
                from = new DateTime(toRef.AddMonths(-9).Year, toRef.AddMonths(-9).Month, 1);
            else if (g == "quarter")
                from = new DateTime(toRef.AddMonths(-9 * 3).Year, toRef.AddMonths(-9 * 3).Month, 1);
            else
                from = toRef.AddDays(-30);
        }

        if (!to.HasValue)
        {
            // default to now (UTC)
            to = DateTime.UtcNow;
        }

        // Ensure UTC kinds for parameters
        if (to.HasValue)
            to = DateTime.SpecifyKind(to.Value, DateTimeKind.Utc);
        if (from.HasValue)
            from = DateTime.SpecifyKind(from.Value, DateTimeKind.Utc);

        // Use cashflows (income/expenses) to compute revenue and profit
        var q = _context.Cashflows.Where(c =>
            c.Status == Entities.Shared.CashFlowStatus.Paid
            && c.Time >= from.Value
            && c.Time <= to.Value
        );

        if (string.Equals(g, "quarter", StringComparison.OrdinalIgnoreCase))
        {
            // group by quarter
            var grouped = await q.GroupBy(c => new
                {
                    c.Time.Year,
                    Quarter = ((c.Time.Month - 1) / 3) + 1,
                })
                .Select(g => new
                {
                    Year = g.Key.Year,
                    Quarter = g.Key.Quarter,
                    Revenue = g.Where(x => x.IsPayment).Sum(x => (decimal?)x.Value) ?? 0m,
                    Expense = g.Where(x => !x.IsPayment).Sum(x => (decimal?)x.Value) ?? 0m,
                })
                .ToListAsync();

            var series = new List<RevenuePointDto>();

            // cursor starts at beginning of the from quarter
            var cursorQuarterStart = new DateTime(
                from.Value.Year,
                ((from.Value.Month - 1) / 3) * 3 + 1,
                1
            );
            var quarters =
                (
                    (to.Value.Year - cursorQuarterStart.Year) * 12
                    + (to.Value.Month - cursorQuarterStart.Month)
                ) / 3
                + 1;
            var qcount = Math.Max(1, quarters);
            for (int i = 0; i < qcount; i++)
            {
                var dt = cursorQuarterStart.AddMonths(i * 3);
                var quarterNumber = ((dt.Month - 1) / 3) + 1;
                var match = grouped.FirstOrDefault(x =>
                    x.Year == dt.Year && x.Quarter == quarterNumber
                );
                var revenue = match?.Revenue ?? 0m;
                var expense = match?.Expense ?? 0m;
                series.Add(
                    new RevenuePointDto
                    {
                        Period = DateTime.SpecifyKind(
                            new DateTime(dt.Year, dt.Month, 1),
                            DateTimeKind.Utc
                        ),
                        Value = Math.Round(revenue, 2),
                        Profit = Math.Round(revenue - expense, 2),
                        Label = $"Q{quarterNumber}/{dt.Year}",
                    }
                );
            }

            if (series.Count > 10)
                series = series.Skip(series.Count - 10).ToList();
            else if (series.Count < 10)
            {
                var need = 10 - series.Count;
                for (int i = 1; i <= need; i++)
                {
                    var dtPrev = cursorQuarterStart.AddMonths(-3 * i);
                    var quarterNumberPrev = ((dtPrev.Month - 1) / 3) + 1;
                    series.Insert(
                        0,
                        new RevenuePointDto
                        {
                            Period = DateTime.SpecifyKind(
                                new DateTime(dtPrev.Year, dtPrev.Month, 1),
                                DateTimeKind.Utc
                            ),
                            Value = 0m,
                            Profit = 0m,
                            Label = $"Q{quarterNumberPrev}/{dtPrev.Year}",
                        }
                    );
                }
            }

            return series;
        }
        else
        {
            // treat anything not 'quarter' as month aggregation
            var grouped = await q.GroupBy(c => new { c.Time.Year, c.Time.Month })
                .Select(gp => new
                {
                    Year = gp.Key.Year,
                    Month = gp.Key.Month,
                    Revenue = gp.Where(x => x.IsPayment).Sum(x => (decimal?)x.Value) ?? 0m,
                    Expense = gp.Where(x => !x.IsPayment).Sum(x => (decimal?)x.Value) ?? 0m,
                })
                .ToListAsync();

            var series = new List<RevenuePointDto>();
            var cursor = new DateTime(from.Value.Year, from.Value.Month, 1);
            var months = ((to.Value.Year - cursor.Year) * 12 + (to.Value.Month - cursor.Month)) + 1;
            var count = Math.Max(1, months);
            for (int i = 0; i < count; i++)
            {
                var dt = cursor.AddMonths(i);
                var match = grouped.FirstOrDefault(x => x.Year == dt.Year && x.Month == dt.Month);
                var revenue = match?.Revenue ?? 0m;
                var expense = match?.Expense ?? 0m;
                series.Add(
                    new RevenuePointDto
                    {
                        Period = DateTime.SpecifyKind(
                            new DateTime(dt.Year, dt.Month, 1),
                            DateTimeKind.Utc
                        ),
                        Value = Math.Round(revenue, 2),
                        Profit = Math.Round(revenue - expense, 2),
                        Label = $"T{dt.Month}/{dt.Year}",
                    }
                );
            }

            if (series.Count > 10)
                series = series.Skip(series.Count - 10).ToList();
            else if (series.Count < 10)
            {
                var need = 10 - series.Count;
                for (int i = 1; i <= need; i++)
                {
                    var dtPrev = cursor.AddMonths(-i);
                    series.Insert(
                        0,
                        new RevenuePointDto
                        {
                            Period = DateTime.SpecifyKind(
                                new DateTime(dtPrev.Year, dtPrev.Month, 1),
                                DateTimeKind.Utc
                            ),
                            Value = 0m,
                            Profit = 0m,
                            Label = $"T{dtPrev.Month}/{dtPrev.Year}",
                        }
                    );
                }
            }

            return series;
        }
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

    public async Task<List<MonthlyCustomerTypeDto>> GetMonthlyCustomerTypeAsync(
        DateTime? from,
        DateTime? to,
        int? branchId
    )
    {
        // Default window: last 6 months
        to ??= DateTime.UtcNow;
        from ??= to.Value.AddMonths(-5); // include current month => 6 months total

        var start = new DateTime(from.Value.Year, from.Value.Month, 1);
        var end = new DateTime(
            to.Value.Year,
            to.Value.Month,
            DateTime.DaysInMonth(to.Value.Year, to.Value.Month),
            23,
            59,
            59
        );

        // Ensure DateTimes have UTC kind so Npgsql can map to timestamptz parameters
        start = DateTime.SpecifyKind(start, DateTimeKind.Utc);
        end = DateTime.SpecifyKind(end, DateTimeKind.Utc);

        var results = new List<MonthlyCustomerTypeDto>();

        var monthCursor = new DateTime(start.Year, start.Month, 1);
        while (monthCursor <= end)
        {
            var monthStart = monthCursor;
            var monthEnd = monthStart.AddMonths(1).AddTicks(-1);

            monthStart = DateTime.SpecifyKind(monthStart, DateTimeKind.Utc);
            monthEnd = DateTime.SpecifyKind(monthEnd, DateTimeKind.Utc);

            // get distinct customer ids who had at least one occurrence in the month
            var customerIds = await _context
                .BookingCourtOccurrences.Where(o =>
                    o.Date >= DateOnly.FromDateTime(monthStart)
                    && o.Date <= DateOnly.FromDateTime(monthEnd)
                )
                .Select(o => o.BookingCourt.CustomerId)
                .Distinct()
                .ToListAsync();

            var totalCustomers = customerIds.Count;

            int fixedCustomers = 0;
            if (customerIds.Any())
            {
                fixedCustomers = await _context
                    .UserMemberships.Where(um =>
                        customerIds.Contains(um.CustomerId)
                        && um.IsActive
                        && um.StartDate <= monthEnd
                        && um.EndDate >= monthStart
                    )
                    .Select(um => um.CustomerId)
                    .Distinct()
                    .CountAsync();
            }

            var walkin = Math.Max(0, totalCustomers - fixedCustomers);

            results.Add(
                new MonthlyCustomerTypeDto
                {
                    Period = monthStart,
                    FixedCustomers = fixedCustomers,
                    WalkinCustomers = walkin,
                }
            );

            monthCursor = monthCursor.AddMonths(1);
        }

        return results;
    }
}
