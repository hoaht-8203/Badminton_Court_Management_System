using ApiApplication.Dtos.Email;
using ApiApplication.Template;

namespace ApiApplication.Services;

public interface IEmailService
{
    Task<EmailResponse> SendEmailAsync(EmailRequest emailRequest);

    Task<EmailResponse> SendTemplateEmailAsync(EmailTemplateRequest templateRequest);

    Task<EmailResponse> SendWelcomeEmailAsync(SendWelcomeEmailAsyncRequest request);

    Task<EmailResponse> SendForgotPasswordEmailAsync(SendForgotPasswordEmailAsyncRequest request);

    Task<EmailResponse> SendNewPasswordEmailAsync(SendNewPasswordEmailAsyncRequest request);

    Task<EmailResponse> SendVerifyEmailAsync(SendVerifyEmailAsyncRequest request);

    Task<EmailResponse> SendPaymentRequestEmailAsync(SendPaymentRequestEmailAsyncRequest request);

    Task<EmailResponse> SendBookingConfirmationEmailAsync(
        SendBookingConfirmationEmailAsyncRequest request
    );

    Task<EmailResponse> TestEmailConfigurationAsync();
}
