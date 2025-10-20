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

                // Handle today's occurrences
                // Overdue and never checked in (still Active due to deposit) but time window fully passed -> mark NoShow
                // Do NOT auto-complete CheckedIn occurrences; checkout must be manual
                var overdueActiveToNoShow = await db
                    .BookingCourtOccurrences.Where(o =>
                        o.Status == BookingCourtOccurrenceStatus.Active
                        && o.Date == today
                        && o.EndTime < nowTime
                    )
                    .Include(o => o.BookingCourt)
                    .ToListAsync(stoppingToken);

                var noShowCount = 0;
                var updatedBookingIds = new List<Guid>();
                var updatedOccurrenceIds = new List<Guid>();

                foreach (var occurrence in overdueActiveToNoShow)
                {
                    occurrence.Status = BookingCourtOccurrenceStatus.NoShow;
                    noShowCount++;

                    // Free up court on no-show
                    var court = await db.Courts.FirstOrDefaultAsync(
                        c => c.Id == occurrence.BookingCourt!.CourtId,
                        stoppingToken
                    );
                    if (court != null)
                        court.Status = CourtStatus.Active;

                    updatedBookingIds.Add(occurrence.BookingCourtId);
                    updatedOccurrenceIds.Add(occurrence.Id);
                }

                if (overdueActiveToNoShow.Count > 0)
                {
                    await db.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation(
                        "AutoCheckout: Completed={CompletedCount}, NoShow={NoShowCount}",
                        0,
                        noShowCount
                    );

                    // Realtime notify UI for each updated booking and occurrence
                    foreach (var bookingId in updatedBookingIds.Distinct())
                    {
                        try
                        {
                            await _hub.Clients.All.SendAsync(
                                "bookingUpdated",
                                bookingId,
                                cancellationToken: stoppingToken
                            );
                        }
                        catch
                        { /* ignore transient signalr errors */
                        }
                    }

                    foreach (var occurrenceId in updatedOccurrenceIds)
                    {
                        try
                        {
                            await _hub.Clients.All.SendAsync(
                                "occurrenceNoShow",
                                occurrenceId,
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
