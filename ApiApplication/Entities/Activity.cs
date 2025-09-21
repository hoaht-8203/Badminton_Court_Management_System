using System;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class Activity : BaseEntity, IAuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // "bán đơn hàng", "nhập hàng", "bán đơn giao hàng"
    public string Description { get; set; } = string.Empty; // "vừa bán đơn hàng với giá trị 1,875,000"
    public decimal Value { get; set; }
    public string ValueFormatted { get; set; } = string.Empty; // "1,875,000"
    public string? OrderId { get; set; } // ID của đơn hàng nếu có
    public string? AdditionalInfo { get; set; } // Thông tin bổ sung
    public DateTime ActivityTime { get; set; } = DateTime.UtcNow;
}
