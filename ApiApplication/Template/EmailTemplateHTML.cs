using System;
using ApiApplication.Dtos.Email;

namespace ApiApplication.Template;

public class EmailTemplateHTML
{
    private static readonly string TemplatesPath = Path.Combine(
        AppDomain.CurrentDomain.BaseDirectory,
        "Templates",
        "Email"
    );

    public class EmailTemplate
    {
        public string Subject { get; set; } = string.Empty;
        public string TemplatePath { get; set; } = string.Empty;
    }

    public static async Task<EmailRequest> CreateEmailFromTemplate(
        EmailTemplateRequest templateRequest
    )
    {
        var template = GetEmailTemplate(templateRequest.TemplateType);
        var subject = !string.IsNullOrEmpty(templateRequest.Subject)
            ? templateRequest.Subject
            : template.Subject;
        var body = await ProcessTemplate(template.TemplatePath, templateRequest.TemplateData);

        return new EmailRequest
        {
            To = templateRequest.To,
            ToName = templateRequest.ToName,
            Subject = subject,
            Body = body,
            IsHtml = true,
        };
    }

    private static async Task<string> ProcessTemplate(
        string templatePath,
        Dictionary<string, string>? data
    )
    {
        var fullPath = Path.Combine(TemplatesPath, templatePath);

        if (!File.Exists(fullPath))
        {
            throw new FileNotFoundException($"Email template not found: {fullPath}");
        }

        var html = await File.ReadAllTextAsync(fullPath);

        if (data != null)
        {
            foreach (var item in data)
            {
                html = html.Replace("{{" + item.Key + "}}", item.Value ?? string.Empty);
            }
        }

        return html;
    }

    public static EmailTemplate GetEmailTemplate(EmailTemplateType templateType)
    {
        return templateType switch
        {
            EmailTemplateType.Welcome => new EmailTemplate
            {
                Subject = "Chào mừng bạn đến với Hệ thống Quản lý Sân Cầu Lông",
                TemplatePath = "WelcomeTemplate.html",
            },
            EmailTemplateType.ForgotPassword => new EmailTemplate
            {
                Subject = "Đặt lại mật khẩu",
                TemplatePath = "ForgotPasswordTemplate.html",
            },
            EmailTemplateType.NewPassword => new EmailTemplate
            {
                Subject = "Mật khẩu mới",
                TemplatePath = "NewPasswordTemplate.html",
            },
            _ => throw new NotImplementedException(
                $"Template type {templateType} is not implemented"
            ),
        };
    }
}
