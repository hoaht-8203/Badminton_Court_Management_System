using ApiApplication.Data;
using ApiApplication.Entities.Shared;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class MembershipPaymentExpiryHostedService(
    IServiceProvider services,
    IConfiguration configuration,
    ILogger<MembershipPaymentExpiryHostedService> logger
) : BackgroundService
{
    private readonly IServiceProvider _services = services;
    private readonly IConfiguration _configuration = configuration;
    private readonly ILogger<MembershipPaymentExpiryHostedService> _logger = logger;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                var nowUtc = DateTime.UtcNow;
                var holdMinutes = _configuration.GetValue<int?>("Booking:HoldMinutes") ?? 5;

                // 1) Hủy tất cả payment đã quá hạn đến thời điểm hiện tại
                var expiredQuery = db
                    .Payments.Where(p =>
                        p.UserMembershipId != null
                        && p.Status == PaymentStatus.PendingPayment
                        && p.CreatedAt.AddMinutes(holdMinutes) <= nowUtc
                    )
                    .Include(p => p.UserMembership);

                var expired = await expiredQuery.ToListAsync(stoppingToken);
                if (expired.Count > 0)
                {
                    foreach (var pay in expired)
                    {
                        pay.Status = PaymentStatus.Cancelled;
                        pay.UpdatedAt = nowUtc;

                        if (
                            pay.UserMembership != null
                            && pay.UserMembership.Status == "PendingPayment"
                        )
                        {
                            pay.UserMembership.Status = "Cancelled";
                            pay.UserMembership.IsActive = false;
                            pay.UserMembership.UpdatedAt = nowUtc;
                        }
                    }
                    await db.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation(
                        "MembershipPaymentExpiry: Cancelled {Count} pending membership payments",
                        expired.Count
                    );
                }

                // 2) Tìm thời điểm hết hạn gần nhất tiếp theo
                var nextExpiry = await db
                    .Payments.Where(p =>
                        p.UserMembershipId != null && p.Status == PaymentStatus.PendingPayment
                    )
                    .Select(p => p.CreatedAt.AddMinutes(holdMinutes))
                    .OrderBy(t => t)
                    .FirstOrDefaultAsync(stoppingToken);

                // 3) Tính thời gian ngủ động: nếu không có payment → ngủ mặc định; nếu có → ngủ đến sát thời điểm hết hạn
                if (nextExpiry == default)
                {
                    await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken); // không có gì chờ, ngủ ngắn
                }
                else
                {
                    nowUtc = DateTime.UtcNow;
                    var delay = nextExpiry - nowUtc;
                    if (delay < TimeSpan.FromMilliseconds(250)) // tránh vòng busy
                        delay = TimeSpan.FromMilliseconds(250);

                    // Giới hạn tối đa để vẫn tự kiểm tra định kỳ
                    var maxSleep = TimeSpan.FromMinutes(2);
                    if (delay > maxSleep)
                        delay = maxSleep;

                    await Task.Delay(delay, stoppingToken);
                }
            }
            catch (TaskCanceledException)
            { /* ignore on shutdown */
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error expiring membership payments");
                // backoff nhỏ nếu lỗi
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }
}
