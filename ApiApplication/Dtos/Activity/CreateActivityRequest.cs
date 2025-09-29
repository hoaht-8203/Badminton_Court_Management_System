using System;

namespace ApiApplication.Dtos.Activity;

public class CreateActivityRequest
{
    public string UserName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public string? OrderId { get; set; }
    public string? AdditionalInfo { get; set; }
}
