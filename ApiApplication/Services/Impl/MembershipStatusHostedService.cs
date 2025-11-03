using ApiApplication.Data;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class MembershipStatusHostedService(
    IServiceProvider serviceProvider,
    ILogger<MembershipStatusHostedService> logger
) : BackgroundService
{
    private readonly IServiceProvider _sp = serviceProvider;
    private readonly ILogger<MembershipStatusHostedService> _logger = logger;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                var nowUtc = DateTime.UtcNow;

                // Activate memberships that are paid and within exact datetime range
                var toActivate = await db
                    .UserMemberships.Where(um =>
                        um.Status == "Paid"
                        && um.StartDate <= nowUtc
                        && nowUtc <= um.EndDate
                        && um.IsActive == false
                    )
                    .ToListAsync(stoppingToken);

                foreach (var um in toActivate)
                {
                    um.IsActive = true;
                }

                // Deactivate memberships that are expired (past exact EndDate time)
                var toDeactivate = await db
                    .UserMemberships.Where(um => um.IsActive == true && um.EndDate < nowUtc)
                    .ToListAsync(stoppingToken);

                foreach (var um in toDeactivate)
                {
                    um.IsActive = false;
                }

                if (toActivate.Count > 0 || toDeactivate.Count > 0)
                {
                    await db.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation(
                        "MembershipStatusHostedService: Activated {Activated}, Deactivated {Deactivated}",
                        toActivate.Count,
                        toDeactivate.Count
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "MembershipStatusHostedService error");
            }

            // Run every 1 minute (can be adjusted to 1 hour/day depending on needs)
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}
