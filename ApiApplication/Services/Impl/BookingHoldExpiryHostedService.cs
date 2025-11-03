using ApiApplication.Data;
using ApiApplication.Entities.Shared;
using ApiApplication.SignalR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class BookingHoldExpiryHostedService(
    IServiceProvider services,
    ILogger<BookingHoldExpiryHostedService> logger
) : BackgroundService
{
    private readonly IServiceProvider _services = services;
    private readonly ILogger<BookingHoldExpiryHostedService> _logger = logger;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var hub = scope.ServiceProvider.GetRequiredService<IHubContext<BookingHub>>();
                var now = DateTime.UtcNow;

                var expiredQuery = db.BookingCourts.Where(b =>
                    b.Status == BookingCourtStatus.PendingPayment
                    && b.HoldExpiresAtUtc != null
                    && b.HoldExpiresAtUtc <= now
                    // Exclude bookings that have active orders (extended payments)
                    && !db.Orders.Any(o => o.BookingId == b.Id && o.Status == "Pending")
                );

                var expiredIds = await expiredQuery.Select(b => b.Id).ToListAsync(stoppingToken);
                if (expiredIds.Count > 0)
                {
                    var rowsBookings = await expiredQuery.ExecuteUpdateAsync(
                        setters =>
                            setters
                                .SetProperty(b => b.Status, BookingCourtStatus.Cancelled)
                                .SetProperty(b => b.UpdatedAt, now),
                        stoppingToken
                    );

                    // Cancel corresponding BookingCourtOccurrences
                    var expiredOccurrencesQuery = db.BookingCourtOccurrences.Where(o =>
                        expiredIds.Contains(o.BookingCourtId)
                        && o.Status == BookingCourtOccurrenceStatus.PendingPayment
                    );

                    var rowsOccurrences = await expiredOccurrencesQuery.ExecuteUpdateAsync(
                        setters =>
                            setters
                                .SetProperty(o => o.Status, BookingCourtOccurrenceStatus.Cancelled)
                                .SetProperty(o => o.UpdatedAt, now),
                        stoppingToken
                    );

                    // Cancel payments tied to these bookings that are still pending
                    var pendingPaymentQuery = db.Payments.Where(i =>
                        expiredIds.Contains(i.BookingId!.Value)
                        && i.Status == PaymentStatus.PendingPayment
                    );

                    var cancelledPaymentIds = await pendingPaymentQuery
                        .Select(i => i.Id)
                        .ToListAsync(stoppingToken);

                    var rowsPayments = await pendingPaymentQuery.ExecuteUpdateAsync(
                        setters =>
                            setters
                                .SetProperty(i => i.Status, PaymentStatus.Cancelled)
                                .SetProperty(i => i.UpdatedAt, now),
                        stoppingToken
                    );

                    _logger.LogInformation(
                        "Expired {Count} pending bookings and {OccurrenceCount} occurrences. RowsAffectedBookings={RowsB}, RowsAffectedOccurrences={RowsO}, RowsAffectedPayments={RowsP}. Ids=[{Ids}]",
                        expiredIds.Count,
                        rowsOccurrences,
                        rowsBookings,
                        rowsOccurrences,
                        rowsPayments,
                        string.Join(",", expiredIds)
                    );

                    // Broadcast real-time notifications
                    await hub.Clients.All.SendAsync("bookingsExpired", expiredIds, stoppingToken);
                    if (cancelledPaymentIds.Count > 0)
                    {
                        await hub.Clients.All.SendAsync(
                            "paymentsCancelled",
                            cancelledPaymentIds,
                            stoppingToken
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error expiring booking holds");
            }

            await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);
        }
    }
}
