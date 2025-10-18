using System;
using Microsoft.Extensions.DependencyInjection;

namespace ApiApplication.Services.BackgroundServices;

public class UpdatePayrollService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<UpdatePayrollService> _logger;

    public UpdatePayrollService(
        IServiceScopeFactory scopeFactory,
        ILogger<UpdatePayrollService> logger
    )
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var now = DateTime.Now;
        var nextRun = DateTime.Today.AddDays(1).AddHours(0); // Chạy vào lúc 00:00 hàng ngày
        var delay = nextRun - now;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                _logger.LogInformation("UpdatePayrollService is starting.");

                await Task.Delay(delay, stoppingToken);

                _logger.LogInformation(
                    "UpdatePayrollService is running at: {time}",
                    DateTimeOffset.Now
                );

                // Resolve the scoped IPayrollService from a scope each time we need it
                using (var scope = _scopeFactory.CreateScope())
                {
                    var payrollService =
                        scope.ServiceProvider.GetRequiredService<IPayrollService>();
                    await payrollService.RefreshPayrollAsync();
                }
            }
            catch (TaskCanceledException)
            {
                // Dịch vụ bị hủy, thoát khỏi vòng lặp
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while executing UpdatePayrollService.");
            }
        }
    }
}
