using System;
using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos.InventoryCard;

public class CreateInventoryCardForSaleRequest
{
    [Required]
    public int ProductId { get; set; }

    [Required]
    [MaxLength(20)]
    public string? Code { get; set; }

    [Required]
    [MaxLength(100)]
    public string Method { get; set; } = "Bán hàng";

    [Required]
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;

    [Required]
    public decimal CostPrice { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Số lượng bán phải lớn hơn 0")]
    public int QuantitySold { get; set; } // Số lượng bán (luôn dương)

    [MaxLength(500)]
    public string? Note { get; set; }

    // Tự động cập nhật tồn kho sản phẩm
    public bool UpdateProductStock { get; set; } = true;
}
