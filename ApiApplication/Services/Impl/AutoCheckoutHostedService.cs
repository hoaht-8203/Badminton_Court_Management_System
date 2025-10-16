using ApiApplication.Data;
using ApiApplication.Entities.Shared;
using ApiApplication.SignalR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class AutoCheckoutHostedService(
    IServiceProvider serviceProvider,
    ILogger<AutoCheckoutHostedService> logger,
    IHubContext<BookingHub> hub
) : BackgroundService
{
    private readonly IServiceProvider _sp = serviceProvider;
    private readonly ILogger<AutoCheckoutHostedService> _logger = logger;
    private readonly IHubContext<BookingHub> _hub = hub;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var now = DateTime.Now;
                var today = DateOnly.FromDateTime(now);
                var nowTime = TimeOnly.FromDateTime(now);

                // Only today's bookings
                // Overdue and never checked in (still Active due to deposit) but time window fully passed -> mark NoShow
                // Do NOT auto-complete CheckedIn bookings; checkout must be manual
                var overdueActiveToNoShow = await db
                    .BookingCourts.Where(b =>
                        b.Status == BookingCourtStatus.Active
                        && b.StartDate <= today
                        && today <= b.EndDate
                        && b.EndTime < nowTime
                    )
                    .ToListAsync(stoppingToken);

                var noShowCount = 0;
                var updatedIds = new List<Guid>();
                foreach (var b in overdueActiveToNoShow)
                {
                    b.Status = BookingCourtStatus.NoShow;
                    noShowCount++;
                    var court = await db.Courts.FirstOrDefaultAsync(
                        c => c.Id == b.CourtId,
                        stoppingToken
                    );
                    if (court != null)
                        court.Status = CourtStatus.Active;

                    updatedIds.Add(b.Id);
                }

                if (overdueActiveToNoShow.Count > 0)
                {
                    await db.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation(
                        "AutoCheckout: Completed={CompletedCount}, NoShow={NoShowCount}",
                        0,
                        noShowCount
                    );

                    // Realtime notify UI for each updated booking
                    foreach (var id in updatedIds)
                    {
                        try
                        {
                            await _hub.Clients.All.SendAsync(
                                "bookingUpdated",
                                id,
                                cancellationToken: stoppingToken
                            );
                        }
                        catch
                        { /* ignore transient signalr errors */
                        }
                    }
                }
                // else: nothing to do this tick
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AutoCheckoutHostedService error");
            }

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}
