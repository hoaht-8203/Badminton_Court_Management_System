using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class InventoryCheck : BaseEntity, IAuditableEntity
{
    [Key]
    public int Id { get; set; }

    [MaxLength(20)]
    public string Code { get; set; } = string.Empty;

    public DateTime CheckTime { get; set; } = DateTime.UtcNow;

    public InventoryCheckStatus Status { get; set; } = InventoryCheckStatus.Draft;

    // Thời điểm cân bằng kho
    public DateTime? BalancedAt { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }

    public List<InventoryCheckItem> Items { get; set; } = new();
} 