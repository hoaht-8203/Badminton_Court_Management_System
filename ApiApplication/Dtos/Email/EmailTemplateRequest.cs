using System;

namespace ApiApplication.Dtos.Email;

public class EmailTemplateRequest
{
    public string To { get; set; } = string.Empty;
    public string? ToName { get; set; }
    public EmailTemplateType TemplateType { get; set; }
    public Dictionary<string, string>? TemplateData { get; set; }
    public string? Subject { get; set; }
}

public enum EmailTemplateType
{
    Welcome,
    ForgotPassword,
    NewPassword,
    EmailVerify,
    PaymentRequest, // Gửi yêu cầu thanh toán (chuyển khoản)
    BookingConfirmation, // Xác nhận đặt sân (đã thanh toán tiền mặt)
}
