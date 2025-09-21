using System;
using System.Net;
using System.Text;
using ApiApplication.Dtos;
using ApiApplication.Entities;
using ApiApplication.Options;
using ApiApplication.Template;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace ApiApplication.Services.Impl;

public class EmailService : IEmailService
{
    private readonly EmailOptions _emailOptions;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailOptions> emailOptions, ILogger<EmailService> logger)
    {
        _emailOptions = emailOptions.Value;
        _logger = logger;
    }

    public async Task<EmailResponse> SendEmailAsync(EmailRequest emailRequest)
    {
        try
        {
            using var smtpClient = CreateSmtpClient();
            var mailMessage = CreateMailMessage(emailRequest);

            await smtpClient.SendAsync(mailMessage);
            await smtpClient.DisconnectAsync(true);

            _logger.LogInformation("Email sent successfully to {To}", emailRequest.To);

            return new EmailResponse
            {
                Success = true,
                Message = "Email sent successfully",
                SentAt = DateTime.UtcNow,
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", emailRequest.To);
            return new EmailResponse
            {
                Success = false,
                Message = "Failed to send email",
                Errors = new List<string> { ex.Message },
                SentAt = DateTime.UtcNow,
            };
        }
    }

    public async Task<EmailResponse> SendTemplateEmailAsync(EmailTemplateRequest templateRequest)
    {
        try
        {
            var emailRequest = await EmailTemplateHTML.CreateEmailFromTemplate(templateRequest);
            return await SendEmailAsync(emailRequest);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send template email to {To}", templateRequest.To);
            return new EmailResponse
            {
                Success = false,
                Message = "Failed to send template email",
                Errors = new List<string> { ex.Message },
                SentAt = DateTime.UtcNow,
            };
        }
    }

    public async Task<EmailResponse> SendWelcomeEmailAsync(SendWelcomeEmailAsyncRequest request)
    {
        var templateRequest = new EmailTemplateRequest
        {
            To = request.To,
            ToName = request.ToName,
            TemplateType = EmailTemplateType.Welcome,
            TemplateData = new Dictionary<string, string>
            {
                { "FullName", request.FullName },
                { "UserName", request.UserName },
                { "Email", request.Email },
                { "Password", request.Password },
                { "SystemLink", "https://app.hethongquanlysancaulong.com/login" },
            },
        };

        return await SendTemplateEmailAsync(templateRequest);
    }

    public async Task<EmailResponse> TestEmailConfigurationAsync()
    {
        try
        {
            var testEmail = new EmailRequest
            {
                To = _emailOptions.FromEmail,
                ToName = "Test",
                Subject = "Email Configuration Test",
                Body = "This is a test email to verify email configuration.",
                IsHtml = false,
            };

            return await SendEmailAsync(testEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Email configuration test failed");
            return new EmailResponse
            {
                Success = false,
                Message = "Email configuration test failed",
                Errors = new List<string> { ex.Message },
                SentAt = DateTime.UtcNow,
            };
        }
    }

    private SmtpClient CreateSmtpClient()
    {
        var smtpClient = new SmtpClient();

        // Set timeout
        smtpClient.Timeout = _emailOptions.Timeout;

        try
        {
            // Connect to SMTP server with appropriate security option
            var secureSocketOptions = _emailOptions.EnableSsl
                ? SecureSocketOptions.StartTls
                : SecureSocketOptions.None;

            _logger.LogInformation(
                "Connecting to SMTP server: {Server}:{Port} with SSL: {EnableSsl}",
                _emailOptions.SmtpServer,
                _emailOptions.SmtpPort,
                _emailOptions.EnableSsl
            );

            smtpClient.Connect(
                _emailOptions.SmtpServer,
                _emailOptions.SmtpPort,
                secureSocketOptions
            );

            // Authenticate if credentials are provided and authentication is required
            if (
                _emailOptions.RequireAuthentication
                && !_emailOptions.UseDefaultCredentials
                && !string.IsNullOrEmpty(_emailOptions.Username)
            )
            {
                _logger.LogInformation(
                    "Attempting to authenticate with username: {Username}",
                    _emailOptions.Username
                );
                smtpClient.Authenticate(_emailOptions.Username, _emailOptions.Password);
                _logger.LogInformation("SMTP authentication successful");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to connect or authenticate with SMTP server: {Server}:{Port}. "
                    + "Please check your credentials and ensure you're using an App Password for Gmail.",
                _emailOptions.SmtpServer,
                _emailOptions.SmtpPort
            );
            throw;
        }

        return smtpClient;
    }

    private MimeMessage CreateMailMessage(EmailRequest emailRequest)
    {
        var fromEmail = !string.IsNullOrEmpty(emailRequest.From)
            ? emailRequest.From
            : _emailOptions.FromEmail;
        var fromName = !string.IsNullOrEmpty(emailRequest.FromName)
            ? emailRequest.FromName
            : _emailOptions.FromName;

        var message = new MimeMessage();

        // Set From
        message.From.Add(new MailboxAddress(fromName, fromEmail));

        // Set To
        message.To.Add(new MailboxAddress(emailRequest.ToName ?? emailRequest.To, emailRequest.To));

        // Set Subject
        message.Subject = emailRequest.Subject;

        // Set Body
        var bodyBuilder = new BodyBuilder();
        if (emailRequest.IsHtml)
        {
            bodyBuilder.HtmlBody = emailRequest.Body;
        }
        else
        {
            bodyBuilder.TextBody = emailRequest.Body;
        }

        // Add attachments
        if (emailRequest.Attachments != null)
        {
            foreach (var attachment in emailRequest.Attachments)
            {
                bodyBuilder.Attachments.Add(
                    attachment.FileName,
                    attachment.Content,
                    ContentType.Parse(attachment.ContentType)
                );
            }
        }

        message.Body = bodyBuilder.ToMessageBody();

        return message;
    }
}
