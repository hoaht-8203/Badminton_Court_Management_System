using System;
using ApiApplication.Dtos;
using ApiApplication.Entities;
using ApiApplication.Template;

namespace ApiApplication.Services;

public interface IEmailService
{
    Task<EmailResponse> SendEmailAsync(EmailRequest emailRequest);

    Task<EmailResponse> SendTemplateEmailAsync(EmailTemplateRequest templateRequest);

    Task<EmailResponse> SendWelcomeEmailAsync(SendWelcomeEmailAsyncRequest request);

    Task<EmailResponse> TestEmailConfigurationAsync();
}
