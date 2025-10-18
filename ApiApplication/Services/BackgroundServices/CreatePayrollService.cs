using System;
using ApiApplication.Dtos.Payroll;
using Cronos;
using Microsoft.Extensions.DependencyInjection;

namespace ApiApplication.Services.BackgroundServices;

public class CreatePayrollService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<CreatePayrollService> _logger;
    private readonly CronExpression _cronExpression = CronExpression.Parse("0 0 1 * ?"); // Chạy vào lúc 00:00 ngày 1 hàng tháng

    public CreatePayrollService(
        IServiceScopeFactory scopeFactory,
        ILogger<CreatePayrollService> logger
    )
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                _logger.LogInformation("CreatePayrollService is starting.");

                var now = DateTimeOffset.Now;
                var nextOccurrence = _cronExpression.GetNextOccurrence(now, TimeZoneInfo.Local);
                if (nextOccurrence.HasValue)
                {
                    var delay = nextOccurrence.Value - now;
                    await Task.Delay(delay, stoppingToken);

                    _logger.LogInformation(
                        "CreatePayrollService is running at: {time}",
                        DateTimeOffset.Now
                    );

                    var request = new CreatePayrollRequest
                    {
                        Name =
                            $"Bảng lương tháng {DateTimeOffset.Now.AddMonths(-1).Month}/{DateTimeOffset.Now.AddMonths(-1).Year}",
                        StartDate = new DateOnly(
                            DateTimeOffset.Now.AddMonths(-1).Year,
                            DateTimeOffset.Now.AddMonths(-1).Month,
                            1
                        ),
                        EndDate = new DateOnly(
                            DateTimeOffset.Now.Year,
                            DateTimeOffset.Now.Month,
                            1
                        ).AddDays(-1),
                        Note = "Tự động tạo bởi hệ thống",
                    };

                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var payrollService = scope.ServiceProvider.GetRequiredService<IPayrollService>();
                        await payrollService.CreatePayrollAsync(request);
                    }
                }
            }
            catch (TaskCanceledException)
            {
                // Dịch vụ bị hủy, thoát khỏi vòng lặp
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while executing CreatePayrollService.");
            }
        }
    }
}
