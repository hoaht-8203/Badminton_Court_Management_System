using ApiApplication.Data;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.SignalR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class OrderExpiryHostedService(
    IServiceProvider services,
    ILogger<OrderExpiryHostedService> logger
) : BackgroundService
{
    private readonly IServiceProvider _services = services;
    private readonly ILogger<OrderExpiryHostedService> _logger = logger;

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

                // Find orders that are pending payment and have expired
                var expiredOrdersQuery = db.Orders.Where(o =>
                    o.Status == OrderStatus.Pending && o.CreatedAt.AddMinutes(5) <= now // 5 minutes expiry
                );

                var expiredOrderIds = await expiredOrdersQuery
                    .Select(o => o.Id)
                    .ToListAsync(stoppingToken);
                if (expiredOrderIds.Count > 0)
                {
                    // Cancel expired orders
                    var rowsOrders = await expiredOrdersQuery.ExecuteUpdateAsync(
                        setters =>
                            setters
                                .SetProperty(o => o.Status, OrderStatus.Cancelled)
                                .SetProperty(o => o.UpdatedAt, now),
                        stoppingToken
                    );

                    // Cancel corresponding payments that are still pending
                    var pendingPaymentQuery = db.Payments.Where(p =>
                        p.OrderId.HasValue
                        && expiredOrderIds.Contains(p.OrderId.Value)
                        && p.Status == PaymentStatus.PendingPayment
                    );

                    var cancelledPaymentIds = await pendingPaymentQuery
                        .Select(p => p.Id)
                        .ToListAsync(stoppingToken);

                    var rowsPayments = await pendingPaymentQuery.ExecuteUpdateAsync(
                        setters =>
                            setters
                                .SetProperty(p => p.Status, PaymentStatus.Cancelled)
                                .SetProperty(p => p.UpdatedAt, now),
                        stoppingToken
                    );

                    // Update corresponding BookingCourtOccurrence status back to CheckedIn
                    var occurrenceQuery = db.BookingCourtOccurrences.Where(o =>
                        expiredOrderIds.Contains(o.BookingCourtId) // Assuming we can link via booking
                        && o.Status == BookingCourtOccurrenceStatus.CheckedIn
                    );

                    var rowsOccurrences = await occurrenceQuery.ExecuteUpdateAsync(
                        setters =>
                            setters
                                .SetProperty(o => o.Status, BookingCourtOccurrenceStatus.CheckedIn)
                                .SetProperty(o => o.UpdatedAt, now),
                        stoppingToken
                    );

                    _logger.LogInformation(
                        "Expired {Count} pending orders and {PaymentCount} payments. RowsAffectedOrders={RowsO}, RowsAffectedPayments={RowsP}, RowsAffectedOccurrences={RowsOcc}. Ids=[{Ids}]",
                        expiredOrderIds.Count,
                        cancelledPaymentIds.Count,
                        rowsOrders,
                        rowsPayments,
                        rowsOccurrences,
                        string.Join(",", expiredOrderIds)
                    );

                    // Broadcast real-time notifications
                    await hub.Clients.All.SendAsync(
                        "ordersExpired",
                        expiredOrderIds,
                        stoppingToken
                    );
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
                _logger.LogError(ex, "Error expiring order holds");
            }

            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken); // Check every 30 seconds
        }
    }
}
