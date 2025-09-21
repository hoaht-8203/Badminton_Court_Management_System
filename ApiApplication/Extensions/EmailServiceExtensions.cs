using System;
using ApiApplication.Services;

namespace ApiApplication.Extensions;

public static class EmailServiceExtensions
{
    public static void SendEmailFireAndForget<T>(
        this IEmailService emailService,
        Func<Task> emailTask,
        ILogger<T> logger,
        string email
    )
    {
        _ = Task.Run(async () =>
        {
            try
            {
                await emailTask();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to send email to {Email}", email);
            }
        });
    }
}
