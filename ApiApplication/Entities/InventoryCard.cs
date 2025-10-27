using System;
using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class InventoryCard : BaseEntity
{
    [Key]
    public int Id { get; set; }

    public int ProductId { get; set; }
    public virtual Product Product { get; set; } = null!;

    [MaxLength(20)]
    public string Code { get; set; } = string.Empty; // Mã chứng từ: KK..., CB...

    [MaxLength(100)]
    public string Method { get; set; } = string.Empty; // Phương thức: Kiểm hàng, Cập nhật giá vốn

    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;

    public decimal CostPrice { get; set; } // Giá vốn tại thời điểm phát sinh

    public int QuantityChange { get; set; } // SL lệch (+/-)

    public int EndingStock { get; set; } // Tồn cuối sau nghiệp vụ
}
