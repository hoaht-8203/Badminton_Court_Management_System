using System;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Dtos;

public class ListActivityResponse : BaseEntity
{
    public Guid Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public string ValueFormatted { get; set; } = string.Empty;
    public string? OrderId { get; set; }
    public string? OrderType { get; set; }
    public string? AdditionalInfo { get; set; }
    public DateTime ActivityTime { get; set; }
    public string TimeAgo { get; set; } = string.Empty;
}
