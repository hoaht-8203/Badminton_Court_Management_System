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
                var now = DateTime.UtcNow.AddHours(7);
                var today = DateOnly.FromDateTime(now);
                var nowTime = TimeOnly.FromDateTime(now);

                System.Console.WriteLine("--------------------------------");
                System.Console.WriteLine("now: " + now);
                System.Console.WriteLine("today: " + today);
                System.Console.WriteLine("nowTime: " + nowTime);
                System.Console.WriteLine("--------------------------------");

                var overdueToNoShow = await db
                    .BookingCourtOccurrences.Where(o =>
                        (
                            o.Status == BookingCourtOccurrenceStatus.Active
                            || o.Status == BookingCourtOccurrenceStatus.PendingPayment
                        )
                        && (
                            // Quá hạn trong ngày hiện tại: đã qua giờ kết thúc
                            (o.Date == today && o.EndTime < nowTime)
                            // Hoặc các ngày trước đó: coi như đã quá hạn
                            || (o.Date < today)
                        )
                    )
                    .Include(o => o.BookingCourt)
                    .ToListAsync(stoppingToken);

                var noShowCount = 0;
                var updatedBookingIds = new List<Guid>();
                var updatedOccurrenceIds = new List<Guid>();

                foreach (var occurrence in overdueToNoShow)
                {
                    var oldStatus = occurrence.Status;
                    occurrence.Status = BookingCourtOccurrenceStatus.NoShow;
                    noShowCount++;

                    _logger.LogInformation(
                        "Auto NoShow: Occurrence {OccurrenceId} (Booking {BookingId}) - {Date} {StartTime}-{EndTime} changed from {OldStatus} to NoShow",
                        occurrence.Id,
                        occurrence.BookingCourtId,
                        occurrence.Date,
                        occurrence.StartTime,
                        occurrence.EndTime,
                        oldStatus
                    );

                    // Free up court on no-show
                    var court = await db.Courts.FirstOrDefaultAsync(
                        c => c.Id == occurrence.BookingCourt!.CourtId,
                        stoppingToken
                    );
                    if (court != null)
                    {
                        court.Status = CourtStatus.Active;
                        _logger.LogInformation("Court {CourtId} released due to NoShow", court.Id);
                    }

                    updatedBookingIds.Add(occurrence.BookingCourtId);
                    updatedOccurrenceIds.Add(occurrence.Id);
                }

                if (overdueToNoShow.Count > 0)
                {
                    await db.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation(
                        "AutoCheckout Summary: Processed {TotalCount} overdue occurrences, marked {NoShowCount} as NoShow, released {CourtCount} courts",
                        overdueToNoShow.Count,
                        noShowCount,
                        overdueToNoShow.Count
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
                else
                {
                    _logger.LogDebug(
                        "AutoCheckout: No overdue occurrences found at {CurrentTime}",
                        now
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AutoCheckoutHostedService error");
            }

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}
