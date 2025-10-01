using ApiApplication.Data;
using ApiApplication.Entities.Shared;
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
                var now = DateTime.UtcNow;

                var expiredQuery = db.BookingCourts.Where(b =>
                    b.Status == BookingCourtStatus.PendingPayment
                    && b.HoldExpiresAtUtc != null
                    && b.HoldExpiresAtUtc <= now
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

                    // Cancel payments tied to these bookings that are still pending
                    var rowsPayments = await db
                        .Payments.Where(i =>
                            expiredIds.Contains(i.BookingId)
                            && i.Status == PaymentStatus.PendingPayment
                        )
                        .ExecuteUpdateAsync(
                            setters =>
                                setters
                                    .SetProperty(i => i.Status, PaymentStatus.Cancelled)
                                    .SetProperty(i => i.UpdatedAt, now),
                            stoppingToken
                        );

                    _logger.LogInformation(
                        "Expired {Count} pending bookings. RowsAffectedBookings={RowsB}, RowsAffectedPayments={RowsP}. Ids=[{Ids}]",
                        expiredIds.Count,
                        rowsBookings,
                        rowsPayments,
                        string.Join(",", expiredIds)
                    );
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
