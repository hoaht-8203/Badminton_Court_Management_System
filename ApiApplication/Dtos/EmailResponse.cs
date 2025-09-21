using System;

namespace ApiApplication.Dtos;

public class EmailResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? MessageId { get; set; }
    public DateTime SentAt { get; set; }
    public List<string>? Errors { get; set; }
}
